#!/usr/bin/env node
/* Browser validation that the sidebar brand emblem (nav.js #on-bcv) is displayed square, on a spread of pages and widths.
 *
 * Usage: node scripts/verify-nav-brand-emblem.js [--root DIR]      (--root runs the same checks against another checkout, e.g. a worktree of origin/main)
 *
 * omega-accessibility-audit.css pads every a[href] to a 44px touch target (15px each side at 14px type). The brand link is a 44px box with a 1px
 * ring, so that padding left 12px of content and bg.js's canvas{max-width:100%} squeezed the 88x88 emblem to 12x44 on every desktop page. For each page at
 * 1000px and 1400px wide (the sidebar is hidden below that on phones, where the canvas is 0x0 by design):
 *   1. the emblem's displayed box is square;
 *   2. it fills the link's content box (it is not shrunk further than the ring requires);
 *   3. its store is at least its box x min(pixel ratio, 2).
 * Files are served from disk through route(). No browser: SKIPPED, exit 0 unless OMEGA_REQUIRE_BROWSER is set.
 */
const fs = require('fs');
const path = require('path');
if (process.argv.includes('--help') || process.argv.includes('-h')) { console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0].replace(/^#!.*\n/, '').replace(/^\/\*\s?/, '')); process.exit(0); }
const ri = process.argv.indexOf('--root');
const ROOT = ri > 0 ? path.resolve(process.argv[ri + 1]) : path.resolve(__dirname, '..');
const ORIGIN = 'https://nb.test';
const PAGES = ['gaming', 'series', 'dashboard'];
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml' };
function loadPW() { const sp = process.env.OMEGA_SCRATCHPAD; for (const t of [sp && path.join(sp, 'node_modules', 'playwright'), 'playwright', 'playwright-core']) { if (!t) continue; try { return require(t); } catch (e) { } } return null; }
const pw = loadPW();
let STUB = null; try { STUB = require(path.join(__dirname, '..', '.claude', 'skills', 'verify-in-browser', 'harness', 'sbstub.js')).STUB; } catch (e) { }
if (!pw || !STUB) { console.log('SKIPPED: no browser or no harness'); process.exit(process.env.OMEGA_REQUIRE_BROWSER ? 1 : 0); }
const results = [];
const check = (n, ok, d) => results.push({ name: n, ok: !!ok, detail: ok ? undefined : d });
(async () => {
  const browser = await pw.chromium.launch();
  for (const [vw, dsf] of [[1000, 1], [1400, 2]]) {
    const ctx = await browser.newContext({ serviceWorkers: 'block', viewport: { width: vw, height: 900 }, deviceScaleFactor: dsf });
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
    for (const page of PAGES) {
      const tag = page + '@' + vw + 'x' + dsf;
      const pg = await ctx.newPage();
      const errs = [];
      pg.on('pageerror', (e) => errs.push(String(e.message).slice(0, 90)));
      await pg.goto(ORIGIN + '/' + page + '.html', { waitUntil: 'load' });
      await pg.waitForTimeout(2500);
      const m = await pg.evaluate(() => {
        const c = document.getElementById('on-bcv');
        if (!c) return null;
        const b = c.getBoundingClientRect(), p = c.parentElement, cs = getComputedStyle(p);
        const inner = p.getBoundingClientRect().width - parseFloat(cs.borderLeftWidth) - parseFloat(cs.borderRightWidth) - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
        return { w: +b.width.toFixed(1), h: +b.height.toFixed(1), inner: +inner.toFixed(1), sw: c.width, sh: c.height };
      });
      check(tag + ' emblem canvas exists', m, 'missing');
      if (m) {
        check(tag + ' emblem is displayed square', Math.abs(m.w - m.h) <= 0.6, JSON.stringify(m));
        check(tag + ' emblem fills the link content box', m.w >= m.inner - 0.6, JSON.stringify(m));
        check(tag + ' emblem store is not below the screen density', m.sw >= m.w * Math.min(dsf, 2) * 0.99 && m.sh >= m.h * Math.min(dsf, 2) * 0.99, JSON.stringify(m));
      }
      check(tag + ' no page errors', errs.length === 0, errs.join(' | '));
      await pg.close();
    }
    await ctx.close();
  }
  await browser.close();
  const failed = results.filter((r) => !r.ok);
  results.forEach((r) => console.log((r.ok ? 'PASS ' : 'FAIL ') + r.name + (r.detail ? '  ' + r.detail : '')));
  console.log(failed.length ? 'FAILED ' + failed.length + '/' + results.length : 'PASSED ' + results.length);
  process.exit(failed.length ? 1 : 0);
})();
