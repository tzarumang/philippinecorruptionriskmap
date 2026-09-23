-- Aggregate of attributed projects per LGU.
--
-- Replaces a client-side count that fetched a bounded slice of rows and
-- tallied them in JavaScript: with 25,452 projects that silently reported only
-- the localities that happened to fall inside the fetched window. Counting
-- belongs in the database.
--
-- `security_invoker = true` is essential. A view defaults to the privileges of
-- its OWNER, which would bypass the Row Level Security on the underlying
-- tables and turn this into a hole in the policy set. With security_invoker the
-- caller's own RLS applies, so this view is exactly as restricted as
-- psgc_spine and infrastructure_project are.

create view public.lgu_project_summary
with (security_invoker = true) as
select
  s.code,
  s.name,
  s.level,
  s.city_class,
  s.parent_code,
  count(p.contract_id)                       as project_count,
  coalesce(sum(p.budget_centavos), 0)        as total_budget_centavos,
  coalesce(sum(p.amount_paid_centavos), 0)   as total_paid_centavos
from public.psgc_spine s
join public.infrastructure_project p
  on p.psgc_code = s.code
group by s.code, s.name, s.level, s.city_class, s.parent_code;

comment on view public.lgu_project_summary is
  'Per-LGU project counts and totals. security_invoker so RLS on the base tables still applies.';
