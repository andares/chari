import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  dts: true,
  format: ['esm', 'cjs'],
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  treeshake: true,
  splitting: false,
  tsconfig: 'tsconfig.json',
  alias: {
    '@': 'src',
    '@chari': 'src',
  },
});
