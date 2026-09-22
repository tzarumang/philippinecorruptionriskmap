# Philippine Corruption Risk Map — Product Requirements Document

_Version 0.1 draft · Prepared by Innovhub · Client approver: [NEEDS INPUT — name, role] · Date: 2026-09-22_

---

## 1. Overview & Objective

The Philippine Corruption Risk Map (PCRM) is a public, open-data web platform that scores and maps **corruption risk** for every Philippine province, city, and municipality, and maps the **political clans** that hold power in each region. It combines national budget data, infrastructure contract records, legislative activity, court decisions, officials registries, and PSA statistics into a single transparent composite index, rendered as an interactive choropleth map with a full evidence trail behind every score.

**Objective:** Give journalists, civil society organisations, auditors, researchers, and citizens a defensible, source-linked view of *where* public funds face the highest corruption risk in the Philippines, and *who* holds the political power in those places — so that scrutiny can be directed where the evidence points.

**The governing design constraint:** PCRM publishes a **risk** score, not an **accusation**. A high score means the observable statistical and structural conditions associated with corruption risk are present and worth examining. It never asserts that a person or LGU is corrupt. Every number on the platform traces back to a citable public record, and every entity named has a right of reply.

---

## 2. Background & Context

### Why now

- **Data availability has crossed a threshold.** Between 2024 and 2026, a cluster of open APIs (the BetterGov.ph family, Juris.ph, BatasWatch) made Philippine budget, infrastructure, legislative, and statistical data machine-readable for the first time at national scale. Before this, the same analysis would have required manual PDF scraping of the General Appropriations Act.
- **The flood-control controversy created public demand.** The public scrutiny of DPWH flood-control projects demonstrated both the appetite for project-level accountability data and the difficulty citizens face in connecting a project, a contractor, a budget line, and a political patron without a unifying tool.
- **Political dynasty data is scattered.** Academic dynasty indices exist but are periodic, static, and not linked to spending data. No public tool connects clan control of an LGU to the flow of public money through it.

### Current state

Each data source is individually browsable but siloed. A journalist investigating a suspect road project in a municipality must currently: search the DPWH portal for the contract, cross-reference the GAA for the appropriation, check Juris.ph for prior graft decisions involving the LGU, look up the incumbent officials manually, and reconstruct family relationships from news archives. This takes days per LGU. There are ~1,600 LGUs.

### Constraints envelope

- **Budget:** [NEEDS INPUT] — owner: client
- **Timeline:** [NEEDS INPUT] — target public launch date. Section 13 proposes a phased plan assuming a start date of 2026-10-01.
- **Team:** [NEEDS INPUT] — engineering headcount, data analyst, legal counsel, editorial reviewer.
- **Legal:** Philippine libel and cyber-libel exposure (Revised Penal Code Art. 353–355; RA 10175 §4(c)(4)) is the binding constraint on all published language. Data Privacy Act (RA 10173) governs handling of named individuals.

---

## 3. Problem Statement

**The job to be done:** "I need to know which local governments are at highest risk of corrupt use of public funds, what evidence supports that, and who politically controls them — without spending a week per locality assembling the picture by hand."

**The pain:**

1. **Fragmentation.** The evidence for a single risk judgment lives across six or more unrelated APIs and portals with no common geographic key.
2. **No geographic key.** Budget data is organised by department and agency; infrastructure data by contract; statistics by PSGC code; officials by position. Nothing joins them at the LGU level without an explicit reconciliation layer.
3. **No baseline.** A ₱400M allocation to a municipality means nothing without knowing what comparable municipalities received. Without peer normalisation, every number is unreadable.
4. **Power is invisible in the data.** Contracts and budgets record institutions, not the families that control them across decades and across sibling positions (governor, mayor, congressman, board member).
5. **Absence of scandal is mistaken for absence of risk.** Places with weak local media and no reported cases look clean. The data cannot distinguish "low risk" from "unobserved."

**Current workarounds:** Manual journalist investigation per locality; periodic academic dynasty studies not linked to spending; COA annual audit reports (authoritative but lagging, per-agency, and published as PDFs); ad-hoc Facebook and news-cycle scrutiny driven by whichever scandal is current.

---

## 4. Users & Personas

| Persona | Role / permissions | Volume | Goals |
|---------|--------------------|--------|-------|
| **Citizen / Voter** | Anonymous public. Read-only map, LGU profiles, methodology. | ~50,000 MAU target year 1; spikes to 200k+ around elections and scandals | "Is my city at risk? Who runs it? Where did the flood-control money go?" |
| **Investigative Journalist** | Free registered account. Saved searches, alerts, CSV/GeoJSON export, contractor and clan network views. | ~500 registered; ~100 active monthly | "Give me a ranked lead list and the underlying records I can independently verify and cite." |
| **CSO / Anti-corruption Advocate** | Free registered account. Same as journalist, plus bulk export and embeddable widgets. | ~200 organisations | "Track my province over time; produce evidence for advocacy and FOI requests." |
| **Academic Researcher** | Free registered account + API key. Full API access, historical snapshots, methodology versioning. | ~150 | "Reproducible panel dataset of LGU risk indicators with documented provenance." |
| **Government Auditor / Oversight (COA, Ombudsman, DILG)** | Optional verified account. Same public data; a feedback channel for corrections. | ~50 | "Triage where to direct limited audit capacity." |
| **Named Official / LGU Representative** | Verified right-of-reply account, scoped to their own LGU or record. Can submit a correction or response, which publishes alongside the record. | ~200 over year 1 | "Contest an inaccurate record; publish our side." |
| **Platform Editor / Data Steward** | Internal. Approves clan-graph entries, moderates crowdsourced submissions, handles corrections and takedown requests, publishes methodology versions. | 2–5 staff | "Keep the dataset accurate, sourced, and legally defensible." |
| **Platform Administrator** | Internal. Full access, ingestion pipeline control, user and role management, audit log. | 1–2 staff | "Keep pipelines green and access controlled." |

---

## 5. Goals & Success Metrics

| ID | Goal | Success metric (KPI) |
|----|------|----------------------|
| **G1** | Produce a transparent, reproducible corruption **risk score** for every Philippine LGU | Risk Index v1.0 published for ≥ 95% of the 1,656 PSGC-coded provinces, cities and municipalities within 90 days of launch; 100% of scores reproducible from published inputs and open-sourced scoring code |
| **G2** | Make every score fully **traceable to a primary source** | 100% of indicator values link to the source API record, retrieval timestamp, and dataset version; zero unsourced published claims; independent spot-check of 50 random indicator values finds ≥ 98% accuracy |
| **G3** | **Unify** fragmented public data on one geographic key | ≥ 98% of ingested project, budget and officials records resolved to a PSGC code; unresolved records quarantined and visible in a public data-quality report |
| **G4** | Map **political clan** control per region with sourced kinship claims | Clan graph covering all 82 provinces and all highly urbanised cities; 100% of published kinship edges carry ≥ 1 citable public source; ≥ 2 independent sources for any edge shown at "confirmed" confidence |
| **G5** | Be **legally defensible and correctable** | Zero adverse legal judgments; 100% of right-of-reply submissions acknowledged within 3 business days and resolved within 15; every published correction logged in a public changelog |
| **G6** | Distinguish **low risk from low data** | Every LGU carries a Data Coverage score shown with equal visual weight as the risk score; no LGU with coverage < 40% is displayed in a "low risk" tier |
| **G7** | Drive **real accountability use** | ≥ 25 documented citations in published journalism, CSO reports, or official proceedings within 12 months of launch; ≥ 1,000 API calls/month from registered researchers by month 12 |
| **G8** | Keep the platform **current** | All ingestion pipelines refresh on schedule with ≥ 99% success; no published dataset older than its source's own update cadence + 7 days; data freshness visible per source on a public status page |

