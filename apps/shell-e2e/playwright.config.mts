import { workspaceRoot } from '@nx/devkit';
import { nxE2EPreset } from '@nx/playwright/preset';
import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env['BASE_URL'] || 'http://localhost:4200';

// Locally, already running dev servers (`npm start`) are reused.
const server = {
  cwd: workspaceRoot,
  reuseExistingServer: !process.env['CI'],
  timeout: 300_000,
};

/**
 * See https://playwright.dev/docs/test-configuration.
 *
 * The shell fetches the `remoteEntry.json` of both remotes (see
 * `federation.manifest.json`) on every page load, so all three dev servers
 * must be up before the first test runs.
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
      command: 'npx nx run mf1:serve',
      url: 'http://localhost:4201/remoteEntry.json',
    },
    {
      ...server,
      command: 'npx nx run mf2:serve',
      url: 'http://localhost:4202/remoteEntry.json',
    },
    {
      ...server,
      command: 'npx nx run shell:serve',
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
