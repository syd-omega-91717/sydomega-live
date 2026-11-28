#!/usr/bin/env node
/* Scan the root pages for a graphic inside a link or button that is displayed at a different aspect than it was sized for.
 *
 * Usage: node scripts/scan-link-graphics.js [--root DIR] [--pages a.html,b.html] [--json FILE]      exit 1 when any is found
 *
 * Why: omega-accessibility-audit.css pads every a[href] to a 44px touch target, and bg.js caps every canvas/img/svg at max-width:100%. A graphic with a fixed
 * size inside a fixed-size link is then squeezed: the sidebar brand emblem was displayed 12x44 from a 44x44 request on every desktop page (docs/fixes/2026-11-28-nav-brand-emblem-squeezed.md).
 * For each canvas, img and svg inside a[href], button or [role=button] that has a declared size (inline style, else width/height attributes) and a visible box,
 * it compares the declared aspect with the displayed one and reports a difference over 4%. Measured at 1280 px wide, signed in, at load only: it does not open tabs,
 * hover, or look at phone widths, and it cannot see a graphic with no declared size. A result of 0 is only believable after a positive control: run it with --root on a
 * checkout from before the fix (e.g. `git worktree add <dir> 100c5ec0d`) and it must flag #on-bcv. Files are served from disk through route(). No browser: SKIPPED, exit 0
 * unless OMEGA_REQUIRE_BROWSER is set. About 3 s a page. */
const fs = require('fs'), path = require('path');

const argv = process.argv.slice(2), opt = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : null; };
if (argv.includes('--help') || argv.includes('-h')) { console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0].replace(/^#!.*\n/, '').replace(/^\/\*\s?/, '')); process.exit(0); }
const ROOT = path.resolve(opt('--root') || path.resolve(__dirname, '..')), OUT = opt('--json');
const ORIGIN = 'https://sq.test';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml' };
function loadPW() { const sp = process.env.OMEGA_SCRATCHPAD; for (const t of [sp && path.join(sp, 'node_modules', 'playwright'), 'playwright', 'playwright-core']) { if (!t) continue; try { return require(t); } catch (e) { } } return null; }
const pw = loadPW();
let BASE = null; try { BASE = require(path.join(__dirname, '..', '.claude', 'skills', 'verify-in-browser', 'harness', 'sbstub.js')).STUB; } catch (e) { }
if (!pw || !BASE) { console.log('SKIPPED: no browser or no harness'); process.exit(process.env.OMEGA_REQUIRE_BROWSER ? 1 : 0); }
const pages = opt('--pages') ? opt('--pages').split(',') : fs.readdirSync(ROOT).filter((f) => f.endsWith('.html')).sort();
const measure = () => {
  const out = [];
  document.querySelectorAll('a[href] canvas, button canvas, [role=button] canvas, a[href] img, button img, a[href] svg, button svg').forEach((el) => {
    const b = el.getBoundingClientRect();
    if (!(b.width > 0 && b.height > 0)) return;
    // the size the author asked for: inline style first, then width/height attributes
    const sw = parseFloat(el.style.width) || parseFloat(el.getAttribute('width')) || 0;
    const sh = parseFloat(el.style.height) || parseFloat(el.getAttribute('height')) || 0;
    if (!(sw > 0 && sh > 0)) return;
    const asked = sw / sh, shown = b.width / b.height;
    if (Math.abs(asked - shown) / asked > 0.04) {
      out.push({ tag: el.tagName, id: el.id || '', cls: (el.getAttribute('class') && el.getAttribute('class').baseVal === undefined ? el.getAttribute('class') : '').slice(0, 30), asked: sw + 'x' + sh, shown: b.width.toFixed(1) + 'x' + b.height.toFixed(1), parent: el.parentElement ? el.parentElement.tagName + '.' + String(el.parentElement.className && el.parentElement.className.baseVal === undefined ? el.parentElement.className : '').slice(0, 24) : '' });
    }
  });
  return out;
};
(async () => {
  const browser = await pw.chromium.launch();
  const res = {};
  for (const f of pages) {
    const key = f.replace(/\.html$/, '');
    const ctx = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
    await ctx.route(ORIGIN + '/**', async (r) => {
      const u = decodeURIComponent(new URL(r.request().url()).pathname);
      if (u === '/vendor/supabase-js.js') return r.fulfill({ status: 200, contentType: 'text/javascript', body: BASE });
      const p = path.join(ROOT, path.normalize(u).replace(/^(\.\.[/\\])+/, ''));
      if (!p.startsWith(ROOT)) return r.fulfill({ status: 404, body: '' });
      try { r.fulfill({ status: 200, contentType: MIME[path.extname(p)] || 'application/octet-stream', body: fs.readFileSync(p) }); } catch (e) { r.fulfill({ status: 404, body: '' }); }
    });
    await ctx.route('https://esm.sh/**', (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: BASE }));
    await ctx.route('https://fonts.g*/**', (r) => r.fulfill({ status: 200, body: '' }));
    await ctx.addInitScript(() => { try { localStorage.setItem('omega_demo_watched_at', '2026-01-01T00:00:00Z'); localStorage.setItem('omega_consent_v1', 'all'); localStorage.setItem('omega_genesis_seen', '1'); } catch (e) { } });
    const pg = await ctx.newPage();
    try {
      await Promise.race([(async () => {
        await pg.goto(ORIGIN + '/' + f, { waitUntil: 'load', timeout: 20000 });
        await pg.waitForTimeout(1800);
        res[key] = await pg.evaluate(measure);
      })(), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 30000))]);
    } catch (e) { res[key] = { error: String(e.message).slice(0, 60) }; }
    try { await Promise.race([ctx.close(), new Promise((r) => setTimeout(r, 4000))]); } catch (e) { }
  }
  await browser.close();
  if (OUT) fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
  const hits = Object.entries(res).filter(([, v]) => Array.isArray(v) && v.length), errs = Object.entries(res).filter(([, v]) => !Array.isArray(v));
  hits.forEach(([k, v]) => v.forEach((e) => console.log('SQUEEZED ' + k + ' ' + e.tag + (e.id ? '#' + e.id : '') + ' in ' + e.parent + ': asked ' + e.asked + ', shown ' + e.shown)));
  errs.forEach(([k, v]) => console.log('ERROR ' + k + ' ' + v.error));
  console.log('SCANNED ' + Object.keys(res).length + ' pages, ' + hits.reduce((n, [, v]) => n + v.length, 0) + ' squeezed graphic(s), ' + errs.length + ' error(s)');
  process.exit(hits.length || errs.length ? 1 : 0);
})();
