#!/usr/bin/env node
/* Browser validation for the Zero-Point Awakening first-visit intro (omega-zero-point.js + the two bg.js hooks).
 *
 * Usage: node scripts/verify-zero-point-intro.js [--shots DIR] [--json]
 *
 * Serves the working tree from disk (Playwright route, no http server) and drives the REAL index.html in headless Chromium. Checks the
 * rendered pixels at fixed times (deterministic, via OmegaZeroPoint.render), natural completion, skip keys,
 * once-per-browser, reduced motion, legacy fallback when the module cannot load, sound opt-in (528 Hz, never
 * autoplays), mobile layout, and zero page errors. With --shots it also writes a PNG per phase for eyeballing.
 * Zero repo deps; resolves playwright from $OMEGA_SCRATCHPAD or a normal require. No browser: prints SKIPPED and
 * exits 0 unless OMEGA_REQUIRE_BROWSER is set. Proves behaviour in a stubbed-network render, not production.
 */
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const JSON_OUT = process.argv.includes('--json');
const si = process.argv.indexOf('--shots'); const SHOTS = si > 0 ? process.argv[si + 1] : null;
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0].replace(/^#!.*\n/, '').replace(/^\/\*\s?/, '')); process.exit(0);
}
function loadPW() {
  const sp = process.env.OMEGA_SCRATCHPAD;
  for (const t of [sp && path.join(sp, 'node_modules', 'playwright'), sp && path.join(sp, 'node_modules', 'playwright-core'), 'playwright', 'playwright-core'].filter(Boolean)) { try { return require(t); } catch (e) { } }
  return null;
}
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
const results = [];
const check = (name, ok, detail) => results.push({ name, ok: !!ok, detail: ok ? undefined : detail });

