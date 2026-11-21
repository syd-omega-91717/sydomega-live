#!/usr/bin/env node
/* Browser check of the one-shell router (omega-one-shell.js, mounted in sovereign-core.html). Needs headless Chromium and the
   static server of .claude/skills/verify-in-browser (port 8765); NOT wired into CI (no browser job runs it), so run it when
   you change omega-one-shell.js, omega-panels.js, the eligibility registry or the page.

   What it does, as a user would and as a hostile URL would:
     MAP          15 workspace nodes + 15 membership lines + the core, no overflow
     HUB / PAGE   click a workspace, click a page: loaded in place, URL path unchanged, breadcrumb, focus moved
     BACK/FORWARD page torn down and its styles removed; forward reloads it
     LINKS        an anchor inside a hosted page is routed in the shell only when it points at a hostable page or a workspace;
                  not for kyc/terms, another origin, ctrl-click, the engine's own "open full page" link or a #fragment
     SAFETY       direct #/p/ hashes for kyc, payments, wallet, terms, enterprise (redirects), unknown, path traversal, an <img onerror>
                  string, and the shell's own page: a notice, nothing hosted, nothing injected
     CYCLES       10 open/close cycles leave no styles or content behind
     NO REGISTRY  the registry request aborted: nothing is offered as "opens here", even a normally hostable page is not hosted
     PHONE 375    2-column grid, all nodes inside the map, tap targets >= 44 px, no overflow
     REDUCED      the flowing lines are static
   Exit 0 only if every check passes. Usage: OMEGA_SCRATCHPAD=<dir> node scripts/shell-check.js */
