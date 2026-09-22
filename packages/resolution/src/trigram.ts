/**
 * Trigram similarity, used as the last name-based step of the matcher (FR-2).
 *
 * This mirrors PostgreSQL's `pg_trgm` closely enough that a threshold tuned
 * here behaves the same way in SQL: the string is padded, split into
 * overlapping 3-grams, and scored by Jaccard similarity over the gram sets.
 *
 * FR-2 sets the acceptance threshold at 0.85 — deliberately high. A wrong
 * match silently attributes one LGU's projects to another, which is worse
 * than a quarantined record a steward can review.
 */

export function trigrams(input: string): Set<string> {
  const padded = `  ${input.trim()} `;
  const grams = new Set<string>();

  for (let i = 0; i < padded.length - 2; i += 1) {
    grams.add(padded.slice(i, i + 3));
  }

  return grams;
}

/** Jaccard similarity over trigram sets, 0–1. */
export function trigramSimilarity(a: string, b: string): number {
  if (a === b) return a.length === 0 ? 0 : 1;
  if (a.length === 0 || b.length === 0) return 0;

  const left = trigrams(a);
  const right = trigrams(b);

  let intersection = 0;
  for (const gram of left) {
    if (right.has(gram)) intersection += 1;
  }

  const union = left.size + right.size - intersection;
  return union === 0 ? 0 : intersection / union;
}