---

## 6. Scope & MVP

### MoSCoW

**Must have**
- PSGC-keyed geographic spine (region → province → city/municipality) with official boundary geometries
- Ingestion for: national budget (GAA/NEP), flood-control projects, DPWH projects, PSA statistics, officials registry
- Corruption Risk Index v1.0 — rules-based, weighted, peer-normalised, published methodology
- Data Coverage score per LGU
- Interactive choropleth map (province and city/municipality levels) with risk tiers
- LGU profile page: score breakdown, indicator-by-indicator evidence, source links, projects, budget, officials
- Political clan graph per region with sourced kinship edges and dynasty metrics
- Full methodology page, versioned, plain-language and technical
- Legal framework: disclaimers, right-of-reply workflow, corrections log, takedown process
- Search (LGU, official, contractor, project)
- Public read-only REST API
- Editorial review workflow gating all clan data before publication

**Should have**
- Legal/jurisprudence indicator from Juris.ph (graft decisions linked to LGUs and officials)
- Legislative indicator from BatasWatch (bill authorship and budget insertion patterns)
- Contractor profile pages with cross-LGU concentration and network view
- Time-series view of a score across index versions and data vintages
- CSV / GeoJSON export
- Saved searches and email alerts for registered users
- Public data-quality and pipeline status dashboard
- Crowdsourced clan submissions with moderation queue
- Filipino (Tagalog) localisation of the public interface

**Could have**
- ASEAN comparative context layer (asean.bettergov.ph)
- Barangay-level drill-down where PSA data supports it
- Embeddable map and LGU-card widgets for newsroom use
- Public comment/annotation on records
- Election-cycle mode highlighting contested vs unopposed races
- Mobile applications
- Automated anomaly alerts pushed to subscribers

**Won't have (now)** — see out-of-scope for the reasoning
- Any machine-learning-derived score shown to the public
- Named-individual "corruption scores" or personal rankings
- Barangay officials coverage
- Anonymous tip intake or whistleblower reporting
- Predictive claims about future corruption
- Real-time procurement monitoring or bid-level PhilGEPS ingestion
- Social-media sentiment or news-sentiment scoring

### MVP boundary

MVP = **Must-have list, at province and city/municipality level, using the four data sources whose APIs are confirmed and documented** (budget.bettergov.ph, flood-control.bettergov.ph, statistics.bettergov.ph, officials.bettergov.ph), plus the clan graph for the 82 provinces. The risk index at MVP therefore runs on the Procurement, Budget, Political Concentration, and Context pillars. The Legal/Jurisprudence and Legislative pillars enter at v1.1 once their API contracts are confirmed (see section 14).

### Out of scope (explicit)

| Out of scope | Why |
|---|---|
| Declaring any person, LGU or company corrupt, guilty, or under investigation | Not supportable by the data; direct libel exposure |
| Public-facing ML or AI-generated risk scores | Unexplainable scores cannot be defended in a legal challenge or corrected when wrong; conflicts with G1/G2 |
| Individual officials' personal risk scores | Attaching a corruption number to a named private-capacity individual is the highest-risk publishing act available; the platform scores **jurisdictions and structures**, not people |
| SALN content ingestion | Access is legally restricted; secondhand copies are of uncertain provenance |
| Anonymous tip/whistleblower intake | Requires a security, legal and duty-of-care regime far beyond this product's scope; mishandling endangers sources |
| PhilGEPS bid-level scraping | No public API; scraping raises ToS and reliability issues. Revisit if an API appears |
| Barangay-level scoring | Data coverage at barangay level is too sparse to support a defensible score |
| Predicting future corruption | Unfalsifiable and indefensible |

---

## 7. Functional Requirements

_Each story carries acceptance criteria and the goal `(G#)` it serves._

### 7.1 Geographic spine and entity resolution

- **FR-1 (G3)** — **As a** platform administrator **I want** a canonical PSGC-keyed geographic reference table covering regions, provinces, cities, municipalities and their historical code changes **so that** every ingested record from every source can be joined on one key.
  - _Acceptance criteria:_ Table loads from `statistics.bettergov.ph/api/classification/psgc/{version}/{level}`; contains ≥ 17 regions, 82 provinces and 1,634 cities/municipalities; each row carries PSGC code, name, parent code, level, income class, and PSGC version; superseded codes map to their successor via an alias table; a record queried by an obsolete code resolves to the current LGU; the loader is idempotent and re-runnable.

- **FR-2 (G3)** — **As a** data steward **I want** incoming records with free-text place names to be resolved to PSGC codes by a deterministic matcher **so that** DPWH and flood-control records join to the spine without manual work.
  - _Acceptance criteria:_ Matcher applies, in order: exact code match, exact normalised name match within the parent, alias-table match, then trigram similarity ≥ 0.85; every match records its method and confidence; matches below 0.85 are written to a quarantine table and never enter a score; quarantine volume is exposed on the data-quality dashboard; on a labelled test set of 500 records, precision ≥ 0.99 and recall ≥ 0.95.

- **FR-3 (G3)** — **As a** citizen **I want** boundary geometries for each LGU **so that** the map renders accurate shapes at province and municipality level.
  - _Acceptance criteria:_ PostGIS geometry stored per PSGC code; simplified tiles served for zoom levels 5–9 and full geometry at 10+; every geometry joins to exactly one spine row; unmatched geometries and spine rows without geometry are both reported; total vector tile payload for the national province view ≤ 1.5 MB.

### 7.2 Data ingestion

- **FR-4 (G1, G8)** — **As a** platform administrator **I want** a scheduled ingestion job per data source with versioned snapshots **so that** every published score can be reproduced from the exact inputs that produced it.
  - _Acceptance criteria:_ Each source has a named connector with its own schedule, retry policy (3 attempts, exponential backoff), and timeout; each run writes an immutable snapshot with `source_id`, `retrieved_at`, `record_count`, `checksum`, and `run_status`; a failed run never overwrites the prior good snapshot; runs emit success/failure to the status page; re-running a scoring job against a historical snapshot reproduces the identical score.

- **FR-5 (G1)** — **As a** data steward **I want** the national budget ingested at department, agency, program and object level for FY2020–2026 GAA plus FY2027 NEP **so that** allocations can be traced toward LGUs and anomalies detected.
  - _Acceptance criteria:_ Connector consumes `budget.bettergov.ph/api/v1` endpoints `/gaa/departments`, `/gaa/departments/{id}/programs`, `/gaa/departments/{id}/objects`, `/gaa/years/{year}/departments/{id}/children`, and `/nep/2027/rollups/{dimension}`; keyset pagination via `next_cursor` is followed to completion; all amounts stored as exact PHP integers (no floats); region-dimension rollups map to spine region codes; a reconciliation check confirms the sum of ingested department totals equals the published national total for each year, to the peso.

