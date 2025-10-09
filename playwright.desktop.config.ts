import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e/desktop',
  timeout: 120_000,
  globalSetup: './tests/e2e/desktop/global-setup.ts',
  expect: {
    timeout: 5_000
  },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report/desktop', open: 'never' }]
  ],
  use: {
    trace: process.env.CI ? 'on-first-retry' : 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: process.env.CI ? 'off' : 'retain-on-failure'
  },
  outputDir: 'test-results/playwright-desktop'
});
