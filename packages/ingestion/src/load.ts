#!/usr/bin/env tsx
import { existsSync } from 'node:fs';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { InfrastructureProject, SnapshotManifest, SpineRow } from '@pcrm/types';
import { latestSnapshotDir, readSnapshot } from './snapshot';
import type { QuarantineEntry } from './sources/infrastructure';

/**
 * Loads the latest snapshots into Postgres.
 *
 * Deliberately separate from fetching. A source outage can then never leave
 * the served data half-written: ingestion writes an immutable snapshot, and
 * only a complete snapshot is ever loaded (FR-40).
 *
 * This is the one place that uses the service-role key, which bypasses RLS.
 * It runs server-side from the CLI and its key is never exposed to the app.
 */

const BATCH = 500;

function env(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env.local and fill it in.`,
    );
  }
  return value;
}

function log(message: string): void {
  process.stdout.write(`${message}\n`);
}

/** Registers a snapshot's manifest and returns its row id. */
async function registerSnapshot(
  db: SupabaseClient,
  manifest: SnapshotManifest,
): Promise<number> {
  const { data, error } = await db
    .from('ingestion_snapshot')
    .upsert(
      {
        source_id: manifest.sourceId,
        retrieved_at: manifest.retrievedAt,
        record_count: manifest.recordCount,
        checksum: manifest.checksum,
        run_status: manifest.runStatus,
        source_urls: manifest.sourceUrls,
        data_vintage: manifest.dataVintage,
        warnings: manifest.warnings,
      },
      { onConflict: 'source_id,checksum' },
    )
    .select('id')
    .single<{ id: number }>();

  if (error) throw new Error(`Failed to register snapshot: ${error.message}`);
  return data.id;
}

async function upsertInBatches(
  db: SupabaseClient,
  table: string,
  rows: Record<string, unknown>[],
  onConflict: string,
  onProgress: (done: number) => void,
): Promise<void> {
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const { error } = await db.from(table).upsert(chunk, { onConflict });
    if (error) {
      throw new Error(`Failed to upsert into ${table} at offset ${i}: ${error.message}`);
    }
    onProgress(Math.min(i + BATCH, rows.length));
  }
}

/**
 * Orders spine rows so a parent is always written before its children.
 *
 * psgc_spine.parent_code is a self-reference, so an arbitrary order would hit
 * a foreign-key violation partway through.
 */
function byHierarchyDepth(rows: SpineRow[]): SpineRow[] {
  const byCode = new Map(rows.map((r) => [r.code, r]));
  const depthOf = new Map<string, number>();

  const depth = (row: SpineRow, guard = 0): number => {
    if (depthOf.has(row.code)) return depthOf.get(row.code)!;
    if (row.parentCode === null || guard > 8) {
      depthOf.set(row.code, 0);
      return 0;
    }
    const parent = byCode.get(row.parentCode);
    const value = parent ? depth(parent, guard + 1) + 1 : 0;
    depthOf.set(row.code, value);
    return value;
  };

  return [...rows].sort((a, b) => depth(a) - depth(b));
}

async function loadSpine(db: SupabaseClient): Promise<void> {
  const dir = await latestSnapshotDir('psgc');
  if (!dir) {
    throw new Error('No PSGC snapshot. Run: npm run ingest -- --source=psgc');
  }

  const { manifest, records } = await readSnapshot<SpineRow>(dir);
  log(`→ spine: ${records.length} rows (${manifest.dataVintage})`);

  const snapshotId = await registerSnapshot(db, manifest);

  const rows = byHierarchyDepth(records).map((row) => ({
    code: row.code,
    name: row.name,
    parent_code: row.parentCode,
    level: row.level,
    city_class: row.cityClass,
    income_classification: row.incomeClassification,
    psgc_version: row.psgcVersion,
    island_region: row.islandRegion,
    old_name: row.oldName,
    correspondence_code: row.correspondenceCode,
    status: row.status,
    latest_population: row.latestPopulation,
    latest_population_year: row.latestPopulationYear,
    snapshot_id: snapshotId,
  }));

  await upsertInBatches(db, 'psgc_spine', rows, 'code', (done) =>
    log(`  spine: ${done}/${rows.length}`),
  );
}

async function loadInfrastructure(db: SupabaseClient): Promise<void> {
  const dir = await latestSnapshotDir('infrastructure');
  if (!dir) {
    throw new Error(
      'No infrastructure snapshot. Run: npm run ingest -- --source=infrastructure',
    );
  }

  const { manifest, records } = await readSnapshot<InfrastructureProject>(dir);
  log(`→ projects: ${records.length} records`);

  const snapshotId = await registerSnapshot(db, manifest);

  const rows = records.map((p) => ({
    contract_id: p.contractId,
    description: p.description,
    category: p.category,
    status: p.status,
    budget_centavos: p.budget,
    amount_paid_centavos: p.amountPaid,
    progress: p.progress,
    contractor: p.contractor,
    source_region: p.sourceRegion,
    source_province: p.sourceProvince,
    start_date: p.startDate,
    completion_date: p.completionDate,
    infra_year: p.infraYear,
    program_name: p.programName,
    source_of_funds: p.sourceOfFunds,
    latitude: p.latitude,
    longitude: p.longitude,
    psgc_code: p.psgcCode,
    resolution_method: p.resolutionMethod,
    resolution_confidence: p.resolutionConfidence,
    quality_flags: p.qualityFlags,
    snapshot_id: snapshotId,
  }));

  await upsertInBatches(db, 'infrastructure_project', rows, 'contract_id', (done) =>
    log(`  projects: ${done}/${rows.length}`),
  );

  const quarantineDir = await latestSnapshotDir('infrastructure-quarantine');
  if (!quarantineDir) return;

  const quarantine = await readSnapshot<QuarantineEntry>(quarantineDir);
  const qSnapshotId = await registerSnapshot(db, quarantine.manifest);

  const qRows = quarantine.records.map((entry) => ({
    source_id: 'infrastructure',
    record_key: entry.contractId,
    source_region: entry.sourceRegion,
    source_province: entry.sourceProvince,
    latitude: entry.latitude,
    longitude: entry.longitude,
    rationale: entry.rationale,
    snapshot_id: qSnapshotId,
  }));

  await upsertInBatches(
    db,
    'resolution_quarantine',
    qRows,
    'source_id,record_key,snapshot_id',
    (done) => log(`  quarantine: ${done}/${qRows.length}`),
  );
}

async function main(): Promise<void> {
  if (existsSync('.env.local')) process.loadEnvFile('.env.local');

  const db = createClient(
    env('NEXT_PUBLIC_SUPABASE_URL'),
    env('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false } },
  );

  const started = Date.now();
  await loadSpine(db);
  await loadInfrastructure(db);

  log('');
  log(`✓ loaded in ${((Date.now() - started) / 1000).toFixed(1)}s`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`\n✗ load failed: ${message}\n`);
  process.exitCode = 1;
});