- **FR-6 (G1, G3)** — **As a** data steward **I want** all flood-control projects ingested with contract, budget, payment, progress, contractor, coordinates and status **so that** the procurement pillar can be computed.
  - _Acceptance criteria:_ Connector consumes `flood-control.bettergov.ph/api/flood-control-projects` paginating to completion (≥ 1,200 records at current volume); persists `contractId`, `description`, `category`, `componentCategories`, `status`, `budget`, `amountPaid`, `progress`, `location.region`, `location.province`, `contractor`, `startDate`, `completionDate`, `infraYear`, `programName`, `sourceOfFunds`, `latitude`, `longitude`; `contractId` is the natural key and re-ingestion updates rather than duplicates; coordinates are validated to fall within Philippine bounds (lat 4.2–21.4, lon 116.0–127.0) and flagged if not; each project resolves to a PSGC code via FR-2 or by point-in-polygon on its coordinates.

- **FR-7 (G1, G3)** — **As a** data steward **I want** DPWH transparency-portal projects ingested **so that** the procurement pillar covers infrastructure beyond flood control.
  - _Acceptance criteria:_ Connector consumes `api.dpwh.bettergov.ph`; persists project identifier, description, cost, contractor, implementing office, status, and location; records deduplicate against flood-control records on contract identifier so a project present in both sources is counted once; [NEEDS INPUT] — the endpoint paths and response schema must be confirmed against the live API documentation before this requirement is final (owner: us; see section 14).

- **FR-8 (G1)** — **As a** data steward **I want** PSA statistics ingested for population, poverty incidence, and crime **so that** indicators can be normalised per capita and against peer LGUs.
  - _Acceptance criteria:_ Connector uses `statistics.bettergov.ph/api/v1` `/datasets` search, `/datasets/{id}` for dimensions, and `POST /datasets/{id}/query` for observations; stores dataset id, release, dimension codes and labels alongside every value; population and poverty series are keyed to PSGC and release year; the most recent release is used for scoring and the release identifier is displayed with the value; where a series is unavailable at municipality level, the value is marked as inherited-from-parent and this reduces the LGU's Data Coverage score.

- **FR-9 (G4)** — **As a** data steward **I want** the officials registry ingested with name, position, LGU, party, and term **so that** incumbency and political concentration can be measured and the clan graph seeded.
  - _Acceptance criteria:_ Connector consumes `officials.bettergov.ph`; each official record carries a stable internal id, normalised name parts (surname, given, middle/maternal, suffix), position, PSGC code, party, term start and end; the same human appearing across terms and positions resolves to one person entity; duplicate-resolution decisions are logged and reversible by a steward; [NEEDS INPUT] — API contract to confirm, portal is documented as "ongoing" (owner: us).

- **FR-10 (G8)** — **As a** citizen **I want** a public status page showing per-source freshness **so that** I know how current the data behind a score is.
  - _Acceptance criteria:_ Page lists every source with its last successful run timestamp, record count, next scheduled run, and a green/amber/red state; amber at > cadence + 3 days, red at > cadence + 7 days; the same freshness badge appears on every LGU profile; page is public and requires no account.

### 7.3 Risk Index

- **FR-11 (G1)** — **As a** researcher **I want** the risk index computed as a documented, weighted, peer-normalised composite of named indicators **so that** I can reproduce and critique it.
  - _Acceptance criteria:_ Index computes from the pillars and weights in section 7.4; each raw indicator is winsorised at the 5th and 95th percentile, then z-scored **within the LGU's peer group** (same level and income class), then mapped to 0–100; pillar scores are the weighted mean of their indicators; the LGU score is the weighted mean of available pillars, with weights re-normalised over available pillars only; every intermediate value (raw, winsorised, z, scaled) is persisted and exposed via API; scoring code is open source; running it against a published snapshot reproduces the published score exactly.

- **FR-12 (G6)** — **As a** citizen **I want** to see how much data an LGU's score is actually based on **so that** I don't read a data gap as a clean record.
  - _Acceptance criteria:_ Data Coverage = weighted share of indicators with a directly observed (not inherited, not imputed) value, 0–100; displayed adjacent to the risk score at equal prominence on map tooltip, profile page and API response; LGUs with coverage < 40% render in a distinct "Insufficient Data" map style, never in a low-risk colour, and their profile leads with an explanation; coverage is never used to raise or lower the risk score itself.

- **FR-13 (G1, G2)** — **As a** journalist **I want** each LGU's score broken down to the individual indicator with its source record **so that** I can verify the basis of every point before I publish.
  - _Acceptance criteria:_ Profile page lists every pillar, its indicators, each indicator's raw value, peer-group percentile, contribution to the score, and a direct link to the source API record and its snapshot version; each indicator has a one-sentence plain-language explanation of what it measures and why it is a risk signal; where an indicator is unavailable, it says so and says why; no indicator is displayed without its source link.

- **FR-14 (G1)** — **As an** editor **I want** index versions to be explicit and immutable **so that** a score cited in an article remains verifiable after the methodology changes.
  - _Acceptance criteria:_ Every published score carries a methodology version (semver) and a data-vintage date; changing any weight, indicator, or transform requires a new version; previous versions remain queryable via API and viewable on the profile; the methodology page shows a changelog of what changed between versions and why; permalinks to a scored LGU include the version.

- **FR-15 (G5)** — **As a** citizen **I want** every score presented with an unambiguous statement of what it does and does not mean **so that** I do not read it as a finding of guilt.
  - _Acceptance criteria:_ A standing disclaimer — risk is not an allegation or finding of wrongdoing — appears on the map, every LGU profile, every clan view, every export file header, and every API response envelope; exported CSV/GeoJSON carry the disclaimer, methodology version and source attribution in-file; the wording is reviewed and approved by legal counsel before launch and is not editable without editor role.

### 7.4 Risk pillars and indicators (index v1.0 specification)

Weights below are the **proposed** v1.0 baseline and are subject to client approval and sensitivity testing (FR-19, section 14).

| Pillar | Weight | Indicators | Primary source |
|---|---|---|---|
| **P1 Procurement & Project Integrity** | 35% | Contractor concentration (Herfindahl–Hirschman index of contract value by contractor within LGU); share of contract value to contractors with < 2 years of record; cost-per-unit deviation from peer median within project category; stalled-project rate (progress < 50% past scheduled completion); payment-ahead-of-progress rate (`amountPaid/budget` − `progress` > 0.25); project-value concentration in the final quarter of the fiscal year | flood-control, DPWH |
| **P2 Budget Anomaly** | 25% | Per-capita allocation deviation from income-class peer median; year-on-year allocation volatility; share of allocation in loosely specified object classes; late-stage insertion delta between NEP and enacted GAA at region level | budget.bettergov.ph |
| **P3 Political Concentration** | 20% | Dynasty share of elective seats in the LGU; consecutive years the dominant clan has held the executive seat; unopposed-race rate over the last 3 cycles; count of concurrently held related-family positions across levels | officials.bettergov.ph + clan graph |
| **P4 Accountability History** | 15% | Count and recency of adverse graft/malversation decisions involving the LGU or its officials in their official capacity, decay-weighted by age | Juris.ph _(v1.1)_ |
| **P5 Socioeconomic Context** | 5% | Poverty incidence; population; income class — **used to normalise and contextualise, contributing only via the peer-grouping and per-capita denominators** | statistics.bettergov.ph |

- **FR-16 (G1, G5)** — **As a** researcher **I want** socioeconomic variables used only as normalisers and peer-group keys, never as direct risk signals **so that** the index does not encode "poor place = corrupt place."
  - _Acceptance criteria:_ P5 contributes no positive-direction weight to the composite; poverty incidence appears only in denominators and peer grouping; a documented test asserts that increasing an LGU's poverty incidence, holding all else constant, does not increase its risk score; the methodology page states this explicitly.

