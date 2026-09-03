#!/usr/bin/env node
/**
 * Render og-image.png -- the social share card for www.sydomega.com.
 *
 * WHY THIS EXISTS
 *
 * 21 references across 11 pages point og:image and twitter:image at
 * https://www.sydomega.com/og-image.png, and that URL returned a hard 404 in
 * production (verified 2026-09-03 against the live domain). Every share of this
 * platform -- WhatsApp, iMessage, Slack, X, LinkedIn, Facebook -- rendered a
 * preview card with no image.
 *
 * The broken-asset gate could not see it: it resolves local `src=`/`href=`
 * paths, and these are ABSOLUTE URLs on the production host. That blind spot is
 * now closed by scripts/absolute-asset-check.py.
 *
 * WHY A RASTER FILE, IN A REPO THAT SHIPS ALMOST NONE
 *
 * The `visual-assets` skill says SVG only; the `image-pipeline` skill names the
 * exception directly -- "reach for raster only for things SVG genuinely can't
 * do (photos, PWA icons, an OG-style share PNG)". Social scrapers do not render
 * SVG for og:image, so PNG is the only format that works here. It is produced
 * the way this repo produces every other raster: drawn in a browser and
 * exported, exactly as omega-share-card.js renders its 1200x630 identity card.
 *
 * The design is deliberately NOT invented: colours are bg.js's :root tokens,
 * type is the platform's three families, and the ring/glow/grid vocabulary is
 * omega-share-card.js's. Regenerate rather than hand-edit the PNG, so the asset
 * always traces back to source.
 *
 * Usage:
 *   node scripts/build-og-image.js            # writes og-image.png
 *   node scripts/build-og-image.js --check    # verify it exists, non-zero, 1200x630
 *
 * Needs playwright + the sandbox Chromium; see the `verify-in-browser` skill
 * for OMEGA_SCRATCHPAD. It is a one-off asset build, NOT a CI step -- CI has no
 * browser guarantee and the committed PNG is the artifact.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.dirname(__dirname);
const OUT = path.join(ROOT, 'og-image.png');
const W = 1200, H = 630;

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0].replace(/^\/\*\*?/, ''));
  process.exit(0);
}

// PNG header carries width/height as big-endian uint32 at bytes 16..24.
function pngSize(file) {
  const b = fs.readFileSync(file);
  if (b.length < 24 || b.toString('hex', 0, 8) !== '89504e470d0a1a0a') return null;
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), bytes: b.length };
}

if (process.argv.includes('--check')) {
  if (!fs.existsSync(OUT)) { console.error('og-image.png MISSING'); process.exit(1); }
  const s = pngSize(OUT);
  if (!s) { console.error('og-image.png is not a valid PNG'); process.exit(1); }
  if (s.w !== W || s.h !== H) {
    console.error(`og-image.png is ${s.w}x${s.h}, expected ${W}x${H}`); process.exit(1);
  }
  console.log(`og-image.png OK - ${s.w}x${s.h}, ${s.bytes} bytes`);
  process.exit(0);
}

// Tokens copied from bg.js's :root. Raw hex is correct here and only here:
// this renders to a flat PNG, so there is no cascade for var() to resolve in.
const GOLD = '#C9A84C', SOLAR = '#E2C86D', CYAN = '#00E5FF', VOID_ = '#0A0A0F';

const HTML = `<!DOCTYPE html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&family=Courier+Prime:wght@400;700&family=Rajdhani:wght@500;600&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:${W}px;height:${H}px;overflow:hidden}
  body{
    background:
      radial-gradient(ellipse 70% 90% at 50% 46%, rgba(201,168,76,.13), transparent 62%),
      linear-gradient(135deg, ${VOID_} 0%, #12121a 48%, ${VOID_} 100%);
    position:relative;
    font-family:"Courier Prime",monospace;
    display:flex;align-items:center;justify-content:center;
  }
  /* Faint lattice, same weight as omega-share-card.js's grid pass. */
  .grid{position:absolute;inset:0;
    background-image:
      repeating-linear-gradient(0deg, rgba(201,168,76,.045) 0 1px, transparent 1px 60px),
      repeating-linear-gradient(90deg, rgba(201,168,76,.045) 0 1px, transparent 1px 60px);}
  .ring{position:absolute;left:50%;top:46%;transform:translate(-50%,-50%);
    border-radius:50%;border:1px solid rgba(201,168,76,.16)}
  .r1{width:430px;height:430px}
  .r2{width:340px;height:340px;border-color:rgba(201,168,76,.26)}
  .r3{width:250px;height:250px;border:1px dashed rgba(0,229,255,.16)}
  .stack{position:relative;z-index:2;text-align:center;width:100%}
  .omega{font-family:"Cinzel Decorative",serif;font-weight:900;font-size:196px;
    color:${GOLD};line-height:1;
    text-shadow:0 0 60px rgba(201,168,76,.55), 0 0 130px rgba(201,168,76,.22)}
  .name{font-family:"Cinzel Decorative",serif;font-weight:700;font-size:56px;
    color:${SOLAR};letter-spacing:9px;margin-top:14px;
    text-shadow:0 0 26px rgba(226,200,109,.30)}
  .rule{width:300px;height:1px;margin:24px auto 0;
    background:linear-gradient(90deg,transparent,rgba(201,168,76,.75),transparent)}
  .tag{font-family:"Rajdhani",sans-serif;font-weight:600;font-size:23px;
    letter-spacing:8px;color:rgba(233,230,220,.80);margin-top:22px}
  .meta{font-family:"Courier Prime",monospace;font-size:13px;letter-spacing:4px;
    color:rgba(138,134,118,.82);margin-top:16px}
  /* Corner ticks — the hairline-border motif, not a full box. */
  .tick{position:absolute;width:46px;height:46px;border-color:rgba(201,168,76,.45);border-style:solid}
  .tl{top:34px;left:34px;border-width:1px 0 0 1px}
  .tr{top:34px;right:34px;border-width:1px 1px 0 0}
  .bl{bottom:34px;left:34px;border-width:0 0 1px 1px}
  .br{bottom:34px;right:34px;border-width:0 1px 1px 0}
  .badge{position:absolute;bottom:40px;left:50%;transform:translateX(-50%);
    font-family:"Courier Prime",monospace;font-size:11px;letter-spacing:5px;
    color:rgba(0,229,255,.62)}
