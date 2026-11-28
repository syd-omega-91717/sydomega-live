#!/usr/bin/env node
/* Browser validation of the Agent Reels tab on trailers.html (omega-reels.js).
 *
 * Usage: node scripts/verify-reels.js [--root DIR]
 *
 * The reels mount inside a tab that is hidden at load, which is exactly where this repo's class-3 bug lives (measuring a box before it is visible reads 0). So it checks:
 *  1. at load the panel is hidden and the reel has measured nothing (no zero-size store); after opening the tab it draws, at the screen's density, 16:9, painted;
 *  2. there are twelve chips, one per agent, and each agent's reel is different on screen and names that agent and its domains for a screen reader;
 *  3. it animates (two times draw different pixels), plays on its own, the scrubber seeks exactly and pauses;
 *  4. reduced motion: no autoplay, a composed still;
 *  5. a 390 px phone: no horizontal overflow, the canvas fits;
 *  6. if omega-agents.json cannot be fetched, the tab says so and shows nothing in its place (CLAUDE.md: no silent empty state, no invented data);
 *  7. no page errors.
 * Files are served from disk through route(). No browser: SKIPPED, exit 0 unless OMEGA_REQUIRE_BROWSER is set. */
const fs = require('fs');
const path = require('path');
if (process.argv.includes('--help') || process.argv.includes('-h')) { console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0].replace(/^#!.*\n/, '').replace(/^\/\*\s?/, '')); process.exit(0); }
const ri = process.argv.indexOf('--root');
const ROOT = ri > 0 ? path.resolve(process.argv[ri + 1]) : path.resolve(__dirname, '..');
const ORIGIN = 'https://rl.test';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml' };
function loadPW() { const sp = process.env.OMEGA_SCRATCHPAD; for (const t of [sp && path.join(sp, 'node_modules', 'playwright'), 'playwright', 'playwright-core']) { if (!t) continue; try { return require(t); } catch (e) { } } return null; }
const pw = loadPW();
let STUB = null; try { STUB = require(path.join(__dirname, '..', '.claude', 'skills', 'verify-in-browser', 'harness', 'sbstub.js')).STUB; } catch (e) { }
if (!pw || !STUB) { console.log('SKIPPED: no browser or no harness'); process.exit(process.env.OMEGA_REQUIRE_BROWSER ? 1 : 0); }
const AGENTS = JSON.parse(fs.readFileSync(path.join(ROOT, 'omega-agents.json'), 'utf8')).agents;
const results = [];
const check = (n, ok, d) => results.push({ name: n, ok: !!ok, detail: ok ? undefined : d });

async function open(browser, o, failAgents) {
  const ctx = await browser.newContext(Object.assign({ serviceWorkers: 'block', viewport: { width: 1100, height: 900 }, deviceScaleFactor: 2 }, o || {}));
  await ctx.route(ORIGIN + '/**', async (r) => {
    const u = decodeURIComponent(new URL(r.request().url()).pathname);
    if (u === '/vendor/supabase-js.js') return r.fulfill({ status: 200, contentType: 'text/javascript', body: STUB });
    if (failAgents && u === '/omega-agents.json') return r.fulfill({ status: 500, body: 'no' });
    const f = path.join(ROOT, path.normalize(u).replace(/^(\.\.[/\\])+/, ''));
    if (!f.startsWith(ROOT)) return r.fulfill({ status: 404, body: '' });
    try { r.fulfill({ status: 200, contentType: MIME[path.extname(f)] || 'application/octet-stream', body: fs.readFileSync(f) }); } catch (e) { r.fulfill({ status: 404, body: '' }); }
  });
  await ctx.route('https://esm.sh/**', (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: STUB }));
  await ctx.route('https://fonts.g*/**', (r) => r.fulfill({ status: 200, body: '' }));
  await ctx.addInitScript(() => { try { localStorage.setItem('omega_demo_watched_at', '2026-01-01T00:00:00Z'); localStorage.setItem('omega_consent_v1', 'all'); localStorage.setItem('omega_genesis_seen', '1'); } catch (e) { } });
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', (e) => errs.push(String(e.message).slice(0, 120)));
  await pg.goto(ORIGIN + '/trailers.html', { waitUntil: 'load' });
  await pg.waitForTimeout(2500);
  return { ctx, pg, errs };
}
const openTab = (pg) => pg.evaluate(() => { [...document.querySelectorAll('.tab-btn')].find((b) => /AGENT REELS/.test(b.textContent)).click(); });
const sig = (pg) => pg.evaluate(() => { const c = document.querySelector('.rl-canvas'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let h = 0, seen = new Set(); for (let i = 0; i < d.length; i += 4 * 211) { h = (Math.imul(h, 31) + d[i] + d[i + 1] * 3 + d[i + 2] * 7) >>> 0; seen.add(d[i] + ',' + d[i + 1] + ',' + d[i + 2]); } return { h, colours: seen.size }; });
const st = (pg) => pg.evaluate(() => window.OmegaReelsInstance.state());
const frame = (pg) => pg.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

(async () => {
  const browser = await pw.chromium.launch();

  {
    const { ctx, pg, errs } = await open(browser);
    const before = await pg.evaluate(() => ({ visible: document.getElementById('tp-reels').offsetWidth > 0, w: window.OmegaReelsInstance ? window.OmegaReelsInstance.state().w : -1, chips: document.querySelectorAll('.rl-chip').length }));
    check('at load the reels tab is hidden and nothing was measured at zero size', !before.visible && before.w === 0 && before.chips === 12, JSON.stringify(before));
    await openTab(pg); await pg.waitForTimeout(800); await frame(pg);
    const box = await pg.evaluate(() => { const c = document.querySelector('.rl-canvas'), b = c.getBoundingClientRect(); return { w: Math.round(b.width), h: Math.round(b.height), sw: c.width, sh: c.height, aspect: +(b.width / b.height).toFixed(2) }; });
    check('after opening the tab the canvas has a real box', box.w > 300 && box.h > 150, JSON.stringify(box));
    check('canvas is 16:9', Math.abs(box.aspect - 16 / 9) < 0.03, JSON.stringify(box));
    check('canvas store is the box x the pixel ratio', box.sw >= box.w * 2 - 2 && box.sh >= box.h * 2 - 2, JSON.stringify(box));
    await pg.evaluate(() => window.OmegaReelsInstance.seek(8)); await frame(pg);
    const s8 = await sig(pg);
    check('the reel is painted (not a flat fill)', s8.colours > 15, JSON.stringify(s8));
    await pg.evaluate(() => window.OmegaReelsInstance.seek(3)); await frame(pg);
    const s3 = await sig(pg);
    /* the whole logical frame must land on the canvas: the bottom bar's label (left) and clock (right) are both drawn and visible. A draw() that reset the transform
       cropped them off the canvas and every other check still passed. */
    await pg.evaluate(() => window.OmegaReelsInstance.seek(9)); await frame(pg);
    const edge = await pg.evaluate(() => { const c = document.querySelector('.rl-canvas'), x = c.getContext('2d'), k = c.width / 960, bar = 540 * 0.085, y0 = Math.round((540 - bar) * k) + 2, h = Math.round(bar * k) - 4;
      const lit = (a, b) => { const d = x.getImageData(Math.round(a * k), y0, Math.round((b - a) * k), h).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] > 120) n++; return n; };
      const tb = x.getImageData(0, 0, c.width, Math.round(bar * k) - 2).data; let top = 0; for (let i = 0; i < tb.length; i += 4) if (tb[i] + tb[i + 1] + tb[i + 2] > 60) top++;
      return { label: lit(10, 420), clock: lit(600, 950), letterboxTopClean: top === 0 }; });
    check('the label that says "not footage" is visible in the bottom bar, and so is the clock (the frame is not cropped)', edge.label > 40 && edge.clock > 40 && edge.letterboxTopClean, JSON.stringify(edge));
    check('time changes the picture (two frames differ)', s3.h !== s8.h, JSON.stringify({ s3, s8 }));

    await pg.evaluate(() => window.OmegaReelsInstance.pick(0)); await pg.waitForTimeout(1500);
    const run1 = await st(pg);
    check('it plays on its own', run1.playing && run1.T > 0.8 && run1.T < 3, JSON.stringify(run1));
    await pg.evaluate(() => { const r = document.querySelector('.rl-scrub'); r.value = '125'; r.dispatchEvent(new Event('input', { bubbles: true })); }); await frame(pg);
    const sk = await st(pg);
    check('the scrubber seeks exactly and pauses', Math.abs(sk.T - 12.5) < 0.01 && !sk.playing, JSON.stringify(sk));

    const names = new Set(), hashes = new Set(); let labelOK = true;
    for (let i = 0; i < 12; i++) {
      await pg.evaluate((i) => { document.querySelectorAll('.rl-chip')[i].click(); window.OmegaReelsInstance.seek(15); }, i); await frame(pg);
      const a = AGENTS[i], label = await pg.evaluate(() => document.querySelector('.rl-canvas').getAttribute('aria-label'));
      if (!(label.includes(a.name) && label.includes(a.greeting) && a.domains.every((d) => label.includes(d)) && /Not footage/.test(label))) labelOK = false;
      names.add(a.name); hashes.add((await sig(pg)).h);
    }
    check('each of the twelve chips selects its own agent and its text alternative names it, its greeting and its domains', names.size === 12 && labelOK, 'labelOK=' + labelOK);
    check('the twelve reels look different from each other at the same time', hashes.size >= 11, 'distinct frames ' + hashes.size);
    check('the page says it is not footage', await pg.evaluate(() => /Not footage; no voice/.test(document.querySelector('.rl-msg').textContent) && /not footage, no voice/i.test(document.getElementById('tp-reels').textContent)), 'missing');
    check('no page errors on desktop', errs.length === 0, errs.join(' | '));
    await ctx.close();
  }

  {
    const { ctx, pg, errs } = await open(browser, { reducedMotion: 'reduce' });
    await openTab(pg); await pg.waitForTimeout(900); await frame(pg);
    const s = await st(pg), a = await sig(pg);
    check('reduced motion: no autoplay, a composed still', !s.playing && s.T === 16 && a.colours > 15, JSON.stringify({ s, a }));
    await pg.waitForTimeout(1000);
    check('reduced motion: the still does not move', (await st(pg)).T === 16, 'T moved');
    check('reduced motion: no page errors', errs.length === 0, errs.join(' | '));
    await ctx.close();
  }

  {
    const { ctx, pg, errs } = await open(browser, { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    await openTab(pg); await pg.waitForTimeout(900); await frame(pg);
    const m = await pg.evaluate(() => { const c = document.querySelector('.rl-canvas').getBoundingClientRect(); const minBtn = Math.min(...[...document.querySelectorAll('.rl-chip,.rl-btn')].map((b) => Math.min(b.getBoundingClientRect().width, b.getBoundingClientRect().height))); return { over: Math.max(0, document.documentElement.scrollWidth - innerWidth), l: Math.round(c.left), r: Math.round(c.right), vw: innerWidth, w: Math.round(c.width), minBtn: Math.round(minBtn) }; });
    check('phone: no horizontal overflow', m.over === 0, JSON.stringify(m));
    check('phone: the canvas fits in the viewport', m.l >= 0 && m.r <= m.vw + 1 && m.w > 250, JSON.stringify(m));
    check('phone: every chip and button is at least 44 px', m.minBtn >= 44, JSON.stringify(m));
    check('phone: no page errors', errs.length === 0, errs.join(' | '));
    await ctx.close();
  }

  {
    const { ctx, pg, errs } = await open(browser, null, true);
    await openTab(pg); await pg.waitForTimeout(600);
    const t = await pg.evaluate(() => ({ msg: document.querySelector('.rl-msg').textContent, chips: document.querySelectorAll('.rl-chip').length }));
    check('if the agent list cannot be fetched the tab says so and invents nothing', /could not load the agent list \(HTTP 500\)/.test(t.msg) && t.chips === 0, JSON.stringify(t));
    check('failed fetch: no page errors', errs.length === 0, errs.join(' | '));
    await ctx.close();
  }

  await browser.close();
  const failed = results.filter((r) => !r.ok);
  results.forEach((r) => console.log((r.ok ? 'PASS ' : 'FAIL ') + r.name + (r.detail ? '  ' + r.detail : '')));
  console.log(failed.length ? 'FAILED ' + failed.length + '/' + results.length : 'PASSED ' + results.length);
  process.exit(failed.length ? 1 : 0);
})();
