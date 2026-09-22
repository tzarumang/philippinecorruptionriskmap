import type { CityClass, GeographicLevel, PsgcCode, SpineRow } from '@pcrm/types';
import { parseCount } from '@pcrm/types/money';
import { fetchJson } from '../http';
import { cleanText } from '../text';

/**
 * PSGC geographic spine connector (FR-1).
 *
 * Source: statistics.bettergov.ph classification API, which mirrors the PSA's
 * Philippine Standard Geographic Code. Current release is Q2_2024.
 *
 * The 10-digit code decomposes as RR|PPP|MM|BBB:
 *
 *   0100000000  =  reg 01                        → Region I
 *   0102800000  =  reg 01, prv 028               → Ilocos Norte
 *   0102801000  =  reg 01, prv 028, mun 01       → Adams
 *   0330100000  =  reg 03, prv 301               → City of Angeles (HUC)
 *
 * Note the third case above: a highly urbanised city occupies the PROVINCE
 * tier, so its parent is a region, not a province. Deriving parentage from the
 * code rather than from the endpoint a row arrived on is what gets this right.
 */

export const PSGC_VERSION = 'Q2_2024';
const ORIGIN = 'https://statistics.bettergov.ph';
const BASE = `${ORIGIN}/api/classification/psgc`;

interface PsgcApiRow {
  code: string;
  area_name: string;
  correspondence_code: string;
  geographic_level: string;
  reg: number;
  prv: number;
  mun: number;
  bgy: number;
  old_name: string;
  city_class: string;
  income_classification: string;
  island_region: string;
  status: string;
  version: string;
  populations?: { population: string; year: number; psgc: string }[];
}

interface PsgcApiPage {
  count: number;
  next: string | null;
  previous: string | null;
  results: PsgcApiRow[];
}

/**
 * Derives a row's parent from its code alone.
 *
 * Returns null for regions. Province-tier rows (including HUCs) point at their
 * region; municipality-tier rows point at their province.
 */
export function parentOf(code: PsgcCode): PsgcCode | null {
  const region = code.slice(0, 2);
  const province = code.slice(2, 5);
  const municipality = code.slice(5, 7);

  if (province === '000') return null;
  if (municipality === '00') return `${region}00000000`;
  return `${region}${province}00000`;
}

function normaliseLevel(row: PsgcApiRow): GeographicLevel {
  const raw = row.geographic_level.trim();
  if (raw === 'Reg' || raw === 'Prov' || raw === 'City' || raw === 'Mun') return raw;
  if (raw === 'SubMun') return 'SubMun';
  if (raw === 'Bgy') return 'Bgy';

  // Q2_2024 carries two rows with an empty level. "City of Isabela (Not a
  // Province)" is a real independent city and is treated as one; "Special
  // Geographic Area" is a cluster of barangays, not an LGU, so it stays
  // Unclassified rather than being silently counted as a province.
  if (raw === '' && /\bCity\b/i.test(row.area_name)) return 'City';
  return 'Unclassified';
}

function normaliseCityClass(raw: string): CityClass | null {
  const value = raw.trim().toUpperCase();
  return value === 'HUC' || value === 'CC' || value === 'ICC' ? value : null;
}

function latestPopulation(row: PsgcApiRow): { value: number | null; year: number | null } {
  const entries = row.populations ?? [];
  if (entries.length === 0) return { value: null, year: null };

  const newest = entries.reduce((a, b) => (b.year > a.year ? b : a));
  // Populations arrive as padded, comma-separated strings — " 593,081 ".
  return { value: parseCount(newest.population), year: newest.year };
}

function toSpineRow(row: PsgcApiRow): SpineRow {
  const population = latestPopulation(row);

  return {
    code: row.code,
    // Names arrive both double-encoded ("Las PiÃ±as") and with stray
    // whitespace ("City of Laoag "). cleanText handles both.
    name: cleanText(row.area_name),
    parentCode: parentOf(row.code),
    level: normaliseLevel(row),
    cityClass: normaliseCityClass(row.city_class),
    incomeClassification: row.income_classification.trim() || null,
    psgcVersion: row.version || PSGC_VERSION,
    islandRegion: cleanText(row.island_region) || null,
    oldName: cleanText(row.old_name) || null,
    correspondenceCode: row.correspondence_code.trim() || null,
    status: cleanText(row.status) || null,
    latestPopulation: population.value,
    latestPopulationYear: population.year,
  };
}

