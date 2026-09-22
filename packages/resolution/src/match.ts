import type {
  GeographicLevel,
  PsgcCode,
  ResolutionResult,
  SpineRow,
} from '@pcrm/types';
import { isPseudoLocation, normalisePlaceName } from './normalise';
import { trigramSimilarity } from './trigram';

/**
 * Deterministic PSGC entity resolution (FR-2).
 *
 * Tried strictly in order, most reliable first:
 *
 *   1. exact 10-digit code
 *   2. exact legacy (correspondence) code — the alias table
 *   3. exact normalised name, within the parent when one is known
 *   4. trigram similarity ≥ 0.85
 *   5. quarantine
 *
 * Two design choices are load-bearing:
 *
 * **Ambiguity never guesses.** "San Isidro" names municipalities in many
 * provinces. When a name matches more than one candidate and no parent
 * narrows it, the record is quarantined rather than assigned to whichever row
 * happened to come first. A wrong assignment attributes one LGU's spending to
 * another; a quarantined record is a steward's five-minute review.
 *
 * **Confidence is capped by method, not just by string distance** — a
 * point-in-polygon hit is ranked below a code match even when the geometry is
 * unambiguous, because the boundaries themselves are indicative rather than
 * official (see plan.md §1.8).
 */

export const QUARANTINE_THRESHOLD = 0.85;

const CONFIDENCE = {
  'exact-code': 1,
  'exact-name': 0.99,
  alias: 0.95,
  'point-in-polygon': 0.8,
} as const;

export interface SpineIndex {
  rows: SpineRow[];
  byCode: Map<PsgcCode, SpineRow>;
  byCorrespondenceCode: Map<string, SpineRow>;
  byNormalisedName: Map<string, SpineRow[]>;
}

export function buildSpineIndex(rows: SpineRow[]): SpineIndex {
  const byCode = new Map<PsgcCode, SpineRow>();
  const byCorrespondenceCode = new Map<string, SpineRow>();
  const byNormalisedName = new Map<string, SpineRow[]>();

  for (const row of rows) {
    byCode.set(row.code, row);

    if (row.correspondenceCode) {
      byCorrespondenceCode.set(row.correspondenceCode, row);
    }

    for (const candidate of [row.name, row.oldName]) {
      const key = normalisePlaceName(candidate);
      if (key === '') continue;

      const bucket = byNormalisedName.get(key);
      if (bucket) bucket.push(row);
      else byNormalisedName.set(key, [row]);
    }
  }

  return { rows, byCode, byCorrespondenceCode, byNormalisedName };
}

export interface ResolveInput {
  /** A PSGC code if the record carries one, current or legacy. */
  code?: string | null;
  /** Free-text place name. */
  name?: string | null;
  /** Restrict candidates to these levels. */
  levels?: GeographicLevel[];
  /** Restrict candidates to descendants of this parent. */
  parentCode?: PsgcCode | null;
}

function quarantine(rationale: string): ResolutionResult {
  return { psgcCode: null, method: null, confidence: 0, rationale };
}

function eligible(row: SpineRow, input: ResolveInput): boolean {
  if (input.levels && !input.levels.includes(row.level)) return false;
  if (input.parentCode && row.parentCode !== input.parentCode) return false;
  return true;
}

export function resolvePlace(input: ResolveInput, index: SpineIndex): ResolutionResult {
  // 1. Exact current code.
  if (input.code) {
    const row = index.byCode.get(input.code.trim());
    if (row) {
      return {
        psgcCode: row.code,
        method: 'exact-code',
        confidence: CONFIDENCE['exact-code'],
        rationale: `Exact PSGC code match to "${row.name}".`,
      };
    }

    // 2. Legacy code via the PSA's own correspondence mapping.
    const aliased = index.byCorrespondenceCode.get(input.code.trim());
    if (aliased) {
      return {
        psgcCode: aliased.code,
        method: 'alias',
        confidence: CONFIDENCE.alias,
        rationale: `Legacy code ${input.code} maps to ${aliased.code} "${aliased.name}".`,
      };
    }
  }

  const rawName = input.name?.trim() ?? '';
  if (rawName === '') {
    return quarantine('No code matched and no name supplied.');
  }

  // Pseudo-locations are not places. Say so explicitly rather than letting a
  // fuzzy match invent a near-miss against a real LGU.
  if (isPseudoLocation(rawName)) {
    return quarantine(
      `"${rawName}" is an administrative pseudo-location, not a place. ` +
        'Resolution requires coordinates.',
    );
  }

  const key = normalisePlaceName(rawName);
  if (key === '') {
    return quarantine(`"${rawName}" normalises to an empty name.`);
  }

  // 3. Exact normalised name.
  const exact = (index.byNormalisedName.get(key) ?? []).filter((r) => eligible(r, input));
  if (exact.length === 1) {
    const row = exact[0]!;
    return {
      psgcCode: row.code,
      method: 'exact-name',
      confidence: CONFIDENCE['exact-name'],
      rationale: `Exact normalised name match: "${rawName}" → "${row.name}".`,
    };
  }
  if (exact.length > 1) {
    return quarantine(
      `"${rawName}" matches ${exact.length} places exactly ` +
        `(${exact.slice(0, 3).map((r) => r.code).join(', ')}…) and no parent narrows it.`,
    );
  }

  // 4. Trigram similarity, with a strict threshold and no tie-breaking.
  const candidates = index.rows.filter((r) => eligible(r, input));
  let best: { row: SpineRow; score: number } | null = null;
  let runnerUp = 0;

  for (const row of candidates) {
    const score = trigramSimilarity(key, normalisePlaceName(row.name));
    if (!best || score > best.score) {
      runnerUp = best?.score ?? 0;
      best = { row, score };
    } else if (score > runnerUp) {
      runnerUp = score;
    }
  }

  if (!best || best.score < QUARANTINE_THRESHOLD) {
    return quarantine(
      `Best trigram similarity for "${rawName}" was ${(best?.score ?? 0).toFixed(3)}, ` +
        `below the ${QUARANTINE_THRESHOLD} threshold.`,
    );
  }

  // Two candidates that score identically are a coin flip, not a match.
  if (best.score === runnerUp) {
    return quarantine(
      `"${rawName}" ties at similarity ${best.score.toFixed(3)} between multiple places.`,
    );
  }

  return {
    psgcCode: best.row.code,
    method: 'trigram',
    confidence: best.score,
    rationale:
      `Trigram similarity ${best.score.toFixed(3)}: "${rawName}" → "${best.row.name}" ` +
      `(runner-up ${runnerUp.toFixed(3)}).`,
  };
}
