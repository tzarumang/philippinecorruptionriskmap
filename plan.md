# PCRM — Build Plan

_Derived from [`prd.md`](./prd.md) v0.1 draft · Prepared 2026-09-22 · Status: proposed, awaiting sign-off_

This plan translates the PRD's 41 functional requirements into a build order on the fixed stack
(Next.js App Router + React + TypeScript + Supabase/PostGIS + MapLibre GL JS). It is a working
artifact, not a document to admire — it changes as slices land.

**Read section 1 first.** Live probes of the data sources on 2026-09-22 contradict the PRD in
several material ways, and those findings reorder the critical path.

---

## 1. Source reality check — what changed since the PRD

All endpoints below were probed directly on 2026-09-22. **All four of the PRD's blocking open
questions marked `owner: us` (§14) are now closed** — one source is confirmed dead, one has no
API, one is live and richer than assumed, and the boundary-geometry source is identified with its
licence. Three PRD assumptions are wrong in ways that affect the schema, and the LGU count
discrepancy is resolved.

### 1.1 `officials.bettergov.ph` — UNBLOCKED, and far richer than assumed

> **Approved by client 2026-09-22** as the data source for the Dynasties layer.

The PRD records this as "ongoing", blocking FR-9, the P3 pillar **and** the whole clan graph.
It is in fact live, versioned, and documented.

| Property | Value |
|---|---|
| Actual name | **Dynasties API** v1.0.0 |
| Data vintage | 2026-09-14 |
| Coverage | 9 election cycles — 2001, 2004, 2007, 2010, 2013, 2016, 2019, 2022, 2025 |
| Volume | 175,720 persons · 309,240 candidacies · 48,718 contests · 21,618 blocs |
| Geography | 18 regions · 88 provinces · 1,767 cities/towns |
| Upstream source | Leung, Robert R. — *Open Halalan: The Philippine National and Local Election Dataset* |
| Licence | **Derived data CC0 1.0** by BetterGov.ph; cite Open Halalan + PSA |
| Endpoints | `/stats` `/coverage` `/places` `/places/{province}` `/places/{province}/{town}` `/contests` `/contests/{id}` `/persons` `/persons/{id}` `/national/{year}` `/blocs` `/blocs/{id}` `/compare` + MCP |

**Consequences for the build:**

- **FR-9 is unblocked.** The `persons` schema already carries the normalised name parts FR-9
  asks us to derive: `last_name`, `first_name`, `middle_name`, `suffix`, `sex`, plus `runs`,
  `wins`, `first_year`, `last_year`, `top_position`, `province`.
- **PRD §14's "[NEEDS INPUT] which academic dynasty datasets, and their licence terms
  (owner: client)" is answered.** It is Open Halalan, CC0 1.0. FR-23's licence check is
  satisfied; no further client decision is required. The attribution obligation remains.
- **FR-22 (surname inference) is largely already done upstream.** The `blocs` endpoint groups
  by surname *including maternal/middle-name surname* (`via_middle_name`) within a province —
  exactly the heuristic FR-22 specifies. We import and review rather than build and review.
- **P3 indicators are directly computable.** `contests` carries an explicit `uncontested` flag
  plus `seats`, `margin`, `total_votes`, `last_winner_votes`, `runner_up_votes`. `blocs`
  carries `share`, `terms`, `members`, `years`, `top_position`, `parties`.

**Two cautions that must survive into the code:**

1. A **bloc is a surname grouping, not verified kinship.** It is precisely the artifact FR-22
   says must be labelled "a search heuristic and not evidence of kinship". Blocs seed the
   `unverified` queue under FR-21. They are never published as kinship edges without human
   approval.
2. If a bloc metric feeds the P3 pillar, the indicator must be named for what it measures —
   **"surname concentration of elective seats"**, not "dynasty share". Scoring the *jurisdiction*
   on surname concentration is defensible under the PRD's own rule that the platform scores
   structures, not people. Calling an unverified heuristic "dynasty" is not.

**One coverage limit to encode in FR-12.** The `/coverage` endpoint shows losing candidates are
absent before 2010 (`losing_candidates: 0` for 2001, 2004, 2007). Any indicator needing the full
candidate field — unopposed-race rate, margin of victory — is only computable from 2010 onward.
The PRD's "unopposed-race rate over the last 3 cycles" (2019/2022/2025) is safe; anything
reaching further back is not, and must reduce Data Coverage rather than silently truncate.

