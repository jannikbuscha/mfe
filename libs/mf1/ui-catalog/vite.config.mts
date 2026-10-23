/// <reference types='vitest' />
import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../../node_modules/.vite/libs/mf1/ui-catalog',
  resolve: {
    tsconfigPaths: true,
  },
  // Explicit, so the plugin does not look for a tsconfig.app.json when Nx
  // loads this file outside of Vitest to infer the project's targets.
  plugins: [angular({ tsconfig: './tsconfig.spec.json' })],
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [],
  // },
  test: {
    name: 'mf1-ui-catalog',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    setupFiles: ['src/test-setup.ts'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../../coverage/libs/mf1/ui-catalog',
      provider: 'v8' as const,
    },
  },
}));
