#!/usr/bin/env node
/*
 * SYD OMEGA 91717 - automated runtime verification (issue #175).
 *
 * Renders the real capability entrypoints in a headless browser and asserts
 * the things `node --check` / audit.py cannot see: the page loads, the
 * approval guard lifts with a valid session, nothing throws, no horizontal
 * overflow, no duplicate ids - plus advisory a11y findings (missing <main>,
 * sub-24px tap targets, unlabelled inputs).
 *
 *   node scripts/verify-runtime.js                 # curated capability set
 *   node scripts/verify-runtime.js --pages a.html,b.html
 *   node scripts/verify-runtime.js --all
 *   node scripts/verify-runtime.js --json
 *
 * Playwright is NOT a repo dependency (no build step - keep it that way).
 * This resolves `playwright-core` from a scratchpad / global install and, if
 * it is not present and no system Chrome/Edge is usable, prints
 * "SKIPPED" and exits 0. On the self-hosted Windows runner (which has Chrome)
 * and any dev box with `npm i -g playwright-core`, it runs for real.
 *
 *   Exit 0 = checks pass, or SKIPPED.   Exit 1 = a real runtime failure.
 *   Exit 2 = the harness itself could not run.
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ARGV = process.argv.slice(2);
const JSON_OUT = ARGV.includes('--json');
const SELF_TEST = ARGV.includes('--self-test');
const pagesFlag = ARGV.indexOf('--pages');
const PAGES_ARG = pagesFlag >= 0 && ARGV[pagesFlag + 1] ? ARGV[pagesFlag + 1]
  : (ARGV.find(a => a.startsWith('--pages=')) || '').split('=')[1] || '';

// The capability set is DERIVED from docs/capabilities/registry.json, not
// listed here. It used to be a hand-maintained array that merely *claimed* to
// be "capability entrypoints" -- the drift pattern CLAUDE.md 8.4 warns about.
// It happened to be in sync when this was written, but nothing kept it there:
// a capability added tomorrow with a new .html entrypoint would go unrendered
// while its contract.live_verification still cited this script as evidence.
// Deriving it means adding a capability automatically extends verification,
// and scripts/capability-audit.py --check enforces the other direction (a
// contract may not cite this script for an entrypoint this script skips).
const REGISTRY = path.join(ROOT, 'docs', 'capabilities', 'registry.json');

// Not a capability entrypoint of its own, but the page every approved member
// lands on, so a regression here is the most visible one there is.
const EXTRA_PAGES = ['dashboard.html'];

function capabilityPages() {
  let reg;
  try {
    reg = JSON.parse(fs.readFileSync(REGISTRY, 'utf8'));
  } catch (e) {
    console.error(`verify-runtime: cannot read ${path.relative(ROOT, REGISTRY)}: ${e.message}`);
    console.error('  The capability set is derived from it; refusing to silently verify a partial set.');
    process.exit(2);
  }
  const pages = [];
  for (const cap of reg.capabilities || []) {
    for (const ep of cap.entrypoints || []) {
      // Non-.html entrypoints (bg.js, omega-a11y.js) are platform-wide modules
      // exercised by every page rendered here, so they need no page of their own.
      if (ep.endsWith('.html') && !pages.includes(ep)) pages.push(ep);
    }
  }
  for (const ep of EXTRA_PAGES) if (!pages.includes(ep)) pages.push(ep);
  return pages.filter(p => fs.existsSync(path.join(ROOT, p)));
}

const DEFAULT_PAGES = capabilityPages();

// --list prints the derived set and exits. Needed because the set is no longer
// readable from the source, and because it lets the derivation be asserted
// (scripts/tests/test_verify_runtime.py) on a machine with no browser, where
// a normal run reports SKIPPED and would prove nothing.
if (ARGV.includes('--list')) {
  for (const page of DEFAULT_PAGES) console.log(page);
  process.exit(0);
}

// Thrown/logged by CDN libs a sandbox blocks, not by our code. Kept in sync
// with .claude/skills/verify-in-browser/SKILL.md "the gotchas".
const BENIGN = [
  /applyStyles/, /esm\.sh/, /cdn\.jsdelivr\.net/, /unpkg\.com/, /cdnjs/,
  /Content Security Policy/, /violates the following/, /Failed to load resource/,
  /fonts\.googleapis\.com/, /fonts\.gstatic\.com/, /net::ERR_/, /ERR_BLOCKED_BY/,
  /ERR_NAME_NOT_RESOLVED/, /tsparticles|three|leaflet|\bd3\b|dayjs|marked|popper|tippy|fuse/i,
  // CLAUDE.md 8.4: graph.html (d3), map.html (Leaflet), realm.html (three.js)
  // throw from CDN libs the sandbox blocks - fine in production.
  /L\.map is not a function/, /WebGLRenderer is not a constructor/, /THREE\b/,
  // Pages that fetch a public API with no CORS header (arxiv, wikipedia) - a
  // real product limitation that needs an Edge Function proxy, not a source
  // fix; tracked, not gating here.
  /export\.arxiv\.org/, /wikipedia\.org/, /has been blocked by CORS/, /Access to fetch at/
];
// Pages that legitimately render signed-out (bg.js public-page allowlist).
const PUBLIC = /(^|\/)(account|enter|reset|terms|pending|index)\.html$/;
// Owner-only pages: the member stub (is_owner:false) SHOULD be kept out, so
// "#app not visible" there is the gate working, not a bug.
const OWNER_GATED = /(^|\/)(approvals)\.html$/;

function loadPlaywright() {
  const tries = [
    process.env.OMEGA_SCRATCHPAD && path.join(process.env.OMEGA_SCRATCHPAD, 'node_modules', 'playwright-core'),
    process.env.OMEGA_SCRATCHPAD && path.join(process.env.OMEGA_SCRATCHPAD, 'node_modules', 'playwright'),
    'playwright-core', 'playwright'
  ].filter(Boolean);
  for (const t of tries) { try { return require(t); } catch (e) {} }
  return null;
}
function systemChannel() {
  const win = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
  ];
  for (const p of win) { try { if (fs.existsSync(p)) return p.includes('msedge') ? 'msedge' : 'chrome'; } catch (e) {} }
  return process.platform === 'win32' ? 'chrome' : null;
}

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json', '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.txt': 'text/plain' };

/* Known-ratio fixture for --self-test. Every value here is computed from the
   WCAG formula against this platform's own surfaces, so the classifier is
   checked against arithmetic rather than against itself. It deliberately
   includes the three surface shapes that each broke an earlier version of the
   rule: translucent glass, an opaque near-uniform gradient, and an element
   whose background is clipped to its text. */
