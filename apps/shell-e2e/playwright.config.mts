import { workspaceRoot } from '@nx/devkit';
import { nxE2EPreset } from '@nx/playwright/preset';
import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env['CI'];
const baseURL = process.env['BASE_URL'] || 'http://localhost:4200';

// Locally, already running dev servers (`npm start`) are reused. CI builds
// and serves the production artifacts (same ports), so the hashed federation
// output is what gets tested.
const server = {
  cwd: workspaceRoot,
  reuseExistingServer: !isCI,
  timeout: 300_000,
};
const serve = (app: string) =>
  isCI ? `npx nx run ${app}:serve-static` : `npx nx run ${app}:serve`;

/**
 * See https://playwright.dev/docs/test-configuration.
 *
 * The shell fetches the `remoteEntry.json` of both remotes (see
 * `federation.manifest.json`) on every page load, so all three servers must
 * be up before the first test runs.
 */
export default defineConfig({
  ...nxE2EPreset(import.meta.dirname, { testDir: './src' }),
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer: [
    {
      ...server,
      command: serve('mf1'),
      url: 'http://localhost:4201/remoteEntry.json',
    },
    {
      ...server,
      command: serve('mf2'),
      url: 'http://localhost:4202/remoteEntry.json',
    },
    {
      ...server,
      command: serve('shell'),
      url: 'http://localhost:4200',
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