### 1.2 `flood-control.bettergov.ph` — live, but 21× larger than the PRD states

| PRD says | Actual |
|---|---|
| "~1,200 records at current volume" | **25,452** (`estimatedTotalHits`) |
| Flood-control projects | Meilisearch index is named **`postgis.dpwh_projects`** |

Sizing, pagination and ingest runtime in the PRD were scoped against a number ~21× too small.
More importantly, the index name suggests this endpoint already carries DPWH infrastructure
beyond flood control — which partly supersedes FR-7.

### 1.3 `api.dpwh.bettergov.ph` — confirmed dead

404 on `/`, `/api`, `/openapi.json`, `/docs`. `dpwh.bettergov.ph`, `infra.bettergov.ph` and
`projects.bettergov.ph` do not resolve at all. There is no separate DPWH API to confirm.

**Recommendation:** drop the standalone DPWH connector from MVP and treat
`flood-control.bettergov.ph` (index `postgis.dpwh_projects`) as *the* infrastructure-projects
source. FR-7 is rewritten as a verification task — confirm what share of DPWH infrastructure
that index actually covers — rather than a second connector. The FR-7 dedupe requirement
disappears with it.

### 1.4 `juris.ph/api` — returns a SPA, not an API

`Content-Type: text/html` — a Vite single-page app, not a REST surface. There is no
machine-readable contract to build P4 against. **P4 stays out of MVP** (the PRD already defers
it to v1.1) and needs a different acquisition route entirely. `bills.juris.ph/api` (BatasWatch)
*is* a real JSON API and responds correctly — it is unaffected.

### 1.5 Two data-shape findings that change the schema

**Monetary values arrive as floats.** A sampled record carries `"budget": 1447499996.23`. NFR
§8 "Data integrity" requires exact integers. The connector must convert to integer centavos at
the boundary and must never let a float reach a score. This is a parsing rule, not a storage
rule, and it needs a test.

**Some records have administrative pseudo-locations, not places.** A sampled record carries
`location.region: "Central Office"` and `location.province: "Flood Control Management Cluster"`.
No name matcher will ever resolve that to a PSGC code — it is not a place. The same record
*does* carry usable coordinates (`18.565046, 123.062516`). This makes **point-in-polygon
resolution the primary path for a meaningful share of records, not the fallback FR-6 assumes.**

That has a knock-on effect the PRD's critical path misses — see §2.

**Also observed:** one record shows `status: "On-Going"`, `progress: 100`, `amountPaid: 0`
simultaneously. Internally contradictory source data is present and must be surfaced on the
data-quality dashboard rather than silently scored.

### 1.6 Confirmed healthy

- `budget.bettergov.ph/api/v1/openapi.json` — OpenAPI 3.1.0, "Philippine Budget Data API". As documented.
- `statistics.bettergov.ph/api/v1/coverage` — 3,582 datasets, 3,580 mirrored. Note the query
  limit of **5,000 points per request**; the PSA connector must page within that.
- `bills.juris.ph/api/policy-areas` — live JSON.

### 1.7 Counts — RESOLVED against PSGC Q2_2024

The authoritative spine (`statistics.bettergov.ph/api/classification/psgc/Q2_2024/*`) settles this.
The current PSGC version is **Q2_2024**.

| Level | PSGC Q2_2024 | Breakdown |
|---|---|---|
| Regions | **18** | includes Negros Island Region (`1800000000`) |
| `/provinces` endpoint | 117 | **82 `Prov`** + 33 province-level `City` (HUC/ICC) + 2 unclassified |
| `/municipalities` endpoint | **1,623** | `Mun` + component `City` |

**The PRD's 82 provinces is correct.** And `1,623 + 33 province-level cities = ` **`1,656`** —
exactly the PRD's G1 denominator. So G1's "1,656" is right and refers to cities + municipalities
*including* the 33 HUC/ICCs; the PRD's separate "1,634 cities/municipalities" figure is the one
that is wrong (82 + 1,634 = 1,716, which contradicts its own 1,656).

