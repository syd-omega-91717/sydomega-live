#!/usr/bin/env node
/* Browser validation for the opt-in deterministic script pipeline in bg.js.
 *
 * Usage: node scripts/verify-script-pipeline.js [--json]
 *
 * Extracts the REAL loader block from bg.js (between the Ω-SCRIPT-PIPELINE:begin marker and the
 * `Platform nervous system` comment: pipeline + __omegaIdleAppend + __omegaAppend) and runs it in headless
 * Chromium against routed fixture scripts, so every assertion exercises shipped code, not a copy.
 * Covers: flag-OFF parity, execution order, shared promises, failure, explicit retry, timeout (+ late load,
 * no retry), dependency blocking, optional dependency, cycle detection, critical protection, existing-tag
 * dedup, and diagnostic-event URL hygiene.
 *
 * Zero repo deps. Resolves playwright from $OMEGA_SCRATCHPAD or a normal require. With no browser it prints
 * SKIPPED and exits 0 unless OMEGA_REQUIRE_BROWSER is set (then it fails), matching scripts/verify-runtime.js.
 * It proves the loader contract in isolation; it does not prove production performance or full-page parity
 * (run scripts/verify-runtime.js with the flag set for that, see docs/DETERMINISTIC_SCRIPT_PIPELINE_PHASE1.md).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const JSON_OUT = process.argv.includes('--json');
const REQUIRE = !!process.env.OMEGA_REQUIRE_BROWSER;

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0].replace(/^#!.*\n/, '').replace(/^\/\*\s?/, ''));
  process.exit(0);
}

function loadPlaywright() {
  const sp = process.env.OMEGA_SCRATCHPAD;
  const tries = [sp && path.join(sp, 'node_modules', 'playwright'), sp && path.join(sp, 'node_modules', 'playwright-core'), 'playwright', 'playwright-core'].filter(Boolean);
  for (const t of tries) { try { return require(t); } catch (e) { /* next */ } }
  return null;
}

function extractBlock() {
  const bg = fs.readFileSync(path.join(ROOT, 'bg.js'), 'utf8');
  const a = bg.indexOf('/* Ω-SCRIPT-PIPELINE:begin');
  const b = bg.indexOf('/* Platform nervous system */');
  if (a < 0 || b < a) throw new Error('pipeline block markers not found in bg.js');
  return bg.slice(a, b);
}

const results = [];
function check(name, ok, detail) { results.push({ name, ok: !!ok, detail: ok ? undefined : detail }); }

