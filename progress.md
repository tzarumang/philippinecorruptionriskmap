# PCRM — Development Progress

_Living tracker. Companion to [`plan.md`](./plan.md) (what to build and why) and [`prd.md`](./prd.md) (the requirement)._

**How to use this file:** update the status table when a slice lands, append to the decision log
when something is settled, and move blockers out of §4 the moment they clear. Status values are
`Not started` · `In progress` · `Blocked` · `Done` · `Superseded`. Never delete a decision-log
entry — supersede it.

---

## 1. At a glance

| | |
|---|---|
| **Phase** | P0 — Confirm & de-risk |
| **Overall status** | Pre-development — planning complete, no code written |
| **Current slice** | Slice 1 (walking skeleton) — *proposed, not started* |
| **FRs complete** | 0 of 41 (1 superseded) |
| **Hard launch blockers cleared** | 0 of 4 |
| **Last updated** | 2026-09-22 |

**P0 exit criteria** (PRD §13): all §14 blocking items closed · architecture ADR written ·
legal counsel engaged · brand inputs received.

| P0 item | Owner | Status |
|---|---|---|
| DPWH API contract confirmed | us | **Done** — source is dead, FR-7 superseded ([plan.md §1.3](./plan.md)) |
| Juris.ph API contract confirmed | us | **Done** — no API exists; P4 stays v1.1 ([§1.4](./plan.md)) |
| officials.bettergov.ph contract confirmed | us | **Done** — live, CC0, approved ([§1.1](./plan.md)) |
| Boundary geometry source + licence | us | **Done (research)** — HDX COD-AB, CC BY-IGO 3.0 ([§1.8](./plan.md)); counsel sign-off outstanding |
| Architecture ADR | us | Not started |
| Named client approver | client | Not started |
| Philippine legal counsel engaged | client | Not started |
| Budget / timeline / team envelope | client | Not started |
| Brand assets | client | Not started |

---

## 2. Epic progress

### Epic A — Geographic spine & entity resolution

| FR | Deliverable | Status |
|---|---|---|
| — | Monorepo scaffold, self-hosted Supabase, RLS baseline, CI | Not started |
| FR-1 | PSGC spine loader (Q2_2024 — 18 reg / 82 prov / 33 HUC-ICC / 1,623 mun-city) | Not started |
| FR-2 | Deterministic PSGC matcher with quarantine | Not started |
| FR-3 | HDX geometry import + province→region `ST_Union` dissolve + tiles | Not started |
| FR-39 | PSGC split / merge / create / rename handling | Not started |
| — | Dynasties-geography → PSGC crossmap (88/1,767 → 82/1,656) | Not started |

_Gate:_ ≥ 98% record resolution · Dynasties crossmap explained · dissolved region layer
reproduces all 18 PSGC regions including NIR.

### Epic B — Ingestion framework & connectors

| FR | Deliverable | Status |
|---|---|---|
| FR-4 | Immutable checksummed snapshot framework | Not started |
| FR-40 | Last-good-snapshot serving; no partial promotion | Not started |
| FR-5 | Budget connector (GAA FY2020–26, NEP FY2027) | Not started |
| FR-6 | Infrastructure projects connector (25,452 records) | Not started |
| ~~FR-7~~ | ~~DPWH connector~~ | **Superseded** — source dead; rewritten as coverage-verification task |
| FR-8 | PSA statistics connector (5,000-point query limit) | Not started |
| FR-9 | Dynasties connector — persons / contests / blocs / places | Not started |
| FR-10 | Public per-source freshness status page | Not started |

_Gate:_ full national ingest checksummed · rescoring a pinned snapshot is byte-identical.

### Epic C — Risk index v1.0

| FR | Deliverable | Status |
|---|---|---|
| FR-11 | Scoring engine (winsorise → peer z-score → 0–100), all intermediates persisted | Not started |
| FR-12 | Data Coverage score, equal prominence, < 40% → Insufficient Data | Not started |
| FR-14 | Immutable versioned scores (semver + data vintage) | Not started |
| FR-16 | P5 normalisers-only guard + CI monotonicity test | Not started |
| FR-17 | Peer grouping (level, income class) with n<10 fallback | Not started |
| FR-18 | Fixed published tier thresholds, non-accusatory labels | Not started |
| FR-19 | Per-version sensitivity analysis; weight-sensitive flagging | Not started |
| FR-41 | Zero-indicator pillar exclusion + weight re-normalisation | Not started |

_MVP pillars:_ P1 · P2 · P3 · P5. _(P4 deferred to v1.1 — no Juris.ph API.)_

### Epic D — Map, profiles & discovery

