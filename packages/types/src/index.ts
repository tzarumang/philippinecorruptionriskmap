/**
 * Shared domain types for PCRM.
 *
 * Two rules from the PRD are encoded here rather than left to convention,
 * because both are the kind of thing that silently rots:
 *
 *  - Money is ALWAYS integer centavos (`Centavos`), never a float. Source
 *    APIs hand us floats like 1447499996.23; they are converted at the
 *    connector boundary and never again.
 *  - Every value that reaches a published score carries its provenance
 *    (`SourceRef`) — the snapshot it came from and the record within it.
 */

// ---------------------------------------------------------------------------
// Geography (FR-1)
// ---------------------------------------------------------------------------

/**
 * PSGC levels as the PSA classification API reports them.
 *
 * `Unclassified` is ours, not the PSA's: two rows in Q2_2024 arrive with an
 * empty `geographic_level` ("Special Geographic Area" in BARMM, and
 * "City of Isabela (Not a Province)"). They are surfaced rather than guessed at.
 */
export type GeographicLevel =
  | 'Reg'
  | 'Prov'
  | 'City'
  | 'Mun'
  | 'SubMun'
  | 'Bgy'
  | 'Unclassified';

/** The LGU tiers PCRM actually scores. Barangays are explicitly out of scope. */
export type ScoredLevel = Extract<GeographicLevel, 'Prov' | 'City' | 'Mun'>;

/**
 * City classification. Distinguishes a highly urbanised city — which sits at
 * the PROVINCE tier and is independent of any province — from a component city
 * inside one. The distinction matters for both the hierarchy and peer grouping.
 */
export type CityClass = 'HUC' | 'CC' | 'ICC';

/**
 * A 10-digit PSGC code, e.g. "0102800000".
 *
 * Kept as a string, never a number: leading zeros are significant and
 * "0102800000" as an integer is a different thing entirely.
 */
export type PsgcCode = string;

export interface SpineRow {
  code: PsgcCode;
  name: string;
  /** Parent PSGC code; null for regions. Derived from the code, not supplied. */
  parentCode: PsgcCode | null;
  level: GeographicLevel;
  /** HUC/CC/ICC where the PSA states one. Null for non-cities. */
  cityClass: CityClass | null;
  /** e.g. "1st", "5th". The peer-group key for FR-17. */
  incomeClassification: string | null;
  /** PSGC release this row came from, e.g. "Q2_2024". */
  psgcVersion: string;
  /** e.g. "Luzon", "Visayas", "Mindanao". */
  islandRegion: string | null;
  /** Superseded name, when the PSA records one. Kept searchable per FR-39. */
  oldName: string | null;
  /**
   * The legacy 9-digit code the PSA still publishes alongside the 10-digit one.
   * This is the alias table FR-1 requires, supplied by the source for free —
   * a record arriving with an obsolete code resolves through it.
   */
  correspondenceCode: string | null;
  /** e.g. "Capital". Free text from the PSA. */
  status: string | null;
  /** Most recent census population the classification API carries. */
  latestPopulation: number | null;
  latestPopulationYear: number | null;
}

// ---------------------------------------------------------------------------
// Money (NFR "Data integrity")
// ---------------------------------------------------------------------------

/**
 * Philippine pesos expressed as an integer number of centavos.
 *
 * A branded type so a raw float cannot be passed where centavos are expected.
 * ₱1,447,499,996.23 is 144_749_999_623 centavos — comfortably inside
 * Number.MAX_SAFE_INTEGER (~9.0e15), so `number` is safe here.
 */
export type Centavos = number & { readonly __brand: 'Centavos' };

// ---------------------------------------------------------------------------
// Snapshots (FR-4)
// ---------------------------------------------------------------------------

export type RunStatus = 'success' | 'failed' | 'partial';

