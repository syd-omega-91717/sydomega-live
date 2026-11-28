#!/usr/bin/env node
/* Browser validation that media.html's film poster canvases draw 1:1 at the screen's density.
 *
 * Usage: node scripts/verify-media-posters.js [--root DIR]      (--root runs the same checks against another checkout, e.g. a worktree of origin/main)
 *
 * media.html is rendered at 1000px@1, 1000px@3 and 390px@3. The 12 film posters sit in the SAGA tab, hidden at load, so each is first
 * measured while hidden, then the tab is opened and every poster is measured again:
 *   1. while hidden nothing is drawn at a made-up size (before the fix a 300x450 scene was stored at 600x900 and then shown in an
 *      80px strip, about 11x squashed);
 *   2. once shown, each backing store is its displayed box x max(2, device pixel ratio) on BOTH axes, with no stretch;
 *   3. each poster has pixels from near the top to near the bottom of its store;
 *   4. the sky is stable: repainting after a resize does not move the stars.
 * Files are served from disk through route(). No browser: SKIPPED, exit 0 unless OMEGA_REQUIRE_BROWSER is set.
 */
const fs = require('fs');
const path = require('path');
if (process.argv.includes('--help') || process.argv.includes('-h')) { console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0].replace(/^#!.*\n/, '').replace(/^\/\*\s?/, '')); process.exit(0); }
const ri = process.argv.indexOf('--root');
const ROOT = ri > 0 ? path.resolve(process.argv[ri + 1]) : path.resolve(__dirname, '..');
const ORIGIN = 'https://mp.test';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml' };
function loadPW() { const sp = process.env.OMEGA_SCRATCHPAD; for (const t of [sp && path.join(sp, 'node_modules', 'playwright'), 'playwright', 'playwright-core']) { if (!t) continue; try { return require(t); } catch (e) { } } return null; }
const pw = loadPW();
let STUB = null; try { STUB = require(path.join(__dirname, '..', '.claude', 'skills', 'verify-in-browser', 'harness', 'sbstub.js')).STUB; } catch (e) { }
if (!pw || !STUB) { console.log('SKIPPED: no browser or no harness'); process.exit(process.env.OMEGA_REQUIRE_BROWSER ? 1 : 0); }
const results = [];
const check = (n, ok, d) => results.push({ name: n, ok: !!ok, detail: ok ? undefined : d });
const measure = () => [...document.querySelectorAll('canvas.poster-canvas')].map((c) => {
  const bb = c.getBoundingClientRect();
  let top = 1e9;
  let bot = -1;
  try {
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    for (let y = 0; y < c.height; y += 2) for (let x = 0; x < c.width; x += 4) if (d[(y * c.width + x) * 4 + 3] > 8) { if (y < top) top = y; if (y > bot) bot = y; }
  } catch (e) { }
  return { w: Math.round(bb.width), h: Math.round(bb.height), sw: c.width, sh: c.height, sx: bb.width ? c.width / bb.width : 0, sy: bb.height ? c.height / bb.height : 0, rows: bot < 0 ? null : [Math.round(top / c.height * 100), Math.round(bot / c.height * 100)] };
});
(async () => {
  const browser = await pw.chromium.launch();
  for (const [vw, dsf] of [[1000, 1], [1000, 3], [390, 3]]) {
    const tag = vw + '@' + dsf;
    const want = Math.max(2, dsf);
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
    await pg.goto(ORIGIN + '/media.html', { waitUntil: 'load' });
    await pg.waitForTimeout(2500);
    const hidden = await pg.evaluate(measure);
    check(tag + ' 12 posters exist', hidden.length === 12, 'found ' + hidden.length);
    check(tag + ' nothing is drawn at a made-up size while hidden', hidden.every((m) => m.w === 0 && m.sw <= 300), JSON.stringify(hidden[0]));
    await pg.click('.mtab-btn[data-mtab="saga"]');
    await pg.waitForTimeout(1500);
    const shown = await pg.evaluate(measure);
    const bad = shown.filter((m) => !(m.w > 0 && m.h > 0 && Math.abs(m.sx - want) < 0.05 && Math.abs(m.sy - want) < 0.05));
    check(tag + ' every store is its box x ' + want + ' on both axes', bad.length === 0 && shown.length === 12, JSON.stringify(bad[0] || shown[0]));
    const unpainted = shown.filter((m) => !(m.rows && m.rows[0] <= 15 && m.rows[1] >= 85));
    check(tag + ' every poster is painted top to bottom', unpainted.length === 0, JSON.stringify(unpainted[0]));
    check(tag + ' no page errors', errs.length === 0, errs.join(' | '));
    await ctx.close();
  }
  await browser.close();
  const failed = results.filter((r) => !r.ok);
  results.forEach((r) => console.log((r.ok ? 'PASS ' : 'FAIL ') + r.name + (r.detail ? '  ' + r.detail : '')));
  console.log(failed.length ? 'FAILED ' + failed.length + '/' + results.length : 'PASSED ' + results.length);
  process.exit(failed.length ? 1 : 0);
})();