- **FR-17 (G1)** — **As a** researcher **I want** indicators normalised within peer groups **so that** a small municipality is not compared against Quezon City.
  - _Acceptance criteria:_ Peer group = (LGU level, income class); groups with n < 10 fall back to (level) alone and this fallback is disclosed on the profile; peer-group membership and size are exposed via API; changing income class between data vintages triggers re-grouping and a new score version.

- **FR-18 (G1)** — **As a** journalist **I want** risk tiers to be defined by fixed published thresholds, not by rank **so that** an LGU's tier reflects its own conditions rather than whoever else is on the list.
  - _Acceptance criteria:_ Five tiers with fixed score boundaries published in the methodology; an LGU's tier changes only when its own score crosses a boundary; the national distribution across tiers is shown on the methodology page; tier labels avoid accusatory language (e.g. "Elevated Risk Signals", not "Most Corrupt").

- **FR-19 (G1)** — **As an** editor **I want** a sensitivity analysis published with each index version **so that** critics can see how much the ranking depends on our weight choices.
  - _Acceptance criteria:_ For each version, the platform publishes score and rank changes under equal weighting and under ±25% perturbation of each pillar weight; LGUs whose tier is unstable across those runs are flagged as "weight-sensitive" on their profile; the analysis is reproducible from the open-source scoring code.

### 7.5 Political clan mapping

- **FR-20 (G4)** — **As a** data steward **I want** to record political clans as a graph of person entities and sourced kinship edges **so that** family control of an LGU can be measured rather than asserted.
  - _Acceptance criteria:_ Person nodes carry normalised name, PSGC affiliation, positions held with terms, and party history; kinship edges carry relationship type (spouse, parent, child, sibling, in-law, other-relative), direction where applicable, and one or more source citations; every edge has a confidence level of `confirmed` (≥ 2 independent citable sources), `reported` (1 source), or `unverified` (submitted, not yet reviewed); only `confirmed` and `reported` edges are publicly visible, and `reported` is visually and textually marked as single-sourced; `unverified` edges are visible only to stewards.

- **FR-21 (G4, G5)** — **As an** editor **I want** every clan edge to pass editorial review before publication **so that** no kinship claim goes public unreviewed.
  - _Acceptance criteria:_ New or changed edges enter a moderation queue regardless of origin (surname inference, academic import, crowdsourced, staff); publication requires an editor-role approval action; the approval records reviewer identity, timestamp, and the sources checked; an edge can be demoted or retracted, and retraction removes it from public view within 60 seconds and logs it in the corrections changelog; no automated process can publish an edge without human approval.

- **FR-22 (G4)** — **As a** data steward **I want** candidate kinship links inferred from the officials registry **so that** the review queue is seeded efficiently rather than built from nothing.
  - _Acceptance criteria:_ Inference proposes candidate edges from shared surname (including maternal/middle-name surname) within the same province plus overlapping or consecutive terms; every inferred candidate enters the queue as `unverified` with its inference rationale attached; inference output is never published without FR-21 review; the methodology page states plainly that surname co-occurrence is a search heuristic and not evidence of kinship.

- **FR-23 (G4)** — **As a** data steward **I want** to import existing academic dynasty datasets as a seed layer **so that** established research is credited and not re-derived.
  - _Acceptance criteria:_ Imported records retain the originating dataset name, author, publication year, and licence; attribution is displayed wherever an imported edge or metric is shown; import is licence-checked before ingestion and the licence is recorded; imported edges still pass FR-21 review before publication; [NEEDS INPUT] — which datasets, and their licence terms (owner: client).

- **FR-24 (G4)** — **As a** citizen **I want** to submit a correction or a new clan relationship with a source **so that** public knowledge improves the map.
  - _Acceptance criteria:_ Submission form requires a claimed relationship, the two people, and at least one source URL or citation; submissions are rate-limited to 5 per account per day and 20 per IP per day; submissions without a source are rejected at validation; all submissions land as `unverified` in the moderation queue; submitters receive an outcome notification; abusive or coordinated submission patterns can be blocked by a steward; submitter identity is never published.

- **FR-25 (G4)** — **As a** journalist **I want** a regional clan network view with dynasty metrics **so that** I can see concentration of power at a glance and drill into the evidence.
  - _Acceptance criteria:_ Per region and province, the view renders the clan graph with nodes sized by positions held and edges styled by confidence; displays seats held by clan, consecutive years in the executive seat, and share of the LGU's elective seats held by the largest clan; every node links to that person's positions with terms and sources; every edge exposes its citations on interaction; the view renders ≤ 2 s for a province with ≤ 300 nodes.

- **FR-26 (G4, G5)** — **As an** editor **I want** clan pages to describe positions and relationships only, never conduct **so that** the clan layer stays factual and defensible.
  - _Acceptance criteria:_ Person and clan records contain only: name, positions, terms, party, kinship edges, and cited sources; the schema has no field for allegations, conduct, or a personal risk score, and none can be added without a schema migration reviewed by legal; clan pages carry a standing notice that holding office and being related to officeholders are not wrongdoing; automated tests assert no conduct-bearing field exists on person records.

### 7.6 Map and discovery

- **FR-27 (G1, G7)** — **As a** citizen **I want** an interactive national choropleth I can zoom from region to municipality **so that** I can find my own locality and see how it compares.
  - _Acceptance criteria:_ Map opens on a national province-level view; zooming past level 9 switches to city/municipality polygons; hover/tap shows LGU name, risk score, tier, and Data Coverage; clicking opens the LGU profile; the colour scale is colourblind-safe and is accompanied by a legend and by pattern differentiation for the Insufficient Data class; initial map interactive in ≤ 3 s on a 4G connection; map is usable with keyboard alone and every LGU is reachable via the accompanying searchable list.

- **FR-28 (G1)** — **As a** journalist **I want** to switch the map between the composite score and any single pillar **so that** I can see, for example, procurement risk in isolation.
  - _Acceptance criteria:_ A layer selector offers the composite and each pillar; switching re-renders in ≤ 1 s without a full page reload; the active layer is reflected in the URL so a specific view is shareable; the legend and tooltip update to the selected layer's units and explanation.

- **FR-29 (G7)** — **As a** citizen **I want** to search for an LGU, official, contractor or project **so that** I can reach what I care about without navigating the map.
  - _Acceptance criteria:_ Single search box queries all four entity types with type-ahead; results grouped by type and ranked by relevance; handles Philippine name and place variants (Ñ/N, diacritics, "Sta./Santa", "Gen./General", hyphenation); returns first results in ≤ 300 ms at p95; zero-result queries suggest close matches.

- **FR-30 (G2, G7)** — **As a** journalist **I want** to see all projects in an LGU with contractor, value, payment and progress **so that** I can identify which specific projects drive its procurement score.
  - _Acceptance criteria:_ Projects table on the LGU profile is sortable and filterable by year, status, category, contractor and value; each row links to the source record; rows contributing to a triggered risk indicator are marked with which indicator they triggered; table paginates at 50 rows and exports to CSV for registered users.

