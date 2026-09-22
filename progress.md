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
| **Phase** | P1 — Foundation |
| **Overall status** | Slice 1 built; ingestion verified against live sources; DB path awaiting Docker |
| **Current slice** | Slice 1 (walking skeleton) — **code complete, partially verified** |
| **FRs complete** | 2 of 41 (FR-1, FR-4) · 2 partial (FR-2, FR-6) · 1 superseded (FR-7) |
| **Tests** | 34 passing · packages typecheck clean · `next build` clean |
| **Hard launch blockers cleared** | 0 of 4 |
| **Last updated** | 2026-09-22 |

### Slice 1 status

> A visitor can open an LGU profile page and see that LGU's real infrastructure
> projects, each row linking to the source record, stamped with data vintage
> and the standing disclaimer.

| Step | State |
|---|---|
| PSGC spine ingested from live API | **Done** — 1,758 rows, 18 reg / 82 prov / 150 city / 1,493 mun |
| Immutable checksummed snapshots | **Done** — verified round-trip + tamper detection |
| Infrastructure feed ingested | **Done** — all 25,452 records |
| Entity resolution | **Partial** — 36.0% attributed; ceiling without geometry is 41.9% |
| Schema + RLS migration | **Written**, not yet applied (needs Docker) |
| Snapshot → Postgres loader | **Written**, not yet run (needs Docker) |
| LGU profile page + disclaimer | **Done** — renders; serves setup state without a DB |

**Blocked on:** Docker Desktop is not running and the Supabase CLI is not
installed, so the migration has never been applied and the page has not yet
rendered real rows. Everything upstream of Postgres is verified against live
sources.

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
| — | Monorepo scaffold, RLS baseline migration | **Done** (migration written, not applied) |
| FR-1 | PSGC spine loader (Q2_2024) | **Done** — 1,758 rows; mojibake + orphan repairs |
| FR-2 | Deterministic PSGC matcher with quarantine | **Partial** — code/alias/name/trigram done; point-in-polygon blocked on FR-3 |
| FR-3 | HDX geometry import + province→region `ST_Union` dissolve + tiles | Not started — **now the top constraint** |
| FR-39 | PSGC split / merge / create / rename handling | Partial — orphan reattachment done (Pateros) |
| — | Dynasties-geography → PSGC crossmap (88/1,767 → 82/1,656) | Not started |

_Gate:_ ≥ 98% record resolution · Dynasties crossmap explained · dissolved region layer
reproduces all 18 PSGC regions including NIR.

### Epic B — Ingestion framework & connectors

| FR | Deliverable | Status |
|---|---|---|
| FR-4 | Immutable checksummed snapshot framework | **Done** — canonical hashing, refuses overwrite, verifies on read |
| FR-40 | Last-good-snapshot serving; no partial promotion | **Done** — `latest` advances only on a successful run |
| FR-5 | Budget connector (GAA FY2020–26, NEP FY2027) | Not started |
| FR-6 | Infrastructure projects connector (25,452 records) | **Done** — float→centavos, bounds checks, quality flags |
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

- [x] Monetary values arrive as **floats** (`1447499996.23`) — `toCentavos` parses decimal text, never multiplies floats
- [x] Populations arrive as **strings with spaces and commas** (`" 593,081 "`) — `parseCount`
- [x] **Administrative pseudo-locations** — detected and routed away from name matching
- [x] **Internally contradictory records** — flagged `complete-but-unpaid`; **16,909 records affected (66.4%)**
- [x] **Double-encoded UTF-8 in place names** — *found during the build*, see below
- [x] **`location.province` is not a province** — *found during the build*, see below
- [ ] **Candidate data absent before 2010** — unopposed-rate/margin only computable 2010+; must reduce Data Coverage
- [ ] **HDX pcodes are 2023-vintage** vs Q2_2024 spine — alias reconciliation required

### Two landmines found while building slice 1

