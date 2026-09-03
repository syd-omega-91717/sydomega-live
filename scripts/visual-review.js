#!/usr/bin/env node
/**
 * Render pages for VISUAL review, with the real brand typography.
 *
 * WHY THIS EXISTS
 *
 * Every screenshot this repo's harness has ever produced showed the browser's
 * fallback serif/sans, not Cinzel Decorative / Rajdhani / Courier Prime. Two
 * separate causes stack:
 *
 *   1. `harness/session.js` stubs fonts.googleapis.com with an EMPTY
 *      stylesheet, deliberately, so correctness scans stay offline and
 *      deterministic. Right for a scan, wrong for judging design.
 *   2. Even unstubbed, a page served from http://localhost:8765 cannot reach
 *      fonts.gstatic.com in this sandbox. Node can (`curl` returns the real
 *      CSS), and a page rendered from about:blank can -- scripts/build-og-image.js
 *      gets correct Cinzel that way -- but from a real http origin the font
 *      FILES never arrive. Injecting the CSS gets `document.fonts.size` to 10
 *      and changes nothing: the faces are declared and never download.
 *
 * The measurement that settles it, and the one to repeat rather than trust a
 * screenshot: render the same string in `"Cinzel Decorative",serif` and in bare
 * `serif` and compare widths. Identical means fallback. On dashboard.html both
 * were 589px, and Rajdhani vs sans-serif both 622px.
 *
 * THE FIX: no page-origin network at all. Node downloads the .ttf files, this
 * script base64-inlines them into `@font-face` rules, and injects those. The
 * faces then resolve from a data: URI, so rendering is accurate offline.
 *
 * This is a REVIEW tool, not a gate. It needs network for the first run and
 * caches the faces in OMEGA_SCRATCHPAD afterwards. Never wire it into CI.
 *
 * Usage:
 *   OMEGA_SCRATCHPAD=... node scripts/visual-review.js dashboard.html profile.html
 *   OMEGA_SCRATCHPAD=... node scripts/visual-review.js --width 390 --mobile enter.html
 *   node scripts/visual-review.js --verify          # prove the faces really apply
 *
 * Screenshots land in $OMEGA_SCRATCHPAD/review/.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const HARNESS = '/home/user/sydomega-live/.claude/skills/verify-in-browser/harness/session.js';
const ORIGIN = 'http://localhost:8765';

// The three families bg.js's :root tokens name (--D / --R / --M). Weights match
// what bg.js actually requests, so review shows what production would.
const CSS_URL =
  'https://fonts.googleapis.com/css2' +
  '?family=Cinzel+Decorative:wght@400;700;900' +
  '&family=Rajdhani:wght@400;500;600;700' +
  '&family=Courier+Prime:ital,wght@0,400;0,700;1,400' +
  '&display=swap';

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0].replace(/^\/\*\*?/, ''));
  process.exit(0);
}

const scratch = process.env.OMEGA_SCRATCHPAD;
if (!scratch) {
  console.error('Set OMEGA_SCRATCHPAD (see the verify-in-browser skill).');
  process.exit(2);
}
const CACHE = path.join(scratch, 'brand-fonts.css');

/**
 * Fetch the Google Fonts CSS and inline every font file it references as a
 * data: URI. Google serves .ttf to a generic UA and .woff2 to a modern one;
 * either works once inlined, and we ask as a plain client so the result is one
 * predictable format.
 */
