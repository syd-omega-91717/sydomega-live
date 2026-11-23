#!/usr/bin/env node
/* Browser validation that the money-cluster charts are drawn at the screen's real pixel density (omega-canvas-hidpi.js).
 *
 * Usage: node scripts/verify-hidpi-charts.js [--root DIR]      (--root runs the same checks against another checkout, e.g. a worktree of origin/main)
 *
 * For each chart (expenses x5, investment, revenue, treasury, wealth) the page is rendered at device scale 1, 2 and 3 with seeded data and the canvas is measured:
 *   1. its CSS size is the same at every scale (the fix must not change layout);
 *   2. its backing store is css size x scale (that is the resolution gain; before the fix it was 1x at every scale and the browser stretched it);
 *   3. what was painted covers the same fraction of the canvas at every scale (a missing transform would draw in the top-left corner only);
 *   4. it is not blank.
 * Files are served from disk through route() (no http server). No browser: SKIPPED, exit 0 unless OMEGA_REQUIRE_BROWSER is set.
 */
const fs = require('fs'), path = require('path');
if (process.argv.includes('--help') || process.argv.includes('-h')) { console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0].replace(/^#!.*\n/, '').replace(/^\/\*\s?/, '')); process.exit(0); }
const ri = process.argv.indexOf('--root');
const ROOT = ri > 0 ? path.resolve(process.argv[ri + 1]) : path.resolve(__dirname, '..'), ORIGIN = 'http://hidpi.test';
const HARNESS = path.resolve(__dirname, '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp' };
function loadPW() { const sp = process.env.OMEGA_SCRATCHPAD; for (const t of [sp && path.join(sp, 'node_modules', 'playwright'), sp && path.join(sp, 'node_modules', 'playwright-core'), 'playwright', 'playwright-core']) { if (!t) continue; try { return require(t); } catch (e) { } } return null; }
let STUB = null; try { STUB = require(path.join(HARNESS, '.claude', 'skills', 'verify-in-browser', 'harness', 'sbstub.js')).STUB; } catch (e) { }
const results = []; const check = (n, ok, d) => results.push({ name: n, ok: !!ok, detail: ok ? undefined : d });

const Y = new Date().getFullYear(), cm = new Date().getMonth() + 1, key = (y, m) => y + '-' + String(m).padStart(2, '0');
const STORE = {}; STORE[key(Y, cm)] = { income: [{ id: 'i1', source: 'job', amount: 4000, date: key(Y, cm) + '-02' }], expenses: [{ id: 'e1', cat: 'HOUSING', desc: 'rent', amount: 1500, date: key(Y, cm) + '-03' }, { id: 'e2', cat: 'FOOD', desc: 'food', amount: 400, date: key(Y, cm) + '-05' }] };
STORE[key(Y, cm === 1 ? 12 : cm - 1)] = { income: [{ id: 'i2', source: 'job', amount: 3800, date: key(Y, cm === 1 ? 12 : cm - 1) + '-01' }], expenses: [{ id: 'e3', cat: 'TRANSPORT', desc: 'bus', amount: 300, date: key(Y, cm === 1 ? 12 : cm - 1) + '-04' }] };
const SEEDS = {
  omega_budget_months: JSON.stringify(STORE),
  omega_investments: JSON.stringify([{ id: 'h1', name: 'ACME', type: 'equity', qty: 10, price: 100, cost: 80, notes: '' }, { id: 'h2', name: 'BOND', type: 'bond', qty: 5, price: 200, cost: 190, notes: '' }]),
  omega_revenue: JSON.stringify([{ id: 'r1', name: 'Retainer', type: 'subscription', monthly: 900, freq: 'monthly', status: 'active' }, { id: 'r2', name: 'Course', type: 'product', monthly: 400, freq: 'monthly', status: 'active' }]),
  omega_treasury_assets: JSON.stringify([{ id: 'a1', name: 'Cash', value: 5000, type: 'liquid' }, { id: 'a2', name: 'House', value: 20000, type: 'illiquid' }]),
  omega_wealth_assets: JSON.stringify({ cash: [{ name: 'Cash', value: 4000 }], invest: [{ name: 'ETF', value: 9000 }], realestate: [{ name: 'Flat', value: 30000 }] })
};
/* page, canvas id, what to click first (text of a tab button) */
const CHARTS = [
  ['expenses.html', 'trend-year-canvas', 'TRENDS'], ['expenses.html', 'trend-rate-canvas', 'TRENDS'],
  ['expenses.html', 'trend-canvas', 'SCIENCE'], ['expenses.html', 'cat-canvas', 'SCIENCE'], ['expenses.html', 'monthly-canvas', 'SCIENCE'],
  ['investment.html', 'alloc-canvas', 'ALLOCATION'], ['revenue.html', 'rev-canvas', 'CHART'], ['treasury.html', 'treasury-canvas', null], ['wealth.html', 'alloc-canvas', null]
];

(async () => {
  const pw = loadPW(); let browser;
  if (pw) for (const exe of [undefined, '/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome']) { try { browser = await pw.chromium.launch(exe ? { executablePath: exe } : {}); break; } catch (e) { } }
  if (!browser || !STUB) { console.log('SKIPPED: no playwright/browser (or the harness Supabase stub) available'); process.exit(process.env.OMEGA_REQUIRE_BROWSER ? 1 : 0); }

  async function measure(page, id, click, dsf) {
    const ctx = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 1000, height: 900 }, deviceScaleFactor: dsf });
    await ctx.route(ORIGIN + '/**', async (route) => {
      let u = decodeURIComponent(new URL(route.request().url()).pathname); if (u === '/') u = '/index.html';
      const f = path.join(ROOT, path.normalize(u).replace(/^(\.\.[/\\])+/, ''));
      if (!f.startsWith(ROOT)) return route.fulfill({ status: 403, body: '' });
      if (u === '/vendor/supabase-js.js') return route.fulfill({ status: 200, contentType: 'text/javascript', body: STUB });
      try { return route.fulfill({ status: 200, contentType: MIME[path.extname(f)] || 'application/octet-stream', body: fs.readFileSync(f) }); } catch (e) { return route.fulfill({ status: 404, body: '' }); }
    });
    await ctx.route('https://esm.sh/**', r => r.fulfill({ status: 200, contentType: 'text/javascript', body: STUB }));
    await ctx.route('https://fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    await ctx.route('https://fonts.gstatic.com/**', r => r.fulfill({ status: 200, body: '' }));
    await ctx.addInitScript((seeds) => { try { localStorage.setItem('omega_demo_watched_at', '2026-01-01T00:00:00Z'); localStorage.setItem('omega_consent_v1', 'all'); localStorage.setItem('omega_genesis_seen', '1'); for (const k in seeds) localStorage.setItem(k, seeds[k]); } catch (e) { } }, SEEDS);
    const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', e => errs.push(String(e.message).slice(0, 120)));
    await pg.goto(ORIGIN + '/' + page, { waitUntil: 'load', timeout: 60000 });
    await pg.waitForTimeout(1200);
    if (click) { await pg.locator('.tab-btn, [role=tab], button').filter({ hasText: click }).first().click({ timeout: 8000 }); await pg.waitForTimeout(700); }
    /* a chart can sit on a tab that is not the default one: try each tab button until the canvas has a box */
    const shown = () => pg.evaluate((i) => { const c = document.getElementById(i); return !!c && c.clientWidth > 0 && c.clientHeight > 0; }, id);
    if (!(await shown())) { const n = await pg.locator('.tab-btn, [role=tab]').count(); for (let k = 0; k < n && !(await shown()); k++) { await pg.locator('.tab-btn, [role=tab]').nth(k).click({ timeout: 4000 }).catch(() => { }); await pg.waitForTimeout(400); } }
    await pg.evaluate((i) => document.getElementById(i).scrollIntoView({ block: 'center', behavior: 'instant' }), id);
    await pg.waitForTimeout(300);
    const m = await pg.evaluate((i) => {
      const c = document.getElementById(i), r = { width: c.clientWidth, height: c.clientHeight }, d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data, W = c.width, H = c.height;
      const bg = [d[0], d[1], d[2], d[3]]; let x0 = W, y0 = H, x1 = -1, y1 = -1, n = 0;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const k = (y * W + x) * 4; if (Math.abs(d[k] - bg[0]) + Math.abs(d[k + 1] - bg[1]) + Math.abs(d[k + 2] - bg[2]) + Math.abs(d[k + 3] - bg[3]) > 30) { n++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
      return { cssW: r.width, cssH: r.height, bw: W, bh: H, painted: n / (W * H), bx0: x0 / W, bx1: (x1 + 1) / W, by0: y0 / H, by1: (y1 + 1) / H };
    }, id);
    await ctx.close(); return Object.assign(m, { errs });
  }

  for (const [page, id, click] of CHARTS) {
    const tag = page.replace('.html', '') + '#' + id;
    let m1, m2, m3;
    try { m1 = await measure(page, id, click, 1); m2 = await measure(page, id, click, 2); m3 = await measure(page, id, click, 3); } catch (e) { check(tag + ': renders', false, String(e.message).slice(0, 160)); continue; }
    check(tag + ': is drawn (not blank)', m1.painted > 0.004 && m2.painted > 0.004, JSON.stringify({ p1: m1.painted, p2: m2.painted }));
    // The page itself lays out a few pixels differently at different device scales (scrollbar, rounding), so compare within 2.5 percent: a canvas that doubled on screen would be off by 100.
    const near = (a, b) => Math.abs(a - b) <= 0.025 * Math.max(a, b) + 1;
    check(tag + ': CSS size is the same at 1x, 2x and 3x (layout unchanged, not doubled)', near(m1.cssW, m2.cssW) && near(m1.cssW, m3.cssW) && near(m1.cssH, m2.cssH) && near(m1.cssH, m3.cssH), JSON.stringify([m1, m2, m3].map(m => [m.cssW, m.cssH])));
    // The invariant: the backing store grows by exactly the device scale relative to 1x (and at 1x it is about the CSS size; treasury's canvas has a 1px border so its content box is 2px under its 600x180 drawing area).
    check(tag + ': the backing store is exactly 2x and 3x what it is at 1x', Math.abs(m2.bw - 2 * m1.bw) <= 2 && Math.abs(m2.bh - 2 * m1.bh) <= 2 && Math.abs(m3.bw - 3 * m1.bw) <= 3 && Math.abs(m3.bh - 3 * m1.bh) <= 3 && near(m1.bw, m1.cssW) && near(m1.bh, m1.cssH), JSON.stringify({ at1: [m1.bw, m1.bh, m1.cssW, m1.cssH], at2: [m2.bw, m2.bh], at3: [m3.bw, m3.bh] }));
    const same = (a, b) => ['bx0', 'bx1', 'by0', 'by1'].every(k => Math.abs(a[k] - b[k]) <= 0.04);
    check(tag + ': what was painted covers the same part of the canvas at every scale (transform applied)', same(m1, m2) && same(m1, m3), JSON.stringify({ x1: [m1.bx0, m1.bx1, m1.by0, m1.by1], x2: [m2.bx0, m2.bx1, m2.by0, m2.by1], x3: [m3.bx0, m3.bx1, m3.by0, m3.by1] }));
    check(tag + ': no page errors', m1.errs.length + m2.errs.length + m3.errs.length === 0, JSON.stringify([m1.errs, m2.errs]));
  }

  await browser.close();
  const bad = results.filter(r => !r.ok);
  results.forEach(r => console.log((r.ok ? 'PASS ' : 'FAIL ') + r.name + (r.ok ? '' : '  -> ' + r.detail)));
  console.log(`\n${results.length - bad.length}/${results.length} passed`);
  process.exit(bad.length ? 1 : 0);
})().catch(e => { console.error('ERROR', e); process.exit(1); });
