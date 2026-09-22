-- PCRM initial schema — geographic spine, snapshots, infrastructure projects.
--
-- Two rules hold for every table in this file and every one added later:
--
--   1. RLS is enabled in the SAME migration that creates the table. A table in
--      `public` is served over an auto-generated REST API reachable with the
--      publishable key, so a table without RLS is world-readable and
--      world-writable. RLS on with no policy is deny-by-default, which is the
--      only safe starting point.
--   2. Writes never come from the client. Ingestion runs server-side under the
--      service role, which bypasses RLS by design. No anon or authenticated
--      role is granted insert/update/delete anywhere in this schema.

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------

-- Trigram search backs the name matching in FR-2 and search in FR-29. The
-- application-side matcher mirrors this operator's semantics.
create extension if not exists pg_trgm;

-- PostGIS is required for FR-3 boundary geometry and the point-in-polygon
-- resolution that FR-2 depends on. Enabled now so the extension is present
-- before geometry lands, rather than mid-series.
create extension if not exists postgis;

-- ---------------------------------------------------------------------------
-- Role helper
-- ---------------------------------------------------------------------------

-- Reads the caller's PCRM role from app_metadata.
--
-- app_metadata, never user_metadata: the latter is user-editable, so
-- authorising off it would let any account promote itself to editor.
create or replace function public.pcrm_role()
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb
      -> 'app_metadata' ->> 'pcrm_role',
    'anonymous'
  );
$$;

comment on function public.pcrm_role() is
  'Caller''s PCRM role from JWT app_metadata. Defaults to anonymous.';

-- ---------------------------------------------------------------------------
-- Ingestion snapshots (FR-4)
-- ---------------------------------------------------------------------------

create table public.ingestion_snapshot (
  id             bigint generated always as identity primary key,
  source_id      text        not null,
  retrieved_at   timestamptz not null,
  record_count   integer     not null check (record_count >= 0),
  checksum       text        not null,
  run_status     text        not null check (run_status in ('success', 'failed', 'partial')),
  source_urls    text[]      not null default '{}',
  data_vintage   text,
  warnings       text[]      not null default '{}',
  loaded_at      timestamptz not null default now(),

  -- The same source and checksum is the same snapshot. Re-loading it is a
  -- no-op rather than a duplicate, which keeps loads idempotent.
  unique (source_id, checksum)
);

comment on table public.ingestion_snapshot is
  'Immutable record of each ingestion run. Every published value traces to a row here.';

create index ingestion_snapshot_source_idx
  on public.ingestion_snapshot (source_id, retrieved_at desc);

-- ---------------------------------------------------------------------------
-- Geographic spine (FR-1)
-- ---------------------------------------------------------------------------

create table public.psgc_spine (
  code                   text primary key check (code ~ '^[0-9]{10}$'),
  name                   text not null,
  parent_code            text references public.psgc_spine (code) on delete restrict,
  level                  text not null check (
                           level in ('Reg','Prov','City','Mun','SubMun','Bgy','Unclassified')
                         ),
  city_class             text check (city_class in ('HUC','CC','ICC')),
  income_classification  text,
  psgc_version           text not null,
  island_region          text,
  old_name               text,
  -- The PSA's legacy 9-digit code. This is FR-1's alias table, supplied by
  -- the source: a record arriving with an obsolete code resolves through it.
  correspondence_code    text,
  status                 text,
  latest_population      integer check (latest_population >= 0),
  latest_population_year integer,
  snapshot_id            bigint not null references public.ingestion_snapshot (id),
  updated_at             timestamptz not null default now()
);

comment on table public.psgc_spine is
  'PSGC geographic reference. The single join key for every other dataset.';

