#!/usr/bin/env node
/* Browser validation for the winged-lion 3-D scene (omega-sculpture.js, data-omega-sculpture="lion") on sculpture.html.
 *
 * Usage: node scripts/verify-lion-scene.js [--shots DIR]
 *
 * "It rendered and nothing threw" is not enough for a scene: an earlier version of this one drew a lion head, no errors, and NO WINGS
 * (front-face culling on mirrored feathers). So this reads the canvas pixels: gold must exist out where the wings are, on both sides;
 * the wings must move; under reduced motion they must not; and with WebGL forced off the flat fallback must draw the seal artwork.
 * Software WebGL (SwiftShader) is requested explicitly. No browser: SKIPPED, exit 0 unless OMEGA_REQUIRE_BROWSER is set.
 * Serves files from disk through route() (no http server). Proves the scene's behaviour in a stubbed render, not GPU performance.
 */
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), ORIGIN = 'http://lion.test';
if (process.argv.includes('--help') || process.argv.includes('-h')) { console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0].replace(/^#!.*\n/, '').replace(/^\/\*\s?/, '')); process.exit(0); }
const si = process.argv.indexOf('--shots'); const SHOTS = si > 0 ? process.argv[si + 1] : null;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
function loadPW() { const sp = process.env.OMEGA_SCRATCHPAD; for (const t of [sp && path.join(sp, 'node_modules', 'playwright'), sp && path.join(sp, 'node_modules', 'playwright-core'), 'playwright', 'playwright-core'].filter(Boolean)) { try { return require(t); } catch (e) { } } return null; }
let STUB = null; try { STUB = require(path.join(ROOT, '.claude', 'skills', 'verify-in-browser', 'harness', 'sbstub.js')).STUB; } catch (e) { }
const results = []; const check = (n, ok, d) => results.push({ name: n, ok: !!ok, detail: ok ? undefined : d });

(async () => {
  const pw = loadPW(); let browser;
  const args = ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
  if (pw) for (const exe of [undefined, '/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome']) { try { browser = await pw.chromium.launch({ ...(exe ? { executablePath: exe } : {}), args }); break; } catch (e) { } }
  if (!browser || !STUB) { console.log('SKIPPED: no playwright/browser (or the harness Supabase stub) available'); process.exit(process.env.OMEGA_REQUIRE_BROWSER ? 1 : 0); }

  async function open({ reduce = false, noWebgl = false, viewport = { width: 1280, height: 900 }, mobile = false } = {}) {
    const ctx = await browser.newContext({ serviceWorkers: 'block', viewport, isMobile: mobile, hasTouch: mobile, reducedMotion: reduce ? 'reduce' : 'no-preference' });
    await ctx.route(ORIGIN + '/**', async (route) => {
      let u = decodeURIComponent(new URL(route.request().url()).pathname); if (u === '/') u = '/index.html';
      const f = path.join(ROOT, path.normalize(u).replace(/^(\.\.[/\\])+/, ''));
      if (!f.startsWith(ROOT)) return route.fulfill({ status: 403, body: '' });
      if (u === '/vendor/supabase-js.js') return route.fulfill({ status: 200, contentType: 'text/javascript', body: STUB });
      try { return route.fulfill({ status: 200, contentType: MIME[path.extname(f)] || 'application/octet-stream', body: fs.readFileSync(f) }); } catch (e) { return route.fulfill({ status: 404, body: 'nf' }); }
    });
    await ctx.route('https://esm.sh/**', r => r.fulfill({ status: 200, contentType: 'text/javascript', body: STUB }));
    await ctx.route('https://fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    await ctx.route('https://fonts.gstatic.com/**', r => r.fulfill({ status: 200, body: '' }));
    await ctx.addInitScript((nw) => {
      try { localStorage.setItem('omega_demo_watched_at', '2026-01-01T00:00:00Z'); localStorage.setItem('omega_consent_v1', 'all'); localStorage.setItem('omega_last_gate', '99'); localStorage.setItem('omega_genesis_seen', '1'); } catch (e) { }
      if (nw) { const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, ...a) { return /webgl/i.test(t) ? null : g.call(this, t, ...a); }; }
    }, noWebgl);
    const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', e => errs.push(String(e.message).slice(0, 160)));
    await pg.goto(ORIGIN + '/sculpture.html', { waitUntil: 'load', timeout: 60000 });
    await pg.evaluate(() => document.querySelector('[data-omega-sculpture="lion"]').scrollIntoView({ block: 'center' }));
    return { ctx, pg, errs };
  }
  /* fraction of "lit" (bright) pixels, and their mean redness-over-blueness, inside a rectangle given as fractions of the canvas */
  const region = (pg, x0, y0, x1, y1) => pg.evaluate(([x0, y0, x1, y1]) => {
    const c = document.querySelector('[data-omega-sculpture="lion"] canvas'); const x = c.getContext('2d');
    const X0 = Math.round(c.width * x0), Y0 = Math.round(c.height * y0), W = Math.max(1, Math.round(c.width * (x1 - x0))), H = Math.max(1, Math.round(c.height * (y1 - y0)));
    const d = x.getImageData(X0, Y0, W, H).data; let lit = 0, warm = 0;
    for (let i = 0; i < d.length; i += 4) { if (d[i] + d[i + 1] + d[i + 2] > 240) { lit++; if (d[i] > d[i + 2] + 30) warm++; } }
    return { lit: lit / (d.length / 4), warm: lit ? warm / lit : 0 };
  }, [x0, y0, x1, y1]);
  const snap = (pg) => pg.evaluate(() => { const c = document.querySelector('[data-omega-sculpture="lion"] canvas'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let h = 0; for (let i = 0; i < d.length; i += 97) h = (h * 31 + d[i]) | 0; return h; });
  const waitDrawn = (pg) => pg.waitForFunction(() => { const c = document.querySelector('[data-omega-sculpture="lion"] canvas'); if (!c || !c.width) return false; const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 40) if (d[i] + d[i + 1] + d[i + 2] > 240) n++; return n > 40; }, null, { timeout: 45000 }).then(() => true, () => false);

  /* 1. the scene draws, with gold in the right places: the head at the centre AND a wing on each side */
  {
    const { ctx, pg, errs } = await open();
    const drawn = await waitDrawn(pg);
    check('lion: the scene draws something bright within 45 s', drawn);
    await pg.waitForTimeout(800);
    const head = await region(pg, 0.42, 0.3, 0.58, 0.62), wl = await region(pg, 0.17, 0.2, 0.34, 0.62), wr = await region(pg, 0.66, 0.2, 0.83, 0.62);
    check('lion: gold at the head', head.lit > 0.2 && head.warm > 0.5, head);
    check('lion: a wing on the LEFT (gold well outside the head)', wl.lit > 0.04 && wl.warm > 0.5, wl);
    check('lion: a wing on the RIGHT (gold well outside the head)', wr.lit > 0.04 && wr.warm > 0.5, wr);
    if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await pg.screenshot({ path: path.join(SHOTS, 'lion-desktop.png') }); }
    /* 2. the wings move (half of a 5 s beat apart) */
    const a = await snap(pg); await pg.waitForTimeout(2500); const b = await snap(pg);
    check('lion: the picture changes over half a wing beat', a !== b, { a, b });
    check('lion: no page errors', errs.length === 0, errs);
    await ctx.close();
  }
  /* 3. reduced motion: one still frame */
  {
    const { ctx, pg } = await open({ reduce: true });
    await waitDrawn(pg); await pg.waitForTimeout(800);
    const a = await snap(pg); await pg.waitForTimeout(2500); const b = await snap(pg);
    check('reduced motion: the lion holds one still frame', a === b, { a, b });
    await ctx.close();
  }
  /* 4. mobile: both wings still in frame */
  {
    const { ctx, pg, errs } = await open({ viewport: { width: 375, height: 740 }, mobile: true });
    await waitDrawn(pg); await pg.waitForTimeout(800);
    const wl = await region(pg, 0.02, 0.2, 0.3, 0.62), wr = await region(pg, 0.7, 0.2, 0.98, 0.62);
    const ov = await pg.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    check('mobile 375 px: both wings are inside the canvas, no horizontal overflow', wl.lit > 0.01 && wr.lit > 0.01 && !ov, { wl, wr, ov });
    if (SHOTS) await pg.screenshot({ path: path.join(SHOTS, 'lion-mobile.png') });
    check('mobile: no page errors', errs.length === 0, errs);
    await ctx.close();
  }
  /* 5. no WebGL: the flat seal artwork is drawn instead of a dead box */
  {
    const { ctx, pg, errs } = await open({ noWebgl: true });
    const drawn = await waitDrawn(pg);
    const ring = await region(pg, 0.3, 0.05, 0.7, 0.95);
    check('no WebGL: the flat fallback draws the seal (bright gold present)', drawn && ring.lit > 0.03 && ring.warm > 0.4, { drawn, ring });
    check('no WebGL: no page errors', errs.length === 0, errs);
    await ctx.close();
  }

  await browser.close();
  const failed = results.filter(r => !r.ok);
  results.forEach(r => console.log((r.ok ? 'PASS  ' : 'FAIL  ') + r.name + (r.ok ? '' : '\n      ' + JSON.stringify(r.detail))));
  console.log(`\n${results.length - failed.length}/${results.length} passed`); process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
