/**
 * DPWH implementing-office parsing.
 *
 * The infrastructure feed's `location.province` is not a province. It is the
 * DPWH office that implemented the project, and it comes in three shapes:
 *
 *   "Abra DEO"                      → a District Engineering Office, named for a province
 *   "Camarines Sur 5th DEO"         → a numbered district within a province
 *   "Las Piñas-Muntinlupa DEO"      → an office spanning TWO LGUs
 *   "Region V"                      → a whole region, no LGU
 *   "Flood Control Management Cluster" → not a place at all
 *
 * Measured across the full 25,452-record feed: 41.9% are district offices,
 * 51.1% name only a region, and 7.0% are pseudo-locations.
 *
 * So a name-based path can reach an LGU for at most ~42% of records. The
 * remaining 58% have coordinates — every record in the feed does — and need
 * point-in-polygon against boundary geometry. This module deliberately does
 * not paper over that gap: a region-level office resolves to a region and is
 * reported as such, never promoted to a guess at one of its LGUs.
 */

export type OfficeKind = 'district-office' | 'region' | 'pseudo' | 'unknown';

export interface ImplementingOffice {
  kind: OfficeKind;
  /** The place the office is named for, decoration stripped. Null when none. */
  placeName: string | null;
  /**
   * Which spine tier the name refers to.
   *
   * This is load-bearing. Many Philippine provinces share a name with a city
   * inside or near them — Cebu, Iloilo, Isabela, Cavite, Tarlac, Sorsogon,
   * Quezon. Name normalisation folds "Iloilo City" onto "iloilo", so without a
   * tier the two are indistinguishable and every such office is ambiguous.
   *
   * DPWH naming resolves it: an office named for a bare province ("Cebu 1st
   * DEO") is the province's district office, while one naming a city
   * explicitly ("Iloilo City DEO") is the city's.
   */
  placeLevel: 'Prov' | 'City' | null;
  /** Set when the office spans several LGUs and cannot attribute to one. */
  spans: string[] | null;
  raw: string;
}

const PSEUDO =
  /\b(cluster|central office|management|unincorporated|nationwide|various|not applicable|n\/a|tbd)\b/i;

/** "Region V", "Region IV-A", "National Capital Region", "BARMM", "CAR". */
const REGION =
  /^(region\s|national capital region|cordillera|bangsamoro|barmm|car\b|nir\b|negros island region)/i;

/**
 * Removes office decoration while leaving Philippine place names intact.
 *
 * English compass words are decoration ("North Manila DEO"); Spanish ones are
 * part of the name and must survive ("Davao del Norte", "Surigao del Sur").
 */
export function stripOfficeDecoration(value: string): string {
  return value
    .replace(/\bDEO\b/gi, '')
    .replace(/\bdistrict engineering office\b/gi, '')
    .replace(/\bsub[- ]?district\b/gi, '')
    .replace(/\b\d+(st|nd|rd|th)\b/gi, '')
    .replace(/\bdistrict\b/gi, '')
    .replace(/^\s*(north|south|east|west|central)\s+/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** "Metro Manila" is NCR — a region, not a province or city. */
const METRO_MANILA = /^metro\s+manila$/i;

export function parseImplementingOffice(raw: string | null | undefined): ImplementingOffice {
  const value = raw?.trim() ?? '';
  const base = { placeName: null, placeLevel: null, spans: null, raw: value } as const;

  if (value === '') return { ...base, kind: 'unknown' };
  if (PSEUDO.test(value)) return { ...base, kind: 'pseudo' };
  if (REGION.test(value)) return { ...base, kind: 'region', placeName: value };

  const stripped = stripOfficeDecoration(value);
  if (stripped === '') return { ...base, kind: 'unknown' };

  // "Metro Manila Nth DEO" names NCR, which has no province tier at all.
  if (METRO_MANILA.test(stripped)) {
    return { ...base, kind: 'region', placeName: stripped };
  }

  // A hyphen joining two names means the office covers both ("Las
  // Piñas-Muntinlupa", "Malabon-Navotas"). Attributing the spend to either
  // would be a coin flip, so report the span and let the caller quarantine it.
  const parts = stripped.split(/\s*[-–]\s*/).filter((p) => p.length > 2);
  if (parts.length > 1) {
    return { ...base, kind: 'district-office', spans: parts };
  }

  return {
    ...base,
    kind: 'district-office',
    placeName: stripped,
    // An explicit "City" in the office name means the city; otherwise the
    // office is named for its province.
    placeLevel: /\bcity\b/i.test(stripped) ? 'City' : 'Prov',
  };
}
