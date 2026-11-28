#!/usr/bin/env node
/* Browser validation of the owner certificate console on approvals.html (omega-certificate-console.js).
 *
 * Usage: node scripts/verify-certificate-console.js [--root DIR]
 *
 * The page is rendered as the owner with a table-aware Supabase stub, and the issue RPC is scripted per case:
 *   1. a returned certificate row  -> "Issued", the number is shown, and the RPC got the chosen member, achievement and evidence;
 *   2. a server refusal            -> "Not issued", the server's meaning is shown, never "Issued";
 *   3. no error but no row         -> NOT reported as issued (the success is the returned row, not a missing error);
 *   4. an aal2 refusal, step-up ok -> retried once and issued; the step-up ran once;
 *   5. missing evidence            -> the RPC is not called at all;
 *   6. the member list is written with textContent (a name containing markup stays text).
 * Files are served from disk through route(). No browser: SKIPPED, exit 0 unless OMEGA_REQUIRE_BROWSER is set.
 */
const fs = require('fs'), path = require('path');
if (process.argv.includes('--help') || process.argv.includes('-h')) { console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0].replace(/^#!.*\n/, '').replace(/^\/\*\s?/, '')); process.exit(0); }
const ri = process.argv.indexOf('--root');
const ROOT = ri > 0 ? path.resolve(process.argv[ri + 1]) : path.resolve(__dirname, '..'), ORIGIN = 'https://cc.test';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml' };
function loadPW() { const sp = process.env.OMEGA_SCRATCHPAD; for (const t of [sp && path.join(sp, 'node_modules', 'playwright'), 'playwright', 'playwright-core']) { if (!t) continue; try { return require(t); } catch (e) { } } return null; }
const pw = loadPW();
let BASE = null; try { BASE = require(path.join(__dirname, '..', '.claude', 'skills', 'verify-in-browser', 'harness', 'sbstub.js')).STUB; } catch (e) { }
if (!pw || !BASE) { console.log('SKIPPED: no browser or no harness'); process.exit(process.env.OMEGA_REQUIRE_BROWSER ? 1 : 0); }
const ROWS = '{profiles:[{id:"11111111-1111-1111-1111-111111111111",display_name:"Maya <b>X</b>",email:"maya@example.test"}],omega_achievement_definitions:[{achievement_id:"omega.stage.initiate",title:"Initiate / Seeker",lifecycle:"active"}]}';
const STUB = BASE.replace('is_owner:false', 'is_owner:true').replace('from: ()=>chain({}),', 'from: (t)=>chain({t}),').replace('rpc:  ()=>chain({}),', 'rpc:  (n,a)=>(window.__rpc&&n==="omega_issue_certificate")?window.__rpc(n,a):chain({}),').replace('const payload = state.single', 'const ROWS=' + ROWS + '; const payload = (state.t&&ROWS[state.t]&&!state.single) ? {data:ROWS[state.t],error:null,count:ROWS[state.t].length,status:200} : state.single');
const results = []; const check = (n, ok, d) => results.push({ name: n, ok: !!ok, detail: ok ? undefined : d });
(async () => {
  const b = await pw.chromium.launch();
  const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1000, height: 900 } });
  await ctx.route(ORIGIN + '/**', async r => {
    const u = decodeURIComponent(new URL(r.request().url()).pathname);
    if (u === '/vendor/supabase-js.js') return r.fulfill({ status: 200, contentType: 'text/javascript', body: STUB });
    const f = path.join(ROOT, path.normalize(u).replace(/^(\.\.[/\\])+/, ''));
    if (!f.startsWith(ROOT)) return r.fulfill({ status: 404, body: '' });
    try { r.fulfill({ status: 200, contentType: MIME[path.extname(f)] || 'application/octet-stream', body: fs.readFileSync(f) }); } catch (e) { r.fulfill({ status: 404, body: '' }); }
  });
  await ctx.route('https://esm.sh/**', r => r.fulfill({ status: 200, contentType: 'text/javascript', body: STUB }));
  await ctx.route('https://fonts.g*/**', r => r.fulfill({ status: 200, body: '' }));
  await ctx.addInitScript(() => { try { localStorage.setItem('omega_demo_watched_at', '2026-01-01T00:00:00Z'); localStorage.setItem('omega_consent_v1', 'all'); localStorage.setItem('omega_genesis_seen', '1'); } catch (e) { } window.__calls = []; window.__steps = 0; window.OmegaMFA = { stepUp: () => { window.__steps++; return Promise.resolve(true); } }; });
  const pg = await ctx.newPage(); const errs = []; const other = []; pg.on('pageerror', e => { const m = String(e.message).slice(0, 90); (String(e.stack || '').includes('omega-certificate-console') ? errs : other).push(m); });
  pg.on('dialog', d => d.accept());
  await pg.goto(ORIGIN + '/approvals.html', { waitUntil: 'load' }); await pg.waitForSelector('#cc-issue', { state: 'attached', timeout: 15000 }).catch(() => { });
  const present = await pg.evaluate(() => !!document.getElementById('cc-issue'));
  await pg.click('button[data-action="setTab"][data-arg="operations"]').catch(() => { });
  await pg.waitForSelector('#cc-member', { state: 'visible', timeout: 8000 }).catch(() => { });
  check('console is mounted on approvals.html', present, 'no #cc-issue');
  if (present) {
    const listed = await pg.evaluate(() => { const o = [...document.querySelectorAll('#cc-member option')].map(x => x.textContent); return { o, hasMarkup: !!document.querySelector('#cc-member b') }; });
    check('member names stay text (no markup injected)', listed.o.some(t => t.includes('<b>X</b>')) && !listed.hasMarkup, JSON.stringify(listed));
    const run = async (name, rpc, evidence, prep) => {
      await pg.evaluate(([r]) => { window.__calls = []; window.__steps = 0; const q = Array.isArray(r) ? r.slice() : [r]; window.__rpc = (n, a) => { window.__calls.push({ n, a }); const x = q.shift() || q[0]; return Promise.resolve(x); }; }, [rpc]);
      await pg.selectOption('#cc-member', '11111111-1111-1111-1111-111111111111'); await pg.selectOption('#cc-achievement', 'omega.stage.initiate');
      await pg.fill('#cc-evidence', evidence); await pg.click('#cc-issue'); await pg.waitForTimeout(500);
      return pg.evaluate(() => ({ text: document.getElementById('cc-result').textContent, calls: window.__calls, steps: window.__steps }));
    };
    let r = await run('ok', { data: { certificate_number: 'OMEGA-CERT-ABC', status: 'issued' }, error: null }, 'Reviewed the submitted work on 2026-11-28');
    check('a returned row is reported as issued with its number', /Issued\./.test(r.text) && r.text.includes('OMEGA-CERT-ABC'), JSON.stringify(r));
    check('the RPC got the member, achievement and evidence', r.calls.length === 1 && r.calls[0].n === 'omega_issue_certificate' && r.calls[0].a.p_user_id === '11111111-1111-1111-1111-111111111111' && r.calls[0].a.p_achievement_id === 'omega.stage.initiate' && /Reviewed the submitted work/.test(r.calls[0].a.p_metadata.evidence_note), JSON.stringify(r.calls));
    r = await run('refused', { data: null, error: { message: 'owner_authorization_required' } }, 'Reviewed the submitted work on 2026-11-28');
    check('a server refusal is shown and never called issued', /Not issued/.test(r.text) && /platform owner/.test(r.text) && !/Issued\./.test(r.text), JSON.stringify(r));
    r = await run('norow', { data: null, error: null }, 'Reviewed the submitted work on 2026-11-28');
    check('no error but no row is NOT reported as issued', /Not issued/.test(r.text) && !/Issued\./.test(r.text), JSON.stringify(r));
    r = await run('aal2', [{ data: null, error: { message: 'aal2_required' } }, { data: { certificate_number: 'OMEGA-CERT-DEF', status: 'issued' }, error: null }], 'Reviewed the submitted work on 2026-11-28');
    check('aal2 refusal: one step-up, one retry, then issued', r.steps === 1 && r.calls.length === 2 && /Issued\./.test(r.text) && r.text.includes('OMEGA-CERT-DEF'), JSON.stringify(r));
    r = await run('short', { data: { certificate_number: 'X', status: 'issued' }, error: null }, 'short');
    check('missing evidence never reaches the RPC', r.calls.length === 0 && /Evidence is required/.test(r.text), JSON.stringify(r));
  }
  check('this module raised no page errors', errs.length === 0, errs.join(' | '));
  if (other.length) console.log('NOTE ' + other.length + ' page error(s) from other scripts under this stub, e.g. ' + other[0] + ' (present on origin/main too; not part of this check)');
  await b.close();
  const bad = results.filter(r => !r.ok); results.forEach(r => console.log((r.ok ? 'PASS ' : 'FAIL ') + r.name + (r.detail ? '  ' + r.detail : '')));
  console.log(bad.length ? 'FAILED ' + bad.length + '/' + results.length : 'PASSED ' + results.length); process.exit(bad.length ? 1 : 0);
})();
