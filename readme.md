# Philippine Corruption Risk Map

An open-data platform that maps **corruption risk** across every Philippine province, city and municipality, and maps the **political clans** that hold power in each region.

PCRM joins national budget data, infrastructure contract records, legislative activity, court decisions, officials registries and PSA statistics onto one geographic key, scores each LGU against a published set of red-flag indicators, and renders the result as an interactive map where every number links back to the primary record it came from.

> **Risk is not an allegation.**
> A high score means the observable statistical and structural conditions associated with corruption risk are present in the public record and worth examining. It is not a finding, an accusation, or evidence of wrongdoing by any person, office or company. Every score is traceable to its sources, every methodology version is published, and every entity named has a right of reply.

---

## Status

**Pre-development.** The PRD is drafted and awaiting client sign-off. No code has been written.

| Artifact | State |
|---|---|
| [`prd.md`](./prd.md) | v0.1 draft — awaiting Gate 1–5 approval |
| [`plan.md`](./plan.md) | Build plan — 41 requirements mapped to six dependency-ordered epics |
| [`progress.md`](./progress.md) | Development tracker — 0 of 41 requirements complete |
| Architecture ADR | Not started |
| Application | Not started |

Every data source was probed live on 2026-09-22. **All four blocking source questions are now closed:** one source is dead, one has no API, one is live and considerably richer than assumed, and the boundary geometry source is identified along with its licence. See [Data sources](#data-sources) and [Open questions](#open-questions).

---

## What it does

**Risk mapping.** Each LGU receives a 0–100 composite risk score built from five weighted pillars. Indicators are winsorised, then z-scored **within a peer group** of similar LGUs (same level, same income class), so a fifth-class municipality is never scored against Quezon City.

| Pillar | Weight | What it measures |
|---|---|---|
| **P1 Procurement & Project Integrity** | 35% | Contractor concentration, new-contractor share, cost-per-unit outliers, stalled projects, payment running ahead of progress, year-end award clustering |
| **P2 Budget Anomaly** | 25% | Per-capita allocation outliers against peers, year-on-year volatility, loosely specified object classes, NEP→GAA insertion deltas |
| **P3 Political Concentration** | 20% | Surname concentration of elective seats, consecutive years of single-surname executive control, unopposed-race rate, concurrent related-surname positions |
| **P4 Accountability History** | 15% | Adverse graft and malversation decisions involving the LGU or its officials in official capacity, decay-weighted by age *(v1.1)* |
| **P5 Socioeconomic Context** | 5% | Poverty, population, income class — **used only as normalisers and peer-group keys, never as a positive risk signal** |

P3 measures **surname concentration**, not "dynasty share". Shared surnames within a province are a search heuristic, not evidence of kinship — so the indicator is named for what it actually measures. Verified kinship lives in the clan graph below, behind editorial review, and is a separate thing from this score.

**Clan mapping.** Political families are modelled as a graph of person nodes and kinship edges. Every published edge carries at least one citable public source; edges shown as `confirmed` carry two independent sources. Nothing publishes without human editorial approval — surname inference and crowdsourced submissions seed a review queue, they never go live on their own.

**Data coverage, shown as loudly as risk.** The hardest problem in this domain is that places with weak local media and thin records *look* clean. Every LGU carries a Data Coverage score displayed at equal prominence beside its risk score, and no LGU with coverage below 40% is ever rendered in a low-risk tier — it renders as **Insufficient Data**, in its own style.

---

## Design principles

1. **Risk, never guilt.** The platform scores *jurisdictions and structures*, not people. There is no field anywhere in the schema for attributing conduct to a named individual, and adding one requires a migration reviewed by legal.
2. **Every number is sourced.** No published indicator exists without a link to the source record, its retrieval timestamp and its snapshot version. Two clicks from any number on the site should reach a primary source.
3. **Reproducible or it doesn't ship.** Scoring code is open source. Running it against a published snapshot reproduces the published score exactly — this is asserted by a CI test, not a promise.
4. **Rules, not black boxes.** No machine-learning-derived score is ever shown to the public. An unexplainable score cannot be defended when challenged or corrected when wrong.
5. **Poverty is not a corruption signal.** Socioeconomic variables appear only in denominators and peer grouping. A CI test asserts that raising an LGU's poverty incidence, all else equal, cannot raise its risk score.
6. **Absence of evidence is stated, not implied.** Missing data is displayed as missing. Pillars with no observed indicators are excluded and the remaining weights re-normalise, with the exclusion shown on the profile.
7. **Correctable by design.** Public right of reply, a public immutable corrections changelog, and a documented takedown workflow — built before launch, not after the first complaint.

---

## Data sources

### Confirmed

| Source | Endpoint | Auth | Notes |
|---|---|---|---|
| **National budget** | `https://budget.bettergov.ph/api/v1` | None | GAA FY2020–2026, NEP FY2027. Cursor pagination, exact PHP amounts, OpenAPI at `/api/v1/openapi.json`, MCP at `/mcp` |
| **Infrastructure projects** | `https://flood-control.bettergov.ph/api/flood-control-projects` | None | **25,452** projects with budget, amountPaid, progress, contractor, coordinates, status. The index is `postgis.dpwh_projects` — it covers DPWH infrastructure, not flood control alone |
| **Officials & dynasties** | `https://officials.bettergov.ph/api/v1` | None | 9 election cycles (2001–2025); 175,720 persons, 309,240 candidacies, 48,718 contests, 21,618 surname blocs. Derived data **CC0 1.0**; sourced from Open Halalan. MCP at `/mcp` |
| **PSA statistics** | `https://statistics.bettergov.ph/api/v1` | None | Datasets + observations; PSGC classification at `/api/classification/{system}/{version}/{level}`, current version **Q2_2024**; MCP at `/mcp` |
| **Boundary geometry** | [HDX `cod-ab-phl`](https://data.humdata.org/dataset/cod-ab-phl) | None | NAMRIA/PSA administrative boundaries prepared by OCHA. **CC BY-IGO 3.0.** Bulk download, not an API |
| **Legislative (BatasWatch)** | `https://bills.juris.ph/api` | None | Measures, authors, policy areas, committees, semantic search. Independent, non-official source |
| **ASEAN indicators** | `https://asean.bettergov.ph/api/v1` | None | 39 datasets across ASEAN-11; comparative context only; MCP at `/mcp` |

### Ruled out

| Source | Finding |
|---|---|
| `https://api.dpwh.bettergov.ph` | **Dead.** 404 on `/`, `/api`, `/openapi.json` and `/docs`; no alternative host resolves. No separate DPWH connector will be built — the infrastructure endpoint above supersedes it |
| `https://juris.ph/api` | **No API.** The service exists (SC decisions + Republic Acts via lawphil.net) but the path serves a single-page app, not a REST surface. The P4 pillar stays out of MVP and needs a different acquisition route |

All sources are public and unauthenticated. Ingestion writes immutable, checksummed snapshots — so published scores stay reproducible even if an upstream source changes or disappears.

**On the geometry licence.** Two better-known alternatives were rejected: BetterGov's own boundary dataset and `altcoder/philippines-psgc-shapefiles` both carry an MIT licence, but that licence covers their *curation code* — their upstream PSA and NAMRIA data each carry no licence at all, so MIT grants no rights in the boundaries themselves. HDX is the only candidate attaching a real data licence, which is what republication has to rest on.

Two caveats travel with it, and both are disclosed on the methodology page: these are **indicative, not official** boundaries (the Land Management Bureau holds the official ones), and HDX omits the Negros Island Region that PSGC Q2_2024 includes — so region geometry is built by dissolving province polygons on their PSGC parent code rather than imported directly.

---

## Stack

- **Next.js** (App Router) + React + TypeScript
- **Supabase, self-hosted** — PostgreSQL + **PostGIS**, Auth, Row-Level Security on every table, Storage, Edge Functions, Vault for secrets
- **MapLibre GL JS** — open-source vector map rendering
- Scheduled ingestion writing versioned snapshots; scoring as a separate reproducible service

Supabase is self-hosted rather than managed — a deliberate choice for a platform that should outlive any particular hosting arrangement. `supabase/migrations/` is the single source of truth for schema, applied via the CLI. The trade is that availability, backups, restore drills and patching are in-house responsibilities rather than a vendor SLA.

Security posture: RLS everywhere, MFA mandatory for editor and admin roles, service-role keys never reachable from the client bundle, secrets in Vault and never in a committed `.env`, CI fails on any committed secret, penetration test before public launch.

---

## Repository layout

Planned structure — not yet created.

```
philippinecorruptionriskmap/
├── prd.md                  # Product Requirements Document
├── plan.md                 # Build plan — epics, critical path, first slice
├── progress.md             # Development tracker — status, blockers, decision log
├── readme.md               # This file
├── docs/
│   ├── methodology/        # Versioned index methodology + changelog
│   ├── adr/                # Architecture decision records
│   └── legal/              # Disclaimers, DPIA, right-of-reply policy
├── apps/
│   └── web/                # Next.js application
├── packages/
│   ├── ingestion/          # One connector per data source
│   ├── scoring/            # Risk index — open source, reproducible
│   ├── resolution/         # PSGC entity resolution
│   └── types/              # Shared TypeScript types
├── supabase/
│   ├── migrations/         # Schema + RLS policies
│   └── functions/          # Edge functions
└── data/
    └── snapshots/          # Immutable ingestion snapshots (checksummed)
```

---

## Getting started

Not yet applicable — the application does not exist. Once P1 begins:

```bash
npm install
cp .env.example .env.local      # never commit this
npx supabase start
npx supabase db reset           # applies migrations + RLS
npm run ingest -- --source=psgc # load the geographic spine first
npm run dev
```

---

## Roadmap

| Phase | Weeks | Deliverable |
|---|---|---|
| **P0** Confirm & de-risk | 1–3 | ~~API contracts confirmed~~ · ~~geometry source + licence~~ · legal counsel engaged · architecture ADR |
| **P1** Foundation | 4–8 | PSGC spine, boundary geometry + region dissolve, schema + RLS, entity resolution, ingestion pipelines, status page |
| **P2** Index v1.0 | 9–13 | Pillars **P1/P2/P3/P5**, Data Coverage, peer normalisation, sensitivity analysis, methodology page |
| **P3** Map & profiles | 12–18 | Choropleth, LGU profiles with evidence trail, search, contractor pages, WCAG 2.2 AA pass |
| **P4** Clan layer | 16–22 | Person entities, kinship graph, moderation workflow, regional network view |
| **P5** Openness | 20–24 | Public REST API, exports, alerts, right of reply, corrections log, audit log |
| **P6** Launch readiness | 24–27 | Load test to 10×, full counsel review, open-source the scoring code, journalist pre-brief |
| **P7** v1.1 | Post-launch | P4 Accountability History pillar, legislative indicators, crowdsourced submissions, Filipino localisation |

Week numbers are the PRD's indicative phasing and are not a commitment — the budget, timeline and team envelope are still unset. The *order* is firm; the durations are not yet estimable.

Two changes from the PRD's original phasing: the **P3 pillar moves forward into the index** (P2 rather than the clan layer), now that the officials data is confirmed — computing surname concentration needs election records, not a published kinship graph. And the **P4 pillar no longer has a route**, since no Juris.ph API exists; acquisition has to be solved before it can be scheduled.

**Hard blockers on public launch:** legal review complete · editorial moderation staffed · penetration test findings closed · DPIA approved.

---

## Open questions

Tracked in full in [`prd.md` §14](./prd.md); live status in [`progress.md`](./progress.md).

**Closed 2026-09-22** — every question the build team owned:

- ~~DPWH, Juris.ph and officials.bettergov.ph API contracts~~ — all three probed; see [Data sources](#data-sources)
- ~~LGU boundary geometry source and licence~~ — HDX COD-AB under CC BY-IGO 3.0
- ~~Which academic dynasty datasets to import, and under what licence~~ — Open Halalan, CC0 1.0, reached through the officials API

**Still open** — all owned by the client:

- Named client approver with sign-off authority
- Philippine legal counsel engaged — including confirmation that CC BY-IGO 3.0 covers republication as derived vector tiles
- Budget, timeline and team envelope — now also needs an ops role, since Supabase is self-hosted
- Editorial staffing for the moderation queue
- Brand assets: name, logo, palette, typography, tone of voice

---

## Contributing

Not yet open. When it is, two rules will govern every contribution touching published data:

1. **No claim without a source.** Kinship edges, indicator values and corrections all require a citable public reference at validation time.
2. **No automated publication of anything about a person.** Inference and crowdsourcing feed a review queue. A human editor publishes.

---

## Legal & ethics

This platform processes public-capacity information about public officials for purposes of public accountability and journalism, under the Data Privacy Act (RA 10173). It publishes no private-individual profiles, no SALN content, and no conduct allegations.

Philippine criminal libel and cyber-libel (RA 10175 §4(c)(4)) apply to statements about identifiable persons. This is the binding constraint on all published language and the reason the schema cannot express an accusation.

**If a record about you is wrong:** every LGU profile, person record and project row carries a correction and right-of-reply action. Submissions are acknowledged within 3 business days and resolved within 15. Accepted corrections publish in a public, immutable changelog.

---

## Attribution

Built on the open APIs of the **BetterGov.ph** family (budget, infrastructure projects, statistics, officials/dynasties, ASEAN), **Juris.ph** (Supreme Court decisions and Republic Acts, sourced from lawphil.net) and **BatasWatch** (Senate and House measures). Originating data belongs to the DBM, DPWH, PSA, COMELEC, DILG, the Supreme Court and the Congress of the Philippines.

Specific attribution required by the licences we rely on:

- **Election and officials data** — Leung, Robert R., *[Open Halalan: The Philippine National and Local Election Dataset](https://robertrleung.github.io/OpenHalalan/)*. Derived data CC0 1.0 via BetterGov.ph; poverty incidence from the PSA.
- **Boundary geometry** — [Philippines Subnational Administrative Boundaries](https://data.humdata.org/dataset/cod-ab-phl), prepared by OCHA from NAMRIA and PSA sources, licensed [CC BY-IGO 3.0](http://creativecommons.org/licenses/by/3.0/igo/legalcode). These are indicative boundaries, not official ones.

BatasWatch and the BetterGov.ph family are independent projects and are not official government websites. Claims should be verified against the official sources cited in each record.

---

_Prepared by Innovhub. API contracts verified 2026-09-22._