const FIXTURE = `<!doctype html><html><head><meta charset="utf-8"><style>
  html{background:#0A0A0F}
  body{margin:0;padding:20px;font:16px/1.6 monospace;background:transparent}
  div{padding:10px;width:600px}
  /* the platform's glass: translucent over the ground, must be composited */
  .glass{background:rgba(10,10,15,.68)}
  /* the sidebar's shape: a low-alpha tint over an opaque near-uniform gradient */
  .side{background-image:linear-gradient(rgba(201,168,76,.09) 0%,rgba(0,0,0,0) 100%),
        linear-gradient(rgb(8,8,15),rgb(5,5,12))}
  /* .ofx-sheen's shape: the gradient paints INSIDE the glyphs, not behind them */
  .sheen{background-image:linear-gradient(100deg,rgb(255,247,214) 38%,rgb(255,247,214) 62%);
         -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
  .sheen span{-webkit-text-fill-color:currentColor}
</style></head><body>
  <div id="t-block-1" style="color:#08080F">void on void, 1.01 to 1, must BLOCK</div>
  <div id="t-block-2" style="color:#55534e">the old dock grey, 2.57 to 1, must BLOCK</div>
  <div id="t-mid-1"   style="color:#C4453C">re-stepped crimson, 4.01 to 1, must be ADVISORY</div>
  <div id="t-pass-1"  style="color:#C9A84C">brand gold, 8.74 to 1, must PASS</div>
  <div id="t-pass-2"  class="glass" style="color:#C9A84C">gold on composited glass, must PASS</div>
  <div id="t-pass-3"  class="side"  style="color:#C9A84C">gold on the opaque gradient, must PASS</div>
  <div class="sheen"><span id="t-pass-4" style="color:#C9A84C">gold in a clip-to-text parent, must PASS</span></div>
</body></html>`;

