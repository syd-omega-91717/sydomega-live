#!/usr/bin/env node
/* Browser validation for the eighteen-node map illustration (omega-node-map.js, data-omega-node-map) on sculpture.html.
 *
 * Usage: node scripts/verify-node-map.js [--shots DIR]
 *
 * What it proves (DOM + geometry; the page is SVG, so there is no canvas to read):
 *  - the eighteen drawn nodes, in order, are exactly OmegaWorldEngine.modules (names, hrefs, accent colours) -- no second list;
 *  - no label overlaps another label or another node's disc (measured with getBoundingClientRect, so a layout tweak that
 *    collides is caught -- the first draft had BLOCKCHAIN / NFT running into LEGAL);
 *  - every node is visible and not covered (elementFromPoint at its centre returns that node);
 *  - the page says it is an illustration, in the figure caption and in the SVG's accessible name, and the drawing carries no
 *    figure that could read as telemetry (no %, ms, uptime, latency, region, LIVE);
 *  - the legend is eighteen real links in order; hover/focus lights the node; clicking a node follows its link;
 *  - reduced motion: no running animation; otherwise the signet halo breathes;
 *  - a 375 px mount has no horizontal overflow and keeps the whole map;
 *  - with the registry blocked it draws nothing, says so, and throws nothing.
 * Files are served from disk through route() (no http server). No browser: SKIPPED, exit 0 unless OMEGA_REQUIRE_BROWSER is set.
 */
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), ORIGIN = 'http://nodemap.test';
if (process.argv.includes('--help') || process.argv.includes('-h')) { console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0].replace(/^#!.*\n/, '').replace(/^\/\*\s?/, '')); process.exit(0); }
const si = process.argv.indexOf('--shots'); const SHOTS = si > 0 ? process.argv[si + 1] : null;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp' };
function loadPW() { const sp = process.env.OMEGA_SCRATCHPAD; for (const t of [sp && path.join(sp, 'node_modules', 'playwright'), sp && path.join(sp, 'node_modules', 'playwright-core'), 'playwright', 'playwright-core']) { if (!t) continue; try { return require(t); } catch (e) { } } return null; }
let STUB = null; try { STUB = require(path.join(ROOT, '.claude', 'skills', 'verify-in-browser', 'harness', 'sbstub.js')).STUB; } catch (e) { }
const results = []; const check = (n, ok, d) => results.push({ name: n, ok: !!ok, detail: ok ? undefined : d });

(async () => {
  const pw = loadPW(); let browser;
  if (pw) for (const exe of [undefined, '/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome']) { try { browser = await pw.chromium.launch(exe ? { executablePath: exe } : {}); break; } catch (e) { } }
  if (!browser || !STUB) { console.log('SKIPPED: no playwright/browser (or the harness Supabase stub) available'); process.exit(process.env.OMEGA_REQUIRE_BROWSER ? 1 : 0); }

  async function open({ reduce = false, viewport = { width: 1280, height: 900 }, mobile = false, noRegistry = false } = {}) {
    const ctx = await browser.newContext({ serviceWorkers: 'block', viewport, isMobile: mobile, hasTouch: mobile, reducedMotion: reduce ? 'reduce' : 'no-preference' });
    await ctx.route(ORIGIN + '/**', async (route) => {
      let u = decodeURIComponent(new URL(route.request().url()).pathname); if (u === '/') u = '/index.html';
      const f = path.join(ROOT, path.normalize(u).replace(/^(\.\.[/\\])+/, ''));
      if (!f.startsWith(ROOT)) return route.fulfill({ status: 403, body: '' });
      if (u === '/vendor/supabase-js.js') return route.fulfill({ status: 200, contentType: 'text/javascript', body: STUB });
      if (noRegistry && u === '/omega-world-engine.js') return route.fulfill({ status: 200, contentType: 'text/javascript', body: '/* blocked by the test */' });
      try { return route.fulfill({ status: 200, contentType: MIME[path.extname(f)] || 'application/octet-stream', body: fs.readFileSync(f) }); } catch (e) { return route.fulfill({ status: 404, body: '' }); }
    });
    await ctx.route('https://esm.sh/**', r => r.fulfill({ status: 200, contentType: 'text/javascript', body: STUB }));
    await ctx.route('https://fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    await ctx.route('https://fonts.gstatic.com/**', r => r.fulfill({ status: 200, body: '' }));
    await ctx.addInitScript(() => { try { localStorage.setItem('omega_demo_watched_at', '2026-01-01T00:00:00Z'); localStorage.setItem('omega_consent_v1', 'all'); localStorage.setItem('omega_genesis_seen', '1'); } catch (e) { } });
    const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', e => errs.push(String(e.message).slice(0, 160)));
    await pg.goto(ORIGIN + '/sculpture.html', { waitUntil: 'load', timeout: 60000 });
    await pg.waitForSelector('[data-omega-node-map][data-onm-state]', { timeout: 20000 });
    return { ctx, pg, errs };
  }
  const toView = async (pg, sel) => { await pg.evaluate((q) => document.querySelector(q).scrollIntoView({ block: 'center', behavior: 'instant' }), sel); await pg.waitForFunction((q) => { const b = document.querySelector(q).getBoundingClientRect(); return b.top >= -1 && b.bottom <= innerHeight + 1 || (b.top < innerHeight / 2 && b.bottom > innerHeight / 2); }, sel); await pg.waitForTimeout(150); };
  const shot = async (pg, name) => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await pg.locator('.onm-fig, .onm-missing').first().screenshot({ path: path.join(SHOTS, name + '.png') }); } };

  /* ---------- desktop, full motion ---------- */
  {
    const { ctx, pg, errs } = await open();
    const reg = await pg.evaluate(() => window.OmegaWorldEngine.modules.slice(0, 18).map(m => ({ id: m.id, name: m.name, href: m.href, accent: m.accent.toLowerCase() })));
    check('the registry has eighteen modules to draw', reg.length === 18, reg.length);
    const drawn = await pg.evaluate(() => [...document.querySelectorAll('.onm-svg .onm-node')].map(g => ({
      n: +g.getAttribute('data-onm-node'), id: g.getAttribute('data-module'), num: g.querySelector('text:not(.onm-lbl)').textContent, name: g.querySelector('.onm-lbl').textContent,
      stroke: getComputedStyle(g.querySelector('.onm-disc')).stroke })));
    check('eighteen nodes are drawn, numbered 01-18 in order', drawn.length === 18 && drawn.every((d, i) => d.n === i + 1 && d.num === String(i + 1).padStart(2, '0')), JSON.stringify(drawn.map(d => d.num)));
    check('node names and ids are exactly the registry\'s, in order', drawn.length === 18 && drawn.every((d, i) => d.name === reg[i].name && d.id === reg[i].id), JSON.stringify(drawn.map(d => d.name)));
    const hexToRgb = h => { const n = parseInt(h.slice(1), 16); return `rgb(${n >> 16 & 255}, ${n >> 8 & 255}, ${n & 255})`; };
    check('each node is stroked in its registry accent colour', drawn.length === 18 && drawn.every((d, i) => d.stroke === hexToRgb(reg[i].accent)), JSON.stringify(drawn.map(d => d.stroke).slice(0, 3)));
    check('the colours are not all one colour (accents are the registry\'s own spread)', new Set(drawn.map(d => d.stroke)).size >= 5, [...new Set(drawn.map(d => d.stroke))].length);

    const links = await pg.evaluate(() => [...document.querySelectorAll('.onm-list a')].map(a => ({ href: a.getAttribute('href'), name: a.querySelector('b').textContent, i: a.querySelector('i').textContent })));
    check('the legend is eighteen real links whose hrefs are the registry\'s, in order', links.length === 18 && links.every((l, i) => l.href === reg[i].href && l.name === reg[i].name && l.i === String(i + 1).padStart(2, '0')), JSON.stringify(links.slice(0, 2)));

    /* geometry: nothing collides with anything else, nothing is covered */
    await toView(pg, '.onm-svg');
    const geo = await pg.evaluate(() => {
      const r = e => { const b = e.getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom }; };
      const hit = (a, b) => a.l < b.r - 1 && b.l < a.r - 1 && a.t < b.b - 1 && b.t < a.b - 1;
      const nodes = [...document.querySelectorAll('.onm-svg .onm-node')];
      const boxes = nodes.map(g => ({ disc: r(g.querySelector('.onm-disc')), lbl: r(g.querySelector('.onm-lbl')) }));
      const svgBox = r(document.querySelector('.onm-svg')), clash = [];
      const core = r(document.querySelector('.onm-svg circle[r="92"]'));
      boxes.forEach((a, i) => {
        if (hit(a.disc, core)) clash.push(['disc-core', i + 1]);
        if (a.lbl.l < svgBox.l || a.lbl.r > svgBox.r || a.lbl.t < svgBox.t || a.lbl.b > svgBox.b) clash.push(['label-outside', i + 1]);
        boxes.forEach((b, j) => {
          if (i === j) return;
          if (hit(a.lbl, b.disc)) clash.push(['label-on-disc', i + 1, j + 1]);
          if (j > i && hit(a.lbl, b.lbl)) clash.push(['label-on-label', i + 1, j + 1]);
          if (j > i && hit(a.disc, b.disc)) clash.push(['disc-on-disc', i + 1, j + 1]);
        });
      });
      return { clash };
    });
    check('no label or node overlaps another label, node or the signet, and none leaves the drawing', geo.clash.length === 0, JSON.stringify(geo.clash));
    await toView(pg, '.onm-svg');
    const covered = await pg.evaluate(() => [...document.querySelectorAll('.onm-svg .onm-node')].map((g, i) => { const c = g.querySelector('.onm-disc').getBoundingClientRect(); const e = document.elementFromPoint(c.left + c.width / 2, c.top + c.height / 2); return e && g.contains(e) ? null : i + 1; }).filter(Boolean));
    check('every node is visible and not covered by anything (elementFromPoint at its centre)', covered.length === 0, JSON.stringify(covered));

    /* honesty */
    const words = await pg.evaluate(() => ({ cap: document.querySelector('.onm-note').textContent, label: document.querySelector('.onm-svg').getAttribute('aria-label'), role: document.querySelector('.onm-svg').getAttribute('role'), svgText: document.querySelector('.onm-svg').textContent, allText: document.querySelector('.onm').textContent }));
    check('the figure caption says it is an illustration and that it shows no status', /illustration/i.test(words.cap) && /no traffic, status, region or rank/i.test(words.cap), words.cap.slice(0, 120));
    check('the SVG is an image with an accessible name that says illustration and not live', words.role === 'img' && /illustration/i.test(words.label) && /not a live status/i.test(words.label), words.label.slice(0, 120));
    check('the drawing carries no figure that could read as telemetry (only 01-18 and names)', !/[%]|\bms\b|uptime|latency|\bregion|\blive\b|\d{3,}/i.test(words.svgText), words.svgText.replace(/\s+/g, ' ').slice(0, 160));
    check('nothing in the map or its caption states a measured figure (%, ms, uptime, latency, a 3+ digit number)', !/%|\bms\b|uptime|latency|\d{3,}/i.test(words.allText), words.allText.replace(/\s+/g, ' ').match(/.{0,30}(%|\bms\b|uptime|latency|\d{3,}).{0,30}/i));
    check('the caption points at the page that owns live status', await pg.evaluate(() => { const a = document.querySelector('.onm-note a'); return !!a && a.getAttribute('href') === '/world.html'; }), 'no /world.html link');

    /* interaction */
    const first = pg.locator('.onm-list a').first();
    await first.hover();
    check('hovering a legend entry lights its node', await pg.evaluate(() => document.querySelector('[data-onm-node="1"]').classList.contains('onm-on')), 'node 1 not lit');
    await pg.mouse.move(5, 5);
    check('moving away puts it out again', await pg.evaluate(() => !document.querySelector('[data-onm-node="1"]').classList.contains('onm-on')), 'node 1 still lit');
    await pg.locator('.onm-list a').nth(6).focus();
    check('focusing a legend entry (keyboard) lights its node', await pg.evaluate(() => document.querySelector('[data-onm-node="7"]').classList.contains('onm-on')), 'node 7 not lit');
    await pg.evaluate(() => document.querySelector('[data-onm-link="9"]').addEventListener('click', e => { window.__navTo = e.currentTarget.href; e.preventDefault(); }, true));
    await pg.locator('[data-onm-node="9"] text').first().click();
    check('clicking a node follows that node\'s own link (09 -> its registry href)', await pg.evaluate((h) => (window.__navTo || '').endsWith(h), reg[8].href), await pg.evaluate(() => window.__navTo));

    /* motion */
    /* entrance animations from omega-motion are finite and settle; what must remain, forever, is exactly the halo */
    await pg.waitForTimeout(1800);
    const loops = await pg.evaluate(() => document.getAnimations().filter(a => a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest('.onm') && a.effect.getComputedTiming().iterations === Infinity).map(a => a.effect.target.getAttribute('class')));
    check('without reduced motion exactly one looping animation remains on the map: the signet halo (nothing travels a spoke)', loops.length === 1 && loops[0] === 'onm-halo', JSON.stringify(loops));
    check('no page errors', errs.length === 0, JSON.stringify(errs));
    await shot(pg, 'desktop');
    await ctx.close();
  }

  /* ---------- reduced motion ---------- */
  {
    const { ctx, pg } = await open({ reduce: true });
    await pg.waitForTimeout(1800);
    const anim = await pg.evaluate(() => document.getAnimations().filter(a => a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest('.onm') && a.playState === 'running').length);
    check('reduced motion: no animation is running on the map', anim === 0, anim);
    await ctx.close();
  }

  /* ---------- phone ---------- */
  {
    const { ctx, pg, errs } = await open({ viewport: { width: 375, height: 800 }, mobile: true });
    const m = await pg.evaluate(() => { const s = document.querySelector('.onm-svg').getBoundingClientRect(); const lbl = [...document.querySelectorAll('.onm-lbl')].every(l => getComputedStyle(l).display === 'none');
      const vb = document.querySelector('.onm-svg').viewBox.baseVal; const inVb = [...document.querySelectorAll('.onm-disc')].every(c => { const x = +c.getAttribute('cx'), y = +c.getAttribute('cy'), r = +c.getAttribute('r'); return x - r >= vb.x && x + r <= vb.x + vb.width && y - r >= vb.y && y + r <= vb.y + vb.height; });
      return { over: document.documentElement.scrollWidth - innerWidth, w: s.width, lbl, inVb, links: document.querySelectorAll('.onm-list a').length, vbw: vb.width }; });
    check('375 px: no horizontal overflow', m.over <= 1, m.over);
    check('375 px: all eighteen discs stay inside the cropped viewBox, which is narrower than the desktop one', m.inVb && m.vbw < 1240, JSON.stringify(m));
    check('375 px: the in-map labels step aside (the legend carries the names) and all 18 links remain', m.lbl && m.links === 18, JSON.stringify(m));
    check('375 px: no page errors', errs.length === 0, JSON.stringify(errs));
    await shot(pg, 'mobile');
    await ctx.close();
  }

  /* ---------- registry missing ---------- */
  {
    const { ctx, pg, errs } = await open({ noRegistry: true });
    const m = await pg.evaluate(() => ({ state: document.querySelector('[data-omega-node-map]').getAttribute('data-onm-state'), nodes: document.querySelectorAll('.onm-node').length, links: document.querySelectorAll('.onm-list a').length, msg: (document.querySelector('.onm-missing') || {}).textContent || '' }));
    check('registry missing: draws no nodes and no links, and says so', m.state === 'missing' && m.nodes === 0 && m.links === 0 && /registry did not load/i.test(m.msg), JSON.stringify(m));
    check('registry missing: nothing throws', errs.length === 0, JSON.stringify(errs));
    await ctx.close();
  }

  await browser.close();
  const bad = results.filter(r => !r.ok);
  results.forEach(r => console.log((r.ok ? 'PASS ' : 'FAIL ') + r.name + (r.ok ? '' : '  -> ' + r.detail)));
  console.log(`\n${results.length - bad.length}/${results.length} passed`);
  process.exit(bad.length ? 1 : 0);
})().catch(e => { console.error('ERROR', e); process.exit(1); });