- **FR-31 (G7)** — **As a** journalist **I want** a contractor profile showing that contractor's work across all LGUs **so that** I can spot concentration that is invisible from any single locality.
  - _Acceptance criteria:_ Contractor page lists all projects, total value, LGU spread, award-share within each LGU, and a co-occurrence view of LGUs where the contractor dominates; contractor name normalisation merges obvious variants (casing, punctuation, "Inc./Incorporated", "Const./Construction") and the merge decisions are inspectable and reversible by a steward; the page carries a notice that appearing here reflects public contract records only and implies no wrongdoing.

### 7.7 Access, export and API

- **FR-32 (G2, G7)** — **As a** researcher **I want** a public read-only REST API over scores, indicators, projects, budget and clan data **so that** I can build on the platform.
  - _Acceptance criteria:_ Endpoints for LGU score (current and by version), indicator detail, projects, budget allocations, officials, and clan graph; every response envelope carries `methodology_version`, `data_vintage`, `sources[]`, and the standing disclaimer; OpenAPI 3.1 spec published and accurate; anonymous access at 60 requests/minute, registered key at 600/minute; responses paginate by cursor; CORS open for GET.

- **FR-33 (G7)** — **As a** CSO analyst **I want** to export the data I am looking at as CSV or GeoJSON **so that** I can use it in my own analysis and reports.
  - _Acceptance criteria:_ Export available on map view, LGU profile, projects table and clan view for registered users; exports include methodology version, data vintage, retrieval timestamp, source attribution and the disclaimer as header rows or GeoJSON properties; exports over 10,000 rows generate asynchronously and notify by email; export actions are logged.

- **FR-34 (G7)** — **As a** journalist **I want** email alerts when an LGU I follow changes tier or gets new projects **so that** I don't have to poll the site.
  - _Acceptance criteria:_ Registered users can follow up to 50 LGUs, contractors or clans; alerts fire on tier change, new project ingested, new adverse decision linked, or clan-graph change; alerts are batched daily by default with an immediate option; every alert states the change, the old and new values, and links to the evidence; unsubscribe works from any alert in one click.

### 7.8 Accountability, corrections and trust

- **FR-35 (G5)** — **As a** named official **I want** to submit a response or correction attached to my record **so that** my side is visible where the claim is made.
  - _Acceptance criteria:_ Every LGU profile, person record and project row carries a visible "Submit a correction or response" action; the submitter identifies themselves and their relationship to the record; submissions are acknowledged automatically within 3 business days and resolved within 15; an accepted correction updates the record and appears in the public corrections log; a response that is not a factual correction publishes as an attached response on the record; the workflow is documented on a public page.

- **FR-36 (G5)** — **As a** citizen **I want** a public corrections changelog **so that** I can see what the platform got wrong and how it was fixed.
  - _Acceptance criteria:_ Log is public, no account required; each entry records what changed, when, why, who approved it, and the affected records; entries are immutable once published; the log is linked from the footer of every page and from the methodology page.

- **FR-37 (G5)** — **As an** editor **I want** a takedown and legal-request workflow with an audit trail **so that** demands are handled consistently and on the record.
  - _Acceptance criteria:_ Requests are logged with requester, date, records named, grounds cited, and outcome; a record can be placed in "under review" state that shows a neutral notice on the public page without deleting data; removal requires editor approval with a recorded reason; every state change is written to an immutable audit log; aggregate statistics on requests received and outcomes are published annually.

- **FR-38 (G2, G5)** — **As a** platform administrator **I want** an immutable audit log of every privileged action **so that** the platform's own integrity can be examined.
  - _Acceptance criteria:_ Log captures actor, role, action, target record, before/after values, timestamp and source IP for all editorial approvals, data corrections, score publications, takedowns, and role changes; log is append-only and not deletable through the application; retained 7 years; exportable by administrators only.

### 7.9 Edge cases and failure behaviour

- **FR-39 (G3)** — **As a** data steward **I want** defined behaviour for LGUs that split, merge, are created or are renamed **so that** history remains coherent across PSGC changes.
  - _Acceptance criteria:_ A new LGU carries no score until it has ≥ 1 full data vintage, displaying "New LGU — insufficient history"; a split LGU's predecessor history is shown as inherited-and-labelled, not silently merged; renames preserve the score series under the new name with the former name searchable; a documented test covers split, merge, creation and rename cases.

- **FR-40 (G8)** — **As a** citizen **I want** the platform to show stale-but-good data rather than break when a source is down **so that** the site stays usable.
  - _Acceptance criteria:_ A failed ingestion leaves the previous snapshot serving; the affected source shows amber/red on the status page and a freshness notice appears on affected profiles; no partial snapshot is ever promoted to serving; scoring will not run against an incomplete snapshot and the prior score version continues to serve.

- **FR-41 (G1, G6)** — **As a** citizen **I want** LGUs with no projects or no budget data handled explicitly **so that** an empty record is not scored as a good record.
  - _Acceptance criteria:_ A pillar with zero observed indicators is excluded from the composite and the remaining weights re-normalise; an LGU with ≤ 1 available pillar shows "Insufficient Data" and no composite score; the profile states which pillars were unavailable and why; these LGUs are counted and reported on the data-quality dashboard.

---

## 8. Non-Functional Requirements