function startServer() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      let u = decodeURIComponent(req.url.split('?')[0]);
      if (u === '/__contrast-fixture.html') {
        res.writeHead(200, { 'content-type': 'text/html', 'cache-control': 'no-store' });
        return res.end(FIXTURE);
      }
      if (u === '/') u = '/enter.html';
      const f = path.join(ROOT, path.normalize(u).replace(/^(\.\.[/\\])+/, ''));
      if (!f.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
      let buf; try { buf = fs.readFileSync(f); } catch (e) { buf = null; }
      if (buf === null) { res.writeHead(404, { 'content-type': 'text/plain' }); return res.end('nf'); }
      res.writeHead(200, { 'content-type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream',
        'cache-control': 'no-store' });
      res.end(buf);
    });
    srv.listen(0, '127.0.0.1', () => resolve({ srv, port: srv.address().port }));
  });
}

const CHECK_JS = `(() => {
  const out = { path: location.pathname, title: document.title };
  out.overflow = document.documentElement.scrollWidth > window.innerWidth + 2;
  const seen = new Set(), dup = new Set();
  document.querySelectorAll('[id]').forEach(el => { if (seen.has(el.id)) dup.add(el.id); seen.add(el.id); });
  out.dupIds = [...dup];
  out.hasMain = !!document.querySelector('main, [role=main], #main-content');
  const app = document.querySelector('#app, .shell, main.main');
  out.appVisible = app ? getComputedStyle(app).display !== 'none' : true;
  const small = [];
  document.querySelectorAll('a[href], button, [role=button], input:not([type=hidden]), select, [onclick]').forEach(el => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    if (r.width > 0 && r.height > 0 && (r.width < 24 || r.height < 24) && cs.visibility !== 'hidden' && cs.display !== 'none')
      small.push((el.id || (el.className && String(el.className).slice(0,20)) || el.tagName) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
  });
  out.smallTapTargets = small.slice(0, 8);
  const unl = [];
  document.querySelectorAll('input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=checkbox]):not([type=radio]), select, textarea').forEach(el => {
    const ok = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.getAttribute('title')
      || (el.id && document.querySelector('label[for="' + CSS.escape(el.id) + '"]')) || el.closest('label');
    if (!ok) unl.push(el.name || el.id || el.type || 'input');
  });
  out.unlabelledInputs = unl.slice(0, 8);
  /* --- FIXED-CHROME OCCLUSION ------------------------------------------
     Two modules independently claimed position:fixed;bottom:0;left:0;right:0
     at z-index 9990 -- omega-legal.js's consent bar and omega-pwa.js's install
     bar -- neither aware of the other, so the later paint intercepted every
     click on the earlier one. Measured on the front door at 1280x800: 61px of
     overlap, ACCEPT ALL blocked by #pwa-dismiss-btn and ESSENTIAL ONLY by
     #pwa-install-btn. A member could not record a cookie choice, so the
     consent bar could never clear. No static check can see this: both rules
     are correct in isolation and only collide once painted.

     Only an occluder under a DIFFERENT position:fixed ancestor counts. That
     is what stops a full-viewport pointer-events:none backdrop -- omega-fx,
     the particle canvas, the noise overlay -- from reporting against every
     control on the page, which is the mistake an earlier collision scan made
     on 177 of 178 pages. Advisory: a deliberately-open modal is a legitimate
     occluder, and this must not gate on one.

     The occluded control must ALSO be inside fixed chrome. That second half
     is the scanner's own false-positive pass (CLAUDE.md 8.4), and it was
     added after measuring: the first version reported 20 controls across the
     13 entrypoints, but most were ordinary page content that merely happened
     to sit under a bar at the current scroll offset. A fixed bar over
     scrollable content is normal and unavoidable -- tested directly by
     reserving padding-bottom equal to the whole stack on body, main.main and
     .main at once, which changed the count by nothing, because the document
     scrolls and the bar covers whatever is at that viewport position
     regardless. What is never normal is one piece of fixed chrome eating
     another's controls, which is the defect this was written for. */
  const fixedRoot = el => {
    for (let n = el; n && n !== document.documentElement; n = n.parentElement)
      if (getComputedStyle(n).position === 'fixed') return n;
    return null;
  };
  const occ = [];
  document.querySelectorAll('a[href], button, [role=button], input:not([type=hidden]), select').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || cs.pointerEvents === 'none') return;
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    if (cx < 0 || cy < 0 || cx > window.innerWidth || cy > window.innerHeight) return;
    const top = document.elementFromPoint(cx, cy);
    if (!top || top === el || el.contains(top) || top.contains(el)) return;
    const mine = fixedRoot(el), theirs = fixedRoot(top);
    if (!mine || !theirs || theirs === mine) return;
    /* A full-viewport overlay is a modal or an access gate, not colliding
       chrome -- approvals.html's #gate (position:fixed; inset:0) covers the
       page for any non-owner, which is exactly what it is for, and it was the
       only thing left in this report once page content was excluded. */
    const tr = theirs.getBoundingClientRect();
    if (tr.width >= window.innerWidth * 0.9 && tr.height >= window.innerHeight * 0.9) return;
    occ.push((el.id || el.textContent.trim().slice(0, 18) || el.tagName) + ' <- #' + (theirs.id || theirs.tagName));
  });
  out.occluded = occ.slice(0, 8);
  /* --- TEXT CONTRAST ---------------------------------------------------
     Blocking below 3:1, the floor for any content. Six buttons shipped at
     1.01:1 and 1:1 on the public sign-up and password-recovery path, and
     15 nav-dock labels at 2.60:1 on 179 pages, with every static gate
     green -- only a render can see this. Verified against those pinned
     pre-fix trees: 3, 15 and 20 findings respectively. 3-4.5:1 is
     advisory, not blocking: --crim was deliberately re-stepped to the
     deepest crimson that still clears 3:1. */

  const lin = v => { v/=255; return v<=.03928 ? v/12.92 : Math.pow((v+.055)/1.055,2.4); };
  const L = c => .2126*lin(c[0]) + .7152*lin(c[1]) + .0722*lin(c[2]);
  const px = t => { const m = String(t).match(/[\\d.]+/g); return m ? m.map(Number) : null; };
  const alpha = c => (c && c.length > 3) ? c[3] : 1;
  const cLow = [], cMidIds = [], cOkIds = []; let cMid = 0, cOk = 0, cSeen = 0;
  document.querySelectorAll('body *').forEach(el => {
    const txt = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join('');
    if (txt.length < 2) return;
    const cs = getComputedStyle(el), r = el.getBoundingClientRect();
    if (r.width < 6 || r.height < 6) return;
    if (cs.visibility === 'hidden' || parseFloat(cs.opacity) < .35) return;
    if (String(cs.webkitTextFillColor).indexOf('rgba(0, 0, 0, 0)') >= 0) return;
    const fg = px(cs.color);
    if (!fg || alpha(fg) < .35) return;
    /* Resolve the surface the way a browser composites it. This platform's
       glass is rgba(10,10,15,.68) and its sidebar is an OPAQUE near-uniform
       gradient under a low-alpha tint, so "opaque colour or give up" measures
       almost nothing. Translucent layers are collected and alpha-blended over
       the first opaque surface; a gradient with opaque stops IS that surface,
       and every one of its stops is a candidate -- text is judged against the
       WORST of them, which is the only honest standard for a gradient. */
    const elRect = r;
    let n = el, bases = null; const layers = [];
    while (n && n !== document.documentElement) {
      /* An ancestor's own background/gradient only actually paints behind
         the text element if its box sits inside the ancestor's own box. A
         position:absolute child with a negative offset (top:-24px, e.g.)
         renders OUTSIDE its parent's rendered box, over whatever is behind
         the parent instead -- but a plain DOM-ancestor walk has no way to
         know that and will still pick up the parent's own background as
         if it were painted there. Measured false positive: a .bar-value
         label positioned above a gold-gradient .bar reported 1:1 (judged
         against the bar's own gold top stop) while a real screenshot of
         the exact pixels shows perfectly legible gold-on-near-black --
         the bar's gradient never reaches that negative-offset region.
         Skip any ancestor other than el itself (whose own background
         always applies) whose box does not contain el's. */
      if (n !== el) {
        const nRect = n.getBoundingClientRect();
        const contains = nRect.left <= elRect.left + 0.5 && nRect.top <= elRect.top + 0.5 &&
                          nRect.right >= elRect.right - 0.5 && nRect.bottom >= elRect.bottom - 0.5;
        if (!contains) { n = n.parentElement; continue; }
      }
      const s = getComputedStyle(n);
      /* background-clip:text means the background paints INSIDE the
         glyphs, not behind them -- .ofx-sheen is exactly this. Treating
         its gradient as a surface reported six .sec-prog spans at 1:1
         against their own text fill. */
      const clipsToText = (s.backgroundClip || s.webkitBackgroundClip) === 'text';
      const c = clipsToText ? null : px(s.backgroundColor);
      if (c) {
        const a = alpha(c);
        if (a > .995) { bases = [c.slice(0,3)]; break; }
        if (a > .02) layers.push([c.slice(0,3), a]);
      }
      const bi = clipsToText ? 'none' : s.backgroundImage;
      if (bi && bi !== 'none') {
        const stops = (bi.match(/rgba?\\([^)]*\\)/g) || []).map(px).filter(Boolean);
        const solid = stops.filter(t => alpha(t) > .85).map(t => t.slice(0,3));
        if (solid.length) { bases = solid; break; }
      }
      n = n.parentElement;
    }
    if (!bases) {
      const h = px(getComputedStyle(document.documentElement).backgroundColor);
      bases = [(h && alpha(h) > .99) ? h.slice(0,3) : [10,10,15]];
    }
    const l1 = L(fg.slice(0,3));
    let worst = Infinity, worstBg = null;
    bases.forEach(b => {
      let bg = b;
      for (let k = layers.length - 1; k >= 0; k--) {
        const c = layers[k][0], a = layers[k][1];
        bg = [0,1,2].map(q => a*c[q] + (1-a)*bg[q]);
      }
      const l2 = L(bg);
      const ratio = (Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05);
      if (ratio < worst) { worst = ratio; worstBg = bg.map(Math.round); }
    });
    cSeen++;
    const size = parseFloat(cs.fontSize) || 12;
    const large = size >= 24 || (size >= 18.66 && (parseInt(cs.fontWeight,10)||400) >= 700);
    if (worst + 0.005 < 3) {
      cLow.push({ id: el.id, sel: el.tagName + (el.className ? '.' + String(el.className).split(' ')[0] : ''),
                 ratio: +worst.toFixed(2), color: cs.color, bg: 'rgb(' + worstBg.join(', ') + ')',
                 px: Math.round(size), text: txt.slice(0,26) });
    } else if (worst + 0.005 < (large ? 3 : 4.5)) { cMid++; if (el.id) cMidIds.push(el.id); }
    else { cOk++; if (el.id) cOkIds.push(el.id); }
  });
  out.lowContrastIds = cLow.map(x => x.id).filter(Boolean);
  out.lowContrast = cLow.slice(0, 6);
  out.lowContrastCount = cLow.length;
  out.midContrast = cMid;
  out.midContrastIds = cMidIds;
  out.okContrastIds = cOkIds;
  return out;
})()`;