| FR | Deliverable | Status |
|---|---|---|
| FR-13 | Indicator-level evidence trail with source links | Not started |
| FR-15 | Standing disclaimer system (map / profile / clan / export / API) | Not started |
| FR-27 | National choropleth, colourblind-safe, keyboard-operable | Not started |
| FR-28 | Composite / pillar layer switch, URL-reflected | Not started |
| FR-29 | Unified search with Philippine name-variant handling | Not started |
| FR-30 | Projects table, sortable/filterable, indicator-trigger marks | Not started |
| FR-31 | Contractor profiles with reversible name merges | Not started |

### Epic E — Dynasty / clan layer

| FR | Deliverable | Status |
|---|---|---|
| FR-26 | Schema-level no-conduct rule + automated test | Not started |
| FR-20 | Person nodes + kinship edges with confidence levels | Not started |
| FR-21 | Mandatory human editorial approval; 60 s retraction | Not started |
| FR-22 | Bloc import as `unverified` candidates with rationale | Not started |
| FR-23 | Open Halalan import with CC0 attribution | Not started |
| FR-24 | Crowdsourced submissions | Deferred to v1.1 (PRD §14 proposal) |
| FR-25 | Regional network view | Not started |

### Epic F — Openness & accountability

| FR | Deliverable | Status |
|---|---|---|
| FR-38 | Append-only audit log (build first in epic) | Not started |
| FR-35 | Right-of-reply workflow (3-day ack / 15-day resolve) | Not started |
| FR-36 | Public immutable corrections changelog | Not started |
| FR-37 | Takedown workflow with "under review" state | Not started |
| FR-32 | Public REST API + OpenAPI 3.1 | Not started |
| FR-33 | CSV / GeoJSON export with in-file provenance | Not started |
| FR-34 | Follow + batched email alerts | Not started |

---

## 3. Data source status

Health as last verified. Update `Last verified` whenever a connector runs or a source is re-probed.

| Source | Contract | Ingestion | Last verified | Notes |
|---|---|---|---|---|
| `statistics.bettergov.ph` PSGC | Confirmed | Not started | 2026-09-22 | Version **Q2_2024**; `income_classification` included |
| `statistics.bettergov.ph` PSA | Confirmed | Not started | 2026-09-22 | 3,582 datasets; **5,000-point query limit** |
| `budget.bettergov.ph` | Confirmed | Not started | 2026-09-22 | OpenAPI 3.1.0 |
| `flood-control.bettergov.ph` | Confirmed | Not started | 2026-09-22 | **25,452 records** (PRD said ~1,200); index `postgis.dpwh_projects` |
| `officials.bettergov.ph` | Confirmed · **approved** | Not started | 2026-09-22 | Dynasties API; CC0 1.0; 2001–2025 |
| HDX `cod-ab-phl` geometry | Confirmed | Not started | 2026-09-22 | CC BY-IGO 3.0; modified 2026-05-28 |
| `bills.juris.ph` (BatasWatch) | Confirmed | Not started | 2026-09-22 | v1.1 scope |
| `api.dpwh.bettergov.ph` | **Dead** | N/A | 2026-09-22 | 404 all paths; no alternative host resolves |
| `juris.ph/api` | **No API** | N/A | 2026-09-22 | Serves a SPA; P4 needs another route |

### Known data-quality landmines

Each needs a connector-boundary guard and a test. Tick when the guard exists.

- [ ] Monetary values arrive as **floats** (`1447499996.23`) — convert to integer centavos
- [ ] Populations arrive as **strings with spaces and commas** (`" 593,081 "`)
- [ ] **Administrative pseudo-locations** (`"Flood Control Management Cluster"`) — no name match possible; needs point-in-polygon
- [ ] **Internally contradictory records** (`status: On-Going` + `progress: 100` + `amountPaid: 0`) — surface, don't score
- [ ] **Candidate data absent before 2010** — unopposed-rate/margin only computable 2010+; must reduce Data Coverage
- [ ] **HDX pcodes are 2023-vintage** vs Q2_2024 spine — alias reconciliation required

---

## 4. Active blockers

| # | Blocker | Blocks | Owner | Since |
|---|---|---|---|---|
| B1 | Counsel confirmation that **CC BY-IGO 3.0 permits derived vector tiles** | Public tile publication (not Epic A design) | client / legal | 2026-09-22 |
| B2 | **Brand tokens** — name, palette, typography, tone | Epic D UI build (not Slice 1) | client | 2026-09-22 |
| B3 | **Named client approver** with sign-off authority | Every PRD gate | client | 2026-09-22 |
| B4 | **Legal counsel engaged** | Public launch | client | 2026-09-22 |
| B5 | **Budget / timeline / team envelope** | Phase planning; now also an **ops role** (self-hosting, plan.md §5.1) | client | 2026-09-22 |
| B6 | **Editorial staffing** for the moderation queue | Epic E go-live | client | 2026-09-22 |