</style></head><body>
  <div class="grid"></div>
  <div class="ring r1"></div><div class="ring r2"></div><div class="ring r3"></div>
  <div class="tick tl"></div><div class="tick tr"></div>
  <div class="tick bl"></div><div class="tick br"></div>
  <div class="stack">
    <div class="omega">&#937;</div>
    <div class="name">SYD OMEGA 91717</div>
    <div class="rule"></div>
    <div class="tag">THE CODE &middot; THE FREQUENCY &middot; THE LEGACY</div>
    <div class="meta">9.17Hz RESONANCE &nbsp;&middot;&nbsp; 104,976-NODE MATRIX &nbsp;&middot;&nbsp; 12 OLYMPIANS</div>
  </div>
  <div class="badge">MEMBERSHIP &middot; BY INVITATION</div>
</body></html>`;

(async () => {
  const scratch = process.env.OMEGA_SCRATCHPAD;
  if (!scratch) {
    console.error('Set OMEGA_SCRATCHPAD to a dir with playwright installed ' +
                  '(see the verify-in-browser skill).');
    process.exit(2);
  }
  const { chromium } = require(path.join(scratch, 'node_modules', 'playwright'));
  const browser = await chromium.launch({
    executablePath: process.env.OMEGA_CHROMIUM ||
      '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  });
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  await page.setContent(HTML, { waitUntil: 'networkidle' });
  // Webfonts decide the layout; screenshotting before they settle bakes the
  // fallback serif into the PNG and it looks nothing like the platform.
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  await page.screenshot({ path: OUT, type: 'png' });
  await browser.close();

  const s = pngSize(OUT);
  console.log(`wrote og-image.png - ${s.w}x${s.h}, ${s.bytes} bytes`);
  if (s.w !== W || s.h !== H) { console.error('unexpected dimensions'); process.exit(1); }
})().catch((e) => { console.error(e); process.exit(1); });
