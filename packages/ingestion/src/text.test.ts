import { describe, expect, it } from 'vitest';
import { cleanText, repairMojibake } from './text';

describe('repairMojibake', () => {
  it('repairs the double-encoded names the PSGC API actually serves', () => {
    // Verbatim from statistics.bettergov.ph, PSGC Q2_2024, on 2026-09-22.
    expect(repairMojibake('City of Las PiÃ±as')).toBe('City of Las Piñas');
    expect(repairMojibake('City of ParaÃ±aque')).toBe('City of Parañaque');
  });

  it('leaves correctly encoded text untouched', () => {
    expect(repairMojibake('City of Las Piñas')).toBe('City of Las Piñas');
    expect(repairMojibake('Ilocos Norte')).toBe('Ilocos Norte');
    expect(repairMojibake('Sto. Niño')).toBe('Sto. Niño');
  });

  it('leaves plain ASCII untouched', () => {
    expect(repairMojibake('Quezon City')).toBe('Quezon City');
    expect(repairMojibake('')).toBe('');
  });

  it('does not mangle text containing characters outside Latin-1', () => {
    // ₱ is U+20B1 — it cannot round-trip through Latin-1, so the repair must
    // decline rather than truncate it.
    expect(repairMojibake('₱1,000 project')).toBe('₱1,000 project');
  });
});

describe('cleanText', () => {
  it('repairs and trims together', () => {
    // "City of Laoag " really does arrive with a trailing space.
    expect(cleanText('City of Laoag ')).toBe('City of Laoag');
    expect(cleanText('  City of Las PiÃ±as  ')).toBe('City of Las Piñas');
  });

  it('maps absent values to an empty string', () => {
    expect(cleanText(null)).toBe('');
    expect(cleanText(undefined)).toBe('');
  });
});
