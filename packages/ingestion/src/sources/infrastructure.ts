import type {
  InfrastructureProject,
  QualityFlag,
  ResolutionResult,
} from '@pcrm/types';
import { toCentavos } from '@pcrm/types/money';
import {
  parseImplementingOffice,
  resolvePlace,
  type SpineIndex,
} from '@pcrm/resolution';
import { fetchJson } from '../http';
import { cleanText } from '../text';

/**
 * Infrastructure projects connector (FR-6).
 *
 * Source: flood-control.bettergov.ph. Despite the hostname, the backing index
 * is `postgis.dpwh_projects` and carries ~25,452 records of DPWH
 * infrastructure — roughly 21× what the PRD assumed, and broader in scope than
 * flood control alone. The separate DPWH API the PRD planned for is dead, so
 * this is the procurement pillar's only project source.
 *
 * Three real defects in this feed are handled at the boundary:
 *
 *  - Budgets arrive as JSON floats (`1447499996.23`) → integer centavos.
 *  - Some records carry administrative pseudo-locations instead of places
 *    ("Central Office" / "Flood Control Management Cluster") → these cannot be
 *    name-resolved and are routed to coordinates.
 *  - Records can be internally contradictory (status "On-Going" with
 *    progress 100 and nothing paid) → flagged, never silently scored.
 */

const ENDPOINT = 'https://flood-control.bettergov.ph/api/flood-control-projects';

/** Philippine bounding box, per FR-6. */
const PH_BOUNDS = { minLat: 4.2, maxLat: 21.4, minLon: 116.0, maxLon: 127.0 };

/**
 * The server caps a response at 1000 hits and IGNORES `offset` — it echoes
 * `offset: 0` whatever you send, so naive offset paging silently re-fetches
 * page one forever. `page`, `from`, `skip`, `start` and `cursor` are ignored
 * too.
 *
 * This endpoint is a map-viewport search: the site's own frontend calls it
 * with `q`, `limit`, `zoom` and `bbox`, and the response's `searchStrategy`
 * flips from "postgis-national" to "postgis-bbox-gist" once a bbox is given.
 * So GEOGRAPHY is the pagination mechanism, and the only way to reach every
 * record is to tile the country.
 *
 * Every record in this feed carries coordinates, so a quadtree harvest is
 * exhaustive: subdivide any tile whose total exceeds the cap, and collect the
 * ones that fit. Records are deduplicated by contractId because a project on a
 * tile boundary can be returned by more than one tile.
 */
const PAGE_CAP = 1000;

/** Depth guard. 2^12 tiles per axis is far finer than any real cluster needs. */
const MAX_DEPTH = 12;

interface BBox {
  minLon: number;
  minLat: number;
  maxLon: number;
  maxLat: number;
}

const bboxParam = (b: BBox): string =>
  `${b.minLon.toFixed(6)},${b.minLat.toFixed(6)},${b.maxLon.toFixed(6)},${b.maxLat.toFixed(6)}`;

function quadrants(b: BBox): BBox[] {
  const midLon = (b.minLon + b.maxLon) / 2;
  const midLat = (b.minLat + b.maxLat) / 2;
  return [
    { minLon: b.minLon, minLat: b.minLat, maxLon: midLon, maxLat: midLat },
    { minLon: midLon, minLat: b.minLat, maxLon: b.maxLon, maxLat: midLat },
    { minLon: b.minLon, minLat: midLat, maxLon: midLon, maxLat: b.maxLat },
    { minLon: midLon, minLat: midLat, maxLon: b.maxLon, maxLat: b.maxLat },
  ];
}

