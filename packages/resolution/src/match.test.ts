import { describe, expect, it } from 'vitest';
import type { SpineRow } from '@pcrm/types';
import { buildSpineIndex, resolvePlace } from './match';
import { isPseudoLocation, normalisePlaceName } from './normalise';
import { trigramSimilarity } from './trigram';

function row(partial: Partial<SpineRow> & Pick<SpineRow, 'code' | 'name' | 'level'>): SpineRow {
  return {
    parentCode: null,
    cityClass: null,
    incomeClassification: null,
    psgcVersion: 'Q2_2024',
    islandRegion: null,
    oldName: null,
    correspondenceCode: null,
    status: null,
    latestPopulation: null,
    latestPopulationYear: null,
    ...partial,
  };
}

const SPINE: SpineRow[] = [
  row({ code: '0100000000', name: 'Region I (Ilocos Region)', level: 'Reg' }),
  row({
    code: '0102800000',
    name: 'Ilocos Norte',
    level: 'Prov',
    parentCode: '0100000000',
    correspondenceCode: '012800000',
  }),
  row({ code: '0102801000', name: 'Adams', level: 'Mun', parentCode: '0102800000' }),
  row({ code: '0102812000', name: 'City of Laoag ', level: 'City', parentCode: '0102800000' }),
  row({ code: '0102900000', name: 'Ilocos Sur', level: 'Prov', parentCode: '0100000000' }),
  // "San Isidro" deliberately appears twice, in different provinces.
  row({ code: '0102820000', name: 'San Isidro', level: 'Mun', parentCode: '0102800000' }),
  row({ code: '0102920000', name: 'San Isidro', level: 'Mun', parentCode: '0102900000' }),
  row({ code: '0402100000', name: 'Cavite', level: 'Prov', parentCode: '0400000000' }),
  row({ code: '0402105000', name: 'General Trias', level: 'City', parentCode: '0402100000' }),
  row({ code: '1303900000', name: 'Las Piñas', level: 'City', parentCode: '1300000000' }),
];

const index = buildSpineIndex(SPINE);

describe('normalisePlaceName', () => {
  it('folds the abbreviations and accents that occur in real records', () => {
    expect(normalisePlaceName('Sta. Cruz')).toBe('santa cruz');
    expect(normalisePlaceName('Santa Cruz')).toBe('santa cruz');
    expect(normalisePlaceName('Gen. Trias')).toBe('general trias');
    expect(normalisePlaceName('LAS PIÑAS')).toBe('las pinas');
    expect(normalisePlaceName('Las Pinas')).toBe('las pinas');
  });

  it('collapses the "City of X" / "X City" variants onto one key', () => {
    // Both spellings occur upstream; "City of Laoag " also has trailing space.
    expect(normalisePlaceName('City of Laoag ')).toBe('laoag');
    expect(normalisePlaceName('Laoag City')).toBe('laoag');
    expect(normalisePlaceName('LAOAG')).toBe('laoag');
  });

  it('returns empty for unusable input rather than a wildcard', () => {
    expect(normalisePlaceName('')).toBe('');
    expect(normalisePlaceName(null)).toBe('');
    expect(normalisePlaceName('   ')).toBe('');
  });
});

describe('isPseudoLocation', () => {
  it('recognises the administrative pseudo-locations in the infrastructure feed', () => {
    // Both sampled verbatim from flood-control.bettergov.ph.
    expect(isPseudoLocation('Central Office')).toBe(true);
    expect(isPseudoLocation('Flood Control Management Cluster')).toBe(true);
  });

  it('does not misfire on real places', () => {
    expect(isPseudoLocation('Ilocos Norte')).toBe(false);
    expect(isPseudoLocation('Cavite')).toBe(false);
  });
});

describe('resolvePlace', () => {
  it('matches an exact PSGC code at full confidence', () => {
    const result = resolvePlace({ code: '0102801000' }, index);
    expect(result.psgcCode).toBe('0102801000');
    expect(result.method).toBe('exact-code');
    expect(result.confidence).toBe(1);
  });

  it('resolves a legacy code through the PSA correspondence mapping', () => {
    const result = resolvePlace({ code: '012800000' }, index);
    expect(result.psgcCode).toBe('0102800000');
    expect(result.method).toBe('alias');
  });

  it('matches a name across spelling variants', () => {
    expect(resolvePlace({ name: 'Laoag City', levels: ['City'] }, index).psgcCode)
      .toBe('0102812000');
    expect(resolvePlace({ name: 'Gen. Trias', levels: ['City'] }, index).psgcCode)
      .toBe('0402105000');
    expect(resolvePlace({ name: 'LAS PINAS', levels: ['City'] }, index).psgcCode)
      .toBe('1303900000');
  });

  it('quarantines an ambiguous name instead of picking the first candidate', () => {
    // This is the important one: guessing here would attribute one LGU's
    // projects to another municipality entirely.
    const result = resolvePlace({ name: 'San Isidro', levels: ['Mun'] }, index);
    expect(result.psgcCode).toBeNull();
    expect(result.rationale).toMatch(/matches 2 places/);
  });

  it('resolves the same ambiguous name once a parent narrows it', () => {
    const result = resolvePlace(
      { name: 'San Isidro', levels: ['Mun'], parentCode: '0102900000' },
      index,
    );
    expect(result.psgcCode).toBe('0102920000');
    expect(result.method).toBe('exact-name');
  });

  it('quarantines a pseudo-location and says coordinates are required', () => {
    const result = resolvePlace({ name: 'Flood Control Management Cluster' }, index);
    expect(result.psgcCode).toBeNull();
    expect(result.rationale).toMatch(/pseudo-location/);
    expect(result.rationale).toMatch(/coordinates/);
  });

  it('quarantines rather than accept a weak fuzzy match', () => {
    const result = resolvePlace({ name: 'Nowhere At All', levels: ['Prov'] }, index);
    expect(result.psgcCode).toBeNull();
    expect(result.rationale).toMatch(/below the 0.85 threshold/);
  });

  it('quarantines when nothing is supplied', () => {
    expect(resolvePlace({}, index).psgcCode).toBeNull();
  });
});

describe('trigramSimilarity', () => {
  it('scores identical strings 1 and unrelated strings low', () => {
    expect(trigramSimilarity('cavite', 'cavite')).toBe(1);
    expect(trigramSimilarity('cavite', 'zamboanga')).toBeLessThan(0.2);
  });

  it('scores a near-miss below the 0.85 acceptance threshold', () => {
    // "Ilocos Norte" vs "Ilocos Sur" share a lot of text but are different
    // provinces — the threshold has to keep them apart.
    expect(trigramSimilarity('ilocos norte', 'ilocos sur')).toBeLessThan(0.85);
  });
});
