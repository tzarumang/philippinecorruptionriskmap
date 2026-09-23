import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Load the monorepo-root .env.local.
 *
 * Next reads .env files relative to the app directory, but the ingestion CLI
 * runs from the repo root. Rather than keep two copies of the same secrets in
 * sync — which is how one of them ends up stale or committed — the root file
 * is the single source and the app loads it here.
 *
 * Existing environment variables always win, so a real deployment's platform
 * env store is never overridden by a stray local file.
 */
function loadRootEnv() {
  const path = fileURLToPath(new URL('../../.env.local', import.meta.url));
  if (!existsSync(path)) return;

  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!match) continue;

    const key = match[1];
    if (process.env[key] !== undefined) continue;

    process.env[key] = match[2].trim().replace(/^["']|["']$/g, '');
  }
}

loadRootEnv();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Workspace packages ship TypeScript source rather than a build artifact,
  // so Next compiles them as part of the app.
  transpilePackages: ['@pcrm/types', '@pcrm/resolution'],
  typedRoutes: true,
};

export default nextConfig;