| Area | Requirement (with a number) | Goal |
|------|-----------------------------|------|
| **Performance — map** | National province choropleth interactive in ≤ 3.0 s at p95 on a 10 Mbps connection; pillar layer switch ≤ 1.0 s at p95; vector tile payload ≤ 1.5 MB for national view | G1, G7 |
| **Performance — pages** | LGU profile Largest Contentful Paint ≤ 2.5 s at p75; search first results ≤ 300 ms at p95; API reads ≤ 500 ms at p95, ≤ 1.5 s at p99 | G7 |
| **Performance — scoring** | Full national rescoring of 1,656 LGUs across all pillars completes in ≤ 30 minutes; a single LGU rescore ≤ 5 s | G1 |
| **Availability** | 99.5% monthly uptime for public read paths (≤ 3.6 h downtime/month); 99.0% for authenticated tooling; planned maintenance announced ≥ 48 h ahead and excluded | G7 |
| **Scale** | Sustain 500 concurrent users and 2,000 requests/minute at stated latencies; absorb a 10× traffic spike (5,000 concurrent) with static/cached content degradation rather than failure; storage sized for 1,656 LGUs × 40 indicators × 12 quarterly vintages × 5 years ≈ 4.0 M score rows plus ~500 k project and ~2 M budget-line records | G7, G8 |
| **Security — authN** | Supabase Auth with email+password (min 12 chars, breach-list checked) or OAuth; MFA mandatory for editor and administrator roles; sessions expire after 24 h idle, 7 d absolute; ≤ 5 failed logins per 15 min per account then lockout | G5 |
| **Security — authZ** | PostgreSQL row-level security on every table with no exceptions; six roles (anonymous, registered, verified-respondent, steward, editor, administrator); service-role key never reachable from the client bundle; all secrets in Supabase Vault, never in `.env` committed to the repository; a CI check fails the build on any committed secret | G5 |
| **Security — transport & storage** | TLS 1.3 minimum, HSTS with 1-year max-age and preload; AES-256 at rest; CSP with no `unsafe-inline`; all user-supplied content (corrections, clan submissions) sanitised server-side against XSS before storage and again before render | G5 |
| **Security — abuse** | Write endpoints rate-limited (submissions 5/account/day, 20/IP/day; corrections 10/account/day); CAPTCHA on anonymous submission; automated blocking on coordinated submission patterns; API anonymous 60 req/min, keyed 600 req/min | G4, G5 |
| **Security — testing** | Dependency scanning on every PR; SAST in CI; third-party penetration test before public launch with all critical and high findings closed prior to go-live; annual retest | G5 |
| **Privacy** | Data Privacy Act (RA 10173) compliance; only public-capacity information about public officials is processed; no private individuals profiled; submitter identities are never published and are retained only as long as the submission is open plus 2 years; a published privacy notice states lawful basis (legitimate interest in public accountability and journalistic purpose), data subject rights, and the correction route; a DPIA is completed and approved before launch | G5 |
| **Legal defensibility** | Every published indicator value carries a source link and retrieval timestamp; no published sentence attributes conduct to a named person; all public-facing wording reviewed by Philippine counsel pre-launch; right-of-reply acknowledged ≤ 3 business days, resolved ≤ 15 business days; corrections log public and immutable | G5 |
| **Accessibility** | WCAG 2.2 Level AA across all public pages; every map-conveyed insight also available in an accessible data table; full keyboard operability; contrast ≥ 4.5:1 for text and ≥ 3:1 for map boundaries and UI; risk tiers distinguishable without colour alone (pattern + label); tested with NVDA and VoiceOver before launch | G7 |
| **Localization** | English at launch; full Filipino (Tagalog) UI and methodology translation by v1.2; all UI strings externalised from day one; PHP currency formatting and Asia/Manila timezone throughout; place names support Ñ and standard Philippine variants | G7 |
| **Data integrity** | All monetary values stored as integer centavos or exact numeric, never floating point; every score row carries `methodology_version`, `data_vintage`, and snapshot checksum; published scores are immutable — a change produces a new version row; reproducibility test in CI asserts a fixed snapshot yields a byte-identical score set | G1, G2 |
| **Observability** | Structured logging on all ingestion and scoring jobs; alert to on-call within 15 min of a pipeline failure; p50/p95/p99 latency and error rate dashboards; public status page updated automatically within 5 min of a state change | G8 |
| **Backup & recovery** | Daily automated backups retained 30 days, weekly retained 12 months; RPO ≤ 24 h, RTO ≤ 8 h; restore drill performed and documented quarterly | G8 |
| **Browser support** | Latest 2 versions of Chrome, Firefox, Safari and Edge; iOS Safari 16+ and Android Chrome 110+; fully responsive from 320 px; map degrades to a searchable ranked list where WebGL is unavailable | G7 |
| **Openness** | Scoring code and methodology published under an open licence; data exports under an open licence with attribution; no dark patterns, no advertising, no third-party behavioural trackers; analytics limited to privacy-preserving aggregate measurement | G1, G2 |

---

## 9. Data Requirements

| Entity | Source | Sensitivity / classification | Retention | Owner |
|--------|--------|------------------------------|-----------|-------|
| **Geographic spine (PSGC)** | statistics.bettergov.ph classification API | Public | Indefinite, all versions | Platform |
| **Boundary geometries** | [NEEDS INPUT] — PSA/NAMRIA source and licence (owner: us) | Public | Indefinite | Platform |
| **Budget allocations (GAA/NEP)** | budget.bettergov.ph `/api/v1` | Public | Indefinite, versioned snapshots | DBM (originator) |
| **Flood-control projects** | flood-control.bettergov.ph | Public | Indefinite, versioned snapshots | DPWH (originator) |
| **DPWH projects** | api.dpwh.bettergov.ph | Public | Indefinite, versioned snapshots | DPWH (originator) |
| **PSA statistics** | statistics.bettergov.ph `/api/v1` | Public | Indefinite, by release | PSA (originator) |
| **Officials registry** | officials.bettergov.ph | Public, **personal data in official capacity** | While in registry + 10 years | Platform / COMELEC & DILG (originators) |
| **Court decisions** | juris.ph | Public, **personal data, high reputational sensitivity** | Indefinite | Supreme Court (originator) |
| **Bills & authorship** | bills.juris.ph (BatasWatch) | Public | Indefinite | Congress (originator) |
| **ASEAN indicators** | asean.bettergov.ph | Public | Indefinite | Platform |
| **Person entities (officials)** | Derived from officials registry + editorial | Public-capacity personal data | While publicly relevant; reviewed every 3 years | Platform |
| **Kinship edges (clan graph)** | Editorial, academic import, crowdsourced | **Highest sensitivity on the platform** — personal data, reputational, familial | Indefinite while sourced; retracted edges retained in audit log only | Platform (editor accountable) |
| **Risk scores & indicator values** | Computed | Public, **derived and contestable** | Indefinite, immutable by version | Platform |
| **Data-quality quarantine** | Computed | Internal | 2 years | Platform |
| **User accounts** | Registration | Confidential — personal data | Account life + 90 days | Platform |
| **Correction / right-of-reply submissions** | User-submitted | Confidential; identity never published | Open + 2 years | Platform |
| **Crowdsourced clan submissions** | User-submitted | Confidential; identity never published | Open + 2 years | Platform |
| **Takedown / legal requests** | External | Confidential | 7 years | Platform |
| **Audit log** | System | Confidential, append-only | 7 years | Platform |

**Classification rule:** anything joining a *named person* to a *risk signal* is treated at the highest sensitivity tier regardless of the public status of its inputs, because the join is the platform's own act and the platform is accountable for it.

---

## 10. Integrations & Dependencies

### Confirmed data sources

| Source | Base URL | Auth | Access notes |
|---|---|---|---|
| **National budget** | `https://budget.bettergov.ph/api/v1` | None | GAA FY2020–2026 and NEP FY2027. Cursor pagination via `next_cursor`. Envelope `{meta, data, next_cursor}`. Exact PHP amounts. OpenAPI at `/api/v1/openapi.json`. MCP at `https://budget.bettergov.ph/mcp`. Cache-Control 300 s / s-maxage 3600 s. CORS `*`. No stated rate limit; fair use applies. |
| **Flood-control projects** | `https://flood-control.bettergov.ph/api/flood-control-projects` | None | Meilisearch-style response `{results:[{indexUid, hits:[…]}]}`. ~1,200 records at current volume. Per-project coordinates, budget, amountPaid, progress, contractor, status. |
| **PSA statistics** | `https://statistics.bettergov.ph/api/v1` | None | `/coverage`, `/topics`, `/datasets`, `/datasets/{id}`, `/datasets/{id}/values`, `POST /datasets/{id}/query` (CSV export supported). PSGC classification at `/api/classification/{system}/{version}/{level}` with `reg`/`prv`/`mun`/`bgy` filters. MCP at `https://statistics.bettergov.ph/mcp`. |
| **Legislative (BatasWatch)** | `https://bills.juris.ph/api` | None | `/measures`, `/search/vector`, `/authors`, `/authors/lookup?name=`, `/authors/{id}`, `/policy-areas`, `/committees/house`, `/committees/senate`. No MCP. Independent, non-official source — must be labelled as such. |
| **ASEAN indicators** | `https://asean.bettergov.ph/api/v1` | None | `/countries`, `/datasets`, `/datasets/{d}`, `/datasets/{d}/rows`. `filter.COLUMN=value`, `limit` ≤ 500, `offset`. SHA-256 checksums per dataset. MCP at `https://asean.bettergov.ph/mcp`. Comparative context only. |

### Sources requiring contract confirmation

