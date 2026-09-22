#!/usr/bin/env tsx
import type { SpineRow } from '@pcrm/types';
import { buildSpineIndex } from '@pcrm/resolution';
import { latestSnapshotDir, readSnapshot, writeSnapshot } from './snapshot';
import { fetchSpine, PSGC_VERSION } from './sources/psgc';
import { fetchInfrastructureProjects } from './sources/infrastructure';

/**
 * Ingestion CLI.
 *
 *   npm run ingest -- --source=psgc
 *   npm run ingest -- --source=infrastructure [--limit=500]
 *
 * Each run writes an immutable, checksummed snapshot under data/snapshots/.
 * Nothing here touches the database: loading a snapshot into Postgres is a
 * separate step, so a source outage can never leave the served data partial.
 */

type SourceId = 'psgc' | 'infrastructure';

function parseArgs(argv: string[]): { source: SourceId | null; limit: number | null } {
  let source: SourceId | null = null;
  let limit: number | null = null;

  for (const arg of argv) {
    const sourceMatch = /^--source=(.+)$/.exec(arg);
    if (sourceMatch) {
      const value = sourceMatch[1];
      if (value === 'psgc' || value === 'infrastructure') source = value;
      else throw new Error(`Unknown source "${value}". Expected psgc or infrastructure.`);
    }

    const limitMatch = /^--limit=(\d+)$/.exec(arg);
    if (limitMatch) limit = Number(limitMatch[1]);
  }

  return { source, limit };
}

function log(message: string): void {
  process.stdout.write(`${message}\n`);
}

async function ingestPsgc(): Promise<void> {
  log(`→ PSGC geographic spine (${PSGC_VERSION})`);

  const { rows, sourceUrls, warnings } = await fetchSpine(log);

  const counts = rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.level] = (acc[row.level] ?? 0) + 1;
    return acc;
  }, {});

  const { manifest, directory } = await writeSnapshot(rows, {
    sourceId: 'psgc',
    sourceUrls,
    dataVintage: PSGC_VERSION,
    warnings,
  });

  log('');
  log(`  regions        ${counts['Reg'] ?? 0}`);
  log(`  provinces      ${counts['Prov'] ?? 0}`);
  log(`  cities         ${counts['City'] ?? 0}`);
  log(`  municipalities ${counts['Mun'] ?? 0}`);
  log(`  unclassified   ${counts['Unclassified'] ?? 0}`);
  log('');
  log(`  records  ${manifest.recordCount}`);
  log(`  checksum ${manifest.checksum.slice(0, 16)}…`);
  log(`  written  ${directory}`);

  if (warnings.length > 0) {
    log('');
    log(`  ${warnings.length} warning(s):`);
    for (const warning of warnings.slice(0, 10)) log(`    · ${warning}`);
    if (warnings.length > 10) log(`    … and ${warnings.length - 10} more`);
  }
}

async function ingestInfrastructure(limit: number | null): Promise<void> {
  log('→ Infrastructure projects');

  const spineDir = await latestSnapshotDir('psgc');
  if (!spineDir) {
    throw new Error(
      'No PSGC snapshot found. The geographic spine must be ingested first:\n' +
        '  npm run ingest -- --source=psgc',
    );
  }

  const spine = await readSnapshot<SpineRow>(spineDir);
  log(`  spine: ${spine.manifest.recordCount} rows from ${spine.manifest.dataVintage}`);

  const index = buildSpineIndex(spine.records);
  const { projects, quarantined, sourceUrls, warnings } =
    await fetchInfrastructureProjects(index, log, limit ? { maxRecords: limit } : {});

  const { manifest, directory } = await writeSnapshot(projects, {
    sourceId: 'infrastructure',
    sourceUrls: [sourceUrls[0] ?? ''],
    dataVintage: null,
    warnings,
  });

  const resolved = projects.length - quarantined.length;
  const rate = projects.length === 0 ? 0 : (resolved / projects.length) * 100;

  const flagCounts = projects.reduce<Record<string, number>>((acc, project) => {
    for (const flag of project.qualityFlags) acc[flag] = (acc[flag] ?? 0) + 1;
    return acc;
  }, {});

  log('');
  log(`  projects   ${projects.length}`);
  log(`  resolved   ${resolved} (${rate.toFixed(1)}%)`);
  log(`  quarantine ${quarantined.length}`);
  log(`  checksum   ${manifest.checksum.slice(0, 16)}…`);
  log(`  written    ${directory}`);

  if (Object.keys(flagCounts).length > 0) {
    log('');
    log('  data-quality flags:');
    for (const [flag, count] of Object.entries(flagCounts).sort((a, b) => b[1] - a[1])) {
      log(`    ${String(count).padStart(6)}  ${flag}`);
    }
  }

  if (quarantined.length > 0) {
    await writeSnapshot(quarantined, {
      sourceId: 'infrastructure-quarantine',
      sourceUrls: [sourceUrls[0] ?? ''],
      warnings: [],
    });
    log('');
    log('  sample quarantine rationales:');
    for (const entry of quarantined.slice(0, 5)) {
      log(`    · ${entry.contractId}: ${entry.rationale}`);
    }
  }
}

async function main(): Promise<void> {
  const { source, limit } = parseArgs(process.argv.slice(2));

  if (!source) {
    log('Usage: npm run ingest -- --source=<psgc|infrastructure> [--limit=N]');
    process.exitCode = 1;
    return;
  }

  const started = Date.now();
  if (source === 'psgc') await ingestPsgc();
  else await ingestInfrastructure(limit);

  log('');
  log(`✓ done in ${((Date.now() - started) / 1000).toFixed(1)}s`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`\n✗ ingestion failed: ${message}\n`);
  process.exitCode = 1;
});