/* --self-test: prove the contrast classifier against arithmetic, not against
   itself. Without this the gate's correctness was only ever demonstrated once,
   by pinning pre-fix files out of git history -- which the next person changing
   the rule has no way to repeat. */
async function selfTest(pw, channel) {
  const EXPECT = {
    block: ['t-block-1', 't-block-2'],
    mid:   ['t-mid-1'],
    ok:    ['t-pass-1', 't-pass-2', 't-pass-3', 't-pass-4']
  };
  const { srv, port } = await startServer();
  const browser = await (channel ? pw.chromium.launch({ channel }) : pw.chromium.launch());
  let info;
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto('http://127.0.0.1:' + port + '/__contrast-fixture.html', { waitUntil: 'load' });
    info = await page.evaluate(CHECK_JS);
  } finally { await browser.close(); srv.close(); }

  const got = { block: (info.lowContrastIds||[]).sort(), mid: (info.midContrastIds||[]).sort(),
                ok: (info.okContrastIds||[]).sort() };
  let bad = 0;
  for (const k of ['block', 'mid', 'ok']) {
    const want = EXPECT[k].slice().sort();
    const same = want.length === got[k].length && want.every((v, i) => v === got[k][i]);
    if (!same) bad++;
    console.log((same ? '  ok   ' : '  FAIL ') + k.padEnd(6) +
      ' expected [' + want.join(', ') + ']  got [' + got[k].join(', ') + ']');
  }
  console.log(bad ? 'CONTRAST SELF-TEST: FAILED' : 'CONTRAST SELF-TEST: PASS (7 known ratios binned correctly)');
  return bad ? 1 : 0;
}

