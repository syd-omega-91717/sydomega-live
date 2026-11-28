#!/usr/bin/env node
/* Browser validation that family.html's two canvases (the owner's constellation and the bloodline tree) draw 1:1 at the screen's density.
 *
 * Usage: node scripts/verify-family-canvases.js [--root DIR]      (--root runs the same checks against another checkout, e.g. a worktree of origin/main)
 *
 * The page is rendered as the owner with seeded family_nodes and bloodline_nodes at 1000px@1, 1000px@3 and 390px@3, and each canvas is measured:
 *   1. its backing store is its displayed box x the scale, at least 2x, with no stretch on either axis;
 *   2. its displayed box is the size the page asked for (260 / 300 CSS px tall), whatever the store's aspect ratio;
 *   3. pixels are painted from the top of the store to the bottom (the tree once painted only the top half);
 *   4. returning from the bloodline tab leaves the constellation refitted to its real width, not the 800px fallback.
 * Files are served from disk through route(). No browser: SKIPPED, exit 0 unless OMEGA_REQUIRE_BROWSER is set.
 */
const fs = require('fs'), path = require('path');
if (process.argv.includes('--help') || process.argv.includes('-h')) { console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0].replace(/^#!.*\n/, '').replace(/^\/\*\s?/, '')); process.exit(0); }
const ri = process.argv.indexOf('--root');
const ROOT = ri > 0 ? path.resolve(process.argv[ri + 1]) : path.resolve(__dirname, '..'), ORIGIN = 'https://fam.test';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml' };
function loadPW() { const sp = process.env.OMEGA_SCRATCHPAD; for (const t of [sp && path.join(sp, 'node_modules', 'playwright'), 'playwright', 'playwright-core']) { if (!t) continue; try { return require(t); } catch (e) { } } return null; }
const pw = loadPW();
let BASE = null; try { BASE = require(path.join(__dirname, '..', '.claude', 'skills', 'verify-in-browser', 'harness', 'sbstub.js')).STUB; } catch (e) { }
if (!pw || !BASE) { console.log('SKIPPED: no browser or no harness'); process.exit(process.env.OMEGA_REQUIRE_BROWSER ? 1 : 0); }
const ROWS = '{family_nodes:[{id:"a",name:"Maya Dagher",relation:"Wife",sign:"Leo",is_heir:false,created_at:"2026-01-01"},{id:"b",name:"Karim Dagher",relation:"Son",sign:"Aries",is_heir:true,created_at:"2026-01-02"},{id:"c",name:"Nora Dagher",relation:"Daughter",sign:"Libra",is_heir:false,created_at:"2026-01-03"}],bloodline_nodes:[{id:"x",name:"Elias Dagher",rel:"Father",birth:"1950-02-01",notes:"n",created_at:"2026-01-01"},{id:"y",name:"Mona Haddad",rel:"Mother",birth:"1955-05-05",notes:"",created_at:"2026-01-02"}]}';
const STUB = BASE.replace('is_owner:false', 'is_owner:true').replace('from: ()=>chain({}),', 'from: (t)=>chain({t}),').replace('const payload = state.single', 'const ROWS=' + ROWS + '; const payload = (state.t&&ROWS[state.t]&&!state.single) ? {data:ROWS[state.t],error:null,count:ROWS[state.t].length,status:200} : state.single');
const results = []; const check = (n, ok, d) => results.push({ name: n, ok: !!ok, detail: ok ? undefined : d });
const probe = () => ['con-cv', 'tree-canvas'].map(id => {
  const c = document.getElementById(id), bb = c.getBoundingClientRect(); let top = 1e9, bot = -1;
  try { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; for (let y = 0; y < c.height; y += 2) for (let x = 0; x < c.width; x += 2) if (d[(y * c.width + x) * 4 + 3] > 8) { if (y < top) top = y; if (y > bot) bot = y; } } catch (e) { }
  return { id, sx: bb.width ? c.width / bb.width : 0, sy: bb.height ? c.height / bb.height : 0, w: Math.round(bb.width), h: Math.round(bb.height), rows: bot < 0 ? null : [Math.round(top / c.height * 100), Math.round(bot / c.height * 100)] };
});
(async () => {
  const b = await pw.chromium.launch();
  for (const [vw, dsf] of [[1000, 1], [1000, 3], [390, 3]]) {
    const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: vw, height: 900 }, deviceScaleFactor: dsf, isMobile: vw < 700, hasTouch: vw < 700 });
    await ctx.route(ORIGIN + '/**', async r => {
      const u = decodeURIComponent(new URL(r.request().url()).pathname);
      if (u === '/vendor/supabase-js.js') return r.fulfill({ status: 200, contentType: 'text/javascript', body: STUB });
      const f = path.join(ROOT, path.normalize(u).replace(/^(\.\.[/\\])+/, ''));
      if (!f.startsWith(ROOT)) return r.fulfill({ status: 404, body: '' });
      try { r.fulfill({ status: 200, contentType: MIME[path.extname(f)] || 'application/octet-stream', body: fs.readFileSync(f) }); } catch (e) { r.fulfill({ status: 404, body: '' }); }
    });
    await ctx.route('https://esm.sh/**', r => r.fulfill({ status: 200, contentType: 'text/javascript', body: STUB }));
    await ctx.route('https://fonts.g*/**', r => r.fulfill({ status: 200, body: '' }));
    await ctx.addInitScript(() => { try { localStorage.setItem('omega_demo_watched_at', '2026-01-01T00:00:00Z'); localStorage.setItem('omega_consent_v1', 'all'); localStorage.setItem('omega_genesis_seen', '1'); } catch (e) { } });
    const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', e => errs.push(String(e.message).slice(0, 90)));
    await pg.goto(ORIGIN + '/family.html', { waitUntil: 'load' }); await pg.waitForTimeout(3500);
    const tag = vw + '@' + dsf, want = Math.max(2, dsf);
    let m = await pg.evaluate(probe); const con = m[0];
    check(tag + ' constellation store is box x ' + want, Math.abs(con.sx - want) < 0.05 && Math.abs(con.sy - want) < 0.05, JSON.stringify(con));
    check(tag + ' constellation box is 260px tall', con.h === 260, JSON.stringify(con));
    check(tag + ' constellation painted top to bottom', con.rows && con.rows[0] <= 5 && con.rows[1] >= 95, JSON.stringify(con));
    await pg.click('.mtab-btn[data-mtab=bloodline]'); await pg.waitForTimeout(2500);
    m = await pg.evaluate(probe); const tree = m[1];
    check(tag + ' tree store is box x ' + want, Math.abs(tree.sx - want) < 0.05 && Math.abs(tree.sy - want) < 0.05, JSON.stringify(tree));
    check(tag + ' tree box is 300px tall', tree.h === 300, JSON.stringify(tree));
    check(tag + ' tree painted top to bottom', tree.rows && tree.rows[0] <= 5 && tree.rows[1] >= 95, JSON.stringify(tree));
    await pg.click('.mtab-btn[data-mtab=family]'); await pg.waitForTimeout(1500);
    m = await pg.evaluate(probe); const back = m[0];
    check(tag + ' constellation refits after the tab round trip', Math.abs(back.sx - want) < 0.05 && back.w === con.w, JSON.stringify(back));
    check(tag + ' no page errors', errs.length === 0, errs.join(' | '));
    await ctx.close();
  }
  await b.close();
  const bad = results.filter(r => !r.ok); results.forEach(r => console.log((r.ok ? 'PASS ' : 'FAIL ') + r.name + (r.detail ? '  ' + r.detail : '')));
  console.log(bad.length ? 'FAILED ' + bad.length + '/' + results.length : 'PASSED ' + results.length); process.exit(bad.length ? 1 : 0);
})();