| Source | Status |
|---|---|
| **DPWH transparency** `https://api.dpwh.bettergov.ph` | Root returns 404 and documentation was not retrievable during this specification. Endpoint paths, schema, pagination and rate limits must be confirmed before FR-7 is final. [NEEDS INPUT] — owner: us |
| **Jurisprudence** `https://juris.ph/api` | Service confirmed (Supreme Court decisions and Republic Acts, sourced from lawphil.net) but no machine-readable API documentation was retrievable. Endpoints, search parameters, response schema and licensing must be confirmed before the P4 pillar can be built. [NEEDS INPUT] — owner: us |
| **Officials registry** `https://officials.bettergov.ph` | Documented by the client as "ongoing." Schema and stability must be confirmed; the P3 pillar and clan graph both depend on it. [NEEDS INPUT] — owner: us |

### Platform dependencies

- **Next.js (App Router) + React + TypeScript** — application framework, server components for data-heavy profile pages, ISR for map and profile caching.
- **Supabase** — PostgreSQL with **PostGIS** for spatial queries, Auth for accounts and roles, Row-Level Security on every table, Storage for exports and snapshots, Edge Functions for ingestion, Vault for secrets.
- **MapLibre GL JS** — open-source map rendering; vector tiles served from PostGIS via `ST_AsMVT` or pre-generated.
- **Ingestion orchestration** — [NEEDS INPUT] — scheduled Edge Functions vs external workflow runner; decide in the architecture ADR (owner: us).
- **Email delivery** — for alerts, correction acknowledgements and notifications. [NEEDS INPUT] — provider (owner: client).
- **Hosting/CDN** — [NEEDS INPUT] — Vercel or alternative; must support Philippine-region edge caching (owner: client).

### External non-technical dependencies

- **Philippine legal counsel** — review of all public-facing language, the disclaimer set, the right-of-reply process, and the DPIA, **before** public launch. This is a launch blocker.
- **Editorial capacity** — at least one trained editor available continuously from the moment the clan graph goes live; the moderation queue cannot be left unstaffed.
- **Academic dataset licensors** — permission and attribution terms for any imported dynasty dataset.

### Migration

None. Greenfield build; all data originates from external APIs.

---

## 11. UX / Design & Brand

**Design principle:** the interface must look like a public-interest research instrument, not an exposé. Every design decision that would increase drama at the expense of precision is resolved in favour of precision. The platform's credibility is its only real asset, and the visual language either protects it or spends it.

- **Map:** national choropleth as the landing surface. Sequential, colourblind-safe scale (ColorBrewer YlOrRd or Viridis-derived), tested for deuteranopia and protanopia. The Insufficient Data class uses a distinct hatch pattern and neutral grey, never the low-risk colour. Risk tiers always carry a text label next to the colour.
- **Language:** neutral, clinical, specific. Tier labels read "Elevated Risk Signals," not "Most Corrupt." Indicator names describe what is measured ("Payment ahead of progress"), not what is implied. No superlatives, no ranking leaderboards on the landing page.
- **Evidence-forward layout:** on every LGU profile the score sits beside its Data Coverage, and the indicator breakdown with source links begins above the fold. A visitor should reach a primary source in two clicks from any number on the site.
- **Disclaimer placement:** persistent, legible, not a dismissible modal and not 8pt grey footer text. It appears on the map, every profile, every clan view, every export and every API response.
- **Clan visualisation:** force-directed graph with confidence encoded in edge style (solid = confirmed, dashed = single-sourced) and a permanent legend explaining the distinction. Sources open on interaction without leaving the page.
- **Accessibility target:** WCAG 2.2 AA. Every map insight has a table equivalent. The site is fully usable without WebGL and without a mouse.
- **Responsive:** mobile-first from 320 px. Most Philippine traffic is mobile; the map must be genuinely usable on a phone, not a desktop view scaled down.
- **Brand:** [NEEDS INPUT] — name, logo, palette, typography, tone-of-voice guidelines (owner: client). If none exist, a brand guideline should be produced before UI build begins.
- **Design references:** [NEEDS INPUT] — owner: client. Useful comparators for tone and evidence-handling include OCCRP Aleph, Transparency International's CPI presentation, and ProPublica's data applications.

---

## 12. Assumptions, Constraints & Risks

### Assumptions

1. The BetterGov.ph API family remains free, unauthenticated and publicly available for the platform's operating life.
2. Fair-use access is sufficient; no commercial licence or rate-limit negotiation is required.
3. PSGC codes or resolvable place names are present on enough source records to reach the 98% resolution target in G3.
4. Official boundary geometries are obtainable under a licence permitting public republication.
5. The client can retain Philippine legal counsel for pre-launch review and ongoing response.
6. The client can staff continuous editorial moderation before the clan graph goes live.
7. Public-capacity information about public officials may lawfully be processed and published under RA 10173 for accountability and journalistic purposes.
8. Academic dynasty datasets exist under terms permitting import with attribution.

### Constraints

- **Legal:** Philippine criminal libel and cyber-libel (RA 10175 §4(c)(4)) apply to published statements about identifiable persons. This constrains language more tightly than in most jurisdictions and is the reason for the no-conduct-fields rule in FR-26 and the risk-not-allegation framing throughout.
- **Data:** the index can only measure what the sources record. Sources are themselves incomplete, and the completeness varies systematically — which is precisely why G6 and FR-12 exist.
- **Ethical:** the platform must not amplify the structural bias by which better-documented places appear worse. Peer normalisation (FR-17) and the coverage score are the mitigations.
- **Technical:** no source offers webhooks; all ingestion is scheduled polling.
- **Political:** the platform will attract organised pushback. It must be operationally and legally prepared for this before launch, not after.
- **Budget/timeline:** [NEEDS INPUT] — owner: client.

### Risk log

| Risk | Impact | Likelihood | Mitigation | Owner |
|------|--------|------------|------------|-------|
| Libel or cyber-libel action over a published score or clan claim | **H** | **M** | No conduct attribution anywhere (FR-26); risk-not-allegation framing on every surface (FR-15); every claim sourced (G2); counsel review pre-launch; right of reply (FR-35); documented takedown workflow (FR-37); consider media liability insurance | Client + legal |
| Index reads as an accusation regardless of framing | **H** | **H** | Neutral tier labels (FR-18); disclaimer prominence (FR-15); methodology written for a lay reader; launch communications plan explaining what the score is and is not; pre-brief journalists on correct interpretation | Editor |
| An upstream API changes schema or disappears | **H** | **M** | Schema validation on every ingestion run with alerting; last-good snapshot keeps serving (FR-40); pillar weights re-normalise over available pillars (FR-11); maintain contact with source maintainers; archive raw snapshots so history survives the source |  Platform admin |
| Erroneous kinship edge published about a real family | **H** | **M** | Two-source rule for `confirmed` (FR-20); mandatory human approval (FR-21); inference never auto-publishes (FR-22); 60-second retraction path; public corrections log (FR-36) | Editor |
| Coordinated false crowdsourced submissions | **M** | **H** | Source required at validation; rate limits (FR-24); everything enters moderation; pattern-based blocking; submissions never publish without review | Editor |
| Low-data LGUs misread as clean | **H** | **H** | Data Coverage at equal prominence (FR-12); Insufficient Data map class; no low-risk tier below 40% coverage; the limitation stated plainly on the methodology page | Product |
| Weight choices drive the ranking more than the evidence | **M** | **M** | Published sensitivity analysis per version (FR-19); weight-sensitive LGUs flagged; open-source scoring code invites external critique | Product |
| Poverty proxies leak into the score as a corruption signal | **H** | **M** | P5 restricted to normalisation only (FR-16); automated monotonicity test in CI; peer grouping by income class (FR-17) | Product |
| Entity resolution merges two different people or companies | **M** | **H** | Confidence thresholds with quarantine (FR-2); steward-reversible merges (FR-31); merge decisions logged and inspectable | Data steward |
| Platform accused of political bias | **H** | **M** | Fully open methodology and code; uniform treatment of all LGUs regardless of party; publish the national tier distribution; no editorial commentary attached to scores; publish funding sources | Client |
| Traffic spike during a scandal takes the site down | **M** | **H** | Static generation + CDN for map and profiles; degrade to cached content under load; autoscaling; load test to 10× before launch | Platform admin |
| Editorial moderation queue becomes a bottleneck and stalls the clan graph | **M** | **H** | Staff before launch; seed with academic imports to reduce initial volume; surface queue depth as an operational metric with an SLA | Client |
| Sustained funding not secured beyond build | **H** | [NEEDS INPUT] | Open-source the code and publish the data so the work survives the platform; document a minimal operating cost floor | Client |