async function buildInlineFontCss() {
  if (fs.existsSync(CACHE)) return fs.readFileSync(CACHE, 'utf8');

  const res = await fetch(CSS_URL);
  if (!res.ok) throw new Error(`font CSS HTTP ${res.status}`);
  let css = await res.text();

  const urls = [...new Set(css.match(/https:\/\/fonts\.gstatic\.com\/[^)]+/g) || [])];
  if (!urls.length) throw new Error('no gstatic URLs in the CSS');

  let inlined = 0;
  for (const u of urls) {
    const r = await fetch(u);
    if (!r.ok) { console.warn(`  skip ${r.status} ${u.slice(-40)}`); continue; }
    const buf = Buffer.from(await r.arrayBuffer());
    const ext = (u.match(/\.(woff2|woff|ttf|otf)$/) || [, 'ttf'])[1];
    const mime = { woff2: 'font/woff2', woff: 'font/woff', ttf: 'font/ttf', otf: 'font/otf' }[ext];
    css = css.split(u).join(`data:${mime};base64,${buf.toString('base64')}`);
    inlined++;
  }
  console.log(`inlined ${inlined}/${urls.length} font files (${Math.round(css.length / 1024)} KB)`);
  fs.writeFileSync(CACHE, css);
  return css;
}

/**
 * The only honest check that the faces applied: compare rendered width against
 * the generic fallback. A screenshot cannot tell you, and document.fonts.size
 * counts DECLARED faces, not downloaded ones — it read 10 while every glyph was
 * still fallback.
 */
const MEASURE = () => {
  const meas = (f) => {
    const s = document.createElement('span');
    s.textContent = 'OMEGA SOVEREIGN 91717';
    // nowrap matters: without it the span wraps at a narrow viewport and every
    // measurement clamps to the viewport width, so all four come back equal and
    // the check falsely reports FALLBACK. Seen at 390px, where cinzel/serif/
    // rajdhani/sans all read exactly 390.
    s.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;`
                    + `font-size:48px;font-family:${f}`;
    document.body.appendChild(s);
    const w = Math.round(s.getBoundingClientRect().width);
    s.remove();
    return w;
  };
  return {
    declared: document.fonts.size,
    cinzel: meas('"Cinzel Decorative",serif'), serif: meas('serif'),
    rajdhani: meas('"Rajdhani",sans-serif'), sans: meas('sans-serif'),
  };
};

(async () => {
  const argv = process.argv.slice(2);
  const verifyOnly = argv.includes('--verify');
  const mobile = argv.includes('--mobile');
  const wIdx = argv.indexOf('--width');
  const width = wIdx > -1 ? parseInt(argv[wIdx + 1], 10) : (mobile ? 390 : 1440);
  const pages = argv.filter((a, i) =>
    a.endsWith('.html') && (wIdx === -1 || i !== wIdx + 1));

  const css = await buildInlineFontCss();
  const { launch } = require(HARNESS);
  const { browser, ctx } = await launch({ width, height: mobile ? 844 : 900, mobile });

  // Applies to every page in this context, before any of its own CSS parses.
  await ctx.addInitScript((fontCss) => {
    const put = () => {
      const s = document.createElement('style');
      s.id = 'omega-review-fonts';
      s.textContent = fontCss;
      (document.head || document.documentElement).appendChild(s);
    };
    if (document.head) put();
    else document.addEventListener('readystatechange', function once() {
      if (document.head) { document.removeEventListener('readystatechange', once); put(); }
    });
  }, css);

  const outDir = path.join(scratch, 'review');
  fs.mkdirSync(outDir, { recursive: true });

  const targets = verifyOnly && !pages.length ? ['dashboard.html'] : pages;
  if (!targets.length) { console.error('give at least one page.html'); process.exit(2); }

  for (const p of targets) {
    const pg = await ctx.newPage();
    await pg.goto(`${ORIGIN}/${p}`, { waitUntil: 'networkidle', timeout: 30000 });
    await pg.evaluate(() => document.fonts.ready);
    await pg.waitForTimeout(1600);

    const m = await pg.evaluate(MEASURE);
    const applied = m.cinzel !== m.serif && m.rajdhani !== m.sans;
    console.log(`${p.padEnd(22)} ${applied ? 'REAL FONTS' : 'FALLBACK  '} ` +
                `cinzel ${m.cinzel} vs serif ${m.serif} | rajdhani ${m.rajdhani} vs sans ${m.sans}`);

    if (!verifyOnly) {
      const name = p.replace('.html', '') + (mobile ? `-${width}` : '') + '.png';
      await pg.screenshot({ path: path.join(outDir, name) });
    }
    await pg.close();
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
