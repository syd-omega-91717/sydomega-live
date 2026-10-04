const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/release',
  timeout: 30000,
  expect: { timeout: 5000 },
  fullyParallel: true,
  workers: 2,
  retries: 1,
  reporter: [['html', { outputFolder: 'playwright-report', open: 'never' }], ['line']],
  use: {
    baseURL: process.env.OMEGA_BASE_URL || 'https://sydomega.com',
    browserName: 'chromium',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
});