---

## 13. Timeline & Milestones

Assumes a start of **2026-10-01** and is subject to the [NEEDS INPUT] team and budget envelope.

| Phase | Weeks | Deliverables | Gate |
|---|---|---|---|
| **P0 — Confirm & de-risk** | 1–3 | DPWH, Juris.ph and officials API contracts confirmed; boundary geometry licence secured; legal counsel engaged; brand inputs received; architecture ADR | All section-14 blocking items closed |
| **P1 — Foundation** | 4–8 | PSGC spine + geometries; Supabase schema with RLS; entity-resolution service; ingestion for budget, flood-control, PSA; snapshot/versioning framework; status page | ≥ 98% resolution rate demonstrated |
| **P2 — Index v1.0** | 9–13 | Pillars P1, P2, P5; Data Coverage; peer normalisation; scoring service; sensitivity analysis; methodology page v1.0 | Client approves weights after reviewing sensitivity output |
| **P3 — Map & profiles** | 12–18 | Choropleth with pillar layers; LGU profiles with full evidence trail; search; projects and contractor pages; accessibility pass | WCAG 2.2 AA audit passed |
| **P4 — Clan layer** | 16–22 | Person entities; kinship schema; inference seeding; academic import; moderation workflow; regional network view; P3 pillar added to index | Editor trained and queue staffed; legal sign-off on clan presentation |
| **P5 — Openness & accountability** | 20–24 | Public REST API + OpenAPI; exports; alerts; right-of-reply workflow; corrections log; takedown workflow; audit log | Penetration test clean of critical/high; DPIA approved |
| **P6 — Launch readiness** | 24–27 | Load test to 10×; full counsel review of all copy; data-quality report; launch communications and journalist pre-brief; open-source release of scoring code | **Go-live approval** |
| **P7 — v1.1** | Post-launch | P4 Accountability History pillar (Juris.ph); legislative indicators (BatasWatch); crowdsourced submissions opened; Filipino localisation | — |

**Critical path:** DPWH/Juris/officials API confirmation → entity resolution → index → map. **Hard blockers on public launch:** legal review complete, editorial staffing in place, penetration test findings closed, DPIA approved.

---

## 14. Open Questions

**Blocking — must close before the relevant phase begins**

- [NEEDS INPUT] DPWH API (`api.dpwh.bettergov.ph`) — endpoints, schema, pagination, rate limits, licence. Root returns 404 and docs were not retrievable. Blocks FR-7. — owner: us
- [NEEDS INPUT] Juris.ph API (`juris.ph/api`) — endpoints, search parameters, response schema, licence, and whether decisions carry structured party/LGU identifiers. Blocks the P4 pillar. — owner: us
- [NEEDS INPUT] officials.bettergov.ph — API contract, coverage (which positions, which years), update cadence, stability given "ongoing" status. Blocks FR-9, P3 pillar and the clan graph. — owner: us
- [NEEDS INPUT] Boundary geometry source and licence for PSGC-coded LGUs. Blocks FR-3 and the map. — owner: us
- [NEEDS INPUT] Named client approver with sign-off authority. Blocks every gate in this PRD. — owner: client
- [NEEDS INPUT] Philippine legal counsel engaged for pre-launch review. Blocks public launch. — owner: client
- [NEEDS INPUT] Budget and timeline envelope; team composition. Blocks phase planning. — owner: client

**Needed before the relevant build phase**

- [NEEDS INPUT] Which academic dynasty datasets to import, and their licence terms. — owner: client
- [NEEDS INPUT] Editorial staffing plan for the moderation queue — headcount, hours, escalation path. — owner: client
- [NEEDS INPUT] Brand assets: name, logo, palette, typography, tone of voice. — owner: client
- [NEEDS INPUT] Hosting and email providers. — owner: client
- [NEEDS INPUT] Ingestion orchestration approach — Supabase scheduled Edge Functions vs external runner. — owner: us
- [NEEDS INPUT] Confirmation of pillar weights in section 7.4 after sensitivity analysis. — owner: client

**Policy questions requiring a client decision**

- [NEEDS INPUT] Do officials' records persist after they leave office, and for how long? (Proposed: 10 years, on public-interest grounds.) — owner: client
- [NEEDS INPUT] Does the platform name individual contractors publicly at launch, or only in aggregate? (Proposed: name them — they are parties to public contracts — with an explicit no-wrongdoing-implied notice per FR-31.) — owner: client
- [NEEDS INPUT] Is crowdsourced clan submission open at launch or deferred to v1.1? (Proposed: defer, until moderation capacity is proven.) — owner: client
- [NEEDS INPUT] How is the platform funded, and will funding sources be published? (Recommended: publish them — the platform's independence will be challenged.) — owner: client
- [NEEDS INPUT] Is there an embargo or pre-notification policy for LGUs before their first score publishes? — owner: client

---

## 15. Approvals

_See the sign-off log. Baseline v1.0 is set at the Final PRD approval; change control applies thereafter._

| Gate | Scope | Client approver | Date | Status |
|---|---|---|---|---|
| **Gate 1 — Discovery** | Sections 1–2: context, stakeholders, envelope | [NEEDS INPUT] | — | Pending |
| **Gate 2 — Problem & Goals** | Sections 3–5: problem, personas, goals G1–G8 and KPIs | [NEEDS INPUT] | — | Pending |
| **Gate 3 — Scope & Requirements** | Sections 6–11: MoSCoW, FR-1–FR-41, NFRs, data, integrations, UX | [NEEDS INPUT] | — | Pending |
| **Gate 4 — Feasibility & Risk** | Sections 12–13: assumptions, risk log, timeline | [NEEDS INPUT] | — | Pending |
| **Gate 5 — Final PRD approval (baseline v1.0)** | Whole document; all blocking [NEEDS INPUT] closed | [NEEDS INPUT] | — | Pending |

The author does not sign. On Gate 5 approval this document becomes **baseline v1.0** and change control applies: any change to a requirement, weight, or scope item requires a versioned amendment recorded against this PRD.

**Handoff:** the baselined PRD is the input to SSDLC Stage 1 (Discover & Define) and QA Gate 1. The data classifications in section 9 and the security NFRs in section 8 seed the threat model.

---

_Prepared by Innovhub. Sources for all API contracts described in section 10 were retrieved and verified on 2026-09-22; three sources could not be verified and are logged as blocking open questions in section 14._
