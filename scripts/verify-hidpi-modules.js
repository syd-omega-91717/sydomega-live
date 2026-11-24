#!/usr/bin/env node
/* Browser validation of the three shared modules that draw at the screen's pixel density with their own ratio maths
 * (emblem.js, omega-element-motif.js, omega-lattice-3d.js).  They cannot use omega-canvas-hidpi.js: bg.js injects them on every page.
 *
 * Usage: node scripts/verify-hidpi-modules.js [--root DIR]
 *
 * For each module a page that uses it is loaded at device scale 1, 2.625 and 3 and the canvas, found by selector, is measured:
 *   1. its CSS box is the same at every scale (the module must not change layout);
 *   2. its backing store is the logical size x the scale (rounded), and exactly the logical size at 1x;
 *   3. it is not blank, and what was painted covers the same part of the canvas at every scale (the context carries the scale);
 *   4. no page errors.
 * Files are served from disk through route().  No browser: SKIPPED, exit 0 unless OMEGA_REQUIRE_BROWSER is set.
 */
const fs = require('fs'), path = require('path');
if (process.argv.includes('--help') || process.argv.includes('-h')) { console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0].replace(/^#!.*\n/, '').replace(/^\/\*\s?/, '')); process.exit(0); }
const ri = process.argv.indexOf('--root');
const ROOT = ri > 0 ? path.resolve(process.argv[ri + 1]) : path.resolve(__dirname, '..'), ORIGIN = 'https://hidpi-modules.test';
const HARNESS = path.resolve(__dirname, '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp' };
function loadPW() { const sp = process.env.OMEGA_SCRATCHPAD; for (const t of [sp && path.join(sp, 'node_modules', 'playwright'), sp && path.join(sp, 'node_modules', 'playwright-core'), 'playwright', 'playwright-core']) { if (!t) continue; try { return require(t); } catch (e) { } } return null; }
let STUB = null; try { STUB = require(path.join(HARNESS, '.claude', 'skills', 'verify-in-browser', 'harness', 'sbstub.js')).STUB; } catch (e) { }
const results = []; const check = (n, ok, d) => results.push({ name: n, ok: !!ok, detail: ok ? undefined : d });

/* module, page, selector for the canvas, logical size the module draws in, optional JS to run first (to make the canvas appear) */
const PLANT = "document.addEventListener('DOMContentLoaded',function(){var d=document.createElement('div');d.id='lat-trig';d.setAttribute('data-lattice-3d','');d.setAttribute('data-nodes','5');d.style.cssText='position:fixed;top:0;left:0;width:30px;height:30px;z-index:99999';document.body.appendChild(d);});";
/* [module, page, canvas selector, logical size (null: scale-relative only), JS to run first, JS to run before the page's scripts, 'loose': random content, so compare the span not the exact box] */
const CASES = [
  ['emblem.js', 'architect.html', '#omega-emblem-wrap canvas', [64, 64], null, null, false],
  ['omega-element-motif.js', 'elements.html', '.el-canvas-wrap canvas', [640, 320], null, null, true],
  ['omega-element-motif.js', 'cosmos.html', 'canvas.el-canvas', [200, 90], null, null, true],
  ['omega-lattice-3d.js', 'dashboard.html', '#lattice3d-cv', null, "document.getElementById('lat-trig').click()", PLANT, true],
  /* Authored at 2x (store = 2 x the CSS box at 1x and 2x); above 2x the store grows by dpr/2. c[7] is the expected store for a CSS box and a scale. */
  ['omega-page-emblem.js', 'honors.html', '[data-page-emblem] canvas', null, null, null, true, (css, d) => Math.round(2 * css * Math.max(1, d / 2))],
  /* Header and widget canvases authored at 2x their CSS box (attribute = 2 x style): same rule as above, through OmegaCanvas.fitAttr. */
  ...[['analytics.html', '#apex-cv'], ['automation.html', '#ohb-cv'], ['family.html', '#phb-cv-family'],
    ['identity.html', '#identity-seal'], ['interface-omni.html', '#pgcv_interface_omni'], ['points.html', '#radar-cv'],
    ['profile.html', '#cv-matx'], ['profile.html', '#mat-cv'], ['profile.html', '#phb-cv-character'], ['profile.html', '#av-canvas'],
    ['social.html', '#soc-omega-cv'], ['subscriptions.html', '#sub-cv'], ['triads.html', '#triad-cv']].map(([pg, sel]) => ['fitAttr widget ' + sel, pg, sel, null, null, null, true, (css, d) => Math.round(2 * css * Math.max(1, d / 2))]),
  ['fitAttr widget #mini-radar (a small glyph: same painted region at every scale)', 'analytics.html', '#mini-radar', null, null, null, false, (css, d) => Math.round(2 * css * Math.max(1, d / 2))],
  ['nav.js (brand mark)', 'dashboard.html', '#on-bcv', null, null, null, true, (css, d) => Math.round(88 * Math.max(1, d / 2))]   /* authored 88 for a 44px box; the dock scales it by a transform, so the measured box is not the authored one */
];

(async () => {
  const pw = loadPW(); let browser;
  if (pw) for (const exe of [undefined, '/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome']) { try { browser = await pw.chromium.launch(exe ? { executablePath: exe } : {}); break; } catch (e) { } }
  if (!browser || !STUB) { console.log('SKIPPED: no playwright/browser (or the harness Supabase stub) available'); process.exit(process.env.OMEGA_REQUIRE_BROWSER ? 1 : 0); }

  async function measure(c, dsf) {
    const ctx = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 1000, height: 900 }, deviceScaleFactor: dsf, reducedMotion: 'reduce' });
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
    if (c[5]) await ctx.addInitScript(c[5]);
    await ctx.addInitScript(() => { try { localStorage.setItem('omega_demo_watched_at', '2026-01-01T00:00:00Z'); localStorage.setItem('omega_consent_v1', 'all'); localStorage.setItem('omega_genesis_seen', '1'); } catch (e) { } });
    const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', e => errs.push(String(e.message).slice(0, 120)));
    await pg.goto(ORIGIN + '/' + c[1], { waitUntil: 'load', timeout: 60000 });
    await pg.waitForTimeout(2500);
    if (c[4]) { try { await pg.evaluate(c[4]); } catch (e) { errs.push('trigger: ' + String(e.message).slice(0, 100)); } await pg.waitForTimeout(1500); }
    /* the canvas can be on an inactive pane: give its ancestors a box */
    await pg.evaluate((s) => { for (let e = document.querySelector(s); e; e = e.parentElement) { if (getComputedStyle(e).display === 'none') { e.classList.add('active'); e.style.display = 'block'; } } }, c[2]);
    await pg.waitForTimeout(600);
    const m = await pg.evaluate((s) => {
      const cv = document.querySelector(s); if (!cv) return null;
      const r = cv.getBoundingClientRect(), W = cv.width, H = cv.height, d = cv.getContext('2d').getImageData(0, 0, W, H).data;
      let x0 = W, y0 = H, x1 = -1, y1 = -1, n = 0;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (d[(y * W + x) * 4 + 3] > 8) { n++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
      return { cssW: r.width, cssH: r.height, bw: W, bh: H, painted: n / (W * H), bx0: x0 / W, bx1: (x1 + 1) / W, by0: y0 / H, by1: (y1 + 1) / H };
    }, c[2]);
    await ctx.close(); return m && Object.assign(m, { errs });
  }

  for (const c of CASES) {
    const tag = c[0] + ' on ' + c[1];
    let m1, m3, m26; try { m1 = await measure(c, 1); m26 = await measure(c, 2.625); m3 = await measure(c, 3); } catch (e) { check(tag + ': renders', false, String(e.message).slice(0, 200)); continue; }
    if (!m1 || !m3 || !m26) { check(tag + ': the canvas appears (' + c[2] + ')', false, JSON.stringify({ m1: !!m1, m26: !!m26, m3: !!m3 })); continue; }
    const near = (a, b) => Math.abs(a - b) <= 0.025 * Math.max(a, b) + 1;
    check(tag + ': CSS box is the same at 1x, 2.625x and 3x', near(m1.cssW, m3.cssW) && near(m1.cssH, m3.cssH) && near(m1.cssW, m26.cssW) && near(m1.cssH, m26.cssH), JSON.stringify([m1, m26, m3].map(m => [m.cssW, m.cssH])));
    if (c[7]) {
      const e = (m, d) => c[7](m.cssW, d);
      check(tag + ': the store is 2x the box up to 2x, then dpr/2 more (never blurry, never oversized)', Math.abs(m1.bw - e(m1, 1)) <= 1 && Math.abs(m26.bw - e(m26, 2.625)) <= 1 && Math.abs(m3.bw - e(m3, 3)) <= 1 && Math.abs(m3.bh / m3.bw - m1.bh / m1.bw) < 0.02 && Math.abs(m26.bh / m26.bw - m1.bh / m1.bw) < 0.02, JSON.stringify({ at1: [m1.cssW, m1.bw], at26: [m26.cssW, m26.bw], at3: [m3.cssW, m3.bw] }));
    } else if (c[3]) {
      check(tag + ': the store is the logical size at 1x', m1.bw === c[3][0] && m1.bh === c[3][1], JSON.stringify([m1.bw, m1.bh]));
      check(tag + ': the store is logical x 3 at 3x and x 2.625 at 2.625x', m3.bw === Math.round(c[3][0] * 3) && m3.bh === Math.round(c[3][1] * 3) && Math.abs(m26.bw - c[3][0] * 2.625) <= 1.5 && Math.abs(m26.bh - c[3][1] * 2.625) <= 1.5, JSON.stringify({ at3: [m3.bw, m3.bh], at26: [m26.bw, m26.bh] }));
    } else {
      check(tag + ': the store is exactly 3x and 2.625x the 1x store', Math.abs(m3.bw - 3 * m1.bw) <= 3 && Math.abs(m3.bh - 3 * m1.bh) <= 3 && Math.abs(m26.bw - 2.625 * m1.bw) <= 3 && Math.abs(m26.bh - 2.625 * m1.bh) <= 3, JSON.stringify({ at1: [m1.bw, m1.bh], at26: [m26.bw, m26.bh], at3: [m3.bw, m3.bh] }));
    }
    check(tag + ': it is drawn (not blank)', m1.painted > 0.003 && m3.painted > 0.003, JSON.stringify({ p1: m1.painted, p3: m3.painted }));
    const same = (a, b) => ['bx0', 'bx1', 'by0', 'by1'].every(k => Math.abs(a[k] - b[k]) <= 0.05);
    const span = m => (m.bx1 - m.bx0) >= 0.4 && (m.by1 - m.by0) >= 0.3;   /* random embers differ between loads; a missing transform would confine the drawing to a corner (1/3 of the width at 3x) */
    check(tag + (c[6] ? ': what was painted spans the canvas at every scale (the context carries the scale)' : ': what was painted covers the same part of the canvas (the context carries the scale)'), c[6] ? (span(m1) && span(m3) && span(m26)) : (same(m1, m3) && same(m1, m26)), JSON.stringify({ x1: [m1.bx0, m1.bx1, m1.by0, m1.by1], x3: [m3.bx0, m3.bx1, m3.by0, m3.by1] }));
    check(tag + ': no page errors', m1.errs.length + m3.errs.length + m26.errs.length === 0, JSON.stringify([m1.errs, m3.errs]));
  }

  await browser.close();
  const bad = results.filter(r => !r.ok);
  results.forEach(r => console.log((r.ok ? 'PASS ' : 'FAIL ') + r.name + (r.ok ? '' : '  -> ' + r.detail)));
  console.log(`\n${results.length - bad.length}/${results.length} passed`);
  process.exit(bad.length ? 1 : 0);
})().catch(e => { console.error('ERROR', e); process.exit(1); });