/** Follows `next` to exhaust a paginated classification endpoint. */
async function fetchAllPages(
  startUrl: string,
  onProgress?: (fetched: number, total: number) => void,
): Promise<PsgcApiRow[]> {
  const rows: PsgcApiRow[] = [];
  let url: string | null = startUrl;

  while (url) {
    const page: PsgcApiPage = await fetchJson<PsgcApiPage>(url);
    rows.push(...page.results);
    onProgress?.(rows.length, page.count);
    // `next` comes back as an origin-relative path, e.g.
    // "/api/classification/psgc/Q2_2024/municipalities?page=2".
    url = page.next ? new URL(page.next, ORIGIN).toString() : null;
  }

  return rows;
}

export interface PsgcFetchResult {
  rows: SpineRow[];
  sourceUrls: string[];
  warnings: string[];
}

/**
 * Fetches regions, provinces and municipalities and assembles the spine.
 *
 * Barangays are deliberately not fetched — the PRD puts barangay-level scoring
 * out of scope, and the tier adds ~42,000 rows we would not use.
 */
export async function fetchSpine(
  onProgress?: (message: string) => void,
): Promise<PsgcFetchResult> {
  const tiers = ['regions', 'provinces', 'municipalities'] as const;
  const sourceUrls: string[] = [];
  const warnings: string[] = [];
  const all: PsgcApiRow[] = [];

  for (const tier of tiers) {
    const url = `${BASE}/${PSGC_VERSION}/${tier}`;
    sourceUrls.push(url);
    onProgress?.(`Fetching ${tier}…`);

    const rows = await fetchAllPages(url, (fetched, total) => {
      onProgress?.(`  ${tier}: ${fetched}/${total}`);
    });
    all.push(...rows);
  }

  // A code appearing on two tiers would corrupt the hierarchy — catch it here
  // rather than discovering it as a duplicate-key error at load time.
  const seen = new Set<string>();
  const deduped: PsgcApiRow[] = [];
  for (const row of all) {
    if (seen.has(row.code)) {
      warnings.push(`Duplicate PSGC code across tiers, keeping first: ${row.code}`);
      continue;
    }
    seen.add(row.code);
    deduped.push(row);
  }

  const rows = deduped.map(toSpineRow);

  const unclassified = rows.filter((r) => r.level === 'Unclassified');
  for (const row of unclassified) {
    warnings.push(
      `Row has no PSA geographic_level and is not scorable: ${row.code} "${row.name}"`,
    );
  }

  // Every non-region row must reach its parent, or the hierarchy has a hole
  // and the row silently drops out of every roll-up.
  //
  // Q2_2024 has one real case: Pateros (1381701000) is NCR's only
  // municipality, and its derived parent 1381700000 is an NCR legislative
  // district that the PSA's provinces endpoint does not publish. Rather than
  // leave it unreachable, reattach it to its region and record the repair —
  // an LGU that exists must be scorable and must roll up.
  const codes = new Set(rows.map((r) => r.code));
  for (const row of rows) {
    if (row.parentCode === null || codes.has(row.parentCode)) continue;

    const regionCode = `${row.code.slice(0, 2)}00000000`;
    if (codes.has(regionCode)) {
      warnings.push(
        `Reattached ${row.code} "${row.name}": derived parent ${row.parentCode} ` +
          `is not published by the PSA; using region ${regionCode} instead.`,
      );
      row.parentCode = regionCode;
    } else {
      warnings.push(
        `Orphan: ${row.code} "${row.name}" references missing parent ` +
          `${row.parentCode} and region ${regionCode} is also absent.`,
      );
    }
  }

  return { rows, sourceUrls, warnings };
}
