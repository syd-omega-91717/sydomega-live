#!/usr/bin/env node
/* Browser validation for the per-task dimension shift (omega-dimension-shift.js + bg.js's fetch recorder + omega-backdrop.js + the council scene).
 *
 * Usage: node scripts/verify-dimension-shift.js [--shots DIR]
 *
 * Drives the REAL chain on real pages (sculpture.html, dashboard.html): a POST to /rest/v1/task_completions that settles ok makes bg.js's recorder
 * report method+pathname, the module reads the member's element (published by omega-backdrop.js from the profile the stub returns: Aries/Fire), and
 * a wash, a "REALM OF FIRE" label, one polite screen-reader line and a window event appear and then clean up. Negative cases matter as much: a GET, a
 * POST to another table, a failed insert, and a burst must not (re)trigger it, and a token in the query string must never appear in any event.
 * Also: reduced motion shows the label with no wash; the council's matching coins brighten; zero page errors.
 * Files are served from disk via route() (no http server). Software WebGL. No browser: SKIPPED, exit 0 unless OMEGA_REQUIRE_BROWSER is set.
 */
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), ORIGIN = 'http://shift.test';
if (process.argv.includes('--help') || process.argv.includes('-h')) { console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0].replace(/^#!.*\n/, '').replace(/^\/\*\s?/, '')); process.exit(0); }
const si = process.argv.indexOf('--shots'); const SHOTS = si > 0 ? process.argv[si + 1] : null;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
function loadPW() { const sp = process.env.OMEGA_SCRATCHPAD; for (const t of [sp && path.join(sp, 'node_modules', 'playwright'), sp && path.join(sp, 'node_modules', 'playwright-core'), 'playwright', 'playwright-core'].filter(Boolean)) { try { return require(t); } catch (e) { } } return null; }
let STUB = null; try { STUB = require(path.join(ROOT, '.claude', 'skills', 'verify-in-browser', 'harness', 'sbstub.js')).STUB; } catch (e) { }
const results = []; const check = (n, ok, d) => results.push({ name: n, ok: !!ok, detail: ok ? undefined : d });

(async () => {
  const pw = loadPW(); let browser;
  const args = ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
  if (pw) for (const exe of [undefined, '/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome']) { try { browser = await pw.chromium.launch({ ...(exe ? { executablePath: exe } : {}), args }); break; } catch (e) { } }
  if (!browser || !STUB) { console.log('SKIPPED: no playwright/browser (or the harness Supabase stub) available'); process.exit(process.env.OMEGA_REQUIRE_BROWSER ? 1 : 0); }

  async function open({ page = '/sculpture.html', reduce = false } = {}) {
    const ctx = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 900 }, reducedMotion: reduce ? 'reduce' : 'no-preference' });
    await ctx.route(ORIGIN + '/**', async (route) => {
      let u = decodeURIComponent(new URL(route.request().url()).pathname); if (u === '/') u = '/index.html';
      const f = path.join(ROOT, path.normalize(u).replace(/^(\.\.[/\\])+/, ''));
      if (!f.startsWith(ROOT)) return route.fulfill({ status: 403, body: '' });
      if (u === '/vendor/supabase-js.js') return route.fulfill({ status: 200, contentType: 'text/javascript', body: STUB });
      try { return route.fulfill({ status: 200, contentType: MIME[path.extname(f)] || 'application/octet-stream', body: fs.readFileSync(f) }); } catch (e) { return route.fulfill({ status: 404, body: 'nf' }); }
    });
    /* registered AFTER the catch-all file route above: Playwright gives the most recently registered matching route priority */
    await ctx.route(ORIGIN + '/rest/v1/**', (r) => { const u = r.request().url(), m = r.request().method();
      if (/status=400/.test(u)) return r.fulfill({ status: 400, contentType: 'application/json', body: '{"message":"bad"}' });
      return r.fulfill({ status: m === 'POST' ? 201 : 200, contentType: 'application/json', body: '[]' }); });
    await ctx.route('https://esm.sh/**', r => r.fulfill({ status: 200, contentType: 'text/javascript', body: STUB }));
    await ctx.route('https://fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    await ctx.route('https://fonts.gstatic.com/**', r => r.fulfill({ status: 200, body: '' }));
    await ctx.addInitScript(() => {
      try { localStorage.setItem('omega_demo_watched_at', '2026-01-01T00:00:00Z'); localStorage.setItem('omega_consent_v1', 'all'); localStorage.setItem('omega_last_gate', '99'); localStorage.setItem('omega_genesis_seen', '1'); } catch (e) { }
      window.__shifts = []; window.__settled = [];
      window.addEventListener('omega:dimension-shift', e => window.__shifts.push(e.detail));
      document.addEventListener('omega:fetch-settled', e => window.__settled.push(e.detail));
    });
    const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', e => errs.push(String(e.message).slice(0, 160)));
    await pg.goto(ORIGIN + page, { waitUntil: 'load', timeout: 60000 });
    await pg.waitForFunction(() => window.OmegaMemberElement === 'FIRE' && window.OmegaDimensionShift, null, { timeout: 30000 }).catch(() => { });
    return { ctx, pg, errs };
  }
  const post = (pg, url, method = 'POST') => pg.evaluate(async ([u, m]) => { try { const r = await fetch(u, { method: m, headers: { 'content-type': 'application/json' }, body: m === 'POST' ? '{}' : undefined }); return r.status; } catch (e) { return 'ERR'; } }, [url, method]);
  const count = (pg) => pg.evaluate(() => window.__shifts.length);
  const gap = (pg) => pg.waitForTimeout(2700);   /* past the module's 2.5 s throttle */

  /* 1. the real chain on the council page */
  {
    const { ctx, pg, errs } = await open();
    check('the member element reaches the module (published by the backdrop from the profile)', await pg.evaluate(() => window.OmegaMemberElement === 'FIRE' && window.OmegaDimensionShift.element() === 'FIRE'));
    const st = await post(pg, '/rest/v1/task_completions?on_conflict=user_id%2Ctask');
    check('a successful POST to task_completions (with a query string) settles ok', st === 201, st);
    await pg.waitForFunction(() => !!document.getElementById('omega-dimension-label'), null, { timeout: 3000 }).catch(() => { });
    const ui = await pg.evaluate(() => { const w = document.getElementById('omega-dimension-wash'), l = document.getElementById('omega-dimension-label'), live = document.getElementById('omega-dimension-live');
      const hit = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
      return { wash: !!w, washBg: w && w.style.background.slice(0, 60), washPE: w && getComputedStyle(w).pointerEvents, label: l && l.textContent, labelPE: l && getComputedStyle(l).pointerEvents, live: live && live.textContent, hitIsWash: !!(w && hit === w), shifts: window.__shifts.length, ev: window.__shifts[0] }; });
    check('the shift appears: a wash and the label "REALM OF FIRE"', ui.wash && ui.label === 'REALM OF FIRE', ui);
    check('the wash and the label never intercept the pointer', ui.washPE === 'none' && ui.labelPE === 'none' && !ui.hitIsWash, ui);
    await pg.waitForFunction(() => /realm of fire/i.test((document.getElementById('omega-dimension-live') || {}).textContent || ''), null, { timeout: 3000 }).catch(() => { });
    check('one polite screen-reader line says so', await pg.evaluate(() => /Realm of fire/i.test(document.getElementById('omega-dimension-live').textContent) && document.getElementById('omega-dimension-live').getAttribute('aria-live') === 'polite'));
    check('the window event carries the element and its source', ui.shifts === 1 && ui.ev && ui.ev.element === 'FIRE' && ui.ev.source === 'task_completions', ui);
    const det = await pg.evaluate(() => window.__settled.filter(d => d && d.m === 'POST'));
    check('bg.js reports method and PATHNAME only (the query string never appears)', det.length >= 1 && det.every(d => d.p === '/rest/v1/task_completions') && !JSON.stringify(det).includes('on_conflict'), det);
    if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await pg.screenshot({ path: path.join(SHOTS, 'shift-wash.png') }); }
    await pg.waitForTimeout(2300);
    check('everything cleans itself up (no wash, no label left behind)', await pg.evaluate(() => !document.getElementById('omega-dimension-wash') && !document.getElementById('omega-dimension-label')));

    /* 2. what must NOT trigger it */
    await gap(pg); let n0 = await count(pg);
    await post(pg, '/rest/v1/task_completions?select=*', 'GET'); await pg.waitForTimeout(400);
    check('NOT a GET of task_completions', (await count(pg)) === n0);
    await post(pg, '/rest/v1/habits'); await pg.waitForTimeout(400);
    check('NOT a POST to another table', (await count(pg)) === n0);
    await post(pg, '/rest/v1/task_completions?status=400'); await pg.waitForTimeout(400);
    check('NOT a failed insert (HTTP 400)', (await count(pg)) === n0);
    await post(pg, '/rest/v1/task_completions_archive'); await pg.waitForTimeout(400);
    check('NOT a look-alike path (task_completions_archive)', (await count(pg)) === n0);
    const leaked = await pg.evaluate(() => JSON.stringify(window.__settled));
    await post(pg, '/rest/v1/habits?apikey=SECRET123TOKEN'); await pg.waitForTimeout(300);
    check('a token in a query string never appears in any recorder event', !(await pg.evaluate(() => JSON.stringify(window.__settled))).includes('SECRET123TOKEN'), 'leaked');

    /* 3. a burst is one shift; the next one after the gap is another; the habits event joins the same shift */
    await gap(pg); n0 = await count(pg);
    await Promise.all([post(pg, '/rest/v1/task_completions'), post(pg, '/rest/v1/task_completions'), post(pg, '/rest/v1/task_completions')]); await pg.waitForTimeout(500);
    await pg.evaluate(() => document.dispatchEvent(new CustomEvent('omega:task-complete', { detail: {} }))); await pg.waitForTimeout(300);
    check('a burst of saves (and the habits event beside them) is ONE shift', (await count(pg)) === n0 + 1, { n0, now: await count(pg) });
    await gap(pg);
    await pg.evaluate(() => document.dispatchEvent(new CustomEvent('omega:task-complete', { detail: {} }))); await pg.waitForTimeout(300);
    check('the habits event alone is a shift once the gap has passed', (await count(pg)) === n0 + 2, { n0, now: await count(pg) });
    check('no page errors', errs.length === 0, errs);
    await ctx.close();
  }

  /* 4. reduced motion: the label and the line, no wash, no animation */
  {
    const { ctx, pg } = await open({ reduce: true });
    await post(pg, '/rest/v1/task_completions');
    await pg.waitForFunction(() => !!document.getElementById('omega-dimension-label'), null, { timeout: 3000 }).catch(() => { });
    const r = await pg.evaluate(() => ({ wash: !!document.getElementById('omega-dimension-wash'), label: (document.getElementById('omega-dimension-label') || {}).textContent, anims: document.getAnimations().filter(an => an.effect && an.effect.target && /^omega-dimension/.test(an.effect.target.id || '')).length, live: !!document.getElementById('omega-dimension-live') }));
    check('reduced motion: the label and the spoken line appear, with no wash and nothing animating', !r.wash && r.label === 'REALM OF FIRE' && r.live && r.anims === 0, r);
    await ctx.close();
  }

  /* 5. it works on other pages, not just the one that holds the council */
  {
    const { ctx, pg, errs } = await open({ page: '/dashboard.html' });
    await post(pg, '/rest/v1/task_completions');
    await pg.waitForFunction(() => !!document.getElementById('omega-dimension-label'), null, { timeout: 4000 }).catch(() => { });
    check('dashboard.html: the same save gives the same shift (platform-wide, no per-page code)', await pg.evaluate(() => (document.getElementById('omega-dimension-label') || {}).textContent === 'REALM OF FIRE'));
    check('dashboard.html: no page errors', errs.length === 0, errs);
    await ctx.close();
  }

  /* 6. the council's coins answer: the Fire executors brighten (Sentinel, Sovereign, Beacon), measured against a shift for an element no executor has */
  {
    const { ctx, pg, errs } = await open();
    await pg.evaluate(() => document.querySelector('[data-omega-sculpture="council"]').scrollIntoView({ block: 'center' }));
    const SEL = '[data-omega-sculpture="council"] canvas';
    const mass = () => pg.evaluate((sel) => { const c = document.querySelector(sel), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let b = 0; for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] > 560) b++; return b / (c.width * c.height) * 100; }, SEL);
    await pg.waitForFunction((sel) => { const c = document.querySelector(sel); if (!c || !c.width) return false; const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 40) if (d[i] + d[i + 1] + d[i + 2] > 240) n++; return n > 60; }, SEL, { timeout: 45000 }).catch(() => { });
    await pg.waitForTimeout(2500);
    const best = async (k) => { let m = 0; for (let i = 0; i < k; i++) { m = Math.max(m, await mass()); await pg.waitForTimeout(120); } return m; };
    /* VOID: no executor has it, so the scene must not react; FIRE: three executors do */
    await pg.evaluate(() => { window.OmegaMemberElement = 'VOID'; window.OmegaDimensionShift.trigger('test'); });
    const voidMass = await best(5); await pg.waitForTimeout(2600);
    await pg.evaluate(() => { window.OmegaMemberElement = 'FIRE'; window.OmegaDimensionShift.trigger('test'); });
    const fireMass = await best(5);
    console.log('      [measured] council coin-face area during a shift: element no executor has = ' + voidMass.toFixed(2) + ' %, Fire = ' + fireMass.toFixed(2) + ' %');
    check('the council: the matching executors brighten (Fire shift shows clearly more coin-face area than a shift nobody answers)', fireMass > voidMass * 1.15, { voidMass, fireMass });
    check('the council: no page errors', errs.length === 0, errs);
    await ctx.close();
  }

  await browser.close();
  const failed = results.filter(r => !r.ok);
  results.forEach(r => console.log((r.ok ? 'PASS  ' : 'FAIL  ') + r.name + (r.ok ? '' : '\n      ' + JSON.stringify(r.detail))));
  console.log(`\n${results.length - failed.length}/${results.length} passed`); process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
