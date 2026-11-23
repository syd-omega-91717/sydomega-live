#!/usr/bin/env node
/* Browser validation for the council chamber 3-D scene (omega-sculpture.js, data-omega-sculpture="council") on sculpture.html and agents.html.
 *
 * Usage: node scripts/verify-council-scene.js [--shots DIR]
 *
 * Reads canvas pixels and the DOM, because "it rendered and nothing threw" proved nothing for the lion (which drew with no visible wings).
 * Checks: the twelve seats are all drawn (lit pixels in at least 10 of 12 angular sectors around the chamber), the executors' element
 * colours differ, the picture moves, reduced motion holds one still frame, every coin is a real door (twelve <a> whose hrefs are exactly
 * omega-agents.json's, in order) and clicking a coin travels to one of them, a 375 px mount keeps the whole chamber, the no-WebGL fallback
 * draws, and the roster page's COUNCIL tab shows it. Software WebGL (SwiftShader). Files are served from disk through route() (no http
 * server). No browser: SKIPPED, exit 0 unless OMEGA_REQUIRE_BROWSER is set.
 */
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), ORIGIN = 'http://council.test';
if (process.argv.includes('--help') || process.argv.includes('-h')) { console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0].replace(/^#!.*\n/, '').replace(/^\/\*\s?/, '')); process.exit(0); }
const si = process.argv.indexOf('--shots'); const SHOTS = si > 0 ? process.argv[si + 1] : null;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
function loadPW() { const sp = process.env.OMEGA_SCRATCHPAD; for (const t of [sp && path.join(sp, 'node_modules', 'playwright'), sp && path.join(sp, 'node_modules', 'playwright-core'), 'playwright', 'playwright-core'].filter(Boolean)) { try { return require(t); } catch (e) { } } return null; }
let STUB = null; try { STUB = require(path.join(ROOT, '.claude', 'skills', 'verify-in-browser', 'harness', 'sbstub.js')).STUB; } catch (e) { }
const AGENTS = JSON.parse(fs.readFileSync(path.join(ROOT, 'omega-agents.json'), 'utf8')).agents.slice(0, 12);
const results = []; const check = (n, ok, d) => results.push({ name: n, ok: !!ok, detail: ok ? undefined : d });

(async () => {
  const pw = loadPW(); let browser;
  const args = ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
  if (pw) for (const exe of [undefined, '/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome']) { try { browser = await pw.chromium.launch({ ...(exe ? { executablePath: exe } : {}), args }); break; } catch (e) { } }
  if (!browser || !STUB) { console.log('SKIPPED: no playwright/browser (or the harness Supabase stub) available'); process.exit(process.env.OMEGA_REQUIRE_BROWSER ? 1 : 0); }

  async function open({ reduce = false, noWebgl = false, viewport = { width: 1280, height: 900 }, mobile = false, page = '/sculpture.html' } = {}) {
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
    await pg.goto(ORIGIN + page, { waitUntil: 'load', timeout: 60000 });
    return { ctx, pg, errs };
  }
  const SEL = '[data-omega-sculpture="council"] canvas';
  const toView = (pg) => pg.evaluate(() => document.querySelector('[data-omega-sculpture="council"]').scrollIntoView({ block: 'center' }));
  const waitDrawn = (pg) => pg.waitForFunction((sel) => { const c = document.querySelector(sel); if (!c || !c.width) return false; const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 40) if (d[i] + d[i + 1] + d[i + 2] > 240) n++; return n > 60; }, SEL, { timeout: 45000 }).then(() => true, () => false);
  /* how many of 12 equal angular sectors around the canvas centre contain bright pixels, and how many hue families the bright pixels span */
  const analyse = (pg) => pg.evaluate((sel) => {
    const c = document.querySelector(sel), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data, W = c.width, H = c.height;
    const cx = W / 2, cy = H * 0.5, sectors = new Array(12).fill(0), hues = new Set(); let lit = 0;
    for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) {
      const i = (y * W + x) * 4, r = d[i], g = d[i + 1], b = d[i + 2], m = Math.max(r, g, b), n = Math.min(r, g, b);
      if (r + g + b < 330) continue; lit++;
      const a = Math.atan2(y - cy, x - cx); sectors[Math.floor(((a + Math.PI) / (2 * Math.PI)) * 12) % 12]++;
      if (m - n > 70) { let h = 0; const dd = m - n; if (m === r) h = ((g - b) / dd + 6) % 6; else if (m === g) h = (b - r) / dd + 2; else h = (r - g) / dd + 4; hues.add(Math.floor(h)); }
    }
    return { lit, sectorsLit: sectors.filter(v => v > 3).length, hueFamilies: hues.size };
  }, SEL);
  /* How much of the canvas is bright "coin face", and how many colour families hold a meaningful share of it. These two quantities are what the
     regressions that matter change: hiding seats shrinks the area, flattening the executors' element colours collapses the families. (A blob
     counter was tried first and abandoned: the glyph splits a coin and neighbouring coins merge, so its count was noise.) A coin face is bright
     only when it faces the camera, so a single frame swings about 2x as they turn; every check therefore uses the BEST of eight frames. Calibrated
     on the real scene and on three mutations: good desktop best-of-5 = 5.0-5.2 % and 4 families; six seats hidden = 2.3 %; one tint for all = at most 3
     families. */
  const stats = (pg) => pg.evaluate((sel) => {
    const c = document.querySelector(sel), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data, N = c.width * c.height; let bright = 0; const hb = {};
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i + 1], b = d[i + 2]; if (r + g + b <= 500) continue; bright++;
      const m = Math.max(r, g, b), mn = Math.min(r, g, b), sat = m ? (m - mn) / m : 0; let k = 'neutral';
      if (sat >= 0.18) { const dd = m - mn; const h = m === r ? (((g - b) / dd) % 6 + 6) % 6 : m === g ? (b - r) / dd + 2 : (r - g) / dd + 4; k = 'h' + Math.floor(h * 60 / 45); }
      hb[k] = (hb[k] || 0) + 1;
    }
    const fam = Object.entries(hb).filter(([k, v]) => v / N >= 0.0015).map(([k]) => k);
    return { massPct: +(100 * bright / N).toFixed(3), tints: fam.length, tintList: fam };
  }, SEL);
  const settledStats = async (pg) => {
    let best = await stats(pg); for (let i = 0; i < 60 && best.massPct < 0.3; i++) { await pg.waitForTimeout(500); best = await stats(pg); }
    for (let i = 0; i < 8; i++) { await pg.waitForTimeout(700); const r = await stats(pg); best = { massPct: Math.max(best.massPct, r.massPct), tints: Math.max(best.tints, r.tints), tintList: r.tints >= best.tints ? r.tintList : best.tintList }; }
    return best;
  };
  const snap = (pg) => pg.evaluate((sel) => { const c = document.querySelector(sel); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let h = 0; for (let i = 0; i < d.length; i += 97) h = (h * 31 + d[i]) | 0; return h; }, SEL);

  /* 1. the chamber on the showcase page */
  {
    const { ctx, pg, errs } = await open();
    await toView(pg); const drawn = await waitDrawn(pg); await pg.waitForTimeout(1200);
    const a = await settledStats(pg); console.log('      [measured] desktop mass %:', a.massPct, 'tint families:', a.tints, a.tintList.join(','));
    check('chamber: it draws something bright within 45 s', drawn);
    check('chamber: all twelve coins are drawn (bright coin-face area at least 3.5 % of the canvas; six seats hidden gives 2.3 %)', a.massPct >= 3.5, a);
    check('chamber: the executors carry different element colours (4 colour families; one tint for all gives at most 3)', a.tints >= 4, a);
    if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await pg.screenshot({ path: path.join(SHOTS, 'council-desktop.png') }); }
    const s1 = await snap(pg); await pg.waitForTimeout(1500); const s2 = await snap(pg);
    check('chamber: the coins, rings and camera turn (the picture changes in 1.5 s)', s1 !== s2, { s1, s2 });
    /* every coin is a real door: twelve anchors, the destinations exactly omega-agents.json's, in order */
    await pg.waitForFunction(() => document.querySelectorAll('[data-omega-sculpture="council"] nav.omega-sculpt-links a').length >= 12, null, { timeout: 15000 }).catch(() => { });
    const doors = await pg.evaluate(() => [...document.querySelectorAll('[data-omega-sculpture="council"] nav.omega-sculpt-links a')].map(a => ({ h: a.getAttribute('href'), t: a.textContent })));
    check('chamber: twelve real <a> doors, each the executor\'s own destination from omega-agents.json, in order', doors.length === 12 && doors.every((d, i) => d.h === AGENTS[i].href && d.t === AGENTS[i].name), { doors: doors.slice(0, 12), want: AGENTS.map(x => [x.name, x.href]) });
    /* clicking a coin travels to one of those pages */
    const box = await pg.evaluate((sel) => { const r = document.querySelector(sel).getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; }, SEL);
    let went = null;
    outer: for (let fy = 0.42; fy <= 0.82; fy += 0.04) for (let fx = 0.2; fx <= 0.8; fx += 0.04) {
      const x = box.x + box.w * fx, y = box.y + box.h * fy;
      await pg.mouse.move(x, y); await pg.waitForTimeout(40);
      const before = pg.url();
      await Promise.all([pg.waitForURL(u => u.toString() !== before, { timeout: 700 }).catch(() => null), pg.mouse.click(x, y)]);
      if (pg.url() !== before) { went = new URL(pg.url()); break outer; }
    }
    check('chamber: clicking a coin travels to one of the twelve executors\' pages', went && AGENTS.some(a => (new URL(a.href, ORIGIN)).pathname === went.pathname), { went: went && went.pathname });
    check('chamber: no page errors', errs.length === 0, errs);
    await ctx.close();
  }
  /* 2. reduced motion: one still frame */
  {
    const { ctx, pg } = await open({ reduce: true });
    await toView(pg); await waitDrawn(pg); await pg.waitForTimeout(1200);
    const a = await snap(pg); await pg.waitForTimeout(1800); const b = await snap(pg);
    check('reduced motion: the chamber holds one still frame', a === b, { a, b });
    await ctx.close();
  }
  /* 3. mobile: the whole chamber stays in frame */
  {
    const { ctx, pg, errs } = await open({ viewport: { width: 375, height: 740 }, mobile: true });
    await toView(pg); await waitDrawn(pg); await pg.waitForTimeout(1200);
    const a = await settledStats(pg), ov = await pg.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    console.log('      [measured] mobile mass %:', a.massPct, 'tint families:', a.tints);
    check('mobile 375 px: the chamber is drawn in frame (coin-face area at least 1.2 %) with no horizontal overflow', a.massPct >= 1.2 && !ov, { a, ov });
    if (SHOTS) await pg.screenshot({ path: path.join(SHOTS, 'council-mobile.png') });
    check('mobile: no page errors', errs.length === 0, errs);
    await ctx.close();
  }
  /* 4. no WebGL: the flat ring of twelve is drawn */
  {
    const { ctx, pg, errs } = await open({ noWebgl: true });
    await toView(pg); const drawn = await waitDrawn(pg); const a = await analyse(pg);
    check('no WebGL: the flat fallback draws twelve discs on a ring', drawn && a.sectorsLit >= 10, { drawn, a });
    check('no WebGL: no page errors', errs.length === 0, errs);
    await ctx.close();
  }
  /* 5. the roster page: its COUNCIL tab shows the chamber */
  {
    const { ctx, pg, errs } = await open({ page: '/agents.html' });
    await pg.waitForSelector('#tab-btn-council', { timeout: 30000 }).catch(() => { });
    await pg.click('#tab-btn-council').catch(() => { });
    await pg.waitForTimeout(500); await toView(pg).catch(() => { });
    const drawn = await waitDrawn(pg); const a = await settledStats(pg);
    console.log('      [measured] agents.html tab mass %:', a.massPct, 'tint families:', a.tints);
    check('agents.html: the COUNCIL tab shows the chamber (coin-face area at least 2.5 %, at least 3 colour families)', drawn && a.massPct >= 2.5 && a.tints >= 3, { drawn, a });
    if (SHOTS) await pg.screenshot({ path: path.join(SHOTS, 'agents-council-tab.png') });
    check('agents.html: no page errors', errs.length === 0, errs);
    await ctx.close();
  }

  await browser.close();
  const failed = results.filter(r => !r.ok);
  results.forEach(r => console.log((r.ok ? 'PASS  ' : 'FAIL  ') + r.name + (r.ok ? '' : '\n      ' + JSON.stringify(r.detail))));
  console.log(`\n${results.length - failed.length}/${results.length} passed`); process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
