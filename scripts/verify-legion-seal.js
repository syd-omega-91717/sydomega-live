#!/usr/bin/env node
/* Browser validation for assets/omega-legion-of-wisdom-seal.svg: the seal animates itself (wing beat, star twinkle, eye pulse) with no page
 * script, including when loaded as a plain <img>, and is completely still under prefers-reduced-motion.
 *
 * Usage: node scripts/verify-legion-seal.js [--shots DIR]
 *
 * Compares screenshots of the same <img> at two points in its cycle. Normal motion must differ in the wing and star regions and stay
 * identical in the ring-text region (text never moves); reduced motion must be pixel-identical everywhere. Zero repo deps; resolves
 * playwright from $OMEGA_SCRATCHPAD or a normal require; SKIPPED (exit 0) without a browser unless OMEGA_REQUIRE_BROWSER is set.
 * Proves the animation runs and is guarded, not how it looks on every device.
 */
const fs = require('fs'), path = require('path'), os = require('os');
if (process.argv.includes('--help') || process.argv.includes('-h')) { console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0].replace(/^#!.*\n/, '').replace(/^\/\*\s?/, '')); process.exit(0); }
const ROOT = path.resolve(__dirname, '..'), SVG = path.join(ROOT, 'assets', 'omega-legion-of-wisdom-seal.svg');
const si = process.argv.indexOf('--shots'); const SHOTS = si > 0 ? process.argv[si + 1] : null;
function loadPW() { const sp = process.env.OMEGA_SCRATCHPAD; for (const t of [sp && path.join(sp, 'node_modules', 'playwright'), sp && path.join(sp, 'node_modules', 'playwright-core'), 'playwright', 'playwright-core'].filter(Boolean)) { try { return require(t); } catch (e) { } } return null; }
const results = []; const check = (n, ok, d) => results.push({ name: n, ok: !!ok, detail: ok ? undefined : d });

(async () => {
  const pw = loadPW(); let browser;
  /* An SVG used as <img> is its own document: CDP media emulation does not reach it, but Chromium's real switch does. */
  const launch = async (args = []) => { if (!pw) return null; for (const exe of [undefined, '/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome']) { try { return await pw.chromium.launch({ ...(exe ? { executablePath: exe } : {}), args }); } catch (e) { } } return null; };
  browser = await launch();
  if (!browser) { console.log('SKIPPED: no playwright/browser available'); process.exit(process.env.OMEGA_REQUIRE_BROWSER ? 1 : 0); }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'seal-')); const html = path.join(tmp, 'seal.html');
  fs.writeFileSync(html, `<body style="margin:0;background:#222"><img id="s" src="file://${SVG}" width="600" height="600" style="display:block"></body>`);

  /* regions in screen px (the seal is drawn 600x600 at 1:1): wings, stars, ring text */
  const R = { wingR: { x: 400, y: 190, width: 130, height: 170 }, stars: { x: 170, y: 100, width: 260, height: 75 }, ring: { x: 0, y: 0, width: 600, height: 48 } };
  async function frames(reduce) {
    const b = reduce ? await launch(['--force-prefers-reduced-motion']) : browser;
    const ctx = await b.newContext({ viewport: { width: 600, height: 600 }, reducedMotion: reduce ? 'reduce' : 'no-preference' });
    const pg = await ctx.newPage(); await pg.goto('file://' + html);
    await pg.waitForFunction(() => document.getElementById('s').complete && document.getElementById('s').naturalWidth > 0);
    const shot = async (clip) => pg.screenshot({ clip });
    const out = {};
    const t0 = await Promise.all(Object.entries(R).map(async ([k, c]) => [k, await shot(c)]));
    await pg.waitForTimeout(2600);   /* half of the 5.2 s wing cycle: the wings are at the far end of their beat */
    const t1 = await Promise.all(Object.entries(R).map(async ([k, c]) => [k, await shot(c)]));
    t0.forEach(([k, b], i) => { out[k] = !b.equals(t1[i][1]); });
    if (SHOTS && !reduce) { fs.mkdirSync(SHOTS, { recursive: true }); await pg.screenshot({ path: path.join(SHOTS, 'seal-beat-peak.png') }); }
    await ctx.close(); if (reduce) await b.close(); return out;
  }
  const normal = await frames(false), still = await frames(true);
  check('normal motion: the wing moves (right wing region changes over half a cycle)', normal.wingR, normal);
  check('normal motion: the stars twinkle (star region changes)', normal.stars, normal);
  check('normal motion: ring text stays put (top ring region identical)', !normal.ring, normal);
  check('reduced motion: nothing moves anywhere (all regions pixel-identical)', !still.wingR && !still.stars && !still.ring, still);
  const svg = fs.readFileSync(SVG, 'utf8');
  const m0 = svg.indexOf('@media (prefers-reduced-motion:no-preference){');
  let depth = 0, end = -1; for (let i = svg.indexOf('{', m0); i < svg.length; i++) { if (svg[i] === '{') depth++; else if (svg[i] === '}' && --depth === 0) { end = i; break; } }
  const outside = m0 < 0 || end < 0 ? svg : svg.slice(0, m0) + svg.slice(end + 1);
  check('every animation rule sits inside @media (prefers-reduced-motion:no-preference)', m0 >= 0 && end > m0 && /animation:beatR/.test(svg.slice(m0, end)) && !/animation\s*:/.test(outside), { m0, end });
  check('the SVG contains no script and no external reference', !/<script|href="https?:|xlink:href="https?:|url\(https?:/i.test(svg));
  await browser.close(); fs.rmSync(tmp, { recursive: true, force: true });
  const failed = results.filter(r => !r.ok);
  results.forEach(r => console.log((r.ok ? 'PASS  ' : 'FAIL  ') + r.name + (r.ok ? '' : '\n      ' + JSON.stringify(r.detail))));
  console.log(`\n${results.length - failed.length}/${results.length} passed`); process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
