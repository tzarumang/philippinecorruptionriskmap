import 'server-only';
import type { Centavos } from '@pcrm/types';
import { createClient } from '../../lib/supabase/server';

/**
 * Server-only data access for LGU profiles.
 *
 * Every database read for this feature goes through here. Components never
 * build queries inline, which keeps one place to change a query and one place
 * to reason about what is exposed.
 */

export interface LguSummary {
  code: string;
  name: string;
  level: string;
  cityClass: string | null;
  incomeClassification: string | null;
  islandRegion: string | null;
  psgcVersion: string;
  latestPopulation: number | null;
  latestPopulationYear: number | null;
  parentCode: string | null;
  parentName: string | null;
}

export interface ProjectRow {
  contractId: string;
  description: string;
  category: string | null;
  status: string | null;
  budget: Centavos | null;
  amountPaid: Centavos | null;
  progress: number | null;
  contractor: string | null;
  infraYear: string | null;
  sourceProvince: string | null;
  qualityFlags: string[];
  resolutionMethod: string | null;
  resolutionConfidence: number | null;
}

export interface Provenance {
  sourceId: string;
  retrievedAt: string;
  recordCount: number;
  checksum: string;
  dataVintage: string | null;
  sourceUrls: string[];
}

interface SpineRecord {
  code: string;
  name: string;
  level: string;
  city_class: string | null;
  income_classification: string | null;
  island_region: string | null;
  psgc_version: string;
  latest_population: number | null;
  latest_population_year: number | null;
  parent_code: string | null;
}

export async function getLgu(psgcCode: string): Promise<LguSummary | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('psgc_spine')
    .select(
      'code, name, level, city_class, income_classification, island_region, ' +
        'psgc_version, latest_population, latest_population_year, parent_code',
    )
    .eq('code', psgcCode)
    .maybeSingle<SpineRecord>();

  if (error) throw new Error(`Failed to load LGU ${psgcCode}: ${error.message}`);
  if (!data) return null;

  let parentName: string | null = null;
  if (data.parent_code) {
    const { data: parent } = await supabase
      .from('psgc_spine')
      .select('name')
      .eq('code', data.parent_code)
      .maybeSingle<{ name: string }>();
    parentName = parent?.name ?? null;
  }

  return {
    code: data.code,
    name: data.name,
    level: data.level,
    cityClass: data.city_class,
    incomeClassification: data.income_classification,
    islandRegion: data.island_region,
    psgcVersion: data.psgc_version,
    latestPopulation: data.latest_population,
    latestPopulationYear: data.latest_population_year,
    parentCode: data.parent_code,
    parentName,
  };
}

interface ProjectRecord {
  contract_id: string;
  description: string;
  category: string | null;
  status: string | null;
  budget_centavos: number | null;
  amount_paid_centavos: number | null;
  progress: number | null;
  contractor: string | null;
  infra_year: string | null;
  source_province: string | null;
  quality_flags: string[];
  resolution_method: string | null;
  resolution_confidence: number | null;
}

/**
 * Projects attributed to an LGU.
 *
 * Only rows that actually resolved to this PSGC code are returned — an
 * unresolved project is never silently attributed to a locality.
 */
export async function getProjectsForLgu(
  psgcCode: string,
  limit = 50,
): Promise<ProjectRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('infrastructure_project')
    .select(
      'contract_id, description, category, status, budget_centavos, ' +
        'amount_paid_centavos, progress, contractor, infra_year, source_province, ' +
        'quality_flags, resolution_method, resolution_confidence',
    )
    .eq('psgc_code', psgcCode)
    .order('budget_centavos', { ascending: false, nullsFirst: false })
    .limit(limit)
    .returns<ProjectRecord[]>();

  if (error) throw new Error(`Failed to load projects for ${psgcCode}: ${error.message}`);

  return (data ?? []).map((row) => ({
    contractId: row.contract_id,
    description: row.description,
    category: row.category,
    status: row.status,
    budget: row.budget_centavos as Centavos | null,
    amountPaid: row.amount_paid_centavos as Centavos | null,
    progress: row.progress === null ? null : Number(row.progress),
    contractor: row.contractor,
    infraYear: row.infra_year,
    sourceProvince: row.source_province,
    qualityFlags: row.quality_flags ?? [],
    resolutionMethod: row.resolution_method,
    resolutionConfidence:
      row.resolution_confidence === null ? null : Number(row.resolution_confidence),
  }));
}

/** The snapshot a source's currently served data came from (FR-4, FR-13). */
export async function getProvenance(sourceId: string): Promise<Provenance | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('ingestion_snapshot')
    .select('source_id, retrieved_at, record_count, checksum, data_vintage, source_urls')
    .eq('source_id', sourceId)
    .eq('run_status', 'success')
    .order('retrieved_at', { ascending: false })
    .limit(1)
    .maybeSingle<{
      source_id: string;
      retrieved_at: string;
      record_count: number;
      checksum: string;
      data_vintage: string | null;
      source_urls: string[];
    }>();

  if (error) throw new Error(`Failed to load provenance for ${sourceId}: ${error.message}`);
  if (!data) return null;

  return {
    sourceId: data.source_id,
    retrievedAt: data.retrieved_at,
    recordCount: data.record_count,
    checksum: data.checksum,
    dataVintage: data.data_vintage,
    sourceUrls: data.source_urls ?? [],
  };
}

/** A handful of LGUs that actually have projects — the landing page needs entry points. */
export async function getLgusWithProjects(limit = 24): Promise<
  { code: string; name: string; level: string; projectCount: number }[]
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('infrastructure_project')
    .select('psgc_code, psgc_spine!inner(code, name, level)')
    .not('psgc_code', 'is', null)
    .limit(5000)
    .returns<{ psgc_code: string; psgc_spine: { code: string; name: string; level: string } }[]>();

  if (error) throw new Error(`Failed to load LGU index: ${error.message}`);

  const counts = new Map<string, { code: string; name: string; level: string; projectCount: number }>();
  for (const row of data ?? []) {
    const existing = counts.get(row.psgc_code);
    if (existing) existing.projectCount += 1;
    else
      counts.set(row.psgc_code, {
        code: row.psgc_spine.code,
        name: row.psgc_spine.name,
        level: row.psgc_spine.level,
        projectCount: 1,
      });
  }

  return [...counts.values()]
    .sort((a, b) => b.projectCount - a.projectCount)
    .slice(0, limit);
}
