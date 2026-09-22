/**
 * Philippine place-name normalisation.
 *
 * Source records spell the same place many ways. Before any comparison we
 * fold the known variation:
 *
 *   "Sta. Cruz"            → "santa cruz"
 *   "Santa Cruz"           → "santa cruz"
 *   "City of Laoag "       → "laoag"
 *   "Laoag City"           → "laoag"
 *   "LAS PIÑAS"            → "las pinas"
 *   "Gen. Trias"           → "general trias"
 *   "Davao del Norte"      → "davao del norte"
 *
 * Folding Ñ to N is deliberate. It is lossy for display — we never show the
 * normalised form — but "LAS PIÑAS" and "LAS PINAS" both occur in real
 * records and must collide.
 */

/** Abbreviations expanded before comparison. Longest-first to avoid partial hits. */
const ABBREVIATIONS: [RegExp, string][] = [
  [/\bsta\b\.?/g, 'santa'],
  [/\bsto\b\.?/g, 'santo'],
  [/\bgen\b\.?/g, 'general'],
  [/\bpres\b\.?/g, 'president'],
  [/\bmt\b\.?/g, 'mount'],
  [/\bft\b\.?/g, 'fort'],
  [/\bpob\b\.?/g, 'poblacion'],
  [/\bn\b\.?\s+/g, 'norte '],
  [/\bs\b\.?\s+/g, 'sur '],
];

/** Tokens that carry no distinguishing information for an LGU name. */
const NOISE = /\b(city|municipality|province|of|the)\b/g;

/**
 * Folds a name to a comparable key.
 *
 * Returns '' for input that normalises to nothing, which callers must treat as
 * unmatchable rather than as a wildcard.
 */
export function normalisePlaceName(input: string | null | undefined): string {
  if (!input) return '';

  let value = input.toLowerCase();

  // Decompose accents, then drop the combining marks: ñ→n, é→e, ü→u.
  value = value.normalize('NFD').replace(/[̀-ͯ]/g, '');

  // Punctuation and hyphens become spaces so "gen.-trias" ≡ "gen trias".
  value = value.replace(/[.\-_/\\,'"()]/g, ' ');

  for (const [pattern, replacement] of ABBREVIATIONS) {
    value = value.replace(pattern, replacement);
  }

  value = value.replace(NOISE, ' ');

  return value.replace(/\s+/g, ' ').trim();
}

/**
 * True when a free-text location is an administrative pseudo-location rather
 * than a place — e.g. "Central Office", "Flood Control Management Cluster".
 *
 * These are real values in the infrastructure feed. No name matcher can ever
 * resolve them, so recognising them lets us route the record to coordinates
 * instead of burning a fuzzy match and recording a false near-miss.
 */
const PSEUDO_LOCATION =
  /\b(central office|cluster|management|unincorporated|nationwide|various|region[- ]wide|not applicable|n\/a|tbd)\b/i;

export function isPseudoLocation(input: string | null | undefined): boolean {
  if (!input) return false;
  return PSEUDO_LOCATION.test(input);
}
