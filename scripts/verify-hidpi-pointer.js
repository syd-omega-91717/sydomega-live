#!/usr/bin/env node
/* Browser validation that the pointer-driven canvases still hit what they draw once they are drawn at the screen's real density (omega-canvas-hidpi.js).
 *
 * Usage: node scripts/verify-hidpi-pointer.js [--root DIR] [--only page.html]    (--root runs the same checks against another checkout, e.g. a worktree of origin/main)
 *
 * A canvas that is drawn larger than its CSS box breaks any handler that converts a pointer position through canvas.width / rect.width: the click lands in the wrong
 * place and nothing reports an error.  Pixels cannot show that, so for every page this scans a grid of real mouse positions over the canvas (CSS pixels) and records
 * which positions the page itself reports as a hit (a pointer cursor, a tooltip, a panel opening, a node being selected).  The set of hit positions must
 *   1. not be empty (else the check proves nothing: the page had nothing to hit);
 *   2. be the same at device scale 3 and 2.625 as at 1 (intersection over union, with the repeat scan at 1 as the noise floor, because some layouts still move);
 *   3. differ from a miss: positions outside the hit set must report nothing.
 * Reduced motion is on, so layouts that animate hold still.  Files are served from disk through route().  No browser: SKIPPED, exit 0 unless OMEGA_REQUIRE_BROWSER is set.
 */
