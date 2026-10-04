const { test, expect } = require('@playwright/test');
const { AxeBuilder } = require('@axe-core/playwright');

const BASE_URL = process.env.OMEGA_BASE_URL || 'https://sydomega.com';

const MODULE_ROUTES = [
  ['/dashboard.html', 'CORE'],
  ['/consultancy.html', 'CONSULTANCY'],
  ['/gaming.html', 'GAMING'],
  ['/honors.html', 'ACHIEVEMENTS'],
  ['/family.html', 'FAMILY'],
  ['/media.html', 'MEDIA'],
  ['/blockchain.html', 'BLOCKCHAIN'],
  ['/social.html', 'COMMUNICATION'],
  ['/horoscope.html', 'HOROSCOPE'],
  ['/news.html', 'NEWS'],
  ['/heritage.html', 'HERITAGE'],
  ['/evolution.html', 'PROGRESS'],
  ['/profile.html#passport', 'PASSPORT'],
  ['/compliance.html', 'LEGAL'],
  ['/elements.html', 'ELEMENTS'],
  ['/investment.html', 'INVESTMENT'],
  ['/intelligence.html', 'INTELLIGENCE'],
  ['/governance.html', 'HIERARCHY'],
];

test.describe('Omega production release surface', () => {
  test('homepage loads without a server error', async ({ page }) => {
    const response = await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    expect(response).not.toBeNull();
    expect(response.status()).toBeLessThan(500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('all 18 governed module routes are reachable', async ({ page }) => {
    for (const [route, moduleName] of MODULE_ROUTES) {
      const response = await page.goto(new URL(route, BASE_URL).toString(), {
        waitUntil: 'domcontentloaded',
      });
      expect(response, moduleName + ' response').not.toBeNull();
      expect([200, 401, 403]).toContain(response.status());
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('payment boundary is reachable without initiating a charge', async ({ page }) => {
    for (const route of ['/payments.html', '/subscriptions.html']) {
      const response = await page.goto(new URL(route, BASE_URL).toString(), {
        waitUntil: 'domcontentloaded',
      });
      expect(response).not.toBeNull();
      expect([200, 401, 403]).toContain(response.status());
      await expect(page.locator('body')).toBeVisible();
      const body = await page.locator('body').innerText();
      expect(body).not.toMatch(/payment successful|charge successful|purchase complete/i);
    }
  });

  test('unauthenticated browser state does not expose a fake LIVE balance', async ({ page }) => {
    await page.goto(new URL('/dashboard.html', BASE_URL).toString(), {
      waitUntil: 'domcontentloaded',
    });
    const body = await page.locator('body').innerText();
    expect(body).not.toMatch(/balance\s*[:=]\s*\$?\s*0\.00\s*(USD|EUR)?/i);
    expect(body).toMatch(/UNAVAILABLE|PARTIAL|LIVE|CALCULATED|SIMULATED|sign in|login|authenticate/i);
  });

  for (const [route] of MODULE_ROUTES.slice(0, 5)) {
    test('accessibility: ' + route, async ({ page }) => {
      await page.goto(new URL(route, BASE_URL).toString(), { waitUntil: 'domcontentloaded' });
      const results = await new AxeBuilder({ page }).analyze();
      const blocking = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
      expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
    });
  }

  test('reduced-motion context is honored by the browser', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
    await context.close();
  });
});