export interface SnapshotManifest {
  /** Stable connector id, e.g. "psgc", "infrastructure-projects". */
  sourceId: string;
  /** ISO-8601 UTC instant the fetch completed. */
  retrievedAt: string;
  recordCount: number;
  /** SHA-256 over the canonical serialisation of the records. */
  checksum: string;
  runStatus: RunStatus;
  /** Upstream endpoint(s) the records came from. */
  sourceUrls: string[];
  /**
   * Source-declared vintage where the API publishes one (the Dynasties API
   * reports `data_vintage`, PSGC reports a version). Distinct from
   * `retrievedAt`: when the data is from, not when we fetched it.
   */
  dataVintage: string | null;
  /** Non-fatal problems worth surfacing on the data-quality dashboard. */
  warnings: string[];
}

/** A snapshot is its manifest plus the records it pins. */
export interface Snapshot<T> {
  manifest: SnapshotManifest;
  records: T[];
}

/** Points a published value back at the exact record that produced it (G2). */
export interface SourceRef {
  sourceId: string;
  /** Natural key of the record within the snapshot, e.g. a contractId. */
  recordKey: string;
  snapshotChecksum: string;
  retrievedAt: string;
  /** Deep link to the upstream record where the API supports one. */
  sourceUrl: string | null;
}

// ---------------------------------------------------------------------------
// Infrastructure projects (FR-6)
// ---------------------------------------------------------------------------

export interface InfrastructureProject {
  /** `contractId` upstream. The natural key — re-ingestion updates, never duplicates. */
  contractId: string;
  description: string;
  category: string | null;
  status: string | null;
  /** Contract value in centavos. Upstream sends a float; converted at ingest. */
  budget: Centavos | null;
  /** Amount disbursed, in centavos. */
  amountPaid: Centavos | null;
  /** Physical completion, 0–100. */
  progress: number | null;
  contractor: string | null;
  /** Free-text region as the source reports it — may be an administrative
   *  pseudo-location such as "Central Office" rather than a real place. */
  sourceRegion: string | null;
  /** Free-text province — likewise may be e.g. "Flood Control Management Cluster". */
  sourceProvince: string | null;
  startDate: string | null;
  completionDate: string | null;
  infraYear: string | null;
  programName: string | null;
  sourceOfFunds: string | null;
  latitude: number | null;
  longitude: number | null;
  /** Resolved LGU, or null when resolution quarantined the record (FR-2). */
  psgcCode: PsgcCode | null;
  /** How the attribution was made, so a reader can judge it (FR-13). */
  resolutionMethod: MatchMethod | null;
  resolutionConfidence: number | null;
  /** Data-quality flags raised at ingest; surfaced, never silently scored. */
  qualityFlags: QualityFlag[];
}

/**
 * Contradictions and gaps observed in source data. The PRD's rule is that
 * these are surfaced on the data-quality dashboard rather than silently
 * scored, so they travel with the record.
 */
export type QualityFlag =
  | 'coordinates-missing'
  | 'coordinates-out-of-bounds'
  | 'budget-missing'
  | 'paid-exceeds-budget'
  | 'progress-out-of-range'
  | 'complete-but-unpaid'
  | 'pseudo-location';

// ---------------------------------------------------------------------------
// Entity resolution (FR-2)
// ---------------------------------------------------------------------------

/**
 * How a record was matched to the spine, in the deterministic order the
 * matcher tries them. Ordered most to least reliable — the ordering is
 * load-bearing, since FR-2 requires point-in-polygon matches to carry lower
 * confidence than code matches.
 */
export type MatchMethod =
  | 'exact-code'
  | 'exact-name'
  | 'alias'
  | 'trigram'
  | 'point-in-polygon';

export interface ResolutionResult {
  psgcCode: PsgcCode | null;
  method: MatchMethod | null;
  /** 0–1. Below the quarantine threshold the match is not used. */
  confidence: number;
  /** Why this resolution happened — human-readable, for steward review. */
  rationale: string;
}
