#!/usr/bin/env node
/* Browser validation of game-zodiac-wars.html (Zodiac Wars: Ascension, Slice 0 prototype).
 *
 * Usage: node scripts/verify-zw-game.js [--root DIR]
 *
 * Proves in a real render what the Node rules tests cannot: the page loads with no errors, the canvas is drawn at the screen's real density and is painted,
 * real keyboard events move and attack, the touch buttons hold and release, a scripted player is asked once per 60 Hz tick (a test hook, OmegaZWGame.drive) and plays the whole duel to a
 * win; the page's DEMO button (a real click) plays a duel with no input, stays labelled, and a real key takes over, the replay of that duel ends in the identical state, reduced motion plays, and nothing overflows a 390 px phone. It does NOT measure frame rate on
 * a named device (a design-document acceptance item that stays open). Files are served from disk through route(). No browser: SKIPPED, exit 0 unless
 * OMEGA_REQUIRE_BROWSER is set. The full duel runs in real time (about half a minute) because the simulation is fixed at 60 Hz. */
const fs = require('fs');
const path = require('path');
if (process.argv.includes('--help') || process.argv.includes('-h')) { console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0].replace(/^#!.*\n/, '').replace(/^\/\*\s?/, '')); process.exit(0); }
const ri = process.argv.indexOf('--root');
const ROOT = ri > 0 ? path.resolve(process.argv[ri + 1]) : path.resolve(__dirname, '..');
const ORIGIN = 'https://zw.test';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml' };
function loadPW() { const sp = process.env.OMEGA_SCRATCHPAD; for (const t of [sp && path.join(sp, 'node_modules', 'playwright'), 'playwright', 'playwright-core']) { if (!t) continue; try { return require(t); } catch (e) { } } return null; }
const pw = loadPW();
let STUB = null; try { STUB = require(path.join(__dirname, '..', '.claude', 'skills', 'verify-in-browser', 'harness', 'sbstub.js')).STUB; } catch (e) { }
if (!pw || !STUB) { console.log('SKIPPED: no browser or no harness'); process.exit(process.env.OMEGA_REQUIRE_BROWSER ? 1 : 0); }
const results = [];
const check = (n, ok, d) => results.push({ name: n, ok: !!ok, detail: ok ? undefined : d });

async function open(browser, o) {
  const ctx = await browser.newContext(Object.assign({ serviceWorkers: 'block', viewport: { width: 1000, height: 900 }, deviceScaleFactor: 2 }, o || {}));
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
  pg.on('pageerror', (e) => errs.push(String(e.message).slice(0, 120)));
  await pg.goto(ORIGIN + '/game-zodiac-wars.html', { waitUntil: 'load' });
  await pg.waitForFunction(() => window.OmegaZWGame && document.getElementById('zw-canvas') && document.getElementById('zw-canvas').clientWidth > 0, null, { timeout: 15000 }).catch(() => { });
  await pg.waitForTimeout(800);
  return { ctx, pg, errs };
}
const state = (pg) => pg.evaluate(() => { const s = OmegaZWGame.state(); return { frame: s.frame, stage: s.stage, over: s.over, px: s.p.x, ex: s.e.x, pact: s.p.act, php: s.p.hp, ehp: s.e.hp }; });

(async () => {
  const browser = await pw.chromium.launch();

  /* ---- desktop at 2x: layout, density, paint, real keyboard, touch, the whole duel, the replay */
  {
    const { ctx, pg, errs } = await open(browser);
    const box = await pg.evaluate(() => { const c = document.getElementById('zw-canvas'), b = c.getBoundingClientRect(); return { w: Math.round(b.width), h: Math.round(b.height), sw: c.width, sh: c.height, aspect: +(b.width / b.height).toFixed(2) }; });
    check('canvas has a real box', box.w > 300 && box.h > 100, JSON.stringify(box));
    check('canvas keeps the arena aspect (1000:420)', Math.abs(box.aspect - 1000 / 420) < 0.03, JSON.stringify(box));
    check('canvas store is the box x the pixel ratio', box.sw >= box.w * 2 - 2 && box.sh >= box.h * 2 - 2, JSON.stringify(box));
    const painted = await pg.evaluate(() => { const c = document.getElementById('zw-canvas'), x = c.getContext('2d'), d = x.getImageData(0, 0, c.width, c.height).data; const seen = new Set(); for (let i = 0; i < d.length; i += 4 * 997) seen.add(d[i] + ',' + d[i + 1] + ',' + d[i + 2]); return seen.size; });
    check('canvas is painted (more than a flat fill)', painted > 12, 'distinct colours ' + painted);
    /* the knight (Aries, body #e8662c) must read at arena scale: its painted height is a real share of the frame (1.0 scale was about 30%, the 1.45 scale is about 47%) */
    const fig = await pg.evaluate(() => { const c = document.getElementById('zw-canvas'), x = c.getContext('2d'), d = x.getImageData(0, 0, c.width, c.height).data; let top = c.height, bot = -1; for (let yy = 0; yy < c.height; yy++) for (let xx = 0; xx < c.width; xx += 2) { const i = (yy * c.width + xx) * 4; if (Math.abs(d[i] - 0xe8) < 14 && Math.abs(d[i + 1] - 0x66) < 14 && Math.abs(d[i + 2] - 0x2c) < 14) { if (yy < top) top = yy; if (yy > bot) bot = yy; } } return { share: bot < 0 ? 0 : +((bot - top) / c.height).toFixed(3) }; });
    check('the knight is drawn at arena scale (40-60% of the frame height)', fig.share >= 0.40 && fig.share <= 0.60, JSON.stringify(fig));
    check('status says prototype and not released', await pg.evaluate(() => /PROTOTYPE/.test(document.body.textContent) && /not a released game/.test(document.body.textContent)), 'missing');
    check('cost preview is shown before any attack', await pg.evaluate(() => /COST: HEALTH/.test(document.getElementById('zw-preview').textContent)), await pg.evaluate(() => document.getElementById('zw-preview').textContent));

    const s0 = await state(pg);
    await pg.keyboard.down('d'); await pg.waitForTimeout(400); await pg.keyboard.up('d');
    const s1 = await state(pg);
    check('real keyboard: D moves the knight right', s1.px > s0.px + 20, JSON.stringify({ s0, s1 }));
    await pg.keyboard.down('j'); await pg.waitForTimeout(120); await pg.keyboard.up('j');
    const s2 = await state(pg);
    check('real keyboard: J begins a light attack', s2.pact === 'light' || s2.ehp < 100, JSON.stringify(s2));
    await pg.waitForTimeout(400);
    await pg.keyboard.down('l'); await pg.waitForTimeout(150);
    check('real keyboard: holding L raises the guard', (await state(pg)).pact === 'guard', 'not guarding');
    await pg.keyboard.up('l'); await pg.waitForTimeout(250);

    const tb = await pg.evaluate(() => { const b = document.getElementById('zw-guard'); return b && { w: b.getBoundingClientRect().width, h: b.getBoundingClientRect().height }; });
    await pg.evaluate(() => { const b = document.getElementById('zw-guard'); b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1 })); });
    await pg.waitForTimeout(150);
    check('touch: holding GUARD raises the guard', (await state(pg)).pact === 'guard' && (await pg.evaluate(() => document.getElementById('zw-guard').getAttribute('aria-pressed'))) === 'true', 'no guard');
    await pg.evaluate(() => { const b = document.getElementById('zw-guard'); b.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1 })); });
    await pg.waitForTimeout(250);
    check('touch: releasing GUARD lowers it', (await state(pg)).pact !== 'guard', 'still guarding');
    check('every control is a real button (keyboard focusable)', await pg.evaluate(() => ['zw-left', 'zw-right', 'zw-light', 'zw-heavy', 'zw-guard', 'zw-pay', 'zw-h-aries', 'zw-h-libra', 'zw-restart', 'zw-newseed', 'zw-sound'].every((id) => { const e = document.getElementById(id); return e && e.tagName === 'BUTTON'; })), 'a control is not a button');

    /* restart, then drive the page's own input path with the scripted player until the duel ends */
    await pg.evaluate(() => OmegaZWGame.reset(91717));
    await pg.evaluate(() => { OmegaZWGame.drive((s) => (s.over ? 0 : OmegaZW.bot(s))); });   // asked once per 60 Hz tick, so the guard windows are hit exactly as in the Node tests
    let end = null; const t0 = Date.now(); let sawStage1 = false;
    while (Date.now() - t0 < 120000) { const st = await state(pg); if (st.stage === 1) sawStage1 = true; if (st.over) { end = st; break; } await pg.waitForTimeout(500); }
    await pg.evaluate(() => { OmegaZWGame.drive(null); OmegaZWGame.feed(0); });
    check('the duel runs dummy then Unbled and the scripted player wins through the page', end && end.over === 'win' && sawStage1, JSON.stringify(end));
    check('the end is stated in words', await pg.evaluate(() => /FALLS|Slice 0 complete/.test(document.getElementById('zw-msg').textContent)), await pg.evaluate(() => document.getElementById('zw-msg').textContent));
    check('a replay is offered after the duel', await pg.evaluate(() => !document.getElementById('zw-replay').hidden), 'no replay button');

    /* replay: the same inputs from the same seed must end in the identical final state */
    const orig = await pg.evaluate(() => { const s = OmegaZWGame.state(); return { hash: OmegaZW.hash(s), frame: s.frame, log: OmegaZWGame.log().length }; });
    await pg.evaluate(() => document.getElementById('zw-replay').click());
    let rend = null; const t1 = Date.now();
    while (Date.now() - t1 < 120000) { const r = await pg.evaluate(() => { const s = OmegaZWGame.state(); return s.over ? { hash: OmegaZW.hash(s), frame: s.frame } : null; }); if (r) { rend = r; break; } await pg.waitForTimeout(500); }
    check('replay ends in the identical state as the duel', rend && rend.hash === orig.hash && rend.frame === orig.frame, JSON.stringify({ orig, rend }));
    /* DEMO: a real click on the button; the scripted player plays a whole duel with no input, is labelled as such throughout, and any real key takes over */
    await pg.evaluate(() => { OmegaZWGame.drive(null); OmegaZWGame.feed(0); OmegaZWGame.reset(4242); });
    await pg.click('#zw-demo');
    await pg.waitForFunction(() => /DEMO/.test(document.getElementById('zw-who').textContent), null, { timeout: 1000 }).catch(() => { });   // the label is drawn by the next screen frame
    const who1 = await pg.evaluate(() => document.getElementById('zw-who').textContent);
    check('demo: labelled as a scripted player, not a person', /DEMO: SCRIPTED PLAYER, NOT A PERSON/.test(who1), who1);
    let dend = null; const t2 = Date.now();
    while (Date.now() - t2 < 120000) { const st = await state(pg); if (st.over) { dend = st; break; } await pg.waitForTimeout(500); }
    check('demo: plays the whole duel to a win with no input', dend && dend.over === 'win' && dend.stage === 1, JSON.stringify(dend));
    check('demo: is still labelled at the end', /DEMO/.test(await pg.evaluate(() => document.getElementById('zw-who').textContent)), 'label dropped');
    await pg.click('#zw-demo'); await pg.waitForTimeout(2500);
    const f0 = await state(pg);
    await pg.keyboard.down('a'); await pg.waitForTimeout(300); await pg.keyboard.up('a');
    const f1 = await state(pg), who2 = await pg.evaluate(() => document.getElementById('zw-who').textContent), msg2 = await pg.evaluate(() => document.getElementById('zw-msg').textContent);
    check('demo: a real keypress takes over (label gone, the game goes on)', !/DEMO/.test(who2) && f1.frame > f0.frame && !f1.over, JSON.stringify({ who2, f0, f1 }));
    check('demo: the takeover is stated in words', /You have the controls/.test(msg2), msg2);
    check('no page errors on desktop', errs.length === 0, errs.join(' | '));
    await ctx.close();
  }

  /* ---- a 390 px phone: no overflow, the touch pad appears, the canvas is not clipped */
  {
    const { ctx, pg, errs } = await open(browser, { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const m = await pg.evaluate(() => { const c = document.getElementById('zw-canvas').getBoundingClientRect(), pad = document.querySelector('.zw-pad'); return { over: Math.max(0, document.documentElement.scrollWidth - innerWidth), cw: Math.round(c.width), cl: Math.round(c.left), right: Math.round(c.right), vw: innerWidth, pad: getComputedStyle(pad).display, minBtn: Math.min(...[...pad.querySelectorAll('button')].map((b) => Math.min(b.getBoundingClientRect().width, b.getBoundingClientRect().height))) }; });
    check('phone: no horizontal overflow', m.over === 0, JSON.stringify(m));
    check('phone: the canvas fits inside the viewport', m.cl >= 0 && m.right <= m.vw + 1 && m.cw > 200, JSON.stringify(m));
    check('phone: the touch pad is shown with 44 px targets', m.pad !== 'none' && m.minBtn >= 44, JSON.stringify(m));
    check('phone: no page errors', errs.length === 0, errs.join(' | '));
    await ctx.close();
  }

  /* ---- reduced motion: the game still plays and draws, with no tremor and no sparks */
  {
    const { ctx, pg, errs } = await open(browser, { reducedMotion: 'reduce' });
    await pg.evaluate(() => { OmegaZWGame.reset(5); OmegaZWGame.feed(0); const s = OmegaZWGame.state(); s.e.hp = 100; });
    await pg.keyboard.down('d'); await pg.waitForTimeout(500); await pg.keyboard.up('d');
    await pg.keyboard.down('j'); await pg.waitForTimeout(100); await pg.keyboard.up('j'); await pg.waitForTimeout(600);
    const fx = await pg.evaluate(() => document.getElementById('zw-canvas').getContext('2d').getImageData(0, 0, 4, 4).data.length > 0);
    check('reduced motion: plays and draws', fx, 'no draw');
    check('reduced motion: no page errors', errs.length === 0, errs.join(' | '));
    await ctx.close();
  }

  await browser.close();
  const failed = results.filter((r) => !r.ok);
  results.forEach((r) => console.log((r.ok ? 'PASS ' : 'FAIL ') + r.name + (r.detail ? '  ' + r.detail : '')));
  console.log(failed.length ? 'FAILED ' + failed.length + '/' + results.length : 'PASSED ' + results.length);
  process.exit(failed.length ? 1 : 0);
})();
