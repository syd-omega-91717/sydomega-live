#!/usr/bin/env node
/* Browser validation for the finance "not advice" notice (omega-finance-notice.js) on every page that loads it.
 *
 * Usage: node scripts/verify-finance-notice.js [--shots DIR] [--pages a.html,b.html]
 *
 * For each page whose HTML loads the module (found by scanning the repo, so a new page is covered the moment it is tagged):
 * exactly one notice, visible, first child of the page's content column (never a third column of the flex shell), the
 * module's exact text, not covered by anything at its centre, no button or link inside it (not dismissible), and at 375 px it
 * stays inside the viewport. A page that does not load the module (dashboard.html) must not show it. Signed-in (Supabase stub);
 * files are served from disk through route() (no http server). No browser: SKIPPED, exit 0 unless OMEGA_REQUIRE_BROWSER is set.
 */
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), ORIGIN = 'http://finance.test';
if (process.argv.includes('--help') || process.argv.includes('-h')) { console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0].replace(/^#!.*\n/, '').replace(/^\/\*\s?/, '')); process.exit(0); }
const si = process.argv.indexOf('--shots'); const SHOTS = si > 0 ? process.argv[si + 1] : null;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp' };
function loadPW() { const sp = process.env.OMEGA_SCRATCHPAD; for (const t of [sp && path.join(sp, 'node_modules', 'playwright'), sp && path.join(sp, 'node_modules', 'playwright-core'), 'playwright', 'playwright-core']) { if (!t) continue; try { return require(t); } catch (e) { } } return null; }
let STUB = null; try { STUB = require(path.join(ROOT, '.claude', 'skills', 'verify-in-browser', 'harness', 'sbstub.js')).STUB; } catch (e) { }
const pi = process.argv.indexOf('--pages'); const ONLY = pi > 0 ? process.argv[pi + 1].split(',') : null;   // for quick mutation runs
const PAGES = fs.readdirSync(ROOT).filter(f => f.endsWith('.html') && fs.readFileSync(path.join(ROOT, f), 'utf8').includes('src="/omega-finance-notice.js"')).filter(f => !ONLY || ONLY.includes(f)).sort();
const MODULE = fs.readFileSync(path.join(ROOT, 'omega-finance-notice.js'), 'utf8');
/* a page whose #app IS the flex-row shell (sidebar + content column inside it): the notice must go in the column, not become a third column */
const FIXTURE = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#05050B;color:#ddd">' +
  '<div id="app" class="shell" style="display:flex;min-height:100vh"><aside id="omega-side" style="width:88px;flex:none;background:#111">side</aside>' +
  '<section id="col" style="flex:1;padding:12px"><h1>Fixture heading</h1><p>content</p></section></div><script src="/omega-finance-notice.js"></script></body></html>';
const results = []; const check = (n, ok, d) => results.push({ name: n, ok: !!ok, detail: ok ? undefined : d });

(async () => {
  const pw = loadPW(); let browser;
  if (pw) for (const exe of [undefined, '/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome']) { try { browser = await pw.chromium.launch(exe ? { executablePath: exe } : {}); break; } catch (e) { } }
  if (!browser || !STUB) { console.log('SKIPPED: no playwright/browser (or the harness Supabase stub) available'); process.exit(process.env.OMEGA_REQUIRE_BROWSER ? 1 : 0); }
  check('the module is loaded by at least the fourteen money pages', ONLY || PAGES.length >= 14, PAGES.length);

  async function open(page, viewport) {
    const ctx = await browser.newContext({ serviceWorkers: 'block', viewport });
    const stub = page === 'income.html' ? STUB.replace('is_owner:false', 'is_owner:true') : STUB;   // income.html is owner-only and bounces a member
    await ctx.route(ORIGIN + '/**', async (route) => {
      if (new URL(route.request().url()).pathname === '/__shell-fixture.html') return route.fulfill({ status: 200, contentType: 'text/html', body: FIXTURE });
      let u = decodeURIComponent(new URL(route.request().url()).pathname); if (u === '/') u = '/index.html';
      const f = path.join(ROOT, path.normalize(u).replace(/^(\.\.[/\\])+/, ''));
      if (!f.startsWith(ROOT)) return route.fulfill({ status: 403, body: '' });
      if (u === '/vendor/supabase-js.js') return route.fulfill({ status: 200, contentType: 'text/javascript', body: stub });
      try { return route.fulfill({ status: 200, contentType: MIME[path.extname(f)] || 'application/octet-stream', body: fs.readFileSync(f) }); } catch (e) { return route.fulfill({ status: 404, body: '' }); }
    });
    await ctx.route('https://esm.sh/**', r => r.fulfill({ status: 200, contentType: 'text/javascript', body: stub }));
    await ctx.route('https://fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    await ctx.route('https://fonts.gstatic.com/**', r => r.fulfill({ status: 200, body: '' }));
    await ctx.addInitScript(() => { try { localStorage.setItem('omega_demo_watched_at', '2026-01-01T00:00:00Z'); localStorage.setItem('omega_consent_v1', 'all'); localStorage.setItem('omega_genesis_seen', '1'); } catch (e) { } });
    const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', e => errs.push(String(e.message).slice(0, 140)));
    await pg.goto(ORIGIN + '/' + page, { waitUntil: 'load', timeout: 60000 });
    return { ctx, pg, errs };
  }
  const probe = (pg) => pg.evaluate((mod) => {
    const all = document.querySelectorAll('#omega-finance-notice'), n = all[0];
    const o = { count: all.length, state: window.OmegaFinanceNotice && window.OmegaFinanceNotice.state().reason };
    if (!n) return o;
    const r = n.getBoundingClientRect(), cs = getComputedStyle(n), p = n.parentElement, side = document.getElementById('omega-side');
    o.visible = r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > 0.9;
    const h = document.querySelector('h1,.sechead'); o.beforeHeading = !h || (n.compareDocumentPosition(h) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0; o.hasHeading = !!h; o.parent = p.tagName + '.' + (p.className || p.id);
    o.parentIsShell = p.classList.contains('shell') || (side && p.contains(side));
    o.text = n.textContent; o.interactive = n.querySelectorAll('a,button,input,[tabindex]').length;
    o.rect = { l: r.left, r: r.right, w: r.width, h: r.height }; o.vw = innerWidth;
    o.sideRight = side ? side.getBoundingClientRect().right : 0;
    n.scrollIntoView({ block: 'center', behavior: 'instant' });
    const r2 = n.getBoundingClientRect(), e = document.elementFromPoint(r2.left + r2.width / 2, r2.top + r2.height / 2);
    o.top = !!e && n.contains(e);
    return o;
  });

  for (const page of PAGES) {
    const { ctx, pg, errs } = await open(page, { width: 1280, height: 900 });
    try { await pg.waitForSelector('#omega-finance-notice', { state: 'attached', timeout: 15000 }); } catch (e) { }
    await pg.waitForFunction(() => { const n = document.getElementById('omega-finance-notice'); if (!n) return true; const r = n.getBoundingClientRect(); return r.height > 0; }, null, { timeout: 15000 }).catch(() => { });
    await pg.waitForTimeout(300);
    const o = await probe(pg);
    const want = await pg.evaluate(() => window.OmegaFinanceNotice && (window.OmegaFinanceNotice.head + window.OmegaFinanceNotice.body));
    check(page + ': exactly one notice', o.count === 1, JSON.stringify({ count: o.count, state: o.state }));
    if (o.count === 1) {
      check(page + ': visible', o.visible, JSON.stringify(o));
      check(page + ': in the content column (not the shell) and before the page\'s first heading' + (o.hasHeading ? '' : ' (page has none)'), o.beforeHeading && !o.parentIsShell, o.parent + ' beforeHeading=' + o.beforeHeading);
      check(page + ': sits to the right of the sidebar and is wider than a sliver (not a third column)', o.rect.l >= o.sideRight - 2 && o.rect.w > 280, JSON.stringify(o.rect) + ' side ' + o.sideRight);
      check(page + ': carries the module\'s exact words', o.text === want && /NOT FINANCIAL ADVICE/.test(o.text) && /not a bank, broker, exchange or regulated financial service/.test(o.text), o.text.slice(0, 80));
      check(page + ': nothing covers it and it cannot be dismissed', o.top && o.interactive === 0, JSON.stringify({ top: o.top, interactive: o.interactive }));
    }
    /* only errors this module could have caused: wallet.html throws "drawAllocCanvas is not defined" on origin/main already (not ours) */
    const mine = errs.filter(e => /finance|notice|OmegaFinance/i.test(e));
    check(page + ': this module throws nothing', mine.length === 0, JSON.stringify(mine));
    if (SHOTS && page === 'investment.html') { fs.mkdirSync(SHOTS, { recursive: true }); await pg.screenshot({ path: path.join(SHOTS, 'investment-desktop.png') }); }
    await ctx.close();
  }
  /* phone: the notice must stay inside the viewport on every page */
  for (const page of PAGES) {
    const { ctx, pg } = await open(page, { width: 375, height: 800 });
    await pg.waitForSelector('#omega-finance-notice', { state: 'attached', timeout: 15000 }).catch(() => { });
    await pg.waitForTimeout(300);
    const o = await probe(pg);
    check(page + ' @375: notice stays inside the viewport', o.count === 1 && o.rect.l >= -1 && o.rect.r <= o.vw + 1, JSON.stringify({ c: o.count, r: o.rect, vw: o.vw }));
    if (SHOTS && page === 'investment.html') await pg.screenshot({ path: path.join(SHOTS, 'investment-mobile.png') });
    await ctx.close();
  }
  /* the shell-as-#app fixture */
  {
    const { ctx, pg } = await open('__shell-fixture.html', { width: 1280, height: 900 });
    await pg.waitForSelector('#omega-finance-notice', { timeout: 5000 }).catch(() => { });
    const f = await pg.evaluate(() => { const n = document.getElementById('omega-finance-notice'); return n ? { parent: n.parentElement.id, first: n.parentElement.firstElementChild === n, left: n.getBoundingClientRect().left, side: document.getElementById('omega-side').getBoundingClientRect().right, w: n.getBoundingClientRect().width } : null; });
    check('fixture where #app is the shell: the notice goes in the content column, first, to the right of the sidebar and full width of the column',
      !!f && f.parent === 'col' && f.first && f.left >= f.side && f.w > 400, JSON.stringify(f));
    await ctx.close();
  }
  /* negative control */
  {
    const { ctx, pg } = await open('dashboard.html', { width: 1280, height: 900 });
    await pg.waitForTimeout(1500);
    check('a page that does not load the module shows no notice (dashboard.html)', await pg.evaluate(() => !document.getElementById('omega-finance-notice') && !window.OmegaFinanceNotice), 'present');
    await ctx.close();
  }
  await browser.close();
  const bad = results.filter(r => !r.ok);
  results.forEach(r => console.log((r.ok ? 'PASS ' : 'FAIL ') + r.name + (r.ok ? '' : '  -> ' + r.detail)));
  console.log(`\n${results.length - bad.length}/${results.length} passed`);
  process.exit(bad.length ? 1 : 0);
})().catch(e => { console.error('ERROR', e); process.exit(1); });