const { launch, open } = require('../.claude/skills/verify-in-browser/harness/session.js');
let pass = 0, fail = 0;
const ok = (c, m, extra) => { c ? pass++ : fail++; console.log((c ? '  ok   ' : '  FAIL ') + m + (c || extra === undefined ? '' : '  -> ' + JSON.stringify(extra))); };
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  /* ---------- desktop ---------- */
  let { browser, ctx } = await launch({ width: 1280, height: 900 });
  let page = await open(ctx, 'sovereign-core.html', { settle: 5000 });
  const errs = page.__errors;
  page.on('pageerror', e => console.log('  [pageerror @' + new Date().toISOString().slice(11, 19) + '] ' + (e.stack || e.message).split('\n').slice(0, 3).join(' | ')));   // the collector keeps messages only; this says where
  const q = (f, a) => page.evaluate(f, a);
  console.log('MAP');
  let r = await q(() => ({ nodes: document.querySelectorAll('.ons-node').length, lines: document.querySelectorAll('.ons-spoke').length, core: !!document.querySelector('.ons-core'), title: document.querySelector('.ons-title').textContent, mapVisible: !document.querySelector('.ons-map').closest('[hidden]'), overflow: document.documentElement.scrollWidth > innerWidth, docTitleKept: document.title.indexOf('Command') >= 0 }));
  ok(r.nodes === 15 && r.lines === 15 && r.core, '15 workspace nodes, 15 membership lines, the core', r);
  ok(r.title === 'Platform map' && r.mapVisible && !r.overflow, 'map view shown, no horizontal overflow', r);

  console.log('HUB');
  await q(() => { [...document.querySelectorAll('.ons-node')].find(a => /Ascend/i.test(a.textContent)).click(); }); await wait(500);
  r = await q(() => ({ hash: location.hash, title: document.querySelector('.ons-title').textContent, pages: document.querySelectorAll('.ons-page').length, inHere: document.querySelectorAll('.ons-ptag.in').length, crumbs: [...document.querySelectorAll('.ons-crumbs li')].map(x => x.textContent), focusOnTitle: document.activeElement === document.querySelector('.ons-title'), full: document.querySelector('.ons-full').href.slice(-12) }));
  ok(r.hash === '#/hub/ascend' && r.title === 'Ascend' && r.pages > 10 && r.inHere > 5, 'hub route: pages listed, many open in place', r);
  ok(r.crumbs.join('|') === 'Map|Ascend' && r.focusOnTitle && /ascend\.html$/.test(r.full), 'breadcrumb, focus moved to the heading, link to the hub\'s own page', r);

  console.log('PAGE IN PLACE');
  await q(() => { document.querySelector('.ons-page[href="#/p/academy"]').click(); }); await wait(3500);
  r = await q(() => { const st = document.querySelector('.ons-host .op-stage'); return { hash: location.hash, nodes: st ? st.querySelectorAll('*').length : -1, busy: st && st.hasAttribute('aria-busy'), crumbs: [...document.querySelectorAll('.ons-crumbs li')].map(x => x.textContent), pathStill: location.pathname, openFull: !!document.querySelector('.ons-host .op-open'), title: document.title }; });
  ok(r.hash === '#/p/academy' && r.nodes > 20 && !r.busy, 'page loaded inside the shell', r);
  ok(r.crumbs.join('|') === 'Map|Ascend|Academy' && r.pathStill === '/sovereign-core.html' && r.openFull, 'URL path unchanged (one page), 3-level breadcrumb, engine\'s own full-page link kept', r);

  console.log('BACK / FORWARD');
  await page.goBack(); await wait(700);
  r = await q(() => ({ hash: location.hash, stageNodes: (document.querySelector('.ons-host .op-stage') || { querySelectorAll: () => [] }).querySelectorAll('*').length, styles: document.querySelectorAll('style[data-op-style]').length, hostHidden: document.querySelector('.ons-host').hidden }));
  ok(r.hash === '#/hub/ascend' && r.stageNodes === 0 && r.styles === 0 && r.hostHidden, 'back: returns to the hub, page torn down, its styles removed', r);
  await page.goBack(); await wait(600);
  ok((await q(() => document.querySelector('.ons-title').textContent)) === 'Platform map', 'back again: the map');
  await page.goForward(); await page.goForward(); await wait(3500);
  ok((await q(() => document.querySelectorAll('.ons-host .op-stage *').length)) > 20, 'forward twice: the page loads again');

  console.log('LINK INTERCEPTION (inside the hosted page)');
  r = await q(async () => {
    const st = document.querySelector('.ons-host .op-stage'); const out = {};
    const click = (href, init) => { const a = document.createElement('a'); a.href = href; if (init && init.cls) a.className = init.cls; a.textContent = 'x'; st.appendChild(a); let seen = null; a.addEventListener('click', e => { seen = e.defaultPrevented; e.preventDefault(); }, true); /* target-phase capture: runs AFTER the shell's ancestor capture handler and BEFORE the platform's own bubble handlers, then blocks the real navigation */ const ev = new MouseEvent('click', Object.assign({ bubbles: true, cancelable: true, button: 0 }, init && init.ev)); a.dispatchEvent(ev); a.remove(); return seen; };
    out.hostable = click('/habits.html');            await new Promise(r => setTimeout(r, 150)); out.hashAfter = location.hash;
    out.hubLink = click('/ascend.html');             await new Promise(r => setTimeout(r, 150)); out.hubHash = location.hash;
    out.kyc = click('/kyc.html'); out.terms = click('/terms.html'); out.external = click('https://example.com/habits.html');
    out.ctrl = click('/mood.html', { ev: { ctrlKey: true } }); out.opOpen = click('/water.html', { cls: 'op-open' }); out.fragment = click('#top');
    return out;
  });
  ok(r.hostable === true && r.hashAfter === '#/p/habits', 'link to a hostable page is routed in the shell', r);
  ok(r.hubLink === true && r.hubHash === '#/hub/ascend', 'link to a workspace page goes to that workspace view', r);
  ok(!r.kyc && !r.terms && !r.external && !r.ctrl && !r.opOpen && !r.fragment, 'NOT intercepted: kyc, terms, external, ctrl-click, the engine\'s own full-page link, #fragment', r);

  console.log('SAFETY: hostile and non-hostable routes');
  let x;
  for (const [hash, expect] of [['#/p/kyc', /not shown inside/], ['#/p/payments', /not shown inside/], ['#/p/wallet', /not shown inside/], ['#/p/terms', /not shown inside/], ['#/p/enterprise', /not shown inside/], ['#/p/no-such-page', /not a page this shell knows/], ['#/p/..%2f..%2fetc', /not part of this shell/], ['#/p/<img src=x onerror=alert(1)>', /not part of this shell/], ['#/hub/zzz', /not part of this shell/]]) {
    await q(h => { location.hash = h; }, hash); await wait(900);
    x = await q(() => ({ note: (document.querySelector('.ons-note') || {}).textContent || '', hostedNodes: document.querySelectorAll('.ons-host .op-stage *').length, stageHidden: document.querySelectorAll('.ons-host > div')[0].hidden, injected: document.querySelectorAll('img[src="x"]').length }));
    ok(expect.test(x.note) && x.hostedNodes === 0 && x.stageHidden && x.injected === 0, 'direct ' + hash + ' -> notice, nothing hosted', x);
  }
  await q(() => { location.hash = '#/p/sovereign-core'; }); await wait(900);
  x = await q(() => ({ note: (document.querySelector('.ons-note') || {}).textContent || '', hosted: document.querySelectorAll('.ons-host .op-stage *').length, shells: document.querySelectorAll('[data-omega-one-shell]').length }));
  ok(/not shown inside/.test(x.note) && x.hosted === 0 && x.shells === 1, 'direct #/p/sovereign-core (the shell\'s own page) -> refused, never hosted inside itself', x);
  await q(() => { location.hash = '#/p/ascend'; }); await wait(800);
  ok((await q(() => location.hash)) === '#/hub/ascend', 'a workspace key used as a page is redirected to its workspace view');
  await q(() => { location.hash = '#sc-title'; }); await wait(300);
  ok((await q(() => document.querySelector('.ons-title').textContent)) === 'Ascend', 'a host-page #fragment leaves the shell view alone');

  console.log('OPEN / CLOSE CYCLES');
  r = await q(async () => {
    const pages = ['academy','habits','mood','sleep','journal','targets','gratitude','breath','rituals','courses']; const w = ms => new Promise(r => setTimeout(r, ms));
    for (let i = 0; i < 10; i++) { location.hash = '#/p/' + pages[i]; await w(1400); location.hash = '#/'; await w(300); }
    return { styles: document.querySelectorAll('style[data-op-style]').length, stages: document.querySelectorAll('.ons-host .op-stage *').length, title: document.querySelector('.ons-title').textContent };
  });
  ok(r.styles === 0 && r.stages === 0 && r.title === 'Platform map', '10 page open/close cycles: no leftover styles or content, back on the map', r);
  ok(errs.length === 0, 'no page errors across the whole desktop run', errs.slice(0, 3));
  await browser.close();

  /* ---------- registry unavailable: default deny ---------- */
  ({ browser, ctx } = await launch({ width: 1280, height: 900 }));
  await ctx.route('**/config/omega-panel-eligibility.json', rt => rt.abort());
  page = await open(ctx, 'sovereign-core.html', { settle: 4500 });
  console.log('REGISTRY UNAVAILABLE');
  await page.evaluate(() => { location.hash = '#/hub/ascend'; }); await wait(600);
  r = await page.evaluate(() => ({ inHere: document.querySelectorAll('.ons-ptag.in').length, pages: document.querySelectorAll('.ons-page').length }));
  ok(r.inHere === 0 && r.pages > 10, 'no registry: nothing is offered as "opens here"; every page is still a link', r);
  await page.evaluate(() => { location.hash = '#/p/academy'; }); await wait(800);
  r = await page.evaluate(() => ({ note: (document.querySelector('.ons-note') || {}).textContent || '', hosted: document.querySelectorAll('.ons-host .op-stage *').length }));
  ok(/not a page this shell knows|not shown inside/.test(r.note) && r.hosted === 0, 'no registry: even a normally hostable page is NOT hosted', r);
  await browser.close();

  /* ---------- mobile + reduced motion ---------- */
  ({ browser, ctx } = await launch({ width: 375, height: 800, mobile: true }));
  page = await open(ctx, 'sovereign-core.html', { settle: 5000 });
  console.log('MOBILE 375');
  r = await page.evaluate(() => { const ns = [...document.querySelectorAll('.ons-node')].map(n => n.getBoundingClientRect()); const m = document.querySelector('.ons-map').getBoundingClientRect(); return { overflow: document.documentElement.scrollWidth > innerWidth, nodes: ns.length, minH: Math.round(Math.min.apply(null, ns.map(b => b.height))), allInside: ns.every(b => b.left >= m.left - 1 && b.right <= m.right + 1), cols: new Set(ns.map(b => Math.round(b.left))).size, linesShown: getComputedStyle(document.querySelector('.ons-lines')).display }; });
  ok(!r.overflow && r.nodes === 15 && r.minH >= 44 && r.allInside && r.cols === 2, 'phone: 2-column grid of 15 nodes, all inside, tap targets >= 44px, no overflow', r);
  ok(r.linesShown === 'none', 'phone: decorative lines hidden', r);
  r = await page.evaluate(() => { const c = document.querySelector('.ons-core'); return { sig: getComputedStyle(document.querySelector('.ons-signet')).display, glyph: getComputedStyle(c.querySelector('.ons-glyph')).opacity }; });
  ok(r.sig === 'none' && r.glyph === '1', 'phone: no 3-D mount, the CSS Omega is shown', r);
  r = await page.evaluate(() => ({ cube: getComputedStyle(document.querySelector('.ons-cube')).display, facts: document.querySelectorAll('.ons-facts li').length, over: document.documentElement.scrollWidth > innerWidth }));
  ok(r.cube === 'none' && r.facts === 3 && !r.over, 'phone: the 3-D cube is off, the canon facts remain, no overflow', r);
  await page.evaluate(() => { location.hash = '#/hub/cosmos'; }); await wait(500);
  r = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth, minH: Math.round(Math.min.apply(null, [...document.querySelectorAll('.ons-page')].map(n => n.getBoundingClientRect().height))) }));
  ok(!r.overflow && r.minH >= 44, 'phone: hub view has no overflow, pages are tappable', r);
  await browser.close();
  console.log('BLUEPRINT (relations)');
  ({ browser, ctx } = await launch({ width: 1440, height: 900 }));
  page = await ctx.newPage();
  await page.goto('http://localhost:8765/sovereign-core.html', { waitUntil: 'load' }); await wait(5000);
  r = await page.evaluate(async () => {
    const rel = await (await fetch('/config/omega-relations.json')).json();
    const drawn = document.querySelectorAll('.ons-edge').length;
    const rest = [...document.querySelectorAll('.ons-edge')].filter(g => getComputedStyle(g).opacity > 0.3).length;
    const strong = rel.edges.filter(e => e.weight >= 3).length;
    const stats = [...document.querySelectorAll('.ons-stat b')].map(b => b.textContent);
    const hubsRel = new Set(rel.hubs);
    const unknown = rel.edges.filter(e => !hubsRel.has(e.a) || !hubsRel.has(e.b) || !(e.shared_pages.length || e.shared_relations.length)).length;
    return { edgesInFile: rel.edges.length, drawn, rest, strong, stats, unknown, panels: document.querySelectorAll('.ons-panel').length, core: !!document.querySelector('.ons-core .ons-rays') };
  });
  ok(r.drawn === r.edgesInFile && r.unknown === 0, 'every drawn edge is in the evidence file and carries evidence (' + r.drawn + ' of ' + r.edgesInFile + ')', r);
  ok(r.rest === r.strong, 'at rest only the strongest edges show (' + r.rest + ' = weight >= 3)', r);
  ok(r.panels === 2 && r.core && r.stats.length === 4, 'luminous core, two panels and four counters are present', r);
  await page.evaluate(() => document.querySelector('[data-omega-one-shell]').scrollIntoView({ block: 'start', behavior: 'instant' })); await wait(1200);
  await page.hover('a.ons-node[href="#/hub/achieve"]'); await wait(700);
  r = await page.evaluate(() => ({ hot: document.querySelectorAll('.ons-edge.hot').length, read: document.querySelector('.ons-read').textContent, focus: document.querySelector('.ons-map').getAttribute('data-focus') }));
  ok(r.focus === 'achieve' && r.hot > 0 && /ACHIEVE connects to: Ascend \(4 shared pages/.test(r.read), 'pointing at a workspace lights its edges and reads out the evidence', r);
  await page.mouse.move(5, 5); await wait(500);
  r = await page.evaluate(() => ({ focus: document.querySelector('.ons-map').getAttribute('data-focus'), hot: document.querySelectorAll('.ons-edge.hot').length }));
  ok(r.focus === null && r.hot === 0, 'moving away clears the focus', r);
  await browser.close();
  console.log('3-D SIGNET CORE');
  const goldPixels = () => page.evaluate(() => {
    const cv = document.querySelector('.ons-signet canvas.omega-sculpture-canvas');
    if (!cv || !cv.width) return { canvas: false };
    const t = document.createElement('canvas'); t.width = cv.width; t.height = cv.height;
    const x = t.getContext('2d'); x.drawImage(cv, 0, 0);
    const d = x.getImageData(0, 0, t.width, t.height).data; let gold = 0, clear = 0, n = d.length / 4;
    for (let i = 0; i < d.length; i += 4) { if (d[i + 3] > 200 && d[i] > 150 && d[i + 1] > 100 && d[i + 2] < 140) gold++; if (d[i + 3] < 8) clear++; }
    const corners = [0, (t.width - 1) * 4, (t.height - 1) * t.width * 4, d.length - 4].map(o => d[o + 3]);
    return { canvas: true, w: t.width, h: t.height, goldShare: +(gold / n).toFixed(4), clearShare: +(clear / n).toFixed(3), corners };
  });
  ({ browser, ctx } = await launch({ width: 1440, height: 900 }));
  page = await ctx.newPage();
  await page.goto('http://localhost:8765/sovereign-core.html', { waitUntil: 'load' }); await wait(6000);
  await page.evaluate(() => document.querySelector('[data-omega-one-shell]').scrollIntoView({ block: 'start', behavior: 'instant' })); await wait(1500);
  r = await page.evaluate(() => { const c = document.querySelector('.ons-core'); const st = window.OmegaSculpture ? window.OmegaSculpture.status() : []; return { three: c.classList.contains('ons-3d'), glyph: getComputedStyle(c.querySelector('.ons-glyph')).opacity, live: st.filter(m => m.kind === 'signet' && m.live && !m.fallback).length, dead: st.filter(m => m.fallback).length, fps: st[0] && st[0].fpsCap, frameMs: st[0] && st[0].frameMs, scripts: document.querySelectorAll('script[src="/omega-sculpture.js"]').length, canvases: document.querySelectorAll('.ons-signet canvas').length }; });
  ok(r.three && r.glyph === '0' && r.live >= 2 && r.dead === 0 && r.scripts === 1 && r.canvases === 1, '3-D signet is live in the core (and the hero\'s), the CSS glyph stepped aside, the module is loaded once', r);
  const gp = await goldPixels();
  ok(gp.canvas && gp.goldShare > 0.02 && gp.clearShare > 0.5 && gp.corners.every(a => a === 0), 'the signet canvas paints real gold geometry on a transparent ground (not blank, not a box)', gp);
  /* the matrix cube: live, painting, figures equal the canon fetched here, decorative note present, and idle when the map is not on screen */
  r = await page.evaluate(async () => {
    const canon = (await (await fetch('/omega-canon.json')).json()).structure;
    const cv = document.querySelector('.ons-cube canvas.omega-sculpture-canvas');
    let ink = 0, gold = 0, cyan = 0;
    if (cv && cv.width) { const t = document.createElement('canvas'); t.width = cv.width; t.height = cv.height; const x = t.getContext('2d'); x.drawImage(cv, 0, 0); const d = x.getImageData(0, 0, t.width, t.height).data; for (let i = 0; i < d.length; i += 4) { if (d[i + 3] > 100) ink++; if (d[i + 3] > 100 && d[i] > 150 && d[i + 1] > 100 && d[i + 2] < 140) gold++; if (d[i + 3] > 100 && d[i] < 120 && d[i + 1] > 150 && d[i + 2] > 150) cyan++; } }
    const facts = [...document.querySelectorAll('.ons-facts li')].map(l => l.textContent);
    const want = ['Each phase ' + canon.axis_depth + ' × ' + canon.axis_depth + ' × ' + canon.axis_depth + ' = ' + canon.nodes_per_track_per_phase.toLocaleString('en-US') + ' nodes',
                  'Tracks × phases ' + canon.tracks + ' × ' + canon.phases + ' = ' + canon.total_nodes.toLocaleString('en-US') + ' nodes',
                  'Axes ' + canon.axes_names.join(' · ')];
    const st = window.OmegaSculpture.status();
    return { ink, gold, cyan, facts, want, matrixLive: st.some(m => m.kind === 'matrix' && m.live && !m.fallback), note: document.querySelector('.ons-fnote').textContent, box: document.querySelector('.ons-cube').getBoundingClientRect().width };
  });
  ok(r.matrixLive && r.ink > 2000 && r.gold > 100 && r.cyan > 100, 'matrix cube is live and paints gold nodes with a cyan shell', { ink: r.ink, gold: r.gold, cyan: r.cyan, matrixLive: r.matrixLive });
  ok(JSON.stringify(r.facts) === JSON.stringify(r.want), 'the figures on the panel equal the canon fetched at run time', { got: r.facts, want: r.want });
  ok(/decorative.*not your progress/.test(r.note), 'the panel says the lit nodes are decorative and shows no progress', r.note);
  await page.evaluate(() => { location.hash = '#/hub/ascend'; }); await wait(1500);
  r = await page.evaluate(() => window.OmegaSculpture.status().filter(m => m.kind === 'matrix').map(m => m.visible));
  ok(r.length === 1 && r[0] === false, 'the cube stops rendering when the map is not on screen', r);
  await browser.close();

  console.log('3-D SIGNET: NO WEBGL');
  ({ browser, ctx } = await launch({ width: 1440, height: 900 }));
  page = await ctx.newPage();
  await page.addInitScript(() => { const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, ...a) { return /webgl/i.test(t) ? null : g.call(this, t, ...a); }; });
  await page.goto('http://localhost:8765/sovereign-core.html', { waitUntil: 'load' }); await wait(6000);
  await page.evaluate(() => document.querySelector('[data-omega-one-shell]').scrollIntoView({ block: 'start', behavior: 'instant' })); await wait(1200);
  r = await page.evaluate(() => { const c = document.querySelector('.ons-core'); const cv = c.querySelector('canvas'); let ink = 0; if (cv && cv.width) { const t = document.createElement('canvas'); t.width = cv.width; t.height = cv.height; const x = t.getContext('2d'); x.drawImage(cv, 0, 0); const d = x.getImageData(0, 0, t.width, t.height).data; for (let i = 3; i < d.length; i += 4) if (d[i] > 40) ink++; } return { three: c.classList.contains('ons-3d'), canvas: !!cv, ink }; });
  ok(r.canvas && r.ink > 200, 'no WebGL: the module draws its flat mark in the core, so the Omega is never missing', r);
  r = await page.evaluate(() => { const cv = document.querySelector('.ons-cube canvas'); let ink = 0; if (cv && cv.width) { const t = document.createElement('canvas'); t.width = cv.width; t.height = cv.height; const x = t.getContext('2d'); x.drawImage(cv, 0, 0); const d = x.getImageData(0, 0, t.width, t.height).data; for (let i = 3; i < d.length; i += 4) if (d[i] > 40) ink++; } return { canvas: !!cv, ink, facts: document.querySelectorAll('.ons-facts li').length }; });
  ok(r.canvas && r.ink > 200 && r.facts === 3, 'no WebGL: the cube shows the module\'s flat lattice and the three canon facts remain', r);
  await browser.close();

  console.log('3-D SIGNET: MODULE BLOCKED');
  ({ browser, ctx } = await launch({ width: 1440, height: 900 }));
  page = await ctx.newPage();
  await page.route('**/omega-sculpture.js', rt => rt.abort());
  await page.goto('http://localhost:8765/sovereign-core.html', { waitUntil: 'load' }); await wait(12500);
  r = await page.evaluate(() => { const c = document.querySelector('.ons-core'); return { three: c.classList.contains('ons-3d'), glyph: getComputedStyle(c.querySelector('.ons-glyph')).opacity, nodes: document.querySelectorAll('a.ons-node').length }; });
  ok(!r.three && r.glyph === '1' && r.nodes === 15, 'module blocked: the CSS Omega stays and all 15 workspaces still link', r);
  r = await page.evaluate(() => ({ cubeHidden: document.querySelector('.ons-cube').hidden, facts: document.querySelectorAll('.ons-facts li').length, link: !!document.querySelector('a.ons-cubelink') }));
  ok(r.cubeHidden && r.facts === 3 && r.link, 'module blocked: the empty cube square is hidden; the canon facts and the link remain', r);
  await browser.close();

  console.log('3-D SIGNET: REDUCED MOTION');
  ({ browser, ctx } = await launch({ width: 1440, height: 900 }));
  page = await ctx.newPage(); await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('http://localhost:8765/sovereign-core.html', { waitUntil: 'load' }); await wait(6000);
  await page.evaluate(() => document.querySelector('[data-omega-one-shell]').scrollIntoView({ block: 'start', behavior: 'instant' })); await wait(1500);
  const snap = () => page.evaluate(() => { const cv = document.querySelector('.ons-signet canvas'); const t = document.createElement('canvas'); t.width = 96; t.height = 96; const x = t.getContext('2d'); x.drawImage(cv, 0, 0, 96, 96); const d = x.getImageData(0, 0, 96, 96).data; let h = 0; for (let i = 0; i < d.length; i++) h = (h * 31 + d[i]) | 0; return h; });
  const h1 = await snap(); await wait(1500); const h2 = await snap();
  ok(h1 === h2, 'reduced motion: the signet is one still frame', { h1, h2 });
  await browser.close();

  console.log('RELATIONS FILE UNAVAILABLE');
  ({ browser, ctx } = await launch({ width: 1440, height: 900 }));
  page = await ctx.newPage();
  await page.route('**/config/omega-relations.json', rt => rt.fulfill({ status: 404, body: 'no' }));
  await page.goto('http://localhost:8765/sovereign-core.html', { waitUntil: 'load' }); await wait(5000);
  r = await page.evaluate(() => ({ edges: document.querySelectorAll('.ons-edge').length, nodes: document.querySelectorAll('a.ons-node').length, read: document.querySelector('.ons-read').textContent }));
  ok(r.edges === 0 && r.nodes === 15 && /could not be read/.test(r.read), 'no evidence file: no connection is drawn, the map says so, all 15 workspaces still link', r);
  await browser.close();
  console.log('REDUCED MOTION');
  ({ browser, ctx } = await launch({ width: 1280, height: 900 }));
  page = await ctx.newPage(); await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('http://localhost:8765/sovereign-core.html', { waitUntil: 'load' }); await wait(5000);
  r = await page.evaluate(() => ({
    edges: document.querySelectorAll('.ons-eline').length,
    flow: getComputedStyle(document.querySelector('.ons-eline')).animationName,
    rays: getComputedStyle(document.querySelector('.ons-rays')).animationName,
    halo: getComputedStyle(document.querySelector('.ons-halo')).animationName
  }));
  ok(r.edges > 0 && r.flow === 'none' && r.rays === 'none' && r.halo === 'none', 'reduced motion: the flowing lines, the rotating rays and the halo are all still', r);
  await browser.close();
  console.log('\nRESULT: ' + pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR', e); process.exit(2); });
