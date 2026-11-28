#!/usr/bin/env node
/* Browser validation that series.html's zodiac emblems (the canvases that replace the glyph in each BY TRACK / BY ELEMENT row) are not squeezed.
 *
 * Usage: node scripts/verify-series-emblems.js [--root DIR]      (--root runs the same checks against another checkout, e.g. a worktree of origin/main)
 *
 * An emblem module swaps each .by-sign glyph for a canvas sized 34x34 (inline style), but the row's .by-sign box was 28px wide and bg.js's
 * canvas{max-width:100%} capped the canvas to that box, so it was displayed 28x34 (about 18% too narrow) from a square 68x68 store. For every
 * emblem canvas that appears after opening every tab, at 1000px@1, 1000px@3 and 390px@3:
 *   1. its displayed box is square (the aspect of its store) and as big as the size the module asked for;
 *   2. its backing store is its box x the pixel ratio or better (it is not blurry).
 * Files are served from disk through route(). No browser: SKIPPED, exit 0 unless OMEGA_REQUIRE_BROWSER is set.
 */
const fs = require('fs');
const path = require('path');
if (process.argv.includes('--help') || process.argv.includes('-h')) { console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0].replace(/^#!.*\n/, '').replace(/^\/\*\s?/, '')); process.exit(0); }
const ri = process.argv.indexOf('--root');
const ROOT = ri > 0 ? path.resolve(process.argv[ri + 1]) : path.resolve(__dirname, '..');
const ORIGIN = 'https://se.test';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml' };
function loadPW() { const sp = process.env.OMEGA_SCRATCHPAD; for (const t of [sp && path.join(sp, 'node_modules', 'playwright'), 'playwright', 'playwright-core']) { if (!t) continue; try { return require(t); } catch (e) { } } return null; }
const pw = loadPW();
let STUB = null; try { STUB = require(path.join(__dirname, '..', '.claude', 'skills', 'verify-in-browser', 'harness', 'sbstub.js')).STUB; } catch (e) { }
if (!pw || !STUB) { console.log('SKIPPED: no browser or no harness'); process.exit(process.env.OMEGA_REQUIRE_BROWSER ? 1 : 0); }
const results = [];
const check = (n, ok, d) => results.push({ name: n, ok: !!ok, detail: ok ? undefined : d });
const emblems = () => [...document.querySelectorAll('.by-sign canvas')].map((c, i) => {
  const bb = c.getBoundingClientRect();
  const asked = parseFloat(c.style.width) || 0;
  return { i, sw: c.width, sh: c.height, bw: +bb.width.toFixed(1), bh: +bb.height.toFixed(1), asked, visible: bb.width > 0 && bb.height > 0 };
});
(async () => {
  const browser = await pw.chromium.launch();
  for (const [vw, dsf] of [[1000, 1], [1000, 3], [390, 3]]) {
    const tag = vw + '@' + dsf;
    const ctx = await browser.newContext({ serviceWorkers: 'block', viewport: { width: vw, height: 900 }, deviceScaleFactor: dsf, isMobile: vw < 700, hasTouch: vw < 700 });
    await ctx.route(ORIGIN + '/**', async (r) => {
      const u = decodeURIComponent(new URL(r.request().url()).pathname);
      if (u === '/vendor/supabase-js.js') return r.fulfill({ status: 200, contentType: 'text/javascript', body: STUB });
      const f = path.join(ROOT, path.normalize(u).replace(/^(\.\.[/\\])+/, ''));
      if (!f.startsWith(ROOT)) return r.fulfill({ status: 404, body: '' });
      try { r.fulfill({ status: 200, contentType: MIME[path.extname(f)] || 'application/octet-stream', body: fs.readFileSync(f) }); } catch (e) { r.fulfill({ status: 404, body: '' }); }
    });
    await ctx.route('https://esm.sh/**', (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: STUB }));
    await ctx.route('https://fonts.g*/**', (r) => r.fulfill({ status: 200, body: '' }));
    await ctx.addInitScript(() => { try { localStorage.setItem('omega_demo_watched_at', '2026-01-01T00:00:00Z'); localStorage.setItem('omega_consent_v1', 'all'); localStorage.setItem('omega_genesis_seen', '1'); } catch (e) { } });
    const pg = await ctx.newPage();
    const errs = [];
    pg.on('pageerror', (e) => errs.push(String(e.message).slice(0, 90)));
    await pg.goto(ORIGIN + '/series.html', { waitUntil: 'load' });
    await pg.waitForTimeout(2500);
    const n = await pg.evaluate(() => document.querySelectorAll('.tab-btn').length);
    const seen = new Map();
    for (let t = 0; t < n; t++) {
      await pg.evaluate((t) => { document.querySelectorAll('.tab-btn')[t].click(); }, t);
      await pg.waitForTimeout(1500);
      (await pg.evaluate(emblems)).forEach((e) => { if (e.visible) seen.set(t + ':' + e.i, e); });
    }
    const list = [...seen.values()];
    check(tag + ' emblem canvases appear in the tabs', list.length >= 4, 'found ' + list.length);
    const squeezed = list.filter((e) => Math.abs(e.bw - e.bh) > 0.6 || (e.asked && Math.abs(e.bw - e.asked) > 0.6));
    check(tag + ' every emblem is displayed square at the size the module asked for', squeezed.length === 0 && list.length >= 4, JSON.stringify(squeezed[0] || list[0]));
    const blurry = list.filter((e) => e.sw < e.bw * Math.min(dsf, 2) * 0.99);
    check(tag + ' every emblem store is not below the screen density', blurry.length === 0, JSON.stringify(blurry[0]));
    check(tag + ' no page errors', errs.length === 0, errs.join(' | '));
    await ctx.close();
  }
  await browser.close();
  const failed = results.filter((r) => !r.ok);
  results.forEach((r) => console.log((r.ok ? 'PASS ' : 'FAIL ') + r.name + (r.detail ? '  ' + r.detail : '')));
  console.log(failed.length ? 'FAILED ' + failed.length + '/' + results.length : 'PASSED ' + results.length);
  process.exit(failed.length ? 1 : 0);
})();
