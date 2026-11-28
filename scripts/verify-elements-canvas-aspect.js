#!/usr/bin/env node
/* Browser validation that elements.html's element-motif canvases are not stretched.
 *
 * Usage: node scripts/verify-elements-canvas-aspect.js [--root DIR]      (--root runs the same checks against another checkout, e.g. a worktree of origin/main)
 *
 * Each of the nine cards draws its motif on a canvas authored 640x320 (2:1), displayed in a box that is 100% wide and 160px tall (2.75:1 at a
 * 440px card), so before the fix the art was stretched about 1.4x sideways. For each canvas, at 1000px@1, 1000px@3 and 390px@3:
 *   1. there are nine of them and each has a backing store (a 2:1 store at the screen's density);
 *   2. the displayed art keeps the store's aspect: either the box already has that aspect, or object-fit is contain (or scale-down);
 *   3. the store is at least the box's width x the pixel ratio, so it is not blurry.
 * Files are served from disk through route(). No browser: SKIPPED, exit 0 unless OMEGA_REQUIRE_BROWSER is set.
 */
const fs = require('fs');
const path = require('path');
if (process.argv.includes('--help') || process.argv.includes('-h')) { console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0].replace(/^#!.*\n/, '').replace(/^\/\*\s?/, '')); process.exit(0); }
const ri = process.argv.indexOf('--root');
const ROOT = ri > 0 ? path.resolve(process.argv[ri + 1]) : path.resolve(__dirname, '..');
const ORIGIN = 'https://ea.test';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml' };
function loadPW() { const sp = process.env.OMEGA_SCRATCHPAD; for (const t of [sp && path.join(sp, 'node_modules', 'playwright'), 'playwright', 'playwright-core']) { if (!t) continue; try { return require(t); } catch (e) { } } return null; }
const pw = loadPW();
let STUB = null; try { STUB = require(path.join(__dirname, '..', '.claude', 'skills', 'verify-in-browser', 'harness', 'sbstub.js')).STUB; } catch (e) { }
if (!pw || !STUB) { console.log('SKIPPED: no browser or no harness'); process.exit(process.env.OMEGA_REQUIRE_BROWSER ? 1 : 0); }
const results = [];
const check = (n, ok, d) => results.push({ name: n, ok: !!ok, detail: ok ? undefined : d });
const measure = () => [...document.querySelectorAll('.el-canvas-wrap canvas')].map((c) => {
  const bb = c.getBoundingClientRect();
  return { sw: c.width, sh: c.height, bw: Math.round(bb.width), bh: Math.round(bb.height), fit: getComputedStyle(c).objectFit };
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
    await pg.goto(ORIGIN + '/elements.html', { waitUntil: 'load' });
    await pg.waitForTimeout(3000);
    const m = await pg.evaluate(measure);
    check(tag + ' nine motif canvases exist and are sized', m.length === 9 && m.every((c) => c.sw > 0 && c.sh > 0 && c.bw > 0 && c.bh > 0), JSON.stringify(m[0]));
    const stretched = m.filter((c) => {
      const storeAspect = c.sw / c.sh;
      const boxAspect = c.bw / c.bh;
      const keeps = Math.abs(storeAspect - boxAspect) / storeAspect < 0.03 || c.fit === 'contain' || c.fit === 'scale-down';
      return !keeps;
    });
    check(tag + ' the displayed art keeps the store aspect (no stretch)', stretched.length === 0 && m.length === 9, JSON.stringify(stretched[0] || m[0]));
    const blurry = m.filter((c) => c.sw < c.bw * dsf * 0.99 && c.sw < 640 * dsf * 0.99);
    check(tag + ' the store is not below the screen density', blurry.length === 0, JSON.stringify(blurry[0]));
    check(tag + ' no page errors', errs.length === 0, errs.join(' | '));
    await ctx.close();
  }
  await browser.close();
  const failed = results.filter((r) => !r.ok);
  results.forEach((r) => console.log((r.ok ? 'PASS ' : 'FAIL ') + r.name + (r.detail ? '  ' + r.detail : '')));
  console.log(failed.length ? 'FAILED ' + failed.length + '/' + results.length : 'PASSED ' + results.length);
  process.exit(failed.length ? 1 : 0);
})();
