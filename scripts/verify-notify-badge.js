#!/usr/bin/env node
/* Browser check: the owner's notification badge (omega-notify.js, fixed top-right) must not cover the page's own top row.
 *
 * Usage: node scripts/verify-notify-badge.js [--root DIR]      (--root runs it against another checkout, e.g. a worktree of origin/main)
 *
 * Renders dashboard.html as an owner with 15 unread notifications at 360, 390 and 820 px wide (device scale 3), scrolls until the sticky
 * .omega-workspace row pins to the top (it only collides with the badge once pinned), and asserts the row's right edge is left of the badge
 * at every width. A page with no such row is skipped for that width. Files are served from disk through route().
 * No browser: SKIPPED, exit 0 unless OMEGA_REQUIRE_BROWSER is set.
 */
const fs = require('fs'), path = require('path');
if (process.argv.includes('--help') || process.argv.includes('-h')) { console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0].replace(/^#!.*\n/, '').replace(/^\/\*\s?/, '')); process.exit(0); }
const ri = process.argv.indexOf('--root');
const ROOT = ri > 0 ? path.resolve(process.argv[ri + 1]) : path.resolve(__dirname, '..'), ORIGIN = 'https://notif.test';
const HARNESS = path.resolve(__dirname, '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp' };
function loadPW() { const sp = process.env.OMEGA_SCRATCHPAD; for (const t of [sp && path.join(sp, 'node_modules', 'playwright'), sp && path.join(sp, 'node_modules', 'playwright-core'), 'playwright', 'playwright-core']) { if (!t) continue; try { return require(t); } catch (e) { } } return null; }
let STUB = null; try { STUB = require(path.join(HARNESS, '.claude', 'skills', 'verify-in-browser', 'harness', 'sbstub.js')).STUB; } catch (e) { }
(async () => {
  const pw = loadPW(); let browser;
  if (pw) for (const exe of [undefined, '/opt/pw-browsers/chromium']) { try { browser = await pw.chromium.launch(exe ? { executablePath: exe } : {}); break; } catch (e) { } }
  if (!browser || !STUB) { console.log('SKIPPED: no playwright/browser (or the harness Supabase stub) available'); process.exit(process.env.OMEGA_REQUIRE_BROWSER ? 1 : 0); }
  /* an owner, and 15 rows for every list read, so the badge shows 15 */
  const OWNER = STUB.replace('is_owner:false', 'is_owner:true').replace('{data:[],error:null,count:0,status:200}',
    "{data:Array.from({length:15},(_,i)=>({id:'p'+i,status:'pending',access_approved:false,read:false,title:'t',message:'m',created_at:new Date().toISOString()})),error:null,count:15,status:200}");
  const results = []; const check = (n, ok, d) => results.push({ name: n, ok: !!ok, detail: ok ? undefined : d });
  for (const w of [360, 390, 820]) {
    const ctx = await browser.newContext({ serviceWorkers: 'block', viewport: { width: w, height: 844 }, deviceScaleFactor: 3, isMobile: w < 700, hasTouch: w < 700, reducedMotion: 'reduce' });
    await ctx.route(ORIGIN + '/**', async (route) => {
      let u = decodeURIComponent(new URL(route.request().url()).pathname); if (u === '/') u = '/index.html';
      if (u === '/vendor/supabase-js.js') return route.fulfill({ status: 200, contentType: 'text/javascript', body: OWNER });
      const f = path.join(ROOT, path.normalize(u).replace(/^(\.\.[/\\])+/, ''));
      try { return route.fulfill({ status: 200, contentType: MIME[path.extname(f)] || 'application/octet-stream', body: fs.readFileSync(f) }); } catch (e) { return route.fulfill({ status: 404, body: '' }); }
    });
    await ctx.route('https://esm.sh/**', r => r.fulfill({ status: 200, contentType: 'text/javascript', body: OWNER }));
    await ctx.route('https://fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    await ctx.route('https://fonts.gstatic.com/**', r => r.fulfill({ status: 200, body: '' }));
    await ctx.addInitScript(() => { try { localStorage.setItem('omega_demo_watched_at', '2026-01-01T00:00:00Z'); localStorage.setItem('omega_consent_v1', 'all'); localStorage.setItem('omega_genesis_seen', '1'); } catch (e) { } });
    const pg = await ctx.newPage();
    await pg.goto(ORIGIN + '/dashboard.html', { waitUntil: 'load', timeout: 60000 }); await pg.waitForTimeout(4500);
    const m = await pg.evaluate(async () => {
      const bd = document.getElementById('omega-notif-badge'), ws = document.querySelector('.omega-workspace');
      if (!bd || getComputedStyle(bd).display === 'none') return { badge: false };
      if (!ws) return { badge: true, ws: false };
      for (let y = 0; y < 4000; y += 80) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 30)); const t = ws.getBoundingClientRect().top; if (t >= -1 && t <= 2 && y > 200) break; }
      await new Promise(r => setTimeout(r, 300));
      const a = bd.getBoundingClientRect(), c = ws.getBoundingClientRect();
      return { badge: true, ws: true, badgeLeft: Math.round(a.left), wsRight: Math.round(c.right), marginRight: getComputedStyle(ws).marginRight, attr: document.documentElement.getAttribute('data-omega-notif') };
    });
    check(w + 'px: the badge shows with 15 unread', m.badge, m);
    if (m.ws) check(w + 'px: the top row ends left of the badge (no tab is covered)', m.wsRight <= m.badgeLeft, m);
    check(w + 'px: the page does not gain a horizontal scroll', await pg.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth) <= 1, w);
    await ctx.close();
  }
  await browser.close();
  const bad = results.filter(r => !r.ok);
  results.forEach(r => console.log((r.ok ? 'PASS ' : 'FAIL ') + r.name + (r.ok ? '' : '  -> ' + JSON.stringify(r.detail))));
  console.log(`\n${results.length - bad.length}/${results.length} passed`);
  process.exit(bad.length ? 1 : 0);
})().catch(e => { console.error('ERROR', e); process.exit(1); });