(async () => {
  const pw = loadPW(); let browser;
  if (pw) for (const exe of [undefined, '/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome']) {
    try { browser = await pw.chromium.launch(exe ? { executablePath: exe } : {}); break; } catch (e) { }
  }
  if (!browser) { console.log('SKIPPED: no playwright/browser available'); process.exit(process.env.OMEGA_REQUIRE_BROWSER ? 1 : 0); }

  /* No http server: files are served from disk through Playwright's route(), on a fake origin. */
  const ORIGIN = 'http://zp.test';
  const serveFromDisk = async (route) => {
    let u = decodeURIComponent(new URL(route.request().url()).pathname); if (u === '/') u = '/index.html';
    const f = path.join(ROOT, path.normalize(u).replace(/^(\.\.[/\\])+/, ''));
    if (!f.startsWith(ROOT)) return route.fulfill({ status: 403, body: '' });
    let b; try { b = fs.readFileSync(f); } catch (e) { return route.fulfill({ status: 404, body: 'nf' }); }
    return route.fulfill({ status: 200, contentType: MIME[path.extname(f)] || 'application/octet-stream', headers: { 'cache-control': 'no-store' }, body: b });
  };

  async function open(opts = {}) {
    const ctx = opts.ctx || await browser.newContext({ serviceWorkers: 'block', viewport: opts.viewport || { width: 1280, height: 720 }, reducedMotion: opts.reduce ? 'reduce' : 'no-preference', isMobile: !!opts.mobile, hasTouch: !!opts.mobile });
    if (!opts.ctx) {
      await ctx.route(ORIGIN + '/**', serveFromDisk);
      await ctx.route('https://fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
      await ctx.route('https://fonts.gstatic.com/**', r => r.fulfill({ status: 200, body: '' }));
      await ctx.addInitScript(() => {
        window.__ac = { made: 0, freq: [] };
        const A = window.AudioContext;
        if (A) window.AudioContext = function () { const c = new A(); window.__ac.made++; const co = c.createOscillator.bind(c); c.createOscillator = () => { const o = co(); const d = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(o.frequency), 'value'); Object.defineProperty(o.frequency, 'value', { set(v) { window.__ac.freq.push(v); d.set.call(o.frequency, v); }, get() { return d.get.call(o.frequency); } }); return o; }; return c; };
      });
    }
    if (opts.blockModule) await ctx.route('**/omega-zero-point.js', r => r.abort('failed'));
    const pg = await ctx.newPage(); const errs = [], reqs = [];
    pg.on('pageerror', e => errs.push(String(e.message).slice(0, 160)));
    pg.on('request', r => { if (/omega-zero-point\.js/.test(r.url())) reqs.push(r.url()); });
    await pg.goto(ORIGIN + '/index.html', { waitUntil: 'domcontentloaded' });
    return { ctx, pg, errs, reqs };
  }
  const present = pg => pg.evaluate(() => !!document.getElementById('omega-genesis'));
  const waitGone = (pg, ms) => pg.waitForFunction(() => !document.getElementById('omega-genesis'), null, { timeout: ms }).then(() => true, () => false);
  /* sample: luminance + redness of the pixel at (fx,fy) as a fraction of the canvas, after drawing frame t */
  const px = (pg, t, fx, fy) => pg.evaluate(([t, fx, fy]) => {
    OmegaZeroPoint.render(t); const c = document.querySelector('#omega-genesis canvas'), x = c.getContext('2d');
    const r = 3, d = x.getImageData(Math.max(0, Math.round(c.width * fx) - r), Math.max(0, Math.round(c.height * fy) - r), r * 2, r * 2).data;
    let R = 0, G = 0, B = 0, n = d.length / 4; for (let i = 0; i < d.length; i += 4) { R += d[i]; G += d[i + 1]; B += d[i + 2]; }
    return { R: R / n, G: G / n, B: B / n, lum: (0.2126 * R + 0.7152 * G + 0.0722 * B) / n };
  }, [t, fx, fy]);
  const litPixels = (pg, t) => pg.evaluate((t) => {
    OmegaZeroPoint.render(t); const c = document.querySelector('#omega-genesis canvas'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] > 120) n++; return n / (d.length / 4);
  }, t);

  /* 1. first visit: overlay + canvas, upgrade took the hold */
  {
    const { ctx, pg, errs, reqs } = await open();
    await pg.waitForFunction(() => window.OmegaZeroPoint && OmegaZeroPoint.active(), null, { timeout: 8000 }).catch(() => { });
    check('first visit: module fetched exactly once and the intro is active', reqs.length === 1 && await pg.evaluate(() => !!(window.OmegaZeroPoint && OmegaZeroPoint.active())), { reqs: reqs.length });
    check('first visit: canvas present, legacy glyph hidden, overlay held', await pg.evaluate(() => { const g = document.getElementById('omega-genesis'); return !!g && !!g.querySelector('canvas') && getComputedStyle(g.querySelector('.gx')).display === 'none' && g.__omegaHold === true; }));
    check('first visit: aria-label set, sound off by default (no AudioContext created)', await pg.evaluate(() => /Escape/.test(document.getElementById('omega-genesis').getAttribute('aria-label')) && window.__ac.made === 0));

    /* 2. deterministic frames */
    const f0 = await px(pg, 300, 0.5, 0.46), f1 = await px(pg, 1100, 0.5, 0.46), f1e = await px(pg, 1100, 0.05, 0.05);
    check('frame 0.3 s: pitch black at the centre', f0.lum < 12, f0);
    check('frame 1.1 s: a single bright point at the centre, black at the edge', f1.lum > 90 && f1e.lum < 12, { f1, f1e });
    const early = await litPixels(pg, 1000), mid = await litPixels(pg, 2400), late = await litPixels(pg, 3300);
    check('pull-back: lit area grows as the field arrives (1.0 s < 2.4 s < 3.3 s)', early < mid && mid < late, { early, mid, late });
    const om = await px(pg, 4300, 0.5, 0.46);
    check('frame 4.3 s: Omega resolved in gold at the centre (R>G>B, bright)', om.lum > 40 && om.R > om.G && om.G > om.B, om);
    const capD = await pg.evaluate(() => { OmegaZeroPoint.render(4300); return OmegaZeroPoint.caption(); });
    check('desktop 1280 px: caption keeps its full 12 px / 6 px styling', capD && capD.fontPx === 12 && capD.spacing === 6 && capD.left >= 15, capD);
    if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); for (const t of [300, 1100, 2200, 3000, 4300]) { await pg.evaluate(t => OmegaZeroPoint.render(t), t); await pg.screenshot({ path: path.join(SHOTS, `zero-point-${String(t).padStart(4, '0')}ms.png`) }); } }

    /* 3. natural completion + once-per-browser flag */
    check('completion: overlay removed on its own and omega_genesis_seen stored', await waitGone(pg, 9000) && await pg.evaluate(() => localStorage.getItem('omega_genesis_seen') === '1'));
    check('no page errors on first visit', errs.length === 0, errs);

    /* 4. second visit in the same browser: no intro, module never requested */
    const second = await open({ ctx });
    await second.pg.waitForTimeout(1500);
    check('second visit: no overlay and omega-zero-point.js not requested', !(await present(second.pg)) && second.reqs.length === 0, { reqs: second.reqs.length });
    await ctx.close();
  }

  /* 5. skip keys */
  for (const key of ['Escape', 'Enter', ' ']) {
    const { ctx, pg } = await open();
    await pg.waitForFunction(() => window.OmegaZeroPoint && OmegaZeroPoint.active(), null, { timeout: 8000 }).catch(() => { });
    await pg.keyboard.press(key);
    check(`skip: ${key === ' ' ? 'Space' : key} ends the intro within 1.5 s`, await waitGone(pg, 1500));
    await ctx.close();
  }

  /* 6. sound: opt-in only, 528 Hz, button does not skip, second tap turns it off */
  {
    const { ctx, pg } = await open();
    await pg.waitForFunction(() => window.OmegaZeroPoint && OmegaZeroPoint.active(), null, { timeout: 8000 }).catch(() => { });
    await pg.click('#omega-genesis button');
    const on = await pg.evaluate(() => ({ made: window.__ac.made, freq: window.__ac.freq.slice(), label: document.querySelector('#omega-genesis button').textContent, still: !!document.getElementById('omega-genesis') }));
    check('sound: a tap creates one AudioContext at 528 Hz and does not skip the intro', on.made === 1 && on.freq.includes(528) && on.label === 'SOUND ON' && on.still, on);
    await pg.click('#omega-genesis button');
    check('sound: second tap turns it off', await pg.evaluate(() => document.querySelector('#omega-genesis button').textContent === 'SOUND OFF'));
    await ctx.close();
  }

  /* 7. reduced motion: no intro at all, no module fetch */
  {
    const { ctx, pg, reqs } = await open({ reduce: true }); await pg.waitForTimeout(1500);
    check('reduced motion: no overlay and no module request', !(await present(pg)) && reqs.length === 0, { reqs: reqs.length });
    await ctx.close();
  }

  /* 8. module cannot load: the legacy intro still plays and ends on its own timer */
  {
    const { ctx, pg, errs } = await open({ blockModule: true });
    await pg.waitForSelector('#omega-genesis .gx', { timeout: 4000 }).catch(() => { });
    const legacy = await pg.evaluate(() => { const g = document.getElementById('omega-genesis'); return !!g && !g.querySelector('canvas') && !g.__omegaHold; });
    check('module blocked: legacy intro shown (no canvas, nothing held)', legacy);
    check('module blocked: legacy intro still ends by itself (~3.1 s + fade)', await waitGone(pg, 6000));
    check('module blocked: failed fetch raises no page error', errs.length === 0, errs);
    await ctx.close();
  }

  /* 9. mobile: canvas fills the viewport, no horizontal overflow, 44 px sound target */
  {
    const { ctx, pg } = await open({ viewport: { width: 375, height: 740 }, mobile: true });
    await pg.waitForFunction(() => window.OmegaZeroPoint && OmegaZeroPoint.active(), null, { timeout: 8000 }).catch(() => { });
    const m = await pg.evaluate(() => { const c = document.querySelector('#omega-genesis canvas'), b = document.querySelector('#omega-genesis button'), r = b.getBoundingClientRect(); return { cw: c.getBoundingClientRect().width, vw: innerWidth, ov: document.documentElement.scrollWidth > innerWidth, bh: r.height, inView: r.right <= innerWidth && r.bottom <= innerHeight }; });
    check('mobile 375 px: canvas = viewport width, no overflow, sound button >= 44 px and on screen', m.cw === m.vw && !m.ov && m.bh >= 44 && m.inView, m);
    const cap = await pg.evaluate(() => { OmegaZeroPoint.render(4300); return OmegaZeroPoint.caption(); });
    check('mobile 375 px: caption fits inside the viewport with a margin (not clipped)', cap && cap.left >= 15 && cap.right <= cap.width - 15, cap);
    if (SHOTS) { await pg.evaluate(() => OmegaZeroPoint.render(4300)); await pg.screenshot({ path: path.join(SHOTS, 'zero-point-mobile-4300ms.png') }); }
    await ctx.close();
  }

  await browser.close();
  const failed = results.filter(r => !r.ok);
  if (JSON_OUT) console.log(JSON.stringify({ passed: results.length - failed.length, failed: failed.length, results }, null, 2));
  else { results.forEach(r => console.log((r.ok ? 'PASS  ' : 'FAIL  ') + r.name + (r.ok ? '' : '\n      ' + JSON.stringify(r.detail)))); console.log(`\n${results.length - failed.length}/${results.length} passed`); }
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
