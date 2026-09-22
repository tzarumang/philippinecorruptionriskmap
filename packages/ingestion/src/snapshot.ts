import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { RunStatus, Snapshot, SnapshotManifest } from '@pcrm/types';

/**
 * Immutable, checksummed ingestion snapshots (FR-4).
 *
 * The platform's central promise is that a published score can be reproduced
 * from the exact inputs that produced it. That only holds if:
 *
 *  - a snapshot is never mutated once written (we refuse to overwrite), and
 *  - the checksum is computed over a CANONICAL serialisation, so the same
 *    records always hash identically regardless of key order or fetch order.
 *
 * A failed run must never clobber the last good snapshot, so the `latest`
 * pointer is only advanced after a successful write (FR-40).
 */

const DEFAULT_ROOT = process.env.PCRM_SNAPSHOT_DIR ?? './data/snapshots';

/**
 * Deterministic JSON: object keys sorted recursively.
 *
 * Without this, two runs returning identical records in a different key order
 * would produce different checksums and break reproducibility for no reason.
 */
export function canonicalise(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value === null || typeof value !== 'object') return value;

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

  return Object.fromEntries(entries.map(([k, v]) => [k, sortKeys(v)]));
}

export function checksumOf(records: unknown[]): string {
  return createHash('sha256').update(canonicalise(records)).digest('hex');
}

/** Filesystem-safe instant, e.g. 2026-09-22T12-47-17-123Z. */
function slugifyInstant(iso: string): string {
  return iso.replace(/[:.]/g, '-');
}

export interface WriteSnapshotOptions {
  sourceId: string;
  sourceUrls: string[];
  dataVintage?: string | null;
  warnings?: string[];
  runStatus?: RunStatus;
  root?: string;
}

export interface WrittenSnapshot {
  manifest: SnapshotManifest;
  directory: string;
}

/**
 * Writes a snapshot and advances the `latest` pointer.
 *
 * Refuses to write into an existing directory: snapshots are immutable, and a
 * collision means a bug worth surfacing rather than data worth overwriting.
 */
export async function writeSnapshot<T>(
  records: T[],
  options: WriteSnapshotOptions,
): Promise<WrittenSnapshot> {
  const {
    sourceId,
    sourceUrls,
    dataVintage = null,
    warnings = [],
    runStatus = 'success',
    root = DEFAULT_ROOT,
  } = options;

  const retrievedAt = new Date().toISOString();
  const checksum = checksumOf(records);

  const manifest: SnapshotManifest = {
    sourceId,
    retrievedAt,
    recordCount: records.length,
    checksum,
    runStatus,
    sourceUrls,
    dataVintage,
    warnings,
  };

  const directory = join(
    root,
    sourceId,
    `${slugifyInstant(retrievedAt)}-${checksum.slice(0, 8)}`,
  );

  if (existsSync(directory)) {
    throw new Error(
      `Snapshot directory already exists and snapshots are immutable: ${directory}`,
    );
  }

  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, 'records.json'), canonicalise(records), 'utf8');
  await writeFile(
    join(directory, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8',
  );

  // Only a successful run may advance `latest` — a partial or failed run
  // leaves the previous good snapshot serving (FR-40).
  if (runStatus === 'success') {
    await writeFile(
      join(root, sourceId, 'latest.json'),
      `${JSON.stringify({ directory, ...manifest }, null, 2)}\n`,
      'utf8',
    );
  }

  return { manifest, directory };
}

/** Reads a snapshot back and verifies its checksum still matches its records. */
export async function readSnapshot<T>(directory: string): Promise<Snapshot<T>> {
  const [manifestRaw, recordsRaw] = await Promise.all([
    readFile(join(directory, 'manifest.json'), 'utf8'),
    readFile(join(directory, 'records.json'), 'utf8'),
  ]);

  const manifest = JSON.parse(manifestRaw) as SnapshotManifest;
  const records = JSON.parse(recordsRaw) as T[];

  const actual = checksumOf(records);
  if (actual !== manifest.checksum) {
    throw new Error(
      `Snapshot checksum mismatch in ${directory}: manifest says ${manifest.checksum}, records hash to ${actual}. ` +
        'The snapshot has been altered — it cannot be trusted to reproduce a score.',
    );
  }

  return { manifest, records };
}

/** Resolves the last successful snapshot for a source, or null if none. */
export async function latestSnapshotDir(
  sourceId: string,
  root: string = DEFAULT_ROOT,
): Promise<string | null> {
  const pointer = join(root, sourceId, 'latest.json');
  if (!existsSync(pointer)) return null;

  const parsed = JSON.parse(await readFile(pointer, 'utf8')) as { directory: string };
  return existsSync(parsed.directory) ? parsed.directory : null;
}

/** Lists every snapshot directory for a source, oldest first. */
export async function listSnapshots(
  sourceId: string,
  root: string = DEFAULT_ROOT,
): Promise<string[]> {
  const dir = join(root, sourceId);
  if (!existsSync(dir)) return [];

  const entries = await readdir(dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => join(dir, e.name))
    .sort();
}
