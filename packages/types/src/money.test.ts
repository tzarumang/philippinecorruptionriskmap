import { describe, expect, it } from 'vitest';
import { formatCentavos, parseCount, toCentavos } from './money';
import type { Centavos } from './index';

describe('toCentavos', () => {
  it('converts the real observed budget float without precision loss', () => {
    // Sampled verbatim from flood-control.bettergov.ph on 2026-09-22.
    // Naive float maths (1447499996.23 * 100) does NOT yield this exactly.
    expect(toCentavos(1447499996.23)).toBe(144_749_999_623);
  });

  it('does not drift where float multiplication would', () => {
    // 0.29 * 100 === 28.999999999999996 in IEEE-754.
    expect(toCentavos(0.29)).toBe(29);
    expect(toCentavos(1.005)).toBe(101); // round half-up on the third decimal
    expect(toCentavos(8.165)).toBe(817);
  });

  it('accepts strings with separators, padding and currency marks', () => {
    expect(toCentavos(' 1,447,499,996.23 ')).toBe(144_749_999_623);
    expect(toCentavos('₱250.00')).toBe(25_000);
    expect(toCentavos('PHP 1,000')).toBe(100_000);
  });

  it('pads a missing or short fraction', () => {
    expect(toCentavos(1000)).toBe(100_000);
    expect(toCentavos('12.5')).toBe(1250);
  });

  it('carries a rounded fraction into the peso', () => {
    expect(toCentavos('1.999')).toBe(200);
    expect(toCentavos('1.995')).toBe(200);
    expect(toCentavos('1.994')).toBe(199);
  });

  it('handles negatives', () => {
    expect(toCentavos('-42.50')).toBe(-4250);
  });

  it('returns null rather than guessing at unreadable input', () => {
    expect(toCentavos(null)).toBeNull();
    expect(toCentavos(undefined)).toBeNull();
    expect(toCentavos('')).toBeNull();
    expect(toCentavos('   ')).toBeNull();
    expect(toCentavos('n/a')).toBeNull();
    expect(toCentavos(Number.NaN)).toBeNull();
    expect(toCentavos(Number.POSITIVE_INFINITY)).toBeNull();
  });

  it('rejects exponential notation instead of risking silent precision loss', () => {
    expect(toCentavos('1e21')).toBeNull();
    expect(toCentavos(1e21)).toBeNull();
  });

  it('rejects amounts beyond exact integer arithmetic', () => {
    // Past 2^53 centavos, `number` stops being exact — refuse rather than lie.
    expect(toCentavos('99999999999999999')).toBeNull();
  });
});

describe('parseCount', () => {
  it('parses the padded, comma-separated population strings PSGC returns', () => {
    // Sampled verbatim from the PSGC classification API on 2026-09-22.
    expect(parseCount(' 593,081 ')).toBe(593_081);
    expect(parseCount('618,850')).toBe(618_850);
  });

  it('returns null for non-integer input', () => {
    expect(parseCount('12.5')).toBeNull();
    expect(parseCount('')).toBeNull();
    expect(parseCount(null)).toBeNull();
    expect(parseCount('unknown')).toBeNull();
  });
});

describe('formatCentavos', () => {
  it('renders pesos and centavos', () => {
    expect(formatCentavos(144_749_999_623 as Centavos)).toBe('₱1,447,499,996.23');
    expect(formatCentavos(25_000 as Centavos)).toBe('₱250.00');
    expect(formatCentavos(5 as Centavos)).toBe('₱0.05');
  });

  it('renders a missing amount as an em dash, not as zero', () => {
    // A zero budget and an unknown budget are different claims.
    expect(formatCentavos(null)).toBe('—');
    expect(formatCentavos(0 as Centavos)).toBe('₱0.00');
  });
});