async function main() {
  const pw = loadPlaywright();
  const channel = systemChannel();
  if (!pw || (!channel && !process.env.OMEGA_SCRATCHPAD)) {
    console.log('SKIPPED: playwright-core not resolvable' + (channel ? '' : ' and no system Chrome/Edge') +
      '. Install with `npm i -g playwright-core`. Runtime verification not run.');
    return 0;
  }
  if (SELF_TEST) return selfTest(pw, channel);
  /* Run it as a PRECONDITION of every sweep, not as a separate step someone
     has to remember: if the classifier is wrong, the sweep's verdict about 189
     pages is meaningless. Costs one extra page load. */
  if (await selfTest(pw, channel) !== 0) {
    console.log('RUNTIME VERIFICATION: aborted -- the contrast classifier failed its own fixture');
    return 2;
  }
  const { chromium } = pw;
  const pages = PAGES_ARG ? PAGES_ARG.split(',').map(s => s.trim()).filter(Boolean)
    : ARGV.includes('--all') ? fs.readdirSync(ROOT).filter(f => f.endsWith('.html')).sort()
    : DEFAULT_PAGES;
  const STUB = require(path.join(ROOT, '.claude/skills/verify-in-browser/harness/sbstub.js')).STUB;

  const { srv, port } = await startServer();
  let browser, results = [], code = 0;
  try {
    try {
      browser = await chromium.launch(channel ? { channel, headless: true } : { headless: true });
    } catch (e) {
      srv.close();
      console.log('SKIPPED: could not launch a browser (' + e.message.split('\n')[0].slice(0, 120) +
        '). Install Chrome/Edge, or `npx playwright-core install chromium`.');
      return 0;
    }
    const ctx = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 900 } });
    await ctx.route('**/vendor/supabase-js.js', r => r.fulfill({ status: 200, contentType: 'text/javascript', body: STUB }));
    await ctx.route('https://esm.sh/**', r => r.fulfill({ status: 200, contentType: 'text/javascript', body: STUB }));
    await ctx.route('https://fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    await ctx.route('https://fonts.gstatic.com/**', r => r.fulfill({ status: 200, body: '' }));
    await ctx.addInitScript(() => { try {
      localStorage.setItem('omega_demo_watched_at', '2026-01-01T00:00:00Z');
      localStorage.setItem('omega_consent_v1', 'all');
      localStorage.setItem('omega_last_gate', '99');
      localStorage.setItem('terms_accepted', 'true');
    } catch (e) {} });

    for (const pg of pages) {
      const page = await ctx.newPage();
      const errs = [];
      page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text().slice(0, 240)); });
      page.on('pageerror', e => errs.push('EXC ' + String(e.message || e).slice(0, 240)));
      let info = {};
      try {
        await page.goto('http://127.0.0.1:' + port + '/' + pg, { waitUntil: 'load', timeout: 30000 });
        await page.waitForTimeout(2600);
        await page.evaluate(() => ['omega-genesis', 'omg-demo-overlay', 'omega-gate-celebrate', 'omega-consent']
          .forEach(id => { const e = document.getElementById(id); if (e) e.remove(); })).catch(() => {});
        info = await page.evaluate(CHECK_JS);
      } catch (e) { errs.push('HARNESS ' + e.message.slice(0, 160)); }
      await page.close();

      const realErrs = errs.filter(e => !BENIGN.some(rx => rx.test(e)));
      const problems = [], advisories = [];
      const landed = info.path;
      if (info.path === undefined) problems.push('page did not render (no evaluate result)');
      if (realErrs.length) problems.push(realErrs.length + ' uncaught error(s): ' + realErrs.slice(0, 3).join(' | '));
      if (info.overflow) problems.push('horizontal overflow');
      if (info.dupIds && info.dupIds.length) problems.push('duplicate ids: ' + info.dupIds.join(', '));
      const landedPublic = landed && PUBLIC.test(landed);
      if (info.appVisible === false && !PUBLIC.test(pg) && !landedPublic) {
        if (OWNER_GATED.test(pg) && !realErrs.length) advisories.push('owner-gated: #app hidden for the member stub (gate working)');
        else problems.push('approval guard never lifted (#app still display:none)');
      }
      if (info.hasMain === false && !landedPublic) advisories.push('no <main> landmark');
      if (info.smallTapTargets && info.smallTapTargets.length) advisories.push('tap targets < 24px: ' + info.smallTapTargets.join('; '));
      if (info.unlabelledInputs && info.unlabelledInputs.length) advisories.push('unlabelled inputs: ' + info.unlabelledInputs.join(', '));
      if (info.occluded && info.occluded.length) advisories.push('occluded by fixed chrome: ' + info.occluded.join(', '));
      if (info.lowContrastCount) problems.push(info.lowContrastCount + ' text element(s) under the 3:1 contrast floor: ' +
        info.lowContrast.map(c => c.ratio + ':1 ' + c.sel + ' ' + JSON.stringify(c.text)).join(' | '));
      if (info.midContrast) advisories.push('contrast 3-4.5:1: ' + info.midContrast);
      results.push({ page: pg, landedOn: landed, problems, advisories, benignSuppressed: errs.length - realErrs.length });
    }
  } catch (e) {
    console.error('HARNESS ERROR: ' + e.message);
    code = 2;
  } finally {
    try { browser && await browser.close(); } catch (e) {}
    srv.close();
  }

  if (JSON_OUT) console.log(JSON.stringify(results, null, 2));
  else {
    console.log('RUNTIME VERIFICATION - ' + results.length + ' page(s), ' + (channel || 'chromium'));
    for (const r of results) {
      const tag = r.landedOn && r.landedOn !== '/' + r.page ? ' (-> ' + r.landedOn + ')' : '';
      console.log((r.problems.length ? '  FAIL ' : '  ok   ') + r.page + tag +
        (!r.problems.length && r.benignSuppressed ? '  [' + r.benignSuppressed + ' benign]' : ''));
      for (const p of r.problems) console.log('        x ' + p);
    }
    // Advisories aggregated - they are platform-wide (bg.js chrome), not per-page.
    const tapSel = new Set(), unlabelled = new Set(), occluded = new Set(), noMain = [], owner = []; let midC = 0;
    for (const r of results) for (const a of r.advisories) {
      if (a.startsWith('tap targets')) a.replace(/tap targets < 24px: /, '').split('; ').forEach(s => tapSel.add(s.replace(/ \d+x\d+$/, '')));
      else if (a.startsWith('unlabelled')) a.replace(/unlabelled inputs: /, '').split(', ').forEach(s => unlabelled.add(s));
      else if (a.startsWith('no <main>')) noMain.push(r.page);
      else if (a.startsWith('owner-gated')) owner.push(r.page);
      else if (a.startsWith('occluded by fixed chrome')) a.replace(/occluded by fixed chrome: /, '').split(', ').forEach(s => occluded.add(s));
      else if (a.startsWith('contrast 3-4.5')) midC += parseInt(a.split(': ')[1], 10) || 0;
    }
    console.log('\nadvisory (tracked as the `accessibility` capability, not gating):');
    if (tapSel.size) console.log('  tap targets < 24px, distinct selectors: ' + [...tapSel].join(', '));
    if (unlabelled.size) console.log('  unlabelled inputs: ' + [...unlabelled].join(', '));
    if (occluded.size) console.log('  interactive controls occluded by other fixed chrome: ' + [...occluded].join(', '));
    if (noMain.length) console.log('  no <main> landmark: ' + noMain.join(', '));
    if (owner.length) console.log('  owner-gated (expected): ' + owner.join(', '));
    if (midC) console.log('  text contrast 3-4.5:1 (clears the 3:1 floor, misses AA at small sizes): ' + midC);
  }
  const failed = results.filter(r => r.problems.length);
  if (code === 0 && failed.length) code = 1;
  console.log(code === 0 ? 'RUNTIME VERIFICATION: PASS (' + results.length + ' pages)'
    : 'RUNTIME VERIFICATION: ' + failed.length + ' page(s) failed');
  return code;
}

main().then(c => process.exit(c)).catch(e => { console.error(e); process.exit(2); });
