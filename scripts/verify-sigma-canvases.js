#!/usr/bin/env node
/* Browser validation that sigma.html's charts are drawn into the box they are shown in, at the screen's density.
 *
 * Usage: node scripts/verify-sigma-canvases.js [--root DIR]      (--root runs the same checks against another checkout, e.g. a worktree of origin/main)
 *
 * Four charts (sigma-axes, sigma-auth-curve, sigma-elem-matrix, sigma-scatter) sit in tabs that are hidden at load. They used to be drawn at
 * `offsetWidth || fallback` (200-500px, 1x) while hidden and then shown 400-860px wide, stretched about 3x sideways. For each of the four, at
 * 1000px@1, 1000px@3 and 390px@3, after opening every tab as a member would:
 *   1. the chart is visible and drawn (it has painted pixels);
 *   2. its backing store is its displayed box x the device pixel ratio on BOTH axes (no stretch, no blur);
 *   3. resizing the window to another width repaints it at the new width (the store follows the box).
 * Files are served from disk through route(). No browser: SKIPPED, exit 0 unless OMEGA_REQUIRE_BROWSER is set.
 */
const fs = require('fs');
const path = require('path');
if (process.argv.includes('--help') || process.argv.includes('-h')) { console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0].replace(/^#!.*\n/, '').replace(/^\/\*\s?/, '')); process.exit(0); }
const ri = process.argv.indexOf('--root');
const ROOT = ri > 0 ? path.resolve(process.argv[ri + 1]) : path.resolve(__dirname, '..');
const ORIGIN = 'https://sg.test';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml' };
const IDS = ['sigma-axes', 'sigma-auth-curve', 'sigma-elem-matrix', 'sigma-scatter'];
function loadPW() { const sp = process.env.OMEGA_SCRATCHPAD; for (const t of [sp && path.join(sp, 'node_modules', 'playwright'), 'playwright', 'playwright-core']) { if (!t) continue; try { return require(t); } catch (e) { } } return null; }
const pw = loadPW();
let STUB = null; try { STUB = require(path.join(__dirname, '..', '.claude', 'skills', 'verify-in-browser', 'harness', 'sbstub.js')).STUB; } catch (e) { }
if (!pw || !STUB) { console.log('SKIPPED: no browser or no harness'); process.exit(process.env.OMEGA_REQUIRE_BROWSER ? 1 : 0); }
const results = [];
const check = (n, ok, d) => results.push({ name: n, ok: !!ok, detail: ok ? undefined : d });
const measure = (ids) => ids.map((id) => {
  const c = document.getElementById(id);
  if (!c) return { id, missing: true };
  const bb = c.getBoundingClientRect();
  let painted = 0;
  try { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; for (let k = 3; k < d.length; k += 4 * 53) if (d[k] > 8) painted++; } catch (e) { painted = -1; }
  return { id, sw: c.width, sh: c.height, bw: Math.round(bb.width), bh: Math.round(bb.height), sx: bb.width ? c.width / bb.width : 0, sy: bb.height ? c.height / bb.height : 0, painted };
});
async function openAllTabs(pg) {
  const n = await pg.evaluate(() => document.querySelectorAll('.tab-btn').length);
  const seen = {};
  for (let t = 0; t < n; t++) {
    await pg.evaluate((t) => { document.querySelectorAll('.tab-btn')[t].click(); }, t);
    await pg.waitForTimeout(500);
    (await pg.evaluate(measure, IDS)).forEach((m) => { if (!m.missing && m.bw > 0 && m.painted > 0) seen[m.id] = m; });
  }
  return seen;
}
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
    await pg.goto(ORIGIN + '/sigma.html', { waitUntil: 'load' });
    await pg.waitForTimeout(2500);
    const seen = await openAllTabs(pg);
    check(tag + ' all four charts become visible and drawn', IDS.every((id) => seen[id]), 'seen: ' + Object.keys(seen).join(','));
    const bad = IDS.filter((id) => seen[id]).map((id) => seen[id]).filter((m) => Math.abs(m.sx - dsf) > 0.06 || Math.abs(m.sy - dsf) > 0.06);
    check(tag + ' each store is its box x ' + dsf + ' on both axes', bad.length === 0, JSON.stringify(bad[0]));
    if (vw >= 700) {
      await pg.setViewportSize({ width: 760, height: 900 });
      await pg.waitForTimeout(700);
      const after = await pg.evaluate(measure, IDS);
      const stale = after.filter((m) => !m.missing && m.bw > 0 && (Math.abs(m.sx - dsf) > 0.06 || Math.abs(m.sy - dsf) > 0.06));
      check(tag + ' after a resize each visible chart is repainted at its new width', stale.length === 0, JSON.stringify(stale[0]));
    }
    await pg.evaluate(() => { document.querySelectorAll('.tab-btn')[1].click(); });  /* the radar lives in the second tab; openAllTabs left the last one open */
    await pg.waitForTimeout(500);
    const radar = await pg.evaluate(() => {
      const c = document.getElementById('sigma-axes');
      if (!c || !c.getBoundingClientRect().width) return null;
      const k = c.width / c.getBoundingClientRect().width;
      const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      let top = 1e9, bot = -1, left = 1e9, right = -1;
      for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 30) { if (y < top) top = y; if (y > bot) bot = y; if (x < left) left = x; if (x > right) right = x; }
      return { top: top / k, bottom: bot / k, left: left / k, right: right / k, w: c.width / k, h: c.height / k };
    });
    check(tag + ' the radar labels are not clipped by the canvas edge', radar && radar.top >= 1 && radar.left >= 1 && radar.bottom <= radar.h - 1 && radar.right <= radar.w - 1, JSON.stringify(radar));
    check(tag + ' no page errors from sigma charts', errs.filter((e) => /sigma|fitBox|cv|canvas/i.test(e)).length === 0, errs.join(' | '));
    await ctx.close();
  }
  await browser.close();
  const failed = results.filter((r) => !r.ok);
  results.forEach((r) => console.log((r.ok ? 'PASS ' : 'FAIL ') + r.name + (r.detail ? '  ' + r.detail : '')));
  console.log(failed.length ? 'FAILED ' + failed.length + '/' + results.length : 'PASSED ' + results.length);
  process.exit(failed.length ? 1 : 0);
})();