const fs = require('fs'), path = require('path');
if (process.argv.includes('--help') || process.argv.includes('-h')) { console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0].replace(/^#!.*\n/, '').replace(/^\/\*\s?/, '')); process.exit(0); }
const ri = process.argv.indexOf('--root');
const ROOT = ri > 0 ? path.resolve(process.argv[ri + 1]) : path.resolve(__dirname, '..'), ORIGIN = 'https://hidpi-pointer.test';
const oi = process.argv.indexOf('--only'); const ONLY = oi > 0 ? process.argv[oi + 1] : null;
const HARNESS = path.resolve(__dirname, '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp' };
function loadPW() { const sp = process.env.OMEGA_SCRATCHPAD; for (const t of [sp && path.join(sp, 'node_modules', 'playwright'), sp && path.join(sp, 'node_modules', 'playwright-core'), 'playwright', 'playwright-core']) { if (!t) continue; try { return require(t); } catch (e) { } } return null; }
let STUB = null, STUB_ROWS = null; try { STUB = require(path.join(HARNESS, '.claude', 'skills', 'verify-in-browser', 'harness', 'sbstub.js')).STUB; } catch (e) { }
/* the harness stub resolves every list query to []; a page that draws from a list gets whatever the page declares in cfg.rows (set as window.__SB_ROWS before the page runs) */
if (STUB) STUB_ROWS = STUB.replace('{data:[],error:null,count:0,status:200}', '{data:(globalThis.__SB_ROWS||[]),error:null,count:0,status:200}');
const results = []; const check = (n, ok, d) => results.push({ name: n, ok: !!ok, detail: ok ? undefined : d });

/* people spread across the five circles (tiers inner, close, tribe, network, outer), through the page's own storage key */
const CONTACTS = JSON.stringify(['inner', 'close', 'tribe', 'network', 'outer'].flatMap((tier, i) => [0, 1, 2].map(j => ({ id: 'c' + i + j, name: 'Person ' + i + j, tier, cat: 'other', freq: 30, strength: 3, lastContact: '2026-11-01', tags: [], vip: false, added: '2026-01-01', color: '#888' }))));
/* approved members for nexus: a spread of signs and axes so the graph has several nodes */
const MEMBERS = ['Aries', 'Leo', 'Sagittarius', 'Taurus', 'Virgo', 'Cancer', 'Pisces', 'Gemini'].map((sign, i) => ({ id: 'u' + i, display_name: 'Member ' + i, axis_a: 2 + i % 4, axis_b: 3 + i % 3, axis_c: 1 + i % 5, is_owner: false, sign, access_approved: true }));
const cursorHit = (id) => `(function(){return document.getElementById('${id}').style.cursor==='pointer'?'hit':''})()`;
const cursorReset = (id) => `document.getElementById('${id}').style.cursor=''`;   /* the previous position's result must not leak into the next probe */
/* page, canvas id, mode ('move' hovers, 'click' clicks), probe (JS returning '' for a miss and a non-empty string for a hit), prep (JS run once the page is up), reset (JS run after each click) */
const PAGES = [
  { page: 'agent-network.html', id: 'network-canvas', mode: 'click', events: ['click'], probe: "(function(){var p=document.getElementById('agent-panel');return p&&p.classList.contains('active')?document.getElementById('agent-content').textContent.slice(0,30):''})()", reset: "closePanel()" },
  { page: 'architect.html', id: 'arch-canvas', mode: 'click', events: ['click'], probe: "(function(){var d=document.getElementById('node-detail');return d&&d.classList.contains('visible')?document.getElementById('nd-title').textContent:''})()" },
  { page: 'atlas.html', id: 'atlas-canvas', mode: 'move', reveal: "window.dispatchEvent(new Event('resize'))", wait: 5000, probe: cursorHit('atlas-canvas'), reset: cursorReset('atlas-canvas') },
  { page: 'dashboard.html', id: 'galaxy-canvas', mode: 'move', reveal: "setTab('overview')", probe: cursorHit('galaxy-canvas'), reset: cursorReset('galaxy-canvas') },
  { page: 'ecosystem.html', id: 'eco-canvas', mode: 'move', probe: cursorHit('eco-canvas'), reset: cursorReset('eco-canvas') },
  { page: 'knowledge.html', id: 'kg-canvas', mode: 'move', probe: cursorHit('kg-canvas'), reset: cursorReset('kg-canvas') },
  { page: 'network.html', id: 'n-orbit', mode: 'move', probe: "document.getElementById('n-orbit-tip').textContent!=='HOVER OVER A NODE TO IDENTIFY'?'hit':''", reset: "document.getElementById('n-orbit-tip').textContent='HOVER OVER A NODE TO IDENTIFY'",
    reveal: "activateTab('orbit')", seeds: { omega_contacts: CONTACTS } },
  { page: 'nexus.html', id: 'nexus-canvas', mode: 'move', probe: "document.getElementById('node-tip').style.display==='block'?'hit':''", reset: "document.getElementById('node-tip').style.display='none'", rows: MEMBERS },
  { page: 'mindmap.html', id: 'map-canvas', mode: 'click', events: ['mousedown', 'mouseup'], probe: "selectedNode?String(selectedNode.id):''", reset: "selectedNode=null;closeEditor();render();",
    prep: "maps=[{id:'m1',name:'T',nodes:[{id:'a',x:0,y:0,text:'Alpha',color:'#C9A84C',shape:'rect',w:120,h:40},{id:'b',x:220,y:90,text:'Beta',color:'#00E5FF',shape:'rect',w:120,h:40},{id:'c',x:-200,y:130,text:'Gamma',color:'#9b6bf0',shape:'rect',w:120,h:40}],edges:[]}];loadMap('m1');" },
];
const STEP = 12, MAXY = 1400;   /* the whole canvas box that fits the 1500 px viewport: a node at 55 to 65 percent of a canvas whose height differs by scale falls either side of any smaller cap */

(async () => {
  const pw = loadPW(); let browser;
  if (pw) for (const exe of [undefined, '/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome']) { try { browser = await pw.chromium.launch(exe ? { executablePath: exe } : {}); break; } catch (e) { } }
  if (!browser || !STUB) { console.log('SKIPPED: no playwright/browser (or the harness Supabase stub) available'); process.exit(process.env.OMEGA_REQUIRE_BROWSER ? 1 : 0); }

  /* Every page's handlers read clientX/clientY (or offsetX) and a bounding rect, so a MouseEvent dispatched at a known CSS position reaches exactly the code that a pointer reaches.
     The dense grid is dispatched inside the page (a few thousand cells in well under a second); then ONE real mouse hit and ONE real miss are made through the browser's own input path, to
     check the synthetic scan and the real pointer agree. */
  async function scan(cfg, dsf) {
    const ctx = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 1000, height: 1500 }, deviceScaleFactor: dsf, reducedMotion: 'reduce' });
    await ctx.route(ORIGIN + '/**', async (route) => {
      let u = decodeURIComponent(new URL(route.request().url()).pathname); if (u === '/') u = '/index.html';
      const f = path.join(ROOT, path.normalize(u).replace(/^(\.\.[/\\])+/, ''));
      if (!f.startsWith(ROOT)) return route.fulfill({ status: 403, body: '' });
      if (u === '/vendor/supabase-js.js') return route.fulfill({ status: 200, contentType: 'text/javascript', body: STUB_ROWS });
      try { return route.fulfill({ status: 200, contentType: MIME[path.extname(f)] || 'application/octet-stream', body: fs.readFileSync(f) }); } catch (e) { return route.fulfill({ status: 404, body: '' }); }
    });
    await ctx.route('https://esm.sh/**', r => r.fulfill({ status: 200, contentType: 'text/javascript', body: STUB }));
    await ctx.route('https://fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    await ctx.route('https://fonts.gstatic.com/**', r => r.fulfill({ status: 200, body: '' }));
    await ctx.addInitScript((x) => { try { localStorage.setItem('omega_demo_watched_at', '2026-01-01T00:00:00Z'); localStorage.setItem('omega_consent_v1', 'all'); localStorage.setItem('omega_genesis_seen', '1'); Object.keys(x.seeds || {}).forEach(k => localStorage.setItem(k, x.seeds[k])); if (x.rows) window.__SB_ROWS = x.rows; } catch (e) { } }, { seeds: cfg.seeds, rows: cfg.rows });
    const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', e => errs.push(String(e.message).slice(0, 120)));
    await pg.goto(ORIGIN + '/' + cfg.page, { waitUntil: 'load', timeout: 60000 });
    await pg.waitForTimeout(1500);
    /* a canvas on a tab that is not the default: open the tab through the page's own router; only if it still has no box, give its ancestors one */
    if (cfg.reveal) { try { await pg.evaluate(cfg.reveal); } catch (e) { errs.push('reveal: ' + String(e.message).slice(0, 100)); } await pg.waitForTimeout(400); }
    if (!(await pg.evaluate((i) => document.getElementById(i).getBoundingClientRect().height > 0, cfg.id))) await pg.evaluate((i) => { for (let e = document.getElementById(i); e; e = e.parentElement) { if (getComputedStyle(e).display === 'none') { e.classList.add('active'); e.style.display = 'block'; e.hidden = false; } } }, cfg.id);
    /* wait until the canvas box has stopped changing in BOTH directions (agent-network grows its own canvas for a few seconds on pristine main) */
    let last = '', same = 0;
    for (let k = 0; k < 40 && same < 3; k++) { const w = await pg.evaluate((i) => { const c = document.getElementById(i); if (!c) return 'none'; const r = c.getBoundingClientRect(); return Math.round(r.width) + 'x' + Math.round(r.height); }, cfg.id); same = w === last ? same + 1 : 0; last = w; await pg.waitForTimeout(300); }
    if (cfg.wait) await pg.waitForTimeout(cfg.wait);
    if (cfg.prep) { try { await pg.evaluate(cfg.prep); } catch (e) { errs.push('prep: ' + String(e.message).slice(0, 100)); } await pg.waitForTimeout(500); }
    await pg.evaluate((i) => document.getElementById(i).scrollIntoView({ block: 'start', behavior: 'instant' }), cfg.id); await pg.waitForTimeout(300);
    const box = await pg.evaluate((i) => { const c = document.getElementById(i), r = c.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, bw: c.width, bh: c.height }; }, cfg.id);
    const events = cfg.events || (cfg.mode === 'move' ? ['mousemove'] : ['click']);
    const fn = `((a) => { const c = document.getElementById(a.id), hits = []; const r = c.getBoundingClientRect();
      for (let y = a.step / 2; y < Math.min(r.height, a.maxY, 1400 - Math.max(r.top, 0)); y += a.step) for (let x = a.step / 2; x < r.width; x += a.step) {
        a.events.forEach(t => c.dispatchEvent(new MouseEvent(t, { bubbles: true, cancelable: true, view: window, clientX: r.left + x, clientY: r.top + y, button: 0 })));
        if ((${cfg.probe})) hits.push(Math.floor(x / a.step) + ',' + Math.floor(y / a.step));
        ${cfg.reset || ''}
      } return hits; })`;
    const hitList = await pg.evaluate(fn + '(' + JSON.stringify({ id: cfg.id, step: STEP, maxY: MAXY, events }) + ')');
    const hits = new Set(hitList);
    const cells = Math.floor(Math.min(box.h, MAXY) / STEP) * Math.floor(box.w / STEP);
    /* real input: one position the scan says is a hit, one it says is not */
    const real = { hit: null, miss: null };
    const realProbe = async (cx, cy) => {
      if (cfg.mode === 'move') { await pg.mouse.move(box.x + cx, box.y + cy); } else { await pg.mouse.move(box.x + cx, box.y + cy); await pg.mouse.down(); await pg.mouse.up(); }
      await pg.waitForTimeout(80); const v = await pg.evaluate(cfg.probe); if (cfg.reset) await pg.evaluate(cfg.reset); return !!v;
    };
    if (hitList.length) { const [hx, hy] = hitList[Math.floor(hitList.length / 2)].split(',').map(Number); real.hit = await realProbe((hx + 0.5) * STEP, (hy + 0.5) * STEP); }
    for (let mx = STEP / 2; mx < box.w && real.miss === null; mx += STEP * 3) for (let my = STEP / 2; my < Math.min(box.h, MAXY) && real.miss === null; my += STEP * 3) {
      let near = false; hits.forEach(k => { const [kx, ky] = k.split(',').map(Number); if (Math.abs((kx + 0.5) * STEP - mx) < STEP * 4 && Math.abs((ky + 0.5) * STEP - my) < STEP * 4) near = true; });
      if (!near) real.miss = !(await realProbe(mx, my));
    }
    const box2 = await pg.evaluate((i) => { const r = document.getElementById(i).getBoundingClientRect(); return { w: r.width, h: r.height }; }, cfg.id);
    box.grew = Math.abs(box2.h - box.h) > 1 || Math.abs(box2.w - box.w) > 1 ? [Math.round(box.w) + 'x' + Math.round(box.h), Math.round(box2.w) + 'x' + Math.round(box2.h)] : null;
    await ctx.close(); return { box, hits, cells, errs, real };
  }
  /* Hit cells -> clusters (one per node) -> positions as a fraction of the canvas box, so a page whose node layout scales with a box that differs by 2 percent between device scales
     (nexus lays nodes out from W and H, and the page itself lays out 26 px differently at 3x than at 1x) is compared by which nodes are hit, not by exact pixels. */
  const clusters = (hits, box) => {
    const left = new Set(hits), out = [];
    while (left.size) {
      const first = left.values().next().value, stack = [first], cells = []; left.delete(first);
      while (stack.length) { const k = stack.pop(); cells.push(k); const [x, y] = k.split(',').map(Number); for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) { const n = (x + dx) + ',' + (y + dy); if (left.has(n)) { left.delete(n); stack.push(n); } } }
      let sx = 0, sy = 0; cells.forEach(k => { const [x, y] = k.split(',').map(Number); sx += x + 0.5; sy += y + 0.5; });
      const cy = (sy / cells.length) * STEP;
      if (cy < MAXY - 3 * STEP) out.push({ x: (sx / cells.length) * STEP / box.w, y: cy / box.h });   /* a node at the scan limit is in at one scale and clipped at another */
    }
    return out;
  };
  const iou = (hitsA, boxA, hitsB, boxB) => {
    const A = clusters(hitsA, boxA), B = clusters(hitsB, boxB), used = new Set(); let m = 0;
    A.forEach(a => { let best = -1, bd = 0.04; B.forEach((b, i) => { const d = Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)); if (!used.has(i) && d <= bd) { bd = d; best = i; } }); if (best >= 0) { used.add(best); m++; } });
    const u = Math.max(A.length, B.length); return u ? m / u : 1;
  };
  const iouOld = (a, b) => { let i = 0; a.forEach(k => { if (b.has(k)) i++; }); const u = a.size + b.size - i; return u ? i / u : 1; };

  for (const cfg of PAGES) {
    if (ONLY && cfg.page !== ONLY) continue;
    if (cfg.skip) { console.log('NOTE  ' + cfg.page.replace('.html', '') + '#' + cfg.id + ': ' + cfg.skip); continue; }
    const tag = cfg.page.replace('.html', '') + '#' + cfg.id;
    let s1, s1b, s3, s26;
    try { s1 = await scan(cfg, 1); s1b = await scan(cfg, 1); s3 = await scan(cfg, 3); s26 = await scan(cfg, 2.625); } catch (e) { check(tag + ': renders and scans', false, String(e.message).slice(0, 220)); continue; }
    const near = (a, b) => Math.abs(a - b) <= 0.025 * Math.max(a, b) + 1;
    check(tag + ': something to hit (the scan found hit positions at 1x; otherwise it proves nothing)', s1.hits.size >= 4, JSON.stringify({ hits: s1.hits.size, cells: s1.cells }));
    check(tag + ': a miss reports nothing (not every position is a hit)', s1.hits.size < s1.cells * 0.6, JSON.stringify({ hits: s1.hits.size, cells: s1.cells }));
    /* the same box at every scale: a different layout would move the hits for a reason that is not the canvas */
    const sameBox = near(s1.box.w, s3.box.w) && near(s1.box.h, s3.box.h) && near(s1.box.w, s26.box.w) && near(s1.box.h, s26.box.h);
    if (process.env.HIDPI_DEBUG) console.log('DEBUG ' + tag + ' clusters 1x ' + JSON.stringify(clusters(s1.hits, s1.box)) + ' 3x ' + JSON.stringify(clusters(s3.hits, s3.box)) + ' boxes ' + JSON.stringify([s1.box, s3.box].map(b => [b.w, b.h])));
    const floor = iou(s1.hits, s1.box, s1b.hits, s1b.box), r3 = iou(s1.hits, s1.box, s3.hits, s3.box), r26 = iou(s1.hits, s1.box, s26.hits, s26.box);
    const need = Math.min(0.8, floor - 0.1);
    if (sameBox) {
      check(tag + ': hit positions at 3x match 1x (node-cluster match ' + r3.toFixed(2) + ', repeat-at-1x noise floor ' + floor.toFixed(2) + ')', r3 >= need, JSON.stringify({ r3, floor, h1: s1.hits.size, h3: s3.hits.size }));
      check(tag + ': hit positions at 2.625x (a fractional phone ratio) match 1x (node-cluster match ' + r26.toFixed(2) + ')', r26 >= need, JSON.stringify({ r26, floor, h1: s1.hits.size, h26: s26.hits.size }));
    } else console.log('NOTE  ' + tag + ': canvas box differs between loads (' + [s1, s3, s26].map(s => Math.round(s.box.w) + 'x' + Math.round(s.box.h)).join(', ') + '); overlap not compared, see the chart harness for layout');
    for (const [name, sc] of [['1x', s1], ['3x', s3], ['2.625x', s26]]) check(tag + ': real mouse input at ' + name + ' agrees with the scan (a hit position hits, a miss position misses)', sc.real.hit === true && sc.real.miss === true, JSON.stringify(sc.real));
    /* The store is the CSS size the page chose, times the ratio.  That is the box times the ratio for a page that sized itself from a settled layout, and the 1x store times the ratio for one that measured
       before its layout settled (architect and knowledge draw 958x520 and 979x478 into 820x445 and 902x440 boxes at 1x on pristine main, which is not this change). */
    for (const [d, sc] of [[3, s3], [2.625, s26]]) {
      const byBox = Math.abs(sc.box.bw - Math.round(sc.box.w * d)) <= 3 && Math.abs(sc.box.bh - Math.round(sc.box.h * d)) <= 3;
      const byOneX = Math.abs(sc.box.bw - Math.round(s1.box.bw * d)) <= 3 && Math.abs(sc.box.bh - Math.round(s1.box.bh * d)) <= 3;
      check(tag + ': the canvas is drawn at the pixel ratio (backing store = ' + d + ' x the size the page chose)', byBox || byOneX, JSON.stringify({ box: [sc.box.w, sc.box.h], store: [sc.box.bw, sc.box.bh], store1x: [s1.box.bw, s1.box.bh] }));
    }
    check(tag + ': at 1x the store equals the box (the page re-measures when its layout settles)', Math.abs(s1.box.bw - s1.box.w) <= 3 && Math.abs(s1.box.bh - s1.box.h) <= 3, JSON.stringify({ box: [s1.box.w, s1.box.h], store: [s1.box.bw, s1.box.bh] }));
    check(tag + ': the canvas box does not change size while the page is scanned (no growth loop)', !s1.box.grew && !s3.box.grew && !s26.box.grew, JSON.stringify([s1.box.grew, s3.box.grew, s26.box.grew]));
    check(tag + ': no page errors', s1.errs.length + s3.errs.length + s26.errs.length === 0, JSON.stringify([s1.errs, s3.errs]));
  }

  await browser.close();
  const bad = results.filter(r => !r.ok);
  results.forEach(r => console.log((r.ok ? 'PASS ' : 'FAIL ') + r.name + (r.ok ? '' : '  -> ' + r.detail)));
  console.log(`\n${results.length - bad.length}/${results.length} passed`);
  process.exit(bad.length ? 1 : 0);
})().catch(e => { console.error('ERROR', e); process.exit(1); });
