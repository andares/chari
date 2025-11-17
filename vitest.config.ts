import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const rootDir = dirname(fileURLToPath(new URL(import.meta.url)));
const srcDir = resolve(rootDir, 'src');

export default defineConfig({
  resolve: {
    alias: {
      '@': srcDir,
      '@chari': srcDir,
      '~': srcDir,
    },
  },
  test: {
    include: ['test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
    },
  },
});