create index psgc_spine_parent_idx on public.psgc_spine (parent_code);
create index psgc_spine_level_idx  on public.psgc_spine (level);
create index psgc_spine_corr_idx   on public.psgc_spine (correspondence_code);
-- Backs both fuzzy matching (FR-2) and type-ahead search (FR-29).
create index psgc_spine_name_trgm_idx
  on public.psgc_spine using gin (name gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- Infrastructure projects (FR-6)
-- ---------------------------------------------------------------------------

create table public.infrastructure_project (
  -- The upstream natural key. Re-ingestion updates rather than duplicates.
  contract_id      text primary key,
  description      text not null default '',
  category         text,
  status           text,

  -- Money is integer centavos, never a float. The source sends floats
  -- (1447499996.23); they are converted at the connector boundary.
  budget_centavos      bigint check (budget_centavos >= 0),
  amount_paid_centavos bigint check (amount_paid_centavos >= 0),

  progress         numeric(5,2) check (progress between 0 and 100),
  contractor       text,

  -- Free text exactly as the source reports it. Despite the field names
  -- upstream, these hold the DPWH IMPLEMENTING OFFICE (e.g. "Abra DEO",
  -- "Region V"), not a geographic province. Kept verbatim so a published
  -- value can always be traced back to what the source actually said.
  source_region    text,
  source_province  text,

  start_date       date,
  completion_date  date,
  infra_year       text,
  program_name     text,
  source_of_funds  text,
  latitude         double precision,
  longitude        double precision,

  -- Null when resolution quarantined the record. A project with no PSGC code
  -- is never counted toward any LGU's score.
  psgc_code        text references public.psgc_spine (code) on delete set null,
  resolution_method     text check (
                          resolution_method in
                          ('exact-code','exact-name','alias','trigram','point-in-polygon')
                        ),
  resolution_confidence numeric(4,3) check (resolution_confidence between 0 and 1),

  quality_flags    text[] not null default '{}',
  snapshot_id      bigint not null references public.ingestion_snapshot (id),
  updated_at       timestamptz not null default now()
);

comment on table public.infrastructure_project is
  'DPWH infrastructure projects. Source names the field "province" but it holds an implementing office.';

create index infrastructure_project_psgc_idx on public.infrastructure_project (psgc_code);
create index infrastructure_project_contractor_idx on public.infrastructure_project (contractor);
create index infrastructure_project_year_idx on public.infrastructure_project (infra_year);

-- ---------------------------------------------------------------------------
-- Resolution quarantine (FR-2)
-- ---------------------------------------------------------------------------

create table public.resolution_quarantine (
  id              bigint generated always as identity primary key,
  source_id       text not null,
  record_key      text not null,
  source_region   text,
  source_province text,
  latitude        double precision,
  longitude       double precision,
  rationale       text not null,
  snapshot_id     bigint not null references public.ingestion_snapshot (id),
  created_at      timestamptz not null default now(),

  unique (source_id, record_key, snapshot_id)
);

comment on table public.resolution_quarantine is
  'Records that could not be resolved to a PSGC code. Visible, never silently dropped.';

create index resolution_quarantine_source_idx
  on public.resolution_quarantine (source_id, snapshot_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.ingestion_snapshot      enable row level security;
alter table public.psgc_spine              enable row level security;
alter table public.infrastructure_project  enable row level security;
alter table public.resolution_quarantine   enable row level security;

-- Public read. These three carry only published public-record data, and the
-- platform's whole purpose is that anyone can read and verify them without an
-- account. Read-only: no insert/update/delete policy exists for any client
-- role, so writes are possible only under the service role, server-side.
create policy "Public read of ingestion snapshots"
  on public.ingestion_snapshot for select to anon, authenticated using (true);

create policy "Public read of the geographic spine"
  on public.psgc_spine for select to anon, authenticated using (true);

create policy "Public read of infrastructure projects"
  on public.infrastructure_project for select to anon, authenticated using (true);

-- Quarantine is deliberately NOT public. Aggregate counts belong on the
-- data-quality dashboard, but individual unresolved rows are working state
-- for stewards and can contain half-matched names about real places.
create policy "Stewards read the resolution quarantine"
  on public.resolution_quarantine for select to authenticated
  using (public.pcrm_role() in ('steward', 'editor', 'administrator'));
