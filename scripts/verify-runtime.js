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
const pagesFlag = ARGV.indexOf('--pages');
const PAGES_ARG = pagesFlag >= 0 && ARGV[pagesFlag + 1] ? ARGV[pagesFlag + 1]
  : (ARGV.find(a => a.startsWith('--pages=')) || '').split('=')[1] || '';

// Capability entrypoints (docs/capabilities/registry.json) + pages whose
// contract.failure_path was tightened for #175.
const DEFAULT_PAGES = [
  'account.html', 'profile.html', 'dashboard.html', 'feed.html', 'family.html',
  'social.html', 'approvals.html', 'search.html', 'roadmap.html', 'ops.html',
  'analytics.html', 'vault.html', 'settings.html'
];

// Thrown/logged by CDN libs a sandbox blocks, not by our code. Kept in sync
// with .claude/skills/verify-in-browser/SKILL.md "the gotchas".
const BENIGN = [
  /applyStyles/, /esm\.sh/, /cdn\.jsdelivr\.net/, /unpkg\.com/, /cdnjs/,
  /Content Security Policy/, /violates the following/, /Failed to load resource/,
  /fonts\.googleapis\.com/, /fonts\.gstatic\.com/, /net::ERR_/, /ERR_BLOCKED_BY/,
  /ERR_NAME_NOT_RESOLVED/, /tsparticles|three|leaflet|\bd3\b|dayjs|marked|popper|tippy|fuse/i
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

function startServer() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      let u = decodeURIComponent(req.url.split('?')[0]);
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
  return out;
})()`;

async function main() {
  const pw = loadPlaywright();
  const channel = systemChannel();
  if (!pw || (!channel && !process.env.OMEGA_SCRATCHPAD)) {
    console.log('SKIPPED: playwright-core not resolvable' + (channel ? '' : ' and no system Chrome/Edge') +
      '. Install with `npm i -g playwright-core`. Runtime verification not run.');
    return 0;
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
    const tapSel = new Set(), unlabelled = new Set(), noMain = [], owner = [];
    for (const r of results) for (const a of r.advisories) {
      if (a.startsWith('tap targets')) a.replace(/tap targets < 24px: /, '').split('; ').forEach(s => tapSel.add(s.replace(/ \d+x\d+$/, '')));
      else if (a.startsWith('unlabelled')) a.replace(/unlabelled inputs: /, '').split(', ').forEach(s => unlabelled.add(s));
      else if (a.startsWith('no <main>')) noMain.push(r.page);
      else if (a.startsWith('owner-gated')) owner.push(r.page);
    }
    console.log('\nadvisory (tracked as the `accessibility` capability, not gating):');
    if (tapSel.size) console.log('  tap targets < 24px, distinct selectors: ' + [...tapSel].join(', '));
    if (unlabelled.size) console.log('  unlabelled inputs: ' + [...unlabelled].join(', '));
    if (noMain.length) console.log('  no <main> landmark: ' + noMain.join(', '));
    if (owner.length) console.log('  owner-gated (expected): ' + owner.join(', '));
  }
  const failed = results.filter(r => r.problems.length);
  if (code === 0 && failed.length) code = 1;
  console.log(code === 0 ? 'RUNTIME VERIFICATION: PASS (' + results.length + ' pages)'
    : 'RUNTIME VERIFICATION: ' + failed.length + ' page(s) failed');
  return code;
}

main().then(c => process.exit(c)).catch(e => { console.error(e); process.exit(2); });
