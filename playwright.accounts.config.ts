import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/accounts',
  testMatch: /.*\.spec\.ts/,
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: false,
  workers: 1,
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
  reporter: [
    ['list'],
    ['html', { outputFolder: 'artifacts/e2e-accounts/report', open: 'never' }],
  ],
  outputDir: 'artifacts/e2e-accounts/test-results',
  use: {
    baseURL: 'http://127.0.0.1:8788',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },
  webServer: {
    command:
      'npm run build && npm run db:local && npx wrangler pages dev dist --ip 127.0.0.1 --port 8788',
    url: 'http://127.0.0.1:8788',
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
