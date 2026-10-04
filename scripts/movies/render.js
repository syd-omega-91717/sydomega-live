#!/usr/bin/env node
/*
 * scripts/movies/render.js -- render the 12 franchise films for movies.html.
 *
 * Usage:
 *   OMEGA_SCRATCHPAD=<dir-with-node_modules/playwright-core> node scripts/movies/render.js
 *     [--only 1,5,12]   render a subset of franchises (default: all 12)
 *     [--out DIR]       output directory (default: assets/movies)
 *     [--keep]          keep the PNG frame directories
 *     [--jobs N]        parallel browser pages (default 3)
 *     [--help]
 *
 * Output: franchise-NN.mp4 (H.264 yuv420p 1280x720 24fps, faststart, AAC 64k
 * synthesized drone) and franchise-NN.jpg (poster from the title-card frame).
 * Each mp4 is held to <= 1.5 MB by stepping CRF up, each poster to <= 120 KB
 * by stepping JPEG quality down.
 *
 * Deterministic: scene.html seeds its RNG per franchise and derives time from
 * the frame index, so re-running produces the same frames. The page is served
 * by a throwaway local HTTP server over the repo root (read-only, same-origin
 * so the canvas can read the hero art without tainting). Not shipped:
 * scripts/ is excluded by scripts/vercel-build.sh. Needs the system ffmpeg.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');
const os = require('os');
const { spawnSync } = require('child_process');

const argv = process.argv.slice(2);
if (argv.includes('--help') || argv.includes('-h')) {
  console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0].replace(/^#!.*\n\/\*/, '').replace(/^ \* ?/gm, ''));
  process.exit(0);
}
function opt(name, def) { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : def; }
const ONLY = (opt('--only', '') || '').split(',').filter(Boolean).map(Number);
const KEEP = argv.includes('--keep');
const JOBS = Number(opt('--jobs', 3));
const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.resolve(opt('--out', path.join(ROOT, 'assets', 'movies')));
const SCRATCH = process.env.OMEGA_SCRATCHPAD || os.tmpdir();
const TMP = path.join(SCRATCH, 'movie-frames');
const MAX_MP4 = 1.5 * 1024 * 1024;
const MAX_JPG = 120 * 1024;

function loadPlaywright() {
  const tries = [path.join(SCRATCH, 'node_modules', 'playwright-core'), 'playwright-core'];
  for (const t of tries) { try { return require(t); } catch (e) { /* next */ } }
  console.error('playwright-core not found; set OMEGA_SCRATCHPAD to a dir containing node_modules/playwright-core');
  process.exit(2);
}

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.css': 'text/css' };
function serve() {
  return new Promise((res) => {
    const srv = http.createServer((req, rsp) => {
      const p = path.normalize(path.join(ROOT, decodeURIComponent(req.url.split('?')[0])));
      if (!p.startsWith(ROOT + path.sep) || !fs.existsSync(p) || !fs.statSync(p).isFile()) { rsp.writeHead(404); return rsp.end(); }
      rsp.writeHead(200, { 'Content-Type': TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream' });
      fs.createReadStream(p).pipe(rsp);
    });
    srv.listen(0, '127.0.0.1', () => res(srv));
  });
}

function ff(args) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: ['ignore', 'inherit', 'inherit'] });
  if (r.status !== 0) throw new Error('ffmpeg failed: ' + args.join(' '));
}

// A quiet ambient drone, one root per franchise (A1 upward, chromatic).
function droneGraph(n) {
  const f = (55 * Math.pow(2, (n - 1) / 12)).toFixed(3);
  const e = `(0.30*sin(2*PI*${f}*t)+0.18*sin(2*PI*${f}*1.5*t+0.6*sin(2*PI*0.11*t))+0.12*sin(2*PI*${f}*2.003*t)+0.05*sin(2*PI*${f}*3.01*t))*(0.75+0.25*sin(2*PI*0.2*t))`;
  return `aevalsrc='${e}':s=48000:d=12,lowpass=f=900,afade=t=in:d=2,afade=t=out:st=9.5:d=2.5,volume=0.45`;
}

function encode(n, dir) {
  const nn = String(n).padStart(2, '0');
  const mp4 = path.join(OUT, `franchise-${nn}.mp4`);
  let crf = 27;
  for (;;) {
    ff(['-framerate', '24', '-i', path.join(dir, 'f%04d.png'), '-f', 'lavfi', '-i', droneGraph(n),
      '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf), '-pix_fmt', 'yuv420p',
      '-profile:v', 'high', '-r', '24', '-c:a', 'aac', '-b:a', '64k', '-ac', '1', '-shortest', '-movflags', '+faststart', mp4]);
    const sz = fs.statSync(mp4).size;
    if (sz <= MAX_MP4 || crf >= 40) { console.log(`  franchise-${nn}.mp4  crf=${crf}  ${(sz / 1024).toFixed(0)} KB`); break; }
    crf += 1;
  }
  return mp4;
}

function poster(n, png) {
  const nn = String(n).padStart(2, '0');
  const jpg = path.join(OUT, `franchise-${nn}.jpg`);
  for (const [w, qv] of [[1280, 3], [1280, 5], [1280, 7], [960, 5], [960, 8], [800, 8], [800, 12]]) {
    ff(['-i', png, '-vf', `scale=${w}:-2`, '-q:v', String(qv), jpg]);
    const sz = fs.statSync(jpg).size;
    if (sz <= MAX_JPG) { console.log(`  franchise-${nn}.jpg  ${w}w q=${qv}  ${(sz / 1024).toFixed(0)} KB`); return jpg; }
  }
  throw new Error('poster over budget: ' + jpg);
}

async function renderOne(browser, base, n) {
  const dir = path.join(TMP, `f${String(n).padStart(2, '0')}`);
  fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  page.on('console', (m) => { if (m.type() === 'warning' || m.type() === 'error') console.log(`  [f${n}] ${m.text()}`); });
  await page.goto(`${base}/scripts/movies/scene.html?f=${n}`);
  const info = await page.evaluate(() => window.SCENE.ready);
  const total = info.frames;
  const posterAt = await page.evaluate(() => window.SCENE.posterFrame);
  console.log(`  franchise ${n}: ${total} frames, art=${info.art || 'glyph fallback'}`);
  for (let i = 0; i < total; i++) {
    const url = await page.evaluate((k) => window.SCENE.frame(k), i);
    fs.writeFileSync(path.join(dir, `f${String(i).padStart(4, '0')}.png`), Buffer.from(url.split(',')[1], 'base64'));
  }
  await page.close();
  encode(n, dir);
  poster(n, path.join(dir, `f${String(posterAt).padStart(4, '0')}.png`));
  if (!KEEP) fs.rmSync(dir, { recursive: true, force: true });
}

(async () => {
  const { chromium } = loadPlaywright();
  fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync(TMP, { recursive: true });
  const srv = await serve();
  const base = `http://127.0.0.1:${srv.address().port}`;
  const browser = await chromium.launch();
  const list = (ONLY.length ? ONLY : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]).filter((n) => n >= 1 && n <= 12);
  const queue = list.slice();
  const t0 = Date.now();
  await Promise.all(Array.from({ length: Math.min(JOBS, queue.length) }, async () => {
    while (queue.length) await renderOne(browser, base, queue.shift());
  }));
  await browser.close(); srv.close();
  console.log(`done: ${list.length} film(s) in ${((Date.now() - t0) / 1000).toFixed(0)}s -> ${OUT}`);
})().catch((e) => { console.error(e); process.exit(1); });