**The PSGC API serves double-encoded UTF-8.** "City of Las Piñas" arrives as
"City of Las PiÃ±as" — the original `ñ` (U+00F1) was decoded as Latin-1 and
re-encoded. 18 spine rows are affected (Las Piñas, Parañaque, Peñablanca, Santo
Niño, Doña Remedios Trinidad, Science City of Muñoz…). Left alone this defeats
name matching, breaks the Ñ handling FR-29 requires, and would put visibly
wrong place names on the public site. Repaired at the connector boundary
(`repairMojibake`) and covered by tests.

**The infrastructure feed's `location.province` is not a province.** It is the
DPWH implementing office. Across all 25,452 records: 51.1% name only a region
("Region V"), 41.9% a district office ("Abra DEO", "Camarines Sur 5th DEO"),
7.0% a pseudo-location. **100% carry valid coordinates.**

This is the strongest evidence yet for plan.md §2: without boundary geometry,
**58% of project records cannot reach any LGU at all**, and the P1 procurement
pillar would be computed over a skewed 42% subset. Name-based resolution
currently attributes 36.0% — about 86% of the achievable ceiling. The rest is
not a tuning problem; it is the geometry gap.

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
| B7 | **Docker Desktop not running + Supabase CLI not installed** | Applying migrations; the last step of slice 1 | dev machine | 2026-09-22 |

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
| D12 | 2026-09-22 | Money is a branded `Centavos` type parsed from **decimal text**, never float multiplication | `1447499996.23 * 100` is not exact in IEEE-754 |
| D13 | 2026-09-22 | Ambiguous name matches **quarantine rather than pick a candidate** | Guessing attributes one LGU's spending to another; a quarantined row is a 5-minute steward review |
| D14 | 2026-09-22 | A bare province name in a DPWH office means the **province**; an explicit "City" means the **city** | Cebu/Iloilo/Isabela/Cavite/Tarlac/Quezon each name both a province and a city; this recovered 2,574 records |
| D15 | 2026-09-22 | Repair double-encoded UTF-8 at the connector boundary | 18 spine rows arrive mangled; see §3 |
| D16 | 2026-09-22 | Region-level implementing offices resolve to **nothing**, not to an arbitrary LGU inside the region | Attributing a region's whole spend to one municipality would be fabrication |
| D17 | 2026-09-22 | Pin `@supabase/supabase-js` to **2.116.0** | 2.117.0 pins `auth-js@2.117.0` exactly, which was never published — the latest release is uninstallable |
| D18 | 2026-09-22 | Pateros reattached to NCR when its derived PSGC parent is unpublished | An LGU that exists must be scorable and must roll up |

---

## 8. Session log

| Date | Work | Outcome |
|---|---|---|
| 2026-09-22 | PRD review; live probe of all 8 data sources | 4 `owner: us` blockers closed; 3 PRD assumptions corrected |
| 2026-09-22 | Build plan authored | [`plan.md`](./plan.md) — 41 FRs mapped to 6 epics, Slice 1 defined |
| 2026-09-22 | Boundary geometry research | HDX COD-AB selected; licence trap in MIT-labelled alternatives documented |
| 2026-09-22 | Progress tracker created | This file |
| 2026-09-22 | Slice 1 built | Monorepo, snapshots, 2 connectors, resolution, schema + RLS, LGU profile. 34 tests, typecheck and build clean |
| 2026-09-22 | Live ingestion runs | 1,758 spine rows · 25,452 projects · 36.0% attributed |

---

## 9. Next up

**Immediate — to finish verifying slice 1.** Start Docker Desktop and install the
Supabase CLI, then:

```
npx supabase start
npx supabase db reset            # applies migrations + RLS
npm run load                     # snapshot → Postgres
npm run dev
```

Snapshots are already on disk, so nothing needs re-fetching.

**Then, in priority order:**

1. **FR-3 boundary geometry.** Now the single largest constraint on the product,
   not merely on the map — it is what unlocks the other 58% of project records
   (§3). Needs only the counsel sign-off on CC BY-IGO (B1) to proceed.
2. **FR-5 budget connector** — the P2 pillar. Unblocked today.
3. **FR-9 Dynasties connector** — the P3 pillar. Unblocked today.
4. **Architecture ADR** — ingestion orchestration, sharpened by self-hosting (D2).
