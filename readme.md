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
| Architecture ADR | Not started |
| Application | Not started |

Three data source contracts are unconfirmed and block parts of the build. See [Open questions](#open-questions).

---

## What it does

**Risk mapping.** Each LGU receives a 0–100 composite risk score built from five weighted pillars. Indicators are winsorised, then z-scored **within a peer group** of similar LGUs (same level, same income class), so a fifth-class municipality is never scored against Quezon City.

| Pillar | Weight | What it measures |
|---|---|---|
| **P1 Procurement & Project Integrity** | 35% | Contractor concentration, new-contractor share, cost-per-unit outliers, stalled projects, payment running ahead of progress, year-end award clustering |
| **P2 Budget Anomaly** | 25% | Per-capita allocation outliers against peers, year-on-year volatility, loosely specified object classes, NEP→GAA insertion deltas |
| **P3 Political Concentration** | 20% | Dynasty share of elective seats, consecutive years of clan control, unopposed-race rate, concurrent related-family positions |
| **P4 Accountability History** | 15% | Adverse graft and malversation decisions involving the LGU or its officials in official capacity, decay-weighted by age *(v1.1)* |
| **P5 Socioeconomic Context** | 5% | Poverty, population, income class — **used only as normalisers and peer-group keys, never as a positive risk signal** |

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
| **Flood-control projects** | `https://flood-control.bettergov.ph/api/flood-control-projects` | None | ~1,200 projects with budget, amountPaid, progress, contractor, coordinates, status |
| **PSA statistics** | `https://statistics.bettergov.ph/api/v1` | None | Datasets + observations; PSGC classification at `/api/classification/{system}/{version}/{level}`; MCP at `/mcp` |
| **Legislative (BatasWatch)** | `https://bills.juris.ph/api` | None | Measures, authors, policy areas, committees, semantic search. Independent, non-official source |
| **ASEAN indicators** | `https://asean.bettergov.ph/api/v1` | None | 39 datasets across ASEAN-11; comparative context only; MCP at `/mcp` |

### Unconfirmed — blocking

| Source | Issue |
|---|---|
| `https://api.dpwh.bettergov.ph` | Root returns 404; documentation not retrievable. Blocks the DPWH half of the procurement pillar |
| `https://juris.ph/api` | Service exists (SC decisions + Republic Acts via lawphil.net) but no machine-readable API docs found. Blocks the P4 pillar |
| `https://officials.bettergov.ph` | Documented as "ongoing". Blocks the P3 pillar *and* the clan graph |

All sources are public and unauthenticated. Ingestion writes immutable, checksummed snapshots — so published scores stay reproducible even if an upstream source changes or disappears.

---

## Stack

- **Next.js** (App Router) + React + TypeScript
- **Supabase** — PostgreSQL + **PostGIS**, Auth, Row-Level Security on every table, Storage, Edge Functions, Vault for secrets
- **MapLibre GL JS** — open-source vector map rendering
- Scheduled ingestion writing versioned snapshots; scoring as a separate reproducible service

Security posture: RLS everywhere, MFA mandatory for editor and admin roles, service-role keys never reachable from the client bundle, secrets in Vault and never in a committed `.env`, CI fails on any committed secret, penetration test before public launch.

---

## Repository layout

Planned structure — not yet created.

```
philippinecorruptionriskmap/
├── prd.md                  # Product Requirements Document
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
| **P0** Confirm & de-risk | 1–3 | API contracts confirmed, geometry licence, legal counsel engaged, architecture ADR |
| **P1** Foundation | 4–8 | PSGC spine, schema + RLS, entity resolution, first three ingestion pipelines, status page |
| **P2** Index v1.0 | 9–13 | Pillars P1/P2/P5, Data Coverage, peer normalisation, sensitivity analysis, methodology page |
| **P3** Map & profiles | 12–18 | Choropleth, LGU profiles with evidence trail, search, contractor pages, WCAG 2.2 AA pass |
| **P4** Clan layer | 16–22 | Person entities, kinship graph, moderation workflow, regional network view, P3 pillar |
| **P5** Openness | 20–24 | Public REST API, exports, alerts, right of reply, corrections log, audit log |
| **P6** Launch readiness | 24–27 | Load test to 10×, full counsel review, open-source the scoring code, journalist pre-brief |
| **P7** v1.1 | Post-launch | P4 pillar (Juris.ph), legislative indicators, crowdsourced submissions, Filipino localisation |

**Hard blockers on public launch:** legal review complete · editorial moderation staffed · penetration test findings closed · DPIA approved.

---

## Open questions

Tracked in full in [`prd.md` §14](./prd.md). The blocking ones:

- DPWH, Juris.ph and officials.bettergov.ph API contracts
- LGU boundary geometry source and licence
- Named client approver with sign-off authority
- Philippine legal counsel engaged
- Budget, timeline and team envelope
- Which academic dynasty datasets to import, and under what licence
- Editorial staffing for the moderation queue

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

Built on the open APIs of the **BetterGov.ph** family (budget, flood-control, statistics, officials, DPWH, ASEAN), **Juris.ph** (Supreme Court decisions and Republic Acts, sourced from lawphil.net) and **BatasWatch** (Senate and House measures). Originating data belongs to the DBM, DPWH, PSA, COMELEC, DILG, the Supreme Court and the Congress of the Philippines.

BatasWatch and the BetterGov.ph family are independent projects and are not official government websites. Claims should be verified against the official sources cited in each record.

---

_Prepared by Innovhub. API contracts verified 2026-09-22._
