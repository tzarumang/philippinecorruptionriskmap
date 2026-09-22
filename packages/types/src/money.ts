import type { Centavos } from './index';

/**
 * Money and numeric parsing at the source boundary.
 *
 * Two real defects in upstream data motivate this module:
 *
 *  1. The infrastructure API sends budgets as JSON floats — `1447499996.23`.
 *     The PRD requires exact integers. Multiplying a float by 100 reintroduces
 *     binary-floating-point error (1447499996.23 * 100 is not exactly
 *     144749999623), so we parse the DECIMAL TEXT instead and never multiply.
 *  2. The PSGC API sends populations as strings with padding and thousands
 *     separators — `" 593,081 "`.
 *
 * Both return `null` rather than throwing or guessing, so a caller can flag a
 * bad value and keep the rest of the record.
 */

/** Strips currency symbols, thousands separators and padding. */
function clean(raw: string): string {
  return raw
    .replace(/[\s ]/g, '')
    .replace(/[₱]/g, '')
    .replace(/PHP/gi, '')
    .replace(/,/g, '');
}

/**
 * Converts a peso amount to integer centavos.
 *
 * Accepts a number or a string. Returns null for anything it cannot read
 * exactly, including exponential notation — at our magnitudes that would
 * indicate a source change worth noticing, not a value worth guessing at.
 */
export function toCentavos(input: unknown): Centavos | null {
  if (input === null || input === undefined) return null;
  if (typeof input === 'number' && !Number.isFinite(input)) return null;

  const text = clean(String(input));
  if (text === '') return null;

  // Reject exponential notation rather than risk a silent precision loss.
  if (/[eE]/.test(text)) return null;

  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(text);
  if (!match) return null;

  // Groups 1 and 2 are guaranteed by the pattern, but the compiler cannot know
  // that under noUncheckedIndexedAccess.
  const sign = match[1] ?? '';
  const whole = match[2] ?? '0';
  const fractionRaw = match[3] ?? '';

  // Pad or round the fraction to exactly two decimal places. More than two
  // decimals on a peso amount is a source anomaly; round half-up and move on.
  let fraction: string;
  if (fractionRaw.length <= 2) {
    fraction = fractionRaw.padEnd(2, '0');
  } else {
    const keep = Number(fractionRaw.slice(0, 2));
    const next = Number(fractionRaw[2]);
    const rounded = next >= 5 ? keep + 1 : keep;
    // Rounding 99 up carries into the peso, so fold it back through the whole.
    if (rounded === 100) {
      const carried = (BigInt(whole) + 1n).toString();
      return finalise(sign, carried, '00');
    }
    fraction = String(rounded).padStart(2, '0');
  }

  return finalise(sign, whole, fraction);
}

function finalise(sign: string, whole: string, fraction: string): Centavos | null {
  const combined = `${sign}${whole}${fraction}`;
  const value = Number(combined);
  // Guard the 2^53 boundary: beyond it, integer arithmetic stops being exact.
  if (!Number.isSafeInteger(value)) return null;
  return value as Centavos;
}

/**
 * Parses a count that may arrive as a padded, comma-separated string —
 * e.g. the PSGC API's `" 593,081 "`.
 */
export function parseCount(input: unknown): number | null {
  if (input === null || input === undefined) return null;

  const text = clean(String(input));
  if (text === '' || !/^-?\d+$/.test(text)) return null;

  const value = Number(text);
  return Number.isSafeInteger(value) ? value : null;
}

/** Formats centavos for display, e.g. 144749999623 → "₱1,447,499,996.23". */
export function formatCentavos(
  value: Centavos | null,
  options: { compact?: boolean } = {},
): string {
  if (value === null) return '—';

  const negative = value < 0;
  const absolute = Math.abs(value);
  const pesos = Math.trunc(absolute / 100);
  const centavos = absolute % 100;

  if (options.compact) {
    const formatted = new Intl.NumberFormat('en-PH', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(pesos);
    return `${negative ? '−' : ''}₱${formatted}`;
  }

  const formatted = new Intl.NumberFormat('en-PH').format(pesos);
  return `${negative ? '−' : ''}₱${formatted}.${String(centavos).padStart(2, '0')}`;
}