_Cleared:_ DPWH API contract · Juris.ph API contract · officials API contract · academic dynasty
dataset selection · boundary geometry source selection (all 2026-09-22).

---

## 5. Hard launch blockers (PRD §13)

| Blocker | Status |
|---|---|
| Legal counsel review of all public-facing copy | Not started |
| Editorial moderation staffed | Not started |
| Penetration test — critical/high findings closed | Not started |
| DPIA approved | Not started |

---

## 6. Goal / KPI tracking (PRD §5)

Measurable only after launch; listed so they are not forgotten.

| Goal | KPI | Status |
|---|---|---|
| G1 | Risk Index v1.0 for ≥ 95% of 1,656 LGUs; 100% reproducible | Not started |
| G2 | 100% of indicator values source-linked; ≥ 98% spot-check accuracy | Not started |
| G3 | ≥ 98% of records resolved to PSGC | Not started |
| G4 | Clan graph covering 82 provinces + HUCs; every edge sourced | Not started |
| G5 | Zero adverse judgments; right-of-reply SLAs met | Not started |
| G6 | Data Coverage shown at equal weight; no low-risk tier below 40% | Not started |
| G7 | ≥ 25 documented citations; ≥ 1,000 API calls/month by month 12 | Not started |
| G8 | ≥ 99% pipeline success; freshness visible per source | Not started |

---

## 7. Decision log

Append-only. Supersede rather than edit.

| # | Date | Decision | Basis |
|---|---|---|---|
| D1 | 2026-09-22 | Stack fixed: Next.js App Router + React + TypeScript + Supabase/PostGIS + MapLibre GL JS | PRD §10 |
| D2 | 2026-09-22 | **Supabase self-hosted**, not Cloud. `supabase/migrations/` is the single source of truth, applied via CLI | Client decision — consequences in [plan.md §5.1](./plan.md) |
| D3 | 2026-09-22 | `officials.bettergov.ph` (Dynasties API) **approved** as the officials/dynasty source | Client approval; live + CC0 1.0 |
| D4 | 2026-09-22 | Standalone DPWH connector **dropped**; flood-control becomes the infrastructure source. FR-7 superseded | `api.dpwh.bettergov.ph` returns 404 on all paths |
| D5 | 2026-09-22 | **P3 moved into the MVP index** | Dynasties API confirmed live |
| D6 | 2026-09-22 | P3 indicator named **"surname concentration"**, not "dynasty share" | A bloc is a surname heuristic, not verified kinship |
| D7 | 2026-09-22 | Recommendation to restate G1's 1,656 denominator **withdrawn** — 1,656 is correct; the PRD's "1,634" is the error | PSGC Q2_2024: 1,623 + 33 = 1,656 |
| D8 | 2026-09-22 | Boundary geometry: **HDX COD-AB under CC BY-IGO 3.0**. BetterGov ds-23 and altcoder rejected as licence basis (MIT covers code; upstream PSA/NAMRIA are `license: null`) | [plan.md §1.8](./plan.md) |
| D9 | 2026-09-22 | **Do not ingest HDX's region layer.** Dissolve provinces → regions on PSGC parent code via `ST_Union` | HDX removed Negros Island Region; PSGC Q2_2024 has it as `1800000000` |
| D10 | 2026-09-22 | Dynasties geography (88/1,767) is **mapped onto** the PSGC spine, never adopted as it | Two sources, two geographies; PSGC is authoritative |
| D11 | 2026-09-22 | Point-in-polygon matches carry **lower confidence** than code matches in FR-2 | HDX boundaries are indicative, not official (OCHA) |

---

## 8. Session log

| Date | Work | Outcome |
|---|---|---|
| 2026-09-22 | PRD review; live probe of all 8 data sources | 4 `owner: us` blockers closed; 3 PRD assumptions corrected |
| 2026-09-22 | Build plan authored | [`plan.md`](./plan.md) — 41 FRs mapped to 6 epics, Slice 1 defined |
| 2026-09-22 | Boundary geometry research | HDX COD-AB selected; licence trap in MIT-labelled alternatives documented |
| 2026-09-22 | Progress tracker created | This file |

---

## 9. Next up

**Slice 1 — the walking skeleton** ([plan.md §4](./plan.md)):
> A visitor can open an LGU profile page and see that LGU's real infrastructure projects, each
> row linking to the source record it came from, stamped with the data vintage and the standing
> disclaimer.

Needs neither geometry nor brand to begin. Competing candidate for first work: the architecture
ADR (ingestion orchestration), made more pressing by the self-hosting decision (D2).
