const { test, expect } = require('@playwright/test');
const { AxeBuilder } = require('@axe-core/playwright');

const BASE_URL = process.env.OMEGA_BASE_URL || 'https://sydomega.com';

// A signed-out visitor is sent on by a client-side redirect (bg.js's approval
// guard, e.g. dashboard.html -> account.html) shortly after DOMContentLoaded.
// Evaluating during that hop throws "Execution context was destroyed", which
// failed this suite on every run without measuring anything. Measure the page
// the visitor actually lands on: wait until the URL stops changing.
async function settle(page) {
  let last = page.url();
  for (let i = 0; i < 20; i++) {
    await page.waitForLoadState('load').catch(() => {});
    await page.waitForTimeout(500);
    if (page.url() === last) return;
    last = page.url();
  }
}

// goto, tolerating the abort a client redirect causes, then settle.
async function visit(page, url, waitUntil = 'domcontentloaded') {
  try {
    await page.goto(url, { waitUntil });
  } catch (e) {
    if (!/ERR_ABORTED|interrupted by another navigation/.test(String(e))) throw e;
  }
  await settle(page);
}

// Run fn against the settled page; a late redirect gets one more settle.
async function onSettled(page, fn) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (e) {
      if (attempt >= 2 || !/Execution context was destroyed|navigat/i.test(String(e))) throw e;
      await settle(page);
    }
  }
}

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
    test.setTimeout(150000); // 18 routes, each settled past its redirect
    for (const [route, moduleName] of MODULE_ROUTES) {
      const url = new URL(route, BASE_URL).toString();
      // Reachability is the server's answer, read without a client redirect racing it.
      const response = await page.request.get(url);
      expect([200, 401, 403], moduleName + ' status').toContain(response.status());
      await visit(page, url);
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('payment boundary is reachable without initiating a charge', async ({ page }) => {
    for (const route of ['/payments.html', '/subscriptions.html']) {
      const url = new URL(route, BASE_URL).toString();
      const response = await page.request.get(url);
      expect([200, 401, 403]).toContain(response.status());
      await visit(page, url);
      await expect(page.locator('body')).toBeVisible();
      const body = await onSettled(page, () => page.locator('body').innerText());
      expect(body).not.toMatch(/payment successful|charge successful|purchase complete/i);
    }
  });

  test('unauthenticated browser state does not expose a fake LIVE balance', async ({ page }) => {
    await visit(page, new URL('/dashboard.html', BASE_URL).toString());
    const body = await onSettled(page, () => page.locator('body').innerText());
    expect(body).not.toMatch(/balance\s*[:=]\s*\$?\s*0\.00\s*(USD|EUR)?/i);
    // A signed-out visitor lands on the account page, whose real prompt is "LOG IN";
    // `login` never matched it -- the test passed only because the ticker/value banner
    // happened to print "LIVE", and calm mode (default since 2026-10-04) hides those.
    expect(body).toMatch(/UNAVAILABLE|PARTIAL|LIVE|CALCULATED|SIMULATED|sign\s*in|log\s*in|authenticate/i);
  });

  for (const [route] of MODULE_ROUTES.slice(0, 5)) {
    test('accessibility: ' + route, async ({ page }) => {
      await visit(page, new URL(route, BASE_URL).toString());
      const results = await onSettled(page, () => new AxeBuilder({ page }).analyze());
      const blocking = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
      expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
    });
  }

  test('homepage performance stays within release thresholds', async ({ page }) => {
    await visit(page, BASE_URL, 'load');
    const metrics = await onSettled(page, () => page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0];
      const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
      const layoutShifts = performance.getEntriesByType('layout-shift').filter((e) => !e.hadRecentInput);
      return {
        domContentLoaded: nav ? nav.domContentLoadedEventEnd : null,
        load: nav ? nav.loadEventEnd : null,
        lcp: lcpEntries.length ? lcpEntries[lcpEntries.length - 1].startTime : null,
        cls: layoutShifts.reduce((sum, e) => sum + e.value, 0),
      };
    }));
    expect(metrics.domContentLoaded).not.toBeNull();
    expect(metrics.load).not.toBeNull();
    expect(metrics.domContentLoaded).toBeLessThan(5000);
    expect(metrics.load).toBeLessThan(8000);
    if (metrics.lcp !== null) expect(metrics.lcp).toBeLessThan(4000);
    expect(metrics.cls).toBeLessThan(0.25);
  });

  test('reduced-motion context is honored by the browser', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
    await context.close();
  });
});
