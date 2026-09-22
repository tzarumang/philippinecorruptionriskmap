import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const resolve = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@pcrm/types/money': resolve('./packages/types/src/money.ts'),
      '@pcrm/types': resolve('./packages/types/src/index.ts'),
      '@pcrm/ingestion': resolve('./packages/ingestion/src/index.ts'),
      '@pcrm/resolution': resolve('./packages/resolution/src/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['packages/**/*.test.ts'],
  },
});