interface ApiHit {
  contractId?: string;
  description?: string;
  category?: string | null;
  status?: string | null;
  budget?: number | string | null;
  amountPaid?: number | string | null;
  progress?: number | null;
  contractor?: string | null;
  location?: { region?: string | null; province?: string | null } | null;
  startDate?: string | null;
  completionDate?: string | null;
  infraYear?: string | null;
  programName?: string | null;
  sourceOfFunds?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

interface ApiResponse {
  results: {
    indexUid: string;
    hits: ApiHit[];
    estimatedTotalHits: number;
    limit: number;
    offset: number;
  }[];
}

function inPhilippines(lat: number, lon: number): boolean {
  return (
    lat >= PH_BOUNDS.minLat &&
    lat <= PH_BOUNDS.maxLat &&
    lon >= PH_BOUNDS.minLon &&
    lon <= PH_BOUNDS.maxLon
  );
}

/**
 * Turns a parsed implementing office into an LGU resolution.
 *
 * Only a district office named for a single place can reach an LGU. A
 * region-level office genuinely does not identify one, and saying so is the
 * honest outcome — the alternative would be attributing a region's entire
 * spend to an arbitrary municipality inside it.
 */
function resolveOffice(
  office: ReturnType<typeof parseImplementingOffice>,
  index: SpineIndex,
): ResolutionResult {
  switch (office.kind) {
    case 'district-office':
      if (office.spans) {
        return {
          psgcCode: null,
          method: null,
          confidence: 0,
          rationale:
            `Implementing office "${office.raw}" spans ${office.spans.join(' and ')}; ` +
            'attribution to one LGU requires coordinates.',
        };
      }
      return resolvePlace(
        {
          name: office.placeName,
          levels: office.placeLevel ? [office.placeLevel] : ['Prov', 'City'],
        },
        index,
      );

    case 'region':
      return {
        psgcCode: null,
        method: null,
        confidence: 0,
        rationale:
          `Implementing office "${office.raw}" identifies a region, not an LGU; ` +
          'LGU attribution requires coordinates.',
      };

    case 'pseudo':
      return {
        psgcCode: null,
        method: null,
        confidence: 0,
        rationale:
          `"${office.raw}" is an administrative unit, not a place; ` +
          'resolution requires coordinates.',
      };

    default:
      return {
        psgcCode: null,
        method: null,
        confidence: 0,
        rationale: 'No implementing office recorded on this project.',
      };
  }
}

/**
 * Maps one upstream hit, raising quality flags as it goes.
 */
export function mapProject(
  hit: ApiHit,
  index: SpineIndex,
): { project: InfrastructureProject; resolution: ResolutionResult } | null {
  const contractId = hit.contractId?.trim();
  if (!contractId) return null; // No natural key — nothing to update against.

  const flags: QualityFlag[] = [];

  const budget = toCentavos(hit.budget);
  const amountPaid = toCentavos(hit.amountPaid);
  if (budget === null) flags.push('budget-missing');
  if (budget !== null && amountPaid !== null && amountPaid > budget) {
    flags.push('paid-exceeds-budget');
  }

  const progress = typeof hit.progress === 'number' ? hit.progress : null;
  if (progress !== null && (progress < 0 || progress > 100)) {
    flags.push('progress-out-of-range');
  }
  // Observed upstream: status "On-Going", progress 100, amountPaid 0.
  if (progress === 100 && amountPaid === 0) flags.push('complete-but-unpaid');

  const lat = typeof hit.latitude === 'number' ? hit.latitude : null;
  const lon = typeof hit.longitude === 'number' ? hit.longitude : null;
  if (lat === null || lon === null) flags.push('coordinates-missing');
  else if (!inPhilippines(lat, lon)) flags.push('coordinates-out-of-bounds');

  const sourceProvince = cleanText(hit.location?.province) || null;
  const sourceRegion = cleanText(hit.location?.region) || null;

  // `location.province` names the DPWH implementing office, not a province.
  const office = parseImplementingOffice(sourceProvince);
  if (office.kind === 'pseudo') flags.push('pseudo-location');

  const resolution = resolveOffice(office, index);

  return {
    project: {
      contractId,
      description: cleanText(hit.description),
      category: cleanText(hit.category) || null,
      status: cleanText(hit.status) || null,
      budget,
      amountPaid,
      progress,
      contractor: cleanText(hit.contractor) || null,
      sourceRegion,
      sourceProvince,
      startDate: hit.startDate ?? null,
      completionDate: hit.completionDate ?? null,
      infraYear: hit.infraYear ?? null,
      programName: cleanText(hit.programName) || null,
      sourceOfFunds: cleanText(hit.sourceOfFunds) || null,
      latitude: lat,
      longitude: lon,
      psgcCode: resolution.psgcCode,
      resolutionMethod: resolution.method,
      resolutionConfidence: resolution.psgcCode ? resolution.confidence : null,
      qualityFlags: flags,
    },
    resolution,
  };
}

export interface QuarantineEntry {
  contractId: string;
  sourceRegion: string | null;
  sourceProvince: string | null;
  latitude: number | null;
  longitude: number | null;
  rationale: string;
}

export interface InfrastructureFetchResult {
  projects: InfrastructureProject[];
  quarantined: QuarantineEntry[];
  sourceUrls: string[];
  warnings: string[];
}

export async function fetchInfrastructureProjects(
  index: SpineIndex,
  onProgress?: (message: string) => void,
  options: { maxRecords?: number } = {},
): Promise<InfrastructureFetchResult> {
  const warnings: string[] = [];
  const hitsById = new Map<string, ApiHit>();

  let requests = 0;
  let nationalTotal = 0;

  async function harvest(box: BBox, depth: number): Promise<void> {
    if (options.maxRecords && hitsById.size >= options.maxRecords) return;

    const url = `${ENDPOINT}?q=&limit=${PAGE_CAP}&zoom=${depth + 5}&bbox=${bboxParam(box)}`;
    const response = await fetchJson<ApiResponse>(url, { timeoutMs: 120_000 });
    requests += 1;

    const result = response.results?.[0];
    if (!result) {
      warnings.push(`Empty results envelope for bbox ${bboxParam(box)}.`);
      return;
    }

    if (depth === 0) nationalTotal = result.estimatedTotalHits;
    if (result.estimatedTotalHits === 0) return;

    // Fits under the cap — take it.
    if (result.estimatedTotalHits <= PAGE_CAP || depth >= MAX_DEPTH) {
      if (result.estimatedTotalHits > PAGE_CAP) {
        warnings.push(
          `Tile ${bboxParam(box)} still holds ${result.estimatedTotalHits} records at max ` +
            `depth; only the first ${PAGE_CAP} were retrieved.`,
        );
      }
      for (const hit of result.hits) {
        const id = hit.contractId?.trim();
        if (id) hitsById.set(id, hit);
      }
      onProgress?.(
        `  tiles: ${requests} · distinct projects: ${hitsById.size}` +
          (nationalTotal ? `/${nationalTotal}` : ''),
      );
      return;
    }

    // Too many for one response — subdivide. The hits from this probe are
    // discarded deliberately: they are an arbitrary 1000 of a larger set, and
    // the children will return them properly.
    for (const child of quadrants(box)) {
      await harvest(child, depth + 1);
    }
  }

  await harvest({ ...PH_BOUNDS }, 0);

  const projects: InfrastructureProject[] = [];
  const quarantined: QuarantineEntry[] = [];
  let skippedWithoutKey = 0;

  for (const hit of hitsById.values()) {
    const mapped = mapProject(hit, index);
    if (!mapped) {
      skippedWithoutKey += 1;
      continue;
    }

    projects.push(mapped.project);

    // FR-2: a record that did not resolve is quarantined and visible, never
    // dropped and never counted toward a score.
    if (mapped.project.psgcCode === null) {
      quarantined.push({
        contractId: mapped.project.contractId,
        sourceRegion: mapped.project.sourceRegion,
        sourceProvince: mapped.project.sourceProvince,
        latitude: mapped.project.latitude,
        longitude: mapped.project.longitude,
        rationale: mapped.resolution.rationale,
      });
    }
  }

  if (skippedWithoutKey > 0) {
    warnings.push(`${skippedWithoutKey} records had no contractId and were skipped.`);
  }
  if (quarantined.length > 0) {
    warnings.push(
      `${quarantined.length} of ${projects.length} projects did not resolve to a PSGC code.`,
    );
  }
  if (nationalTotal > 0 && projects.length < nationalTotal) {
    warnings.push(
      `Harvested ${projects.length} distinct projects against a national total of ` +
        `${nationalTotal}. The shortfall is records the bbox tiling did not reach.`,
    );
  }

  return {
    projects,
    quarantined,
    sourceUrls: [`${ENDPOINT}?q=&limit=${PAGE_CAP}&bbox=<tiled over Philippine bounds>`],
    warnings,
  };
}