**The Dynasties API's 88 provinces / 1,767 cities is a different geography, not a correction.**
It reflects its own election-administration groupings (Maguindanao del Norte/Sur, "Special
Geographic Area", district handling). It must be **mapped onto** the PSGC spine, never adopted
as the spine. That mapping is a named deliverable of Epic A.

**Recommendation 8 is therefore withdrawn** — no restatement of G1 is needed. Correct the
"1,634" figure instead.

### 1.8 Boundary geometry — source identified, licence caveat attached

The PRD's top open item (§2). Three candidates evaluated on the only criterion that matters for
this platform: **does the licence permit public republication of the geometry itself?**

| Candidate | Licence | Currency | Verdict |
|---|---|---|---|
| **HDX COD-AB `cod-ab-phl`** | **CC BY-IGO 3.0** (explicit data licence) | modified **2026-05-28** | **Recommended** |
| BetterGov data portal dataset 23 | MIT — **on the curation code only** | PSA 2023-10-24 / NAMRIA 2023-11-06 | Cross-check only |
| `altcoder/philippines-psgc-shapefiles` | MIT — **on the repo only** | 31 Dec 2023 | Cross-check only |

**The licence subtlety that decides it.** Dataset 23's API record lists its attributions
explicitly: PSA carries `"license": null` and NAMRIA carries `"license": null`; the MIT licence
belongs to the curator's *code*. An MIT licence over curation code grants no rights in NAMRIA's
underlying boundary data. The same applies to altcoder. **Only HDX carries a real data licence** —
CC BY-IGO 3.0, applied by OCHA (an IGO) to its prepared Common Operational Dataset, sourced from
NAMRIA and PSA. For a platform whose entire premise is legal defensibility, that distinction is
the whole decision.

Formats available: GeoJSON, SHP, Geodatabase, XLSX (`phl_admin_boundaries.*`).

**Three caveats that must be carried into the build and the methodology page:**

1. **These are indicative, not official.** OCHA states plainly that the Land Management Bureau is
   the source of official Philippine administrative boundaries, and that in its absence the IMTWG
   agreed to use PSA boundaries — so the dataset "can only be considered as indicative". Since we
   assign projects to LGUs by point-in-polygon (§1.5), a disputed boundary is a real source of
   mis-assignment. **Disclose it, and treat point-in-polygon matches as lower confidence than
   code matches in FR-2.**
2. **HDX has no Negros Island Region.** Its caveat removes NIR (`PH1800000000`) and folds it back
   into regions 06 and 07, on the basis that NIR existed only 2015–2017. But PSGC Q2_2024 *has*
   NIR as region `1800000000` (§1.7) — it was re-established since. HDX's region layer is
   therefore structurally stale.
   **Mitigation: do not ingest HDX's region layer at all.** Build region geometry by dissolving
   province polygons on their PSGC parent code (`ST_Union` in PostGIS). This decouples us from
   HDX's grouping entirely and makes future PSGC region changes a spine update rather than a
   geometry re-import.
3. **Pcode vintage gap.** HDX pcodes are "consistent with government PSGC as of 2023"; our spine
   is Q2_2024. The FR-1 alias table absorbs this, but the reconciliation is an Epic A acceptance
   criterion, not an assumption.

**Still needs a human decision:** counsel should confirm CC BY-IGO 3.0 covers republication as
derived vector tiles. That is a legal sign-off, not a research question — but it is now a narrow,
answerable one rather than an open blocker.

### 1.9 A third parsing landmine

PSGC population values arrive as **strings with embedded spaces and thousands separators** —
`"population": " 593,081 "`. Same class of defect as the float amounts (§1.5): parse and validate
at the connector boundary, never downstream.

**One piece of good news:** `income_classification` (e.g. `"1st"`) is present directly on PSGC
province rows. FR-17's peer grouping key is available from the spine itself — no separate source
needed.

---

## 2. Revised critical path

The PRD §13 states: *DPWH/Juris/officials API confirmation → entity resolution → index → map.*

After §1 that becomes:

```
PSGC spine ──┬── boundary geometry ──┐
             │                       ├── entity resolution ── index ── map
             └── name/alias matcher ─┘
```

**Boundary geometry moves onto the critical path for entity resolution itself**, because
records like "Flood Control Management Cluster" can only be placed by point-in-polygon. The PRD
treats geometry (FR-3) as a map concern. It is not — without it, a meaningful share of the
25,452 project records cannot be assigned to any LGU, and the P1 pillar is built on a partial
denominator.

**Status: source identified (§1.8).** HDX COD-AB under CC BY-IGO 3.0, region layer rebuilt by
dissolving provinces. What remains is a narrow legal sign-off that CC BY-IGO permits republication
as derived vector tiles — not an open research question. Epic A can be planned in full; only the
public *publication* of tiles waits on counsel.

What is *no longer* on the critical path: DPWH API confirmation (dead, removed), officials API
confirmation (closed and client-approved), academic dynasty dataset selection (closed), geometry
source selection (closed, §1.8).

**The critical path is now: PSGC spine → geometry import + region dissolve → entity resolution →
index → map.** Every input to it is identified and reachable.

---

## 3. Build epics

Every one of FR-1 … FR-41 is placed. Epics are sequenced by dependency, not by PRD section.

### Epic A — Geographic spine & entity resolution
_Blocks everything. Nothing else can start meaningfully._

| FR | Work | Notes |
|---|---|---|
| — | Monorepo scaffold, Supabase project, RLS baseline, CI | See §5 |
| FR-1 | PSGC spine loader, version **Q2_2024** — 18 regions, 82 provinces, 33 HUC/ICC, 1,623 mun/city | Idempotent, re-runnable, alias table for superseded codes; parse `" 593,081 "` population strings safely (§1.9) |
| FR-39 | PSGC split/merge/create/rename handling | **Promoted from edge case** — NIR alone proves it (§1.8) |
| FR-3 | Import HDX COD-AB geometry; **dissolve provinces → regions** via `ST_Union`; simplified tiles z5–9, full z10+ | Source and licence settled (§1.8); public tile publication awaits counsel sign-off only |
| FR-2 | Deterministic matcher: exact code → exact normalised name → alias → trigram ≥ 0.85 → **point-in-polygon** → quarantine | Precision ≥ 0.99, recall ≥ 0.95 on a 500-record labelled set; point-in-polygon matches carry **lower confidence** than code matches (§1.8 caveat 1) |
| — | **Dynasties-geography → PSGC crossmap** (88/1,767 → 82/1,656) | Named deliverable; the Dynasties geography is mapped, never adopted (§1.7) |

**Gate:** ≥ 98% of sampled project records resolve to a PSGC code; the Dynasties API's 88
provinces / 1,767 cities crossmap cleanly to the spine with every discrepancy explained; the
dissolved region layer reproduces all 18 PSGC regions including NIR.

### Epic B — Ingestion framework & connectors

| FR | Work | Notes |
|---|---|---|
| FR-4 | Snapshot framework: immutable, checksummed, `source_id`/`retrieved_at`/`record_count`/`run_status` | Reproducibility is asserted by test, not promised |
| FR-40 | Last-good-snapshot serving; never promote a partial snapshot | Build with FR-4, not after |
| FR-5 | Budget connector (GAA FY2020–26, NEP FY2027), cursor pagination | Reconcile to published national total **to the peso** |
| FR-6 | Infrastructure projects connector — 25,452 records | `contractId` natural key; **float → integer centavos**; coordinate bounds validation |
| ~~FR-7~~ | ~~DPWH connector~~ → **rewritten as a coverage-verification task** | Source is dead (§1.3) |
| FR-8 | PSA statistics connector | Respect the 5,000-point query limit; mark inherited-from-parent values |
| FR-9 | Dynasties connector — persons, contests, blocs, places | **Unblocked and approved** (§1.1) |
| FR-10 | Public status page, per-source freshness, green/amber/red | No account required |

**Gate:** a full national ingest completes, is checksummed, and re-running scoring against a
pinned snapshot reproduces byte-identical output.

### Epic C — Risk index v1.0

| FR | Work |
|---|---|
| FR-11 | Scoring engine: winsorise p5/p95 → z-score within peer group → scale 0–100; persist **every** intermediate value |
| FR-17 | Peer grouping (level, income class); n < 10 falls back to level alone and discloses it |
| FR-16 | P5 normalisers-only guard + **CI monotonicity test**: raising poverty cannot raise risk |
| FR-12 | Data Coverage score, equal visual weight, `< 40%` → Insufficient Data |
| FR-41 | Zero-indicator pillars excluded, weights re-normalise; ≤ 1 pillar → no composite |
| FR-14 | Immutable versioned scores (semver + data vintage); prior versions stay queryable |
| FR-18 | Fixed published tier thresholds, non-accusatory labels |
| FR-19 | Sensitivity analysis per version; flag weight-sensitive LGUs |

Pillars at MVP: **P1** (infrastructure projects), **P2** (budget), **P5** (context/normalisers),
and — newly possible — **P3** (political concentration, via the approved Dynasties API). P4
remains v1.1.

### Epic D — Map, profiles & discovery

| FR | Work |
|---|---|
| FR-27 | National choropleth, province → municipality at z9, colourblind-safe, keyboard-operable |
| FR-28 | Composite/pillar layer switch, URL-reflected, ≤ 1 s |
| FR-13 | Indicator-level evidence trail with source link + snapshot version |
| FR-15 | Standing disclaimer system — map, profile, clan view, export header, API envelope |
| FR-29 | Unified search (LGU/official/contractor/project) with Ñ, diacritic, "Sta./Santa" handling |
| FR-30 | Projects table — sortable, filterable, marks which indicator each row triggered |
| FR-31 | Contractor profiles with reversible name-variant merges |

### Epic E — Dynasty / clan layer

| FR | Work |
|---|---|
| FR-26 | **Schema-level no-conduct rule + automated test asserting no conduct field exists** — build this *first* in the epic |
| FR-20 | Person nodes + kinship edges with `confirmed`/`reported`/`unverified` confidence |
| FR-21 | Mandatory human editorial approval; 60-second retraction path |
| FR-22 | Import blocs as `unverified` candidates with inference rationale (§1.1 caution 1) |
| FR-23 | Open Halalan import with CC0 attribution surfaced wherever shown |
| FR-25 | Regional network view, ≤ 2 s for 300 nodes, citations on interaction |
| FR-24 | Crowdsourced submissions — PRD §14 proposes deferring to v1.1; plan assumes deferred |

### Epic F — Openness & accountability

| FR | Work |
|---|---|
| FR-38 | Append-only audit log — **build before the workflows that write to it** |
| FR-35 | Right-of-reply workflow, 3-day ack / 15-day resolve |
| FR-36 | Public immutable corrections changelog |
| FR-37 | Takedown workflow with "under review" state (notice, not deletion) |
| FR-32 | Public REST API + accurate OpenAPI 3.1; 60/min anon, 600/min keyed |
| FR-33 | CSV/GeoJSON export with in-file methodology version + disclaimer |
| FR-34 | Follow + email alerts, batched daily |

---

## 4. Slice 1 — the walking skeleton

Per the agile standard: one thin capability, end to end, before anything is built broadly.

> **A visitor can open an LGU profile page and see that LGU's real infrastructure projects,
> each row linking to the source record it came from, stamped with the data vintage and the
> standing disclaimer.**

**Done =** `/lgu/[psgc]` renders live data that travelled the full path:

```
PSGC spine ─→ snapshot (checksummed) ─→ entity resolution ─→ Postgres (RLS on)
                                                                   │
                                   server-only DAL ─→ Server Component ─→ UI
```

**Why this slice.** It proves the single hardest architectural claim in the PRD — that
heterogeneous public records can be joined onto one geographic key *with provenance intact* —
and it exercises FR-1, FR-2, FR-4, FR-6 and FR-15 together. It deliberately excludes the score
(needs peer groups across pillars), the map (needs geometry), and auth (nothing here is
user-specific). No score is displayed, so nothing legally sensitive publishes.

**Explicitly not in slice 1:** risk score, choropleth, clan/dynasty data, search, export, accounts.

---

## 5. Repo & schema shape

Follows the readme's planned layout, with the data-access rule from the build standard: **only
`lib/supabase/server.ts`, `lib/data/` and `features/*/data.ts` touch the server Supabase client,
each behind `import 'server-only'`.**

```
apps/web/            Next.js App Router — server components for data-heavy profiles
packages/ingestion/  one connector per source, no cross-imports between connectors
packages/scoring/    pure, dependency-free, open-sourced (FR-11); no DB access
packages/resolution/ PSGC matcher (FR-2); pure functions over spine + geometry
packages/types/      shared TS types + generated database.types.ts
supabase/migrations/ schema + RLS in the same migration, always
docs/adr/            architecture decisions (next deliverable after this plan)
```

`packages/scoring` being pure and DB-free is what makes FR-11's "reproduces the published score
exactly" testable in CI, and what makes open-sourcing it (NFR "Openness") safe.

**RLS baseline:** every table ships with RLS enabled in the creating migration. Public read
tables (spine, scores, projects, budget) get an explicit `select` policy for `anon`; everything
else is deny-by-default. The six PRD roles (anonymous, registered, verified-respondent, steward,
editor, administrator) are carried in `app_metadata` and read via `auth.jwt()` — never
`user_metadata`.

### 5.1 Self-hosted Supabase — consequences

**Decided 2026-09-22: Supabase is self-hosted**, not Supabase Cloud. This is a sound fit for a
platform that must survive political pressure and outlive its hosting arrangements, but it moves
real work in-house and changes several PRD assumptions:

| Area | Consequence |
|---|---|
| **Schema authority** | No hosted Supabase MCP. Migrations run via the Supabase CLI against the self-hosted instance; `supabase/migrations/` is the single source of truth, applied with `supabase db push` / `db reset`. |
| **PostGIS** | Must be explicitly enabled in the Postgres image and in a migration (`create extension postgis`). Confirm the image ships it before Epic A. |
| **Keys** | Self-hosted uses the legacy `anon` / `service_role` JWTs signed with a project `JWT_SECRET`, not the newer `sb_publishable_` / `sb_secret_` format. The security rule is unchanged: `service_role` never leaves `server-only` modules. |
| **Vault** | Available as a Postgres extension self-hosted; NFR §8 "all secrets in Supabase Vault" still holds. |
| **Edge Functions** | Self-hostable, but deployment and scheduling are ours. This sharpens the open ingestion-orchestration question (§7) — a self-hosted cron/worker is now the more likely answer than scheduled Edge Functions. |
| **NFR §8 Availability (99.5%), Backup & recovery (RPO ≤ 24 h, RTO ≤ 8 h), quarterly restore drills** | Now **our operational burden**, not a managed guarantee. These become staffed responsibilities and need naming in the ops plan. |
| **Security advisors** | No hosted Security Advisor. Replace with an explicit CI check asserting RLS is enabled on every table in `public` — worth having regardless. |

**Flagged for the client:** self-hosting shifts the availability, backup and patching NFRs from a
vendor SLA onto the team. The PRD's team envelope is still `[NEEDS INPUT]`; this decision adds an
ops role to it that should be costed before Gate 5.

---

## 6. Decisions needed before code

### Settled

| # | Decision | Status |
|---|---|---|
| 1 | **Supabase self-hosted** (not Cloud); migrations via CLI, `supabase/migrations/` is source of truth | **Decided 2026-09-22** — see §5.1 |
| 2 | Use `officials.bettergov.ph` (Dynasties API) as the officials/dynasty source | **Approved 2026-09-22** |
| 3 | Drop the standalone DPWH connector; flood-control becomes the infrastructure source (§1.3) | **Accepted 2026-09-22** |
| 4 | Move **P3 into the MVP index** (§1.1) | **Accepted 2026-09-22** |
| 5 | Name the P3 indicator **"surname concentration"**, not "dynasty share" (§1.1) | **Accepted 2026-09-22** |
| 6 | ~~Restate G1's 1,656 denominator~~ | **Withdrawn** — 1,656 is correct; fix the "1,634" figure instead (§1.7) |
| 7 | **Boundary geometry: HDX COD-AB, CC BY-IGO 3.0**, region layer rebuilt by dissolve (§1.8) | Researched and recommended 2026-09-22 |

### Still open

**Legal sign-off (narrow, not blocking design):**

- Confirm **CC BY-IGO 3.0 permits republication of derived vector tiles** (§1.8). Counsel question.
- Confirm the **"indicative, not official" boundary caveat** wording for the methodology page (§1.8).

**Blocking Epic D (UI build), not slice 1:**

- **Brand tokens** — name, palette, typography, tone. PRD §11 flags this as client-owned. Slice 1
  proceeds on neutral accessible defaults; the design system should not be built twice.

**Newly raised by the self-hosting decision:**

- **Ops ownership** for availability, backup/restore drills and patching, now in-house (§5.1).
  Needs costing into the PRD's still-`[NEEDS INPUT]` team envelope before Gate 5.

**Unchanged from the PRD as hard launch blockers:** legal counsel review, editorial staffing,
penetration test findings closed, DPIA approved.

---

## 7. What this plan does not cover

- The architecture ADR (ingestion orchestration: scheduled Edge Functions vs external runner —
  PRD §14, owner: us). Next deliverable after this plan is signed off.
- Cost/effort estimates — the PRD's budget, timeline and team envelope are all still
  `[NEEDS INPUT]`, so any schedule here would be fiction. The epic *order* is firm; the
  *duration* is not estimable yet.
- P4 (Juris.ph) acquisition strategy, now that no API exists (§1.4).
