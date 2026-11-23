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
  /* Past the module's 2.5 s throttle, measured from the LAST SHIFT THAT ACTUALLY HAPPENED (detail.at), not from when the test last looked: on a starved machine a
     shift can land late, and a fixed sleep then ends inside the throttle and the next event is (correctly) dropped. */
  const gap = (pg) => pg.waitForFunction(() => { const a = window.__shifts, last = a.length ? a[a.length - 1].at : 0; return Date.now() - last > 2650; }, null, { timeout: 30000, polling: 100 });
  const countReaches = (pg, n) => pg.waitForFunction((k) => window.__shifts.length >= k, n, { timeout: 15000 }).catch(() => { });

  /* 1. the real chain on the council page */
  {
    const { ctx, pg, errs } = await open();
    check('the member element reaches the module (published by the backdrop from the profile)', await pg.evaluate(() => window.OmegaMemberElement === 'FIRE' && window.OmegaDimensionShift.element() === 'FIRE'));
    /* Snapshot the wash and the label at the moment the label is inserted, not after a wait: the label lives 1.7 s, and on a starved machine a later read can land after it is gone. */
    await pg.evaluate(() => { window.__uiSnap = null; new MutationObserver((_, mo) => { const l = document.getElementById('omega-dimension-label'); if (!l || window.__uiSnap) return; const w = document.getElementById('omega-dimension-wash'), hit = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
      window.__uiSnap = { wash: !!w, washBg: w && w.style.background.slice(0, 60), washPE: w && getComputedStyle(w).pointerEvents, label: l.textContent, labelPE: getComputedStyle(l).pointerEvents, hitIsWash: !!(w && hit === w) }; mo.disconnect(); }).observe(document.body, { childList: true }); });
    const st = await post(pg, '/rest/v1/task_completions?on_conflict=user_id%2Ctask');
    check('a successful POST to task_completions (with a query string) settles ok', st === 201, st);
    await pg.waitForFunction(() => !!window.__uiSnap && window.__shifts.length >= 1, null, { timeout: 15000 }).catch(() => { });
    const ui = await pg.evaluate(() => Object.assign({}, window.__uiSnap, { shifts: window.__shifts.length, ev: window.__shifts[0] }));
    check('the shift appears: a wash and the label "REALM OF FIRE"', ui.wash && ui.label === 'REALM OF FIRE', ui);
    check('the wash and the label never intercept the pointer', ui.washPE === 'none' && ui.labelPE === 'none' && !ui.hitIsWash, ui);
    await pg.waitForFunction(() => /realm of fire/i.test((document.getElementById('omega-dimension-live') || {}).textContent || ''), null, { timeout: 3000 }).catch(() => { });
    check('one polite screen-reader line says so', await pg.evaluate(() => /Realm of fire/i.test(document.getElementById('omega-dimension-live').textContent) && document.getElementById('omega-dimension-live').getAttribute('aria-live') === 'polite'));
    check('the window event carries the element and its source', ui.shifts === 1 && ui.ev && ui.ev.element === 'FIRE' && ui.ev.source === 'task_completions', ui);
    const det = await pg.evaluate(() => window.__settled.filter(d => d && d.m === 'POST'));
    check('bg.js reports method and PATHNAME only (the query string never appears)', det.length >= 1 && det.every(d => d.p === '/rest/v1/task_completions') && !JSON.stringify(det).includes('on_conflict'), det);
    if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await pg.screenshot({ path: path.join(SHOTS, 'shift-wash.png') }); }
    await pg.waitForFunction(() => !document.getElementById('omega-dimension-wash') && !document.getElementById('omega-dimension-label'), null, { timeout: 15000 }).catch(() => { });   /* they remove themselves after 1.3 s / 1.8 s; wait for that, not for a guess */
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
    /* The burst is dispatched in ONE synchronous tick (three settled saves exactly as bg.js reports them, plus the habits event). Three real network saves can settle more than
       2.5 s apart on a starved machine, and the throttle then correctly lets each through as its own shift: that tests the machine, not the module. Section 1 covers the real chain. */
    await pg.evaluate(() => { for (let i = 0; i < 3; i++) document.dispatchEvent(new CustomEvent('omega:fetch-settled', { detail: { ok: true, m: 'POST', p: '/rest/v1/task_completions', status: 201 } })); document.dispatchEvent(new CustomEvent('omega:task-complete', { detail: {} })); });
    await countReaches(pg, n0 + 1); await pg.waitForTimeout(900);          /* it happened; now give any (wrong) extra shift time to show */
    check('a burst of saves (and the habits event beside them) is ONE shift', (await count(pg)) === n0 + 1, { n0, now: await count(pg) });
    await gap(pg);
    await pg.evaluate(() => document.dispatchEvent(new CustomEvent('omega:task-complete', { detail: {} })));
    await countReaches(pg, n0 + 2); await pg.waitForTimeout(600);
    check('the habits event alone is a shift once the gap has passed', (await count(pg)) === n0 + 2, { n0, now: await count(pg) });
    check('no page errors', errs.length === 0, errs);
    await ctx.close();
  }

  /* 4. reduced motion: the label and the line, no wash, no animation */
  {
    const { ctx, pg } = await open({ reduce: true });
    /* snapshot when the label is inserted (it lives 1.7 s; a late read on a starved machine finds it gone) */
    await pg.evaluate(() => { window.__rm = null; new MutationObserver((_, mo) => { const l = document.getElementById('omega-dimension-label'); if (!l || window.__rm) return;
      window.__rm = { wash: !!document.getElementById('omega-dimension-wash'), label: l.textContent, anims: document.getAnimations().filter(an => an.effect && an.effect.target && /^omega-dimension/.test(an.effect.target.id || '')).length }; mo.disconnect(); }).observe(document.body, { childList: true }); });
    await post(pg, '/rest/v1/task_completions');
    await pg.waitForFunction(() => !!window.__rm, null, { timeout: 15000 }).catch(() => { });
    await pg.waitForFunction(() => !!document.getElementById('omega-dimension-live'), null, { timeout: 5000 }).catch(() => { });
    const r = await pg.evaluate(() => Object.assign({}, window.__rm, { live: !!document.getElementById('omega-dimension-live') }));
    check('reduced motion: the label and the spoken line appear, with no wash and nothing animating', !r.wash && r.label === 'REALM OF FIRE' && r.live && r.anims === 0, r);
    await ctx.close();
  }

  /* 5. it works on other pages, not just the one that holds the council */
  {
    const { ctx, pg, errs } = await open({ page: '/dashboard.html' });
    await pg.evaluate(() => { window.__lbl = null; new MutationObserver((_, mo) => { const l = document.getElementById('omega-dimension-label'); if (l && !window.__lbl) { window.__lbl = l.textContent; mo.disconnect(); } }).observe(document.body, { childList: true }); });   /* the label lives 1.7 s: record it when it is inserted */
    await post(pg, '/rest/v1/task_completions');
    await pg.waitForFunction(() => !!window.__lbl, null, { timeout: 15000 }).catch(() => { });
    check('dashboard.html: the same save gives the same shift (platform-wide, no per-page code)', await pg.evaluate(() => window.__lbl === 'REALM OF FIRE'), await pg.evaluate(() => window.__lbl));
    check('dashboard.html: no page errors', errs.length === 0, errs);
    await ctx.close();
  }

  /* 6. the council's coins answer: the Fire executors brighten (Sentinel, Sovereign, Beacon), measured against a shift for an element no executor has */
  {
    const { ctx, pg, errs } = await open();
    await pg.evaluate(() => document.querySelector('[data-omega-sculpture="council"]').scrollIntoView({ block: 'center' }));
    /* The cause, not the pixels: the council publishes which seats are answering (scene.answering, via OmegaSculpture.status()). The first version of this check
       compared total canvas brightness between two runs; the scene swings ~40 percent by itself, so it failed intermittently on a correct build. */
    const AG = JSON.parse(require('fs').readFileSync(require('path').join(ROOT, 'omega-agents.json'), 'utf8')).agents.slice(0, 12);
    const seatsOf = (el) => AG.map((a, i) => (String(a.element).toLowerCase() === el ? i : -1)).filter(i => i >= 0);
    const want = seatsOf('fire'), wantWater = seatsOf('water');
    const state = () => pg.evaluate(() => { const m = window.OmegaSculpture.status().find(x => x.kind === 'council'); return m ? { live: m.live, answering: m.answering } : null; });
    /* trigger() returns false while the module's 2.5 s throttle holds, so retry until it actually fired: a fixed sleep either wastes time or loses the race */
    const shiftFor = async (el) => { for (let i = 0; i < 80; i++) { if (await pg.evaluate((e) => { window.OmegaMemberElement = e; return window.OmegaDimensionShift.trigger('test'); }, el)) return true; await pg.waitForTimeout(150); } return false; };
    /* The pulse lasts 1.9 s. On a starved machine the council's frame loop can skip that whole window, which is the product behaving correctly, not a bug: so the
       check retries the shift (up to 5 times) and judges the FIRST non-empty answer. A scene that never answers still fails; a wrong set fails at once. */
    const answerFor = async (el) => { for (let a = 0; a < 5; a++) { if (!(await shiftFor(el))) return { fired: false, got: [] }; const t0 = Date.now(); while (Date.now() - t0 < 1700) { const g = (await state()).answering; if (g.length) return { fired: true, got: g, attempts: a + 1 }; await pg.waitForTimeout(60); } } return { fired: true, got: [], attempts: 5 }; };
    await pg.waitForFunction(() => { const m = window.OmegaSculpture.status().find(x => x.kind === 'council'); return !!m && m.live && Array.isArray(m.answering); }, null, { timeout: 30000 });
    const calm = await state();
    /* a shift for an element no executor has: nobody answers, over the whole window */
    check('the council: the VOID shift fired', await shiftFor('VOID'));
    let voidSeen = []; for (let i = 0; i < 8; i++) { voidSeen = voidSeen.concat((await state()).answering); await pg.waitForTimeout(120); }
    const fire = await answerFor('FIRE');
    await pg.waitForFunction(() => window.OmegaSculpture.status().find(x => x.kind === 'council').answering.length === 0, null, { timeout: 15000 }).catch(() => { });   /* it must clear on its own (the pulse is 1.9 s; a starved frame loop only delays the read) */
    const after = await state();
    const water = await answerFor('WATER');
    check('the council: before any shift nobody is answering', calm && calm.answering.length === 0, calm);
    check('the council: a shift for an element no executor has makes no seat answer (checked across the whole window)', voidSeen.length === 0, voidSeen);
    check('the council: a Fire shift makes exactly the Fire executors answer (' + want.map(i => AG[i].name).join(', ') + ' = seats ' + want.join(',') + ' from omega-agents.json)', fire.fired && JSON.stringify(fire.got) === JSON.stringify(want), { want, fire });
    check('the council: the answer is a pulse, not a state -- it clears by itself', after && after.answering.length === 0, after);
    check('the council: a Water shift lights exactly the Water executors (the answer follows the member element, it is not hard-wired to Fire)', water.fired && JSON.stringify(water.got) === JSON.stringify(wantWater), { wantWater, water });
    check('the council: no page errors', errs.length === 0, errs);
    await ctx.close();
  }

  /* 7. reduced motion: no seat animates, so none answers (the label and the spoken line still appear: check 4) */
  {
    const { ctx, pg } = await open({ reduce: true });
    await pg.evaluate(() => document.querySelector('[data-omega-sculpture="council"]').scrollIntoView({ block: 'center' }));
    await pg.waitForFunction(() => { const m = window.OmegaSculpture.status().find(x => x.kind === 'council'); return !!m && m.live && Array.isArray(m.answering); }, null, { timeout: 30000 }).catch(() => { });
    await pg.evaluate(() => { window.OmegaMemberElement = 'FIRE'; window.OmegaDimensionShift.trigger('test'); });
    let seen = []; for (let i = 0; i < 8; i++) { seen = seen.concat(await pg.evaluate(() => (window.OmegaSculpture.status().find(x => x.kind === 'council') || { answering: ['no-council'] }).answering)); await pg.waitForTimeout(120); }
    check('reduced motion: a Fire shift makes no seat answer', seen.length === 0, seen);
    await ctx.close();
  }

  await browser.close();
  const failed = results.filter(r => !r.ok);
  results.forEach(r => console.log((r.ok ? 'PASS  ' : 'FAIL  ') + r.name + (r.ok ? '' : '\n      ' + JSON.stringify(r.detail))));
  console.log(`\n${results.length - failed.length}/${results.length} passed`); process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