(async () => {
  const pw = loadPlaywright();
  let browser;
  if (pw) {
    const exes = [undefined, '/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'];
    for (const exe of exes) {
      try { browser = await pw.chromium.launch(exe ? { executablePath: exe } : {}); break; } catch (e) { /* next */ }
    }
  }
  if (!browser) {
    console.log('SKIPPED: no playwright/browser available');
    process.exit(REQUIRE ? 1 : 0);
  }
  const block = extractBlock();
  const ORIGIN = 'http://pipe.test';

  /* fixture server: each fixture script records its execution into window.__order */
  async function page(flag, handlers) {
    const ctx = await browser.newContext();
    const pg = await ctx.newPage();
    const hits = {};
    await pg.route(ORIGIN + '/**', async (route) => {
      const u = new URL(route.request().url());
      hits[u.pathname] = (hits[u.pathname] || 0) + 1;
      if (u.pathname === '/') return route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><head></head><body></body></html>' });
      if (u.pathname === '/with-tag.html') return route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><head></head><body><script src="/pre.js"></script></body></html>' });
      const h = handlers[u.pathname] || {};
      if (h.fail && !(h.failOnce && hits[u.pathname] > 1)) return route.abort('failed');
      if (h.delay) await new Promise(r => setTimeout(r, h.delay));
      return route.fulfill({ contentType: 'text/javascript', body: `(window.__order=window.__order||[]).push(${JSON.stringify(u.pathname)});` });
    });
    await pg.addInitScript((f) => { try { if (f) localStorage.setItem('omega_script_pipeline', '1'); } catch (e) { } window.__events = []; window.addEventListener('omega:script-pipeline', e => window.__events.push(e.detail)); }, flag);
    await pg.goto(ORIGIN + (handlers.__start || '/'));
    await pg.addScriptTag({ content: block });
    return { pg, ctx, hits };
  }
  const ap = (pg, p) => pg.evaluate((p) => { const s = document.createElement('script'); s.src = p; __omegaAppend(s); return s.async; }, p);
  const wait = (pg, fn, arg) => pg.waitForFunction(fn, arg, { timeout: 5000 });

  /* 1. flag OFF: no pipeline, legacy ordering untouched */
  {
    const { pg, ctx } = await page(false, { '/a.js': { delay: 300 }, '/b.js': {} });
    const asyncFlag = await ap(pg, '/a.js'); await ap(pg, '/b.js');
    await wait(pg, () => (window.__order || []).length === 2);
    const o = await pg.evaluate(() => window.__order);
    check('flag OFF: OmegaScriptPipeline not published', await pg.evaluate(() => typeof window.OmegaScriptPipeline === 'undefined'));
    check('flag OFF: el.async untouched (legacy default true)', asyncFlag === true, asyncFlag);
    check('flag OFF: legacy completion order unchanged (fast b before slow a)', o[0] === '/b.js' && o[1] === '/a.js', o);
    await ctx.close();
  }

  /* 2. flag ON: deterministic execution order despite reversed latency, async=false */
  {
    const { pg, ctx } = await page(true, { '/a.js': { delay: 300 }, '/b.js': { delay: 50 }, '/c.js': {} });
    const asyncFlag = await ap(pg, '/a.js'); await ap(pg, '/b.js'); await ap(pg, '/c.js');
    await wait(pg, () => (window.__order || []).length === 3);
    const o = await pg.evaluate(() => window.__order);
    check('flag ON: el.async === false', asyncFlag === false, asyncFlag);
    check('flag ON: execution follows insertion order a,b,c', JSON.stringify(o) === '["/a.js","/b.js","/c.js"]', o);
    check('flag ON: all three reach state loaded', await pg.evaluate(() => ['/a.js', '/b.js', '/c.js'].every(p => OmegaScriptPipeline.status(p) === 'loaded')));
    await ctx.close();
  }

  /* 3. shared promise: concurrent load() calls share one promise and one element/request */
  {
    const { pg, ctx, hits } = await page(true, { '/s.js': { delay: 100 } });
    const r = await pg.evaluate(async () => {
      const P = OmegaScriptPipeline, p1 = P.load('/s.js'), p2 = P.load('/s.js'), same = p1 === p2;
      await Promise.all([p1, p2]);
      return { same, tags: document.querySelectorAll('script[src="/s.js"]').length, order: window.__order.length };
    });
    check('shared promise: identical promise object', r.same, r);
    check('shared promise: one element, executed once', r.tags === 1 && r.order === 1 && hits['/s.js'] === 1, { r, hits: hits['/s.js'] });
    await ctx.close();
  }

  /* 4. failure then explicit retry; retry forbidden once loaded; no duplicate execution */
  {
    const { pg, ctx } = await page(true, { '/f.js': { fail: true, failOnce: true } });
    const r = await pg.evaluate(async () => {
      const P = OmegaScriptPipeline; const out = {};
      try { await P.load('/f.js'); out.first = 'resolved'; } catch (e) { out.first = e.reason; }
      out.stateAfterFail = P.status('/f.js');
      out.noImplicitRetry = await P.load('/f.js').then(() => 'resolved', e => e.reason);
      await P.retry('/f.js'); out.stateAfterRetry = P.status('/f.js');
      out.execs = window.__order.filter(x => x === '/f.js').length;
      out.retryLoaded = await P.retry('/f.js').then(() => 'resolved', e => e.reason);
      out.attempts = P.snapshot()['/f.js'].attempts;
      return out;
    });
    check('failure: load rejects with load-error and state failed', r.first === 'load-error' && r.stateAfterFail === 'failed', r);
    check('failure: load() never retries implicitly', r.noImplicitRetry === 'load-error', r);
    check('retry: failed script loads on explicit retry, executes exactly once', r.stateAfterRetry === 'loaded' && r.execs === 1, r);
    check('retry: refused once loaded (no duplicate execution)', r.retryLoaded === 'not-retryable' && r.attempts === 2, r);
    await ctx.close();
  }

  /* 5. timeout: reports, forbids retry, records late load */
  {
    const { pg, ctx } = await page(true, { '/t.js': { delay: 700 } });
    const r = await pg.evaluate(async () => {
      const P = OmegaScriptPipeline; P.configure({ timeoutMs: 150 }); const out = {};
      out.first = await P.load('/t.js').then(() => 'resolved', e => e.reason);
      out.state = P.status('/t.js');
      out.retry = await P.retry('/t.js').then(() => 'resolved', e => e.reason);
      return out;
    });
    check('timeout: rejects with timeout, state timeout, retry refused', r.first === 'timeout' && r.state === 'timeout' && r.retry === 'not-retryable', r);
    await wait(pg, () => OmegaScriptPipeline.status('/t.js') === 'loaded');
    const ev = await pg.evaluate(() => window.__events.filter(e => e.path === '/t.js').map(e => e.state + ':' + e.reason));
    check('timeout: late arrival recorded as loaded/late-load, executed once', ev.includes('loaded:late-load') && (await pg.evaluate(() => window.__order.filter(x => x === '/t.js').length)) === 1, ev);
    await ctx.close();
  }

  /* 6. dependencies: failed hard dep blocks dependent (never fetched); optional dep fails open */
  {
    const { pg, ctx, hits } = await page(true, { '/dep-bad.js': { fail: true }, '/m.js': {}, '/opt-bad.js': { fail: true }, '/n.js': {}, '/dep-ok.js': {} });
    const r = await pg.evaluate(async () => {
      const P = OmegaScriptPipeline;
      P.register('/m.js', { requires: ['/dep-bad.js'] });
      P.register('/n.js', { requires: ['/dep-ok.js'], optionalRequires: ['/opt-bad.js'] });
      const out = {};
      out.m = await P.load('/m.js').then(() => 'resolved', e => e.reason);
      out.mState = P.status('/m.js');
      out.n = await P.load('/n.js').then(() => 'resolved', e => e.reason);
      out.order = window.__order.slice();
      return out;
    });
    check('dependency: hard dep failure blocks dependent with observable reason', r.m === 'dependency:/dep-bad.js' && r.mState === 'blocked' && !hits['/m.js'], { r, mHits: hits['/m.js'] });
    check('dependency: optional dep failure fails open; hard dep runs before dependent', r.n === 'resolved' && r.order.indexOf('/dep-ok.js') < r.order.indexOf('/n.js'), r);
    await ctx.close();
  }

  /* 7. cycles are detected and rejected, not silently broken; plan() is stable + lexical */
  {
    const { pg, ctx } = await page(true, {});
    const r = await pg.evaluate(() => {
      const P = OmegaScriptPipeline;
      const ok1 = P.register('/x.js', { requires: ['/y.js'] });
      const bad = P.register('/y.js', { requires: ['/x.js'] });
      P.register('/q.js', { requires: ['/p.js'] });
      return { ok1, bad, plan: P.plan(['/q.js', '/z.js', '/a.js']), plan2: P.plan(['/a.js', '/z.js', '/q.js']) };
    });
    check('cycle: second edge rejected with cycle path', r.ok1.ok && !r.bad.ok && r.bad.reason === 'cycle', r);
    check('plan: deterministic, dependency-first, lexical tie-break, input-order independent',
      JSON.stringify(r.plan) === '["/a.js","/p.js","/q.js","/z.js"]' && JSON.stringify(r.plan) === JSON.stringify(r.plan2), r);
    await ctx.close();
  }

  /* 8. critical paths keep legacy ordering semantics and are never retried */
  {
    const { pg, ctx } = await page(true, { '/omega-gate.js': { fail: true }, '/vendor/supabase-js.js': {}, '/omega-mfa-gate.js': {} });
    const r = await pg.evaluate(async () => {
      const P = OmegaScriptPipeline, out = {};
      const s = document.createElement('script'); s.src = '/vendor/supabase-js.js'; __omegaAppend(s); out.vendorAsync = s.async;
      out.gate = await P.load('/omega-gate.js').then(() => 'resolved', e => e.reason);
      out.retry = await P.retry('/omega-gate.js').then(() => 'resolved', e => e.reason);
      out.critical = P.snapshot()['/omega-gate.js'].critical;
      return out;
    });
    check('critical: ordering untouched (async stays default true)', r.vendorAsync === true, r);
    check('critical: failure reported but retry refused', r.gate === 'load-error' && r.retry === 'not-retryable' && r.critical === true, r);
    await ctx.close();
  }

  /* 9. a script the page already carries is not re-executed and is reported 'present', not 'loaded' */
  {
    const { pg, ctx } = await page(true, { __start: '/with-tag.html', '/pre.js': {} });
    await wait(pg, () => (window.__order || []).length === 1);
    const r = await pg.evaluate(async () => {
      const P = OmegaScriptPipeline; const res = await P.load('/pre.js');
      return { res, execs: window.__order.filter(x => x === '/pre.js').length, tags: document.querySelectorAll('script[src="/pre.js"]').length };
    });
    check('dedup: existing tag => present, one execution, no second element', r.res.state === 'present' && r.execs === 1 && r.tags === 1, r);
    await ctx.close();
  }

  /* 10. diagnostics carry pathname only */
  {
    const { pg, ctx } = await page(true, { '/q.js': {} });
    await ap(pg, '/q.js?token=SECRET123');
    await wait(pg, () => OmegaScriptPipeline.status('/q.js') === 'loaded');
    const ev = JSON.stringify(await pg.evaluate(() => window.__events));
    check('diagnostics: no query string / secret leaked', ev.includes('/q.js') && !ev.includes('SECRET123') && !ev.includes('token'), ev);
    await ctx.close();
  }

  await browser.close();
  const failed = results.filter(r => !r.ok);
  if (JSON_OUT) console.log(JSON.stringify({ passed: results.length - failed.length, failed: failed.length, results }, null, 2));
  else {
    results.forEach(r => console.log((r.ok ? 'PASS  ' : 'FAIL  ') + r.name + (r.ok ? '' : '\n      ' + JSON.stringify(r.detail))));
    console.log(`\n${results.length - failed.length}/${results.length} passed`);
  }
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
