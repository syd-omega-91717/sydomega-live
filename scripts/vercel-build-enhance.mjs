#!/usr/bin/env node
/**
 * Finalizes the static artifact after it has been copied into public/.
 * Every shipped page receives the same baseline shell: viewport, title,
 * canonical visual runtime, privacy-safe observability, manifest, and
 * resilient offline recovery registration.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const ROOT = join(process.cwd(), 'public');
const ENGINE_CANDIDATES = ['omega-visual-engine.js','assets/js/omega-visual-engine.js','js/omega-visual-engine.js','assets/omega-visual-engine.js'];
const OBSERVABILITY_CANDIDATES = ['omega-runtime-observability.js','assets/js/omega-runtime-observability.js','js/omega-runtime-observability.js'];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) files.push(path);
  }
  return files;
}

async function findAsset(candidates) {
  for (const relative of candidates) {
    try { await readFile(join(ROOT, relative)); return `/${relative}`; } catch {}
  }
  return null;
}

function fallbackTitle(file) {
  const name = file.split('/').pop().replace(/\.html$/i, '');
  if (!name || name === 'index') return 'Ω SYD OMEGA 91717';
  return `Ω SYD OMEGA 91717 — ${name.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`;
}

const files = await walk(ROOT);
const engine = await findAsset(ENGINE_CANDIDATES);
const observability = await findAsset(OBSERVABILITY_CANDIDATES);
const manifestExists = await findAsset(['manifest.json']);
const offlineExists = await findAsset(['offline.html']);
let changed = 0;

for (const file of files) {
  if (file.endsWith(`${ROOT}/offline.html`)) continue;
  let html = await readFile(file, 'utf8');
  const original = html;
  const title = fallbackTitle(file);

  if (!/<meta\s+[^>]*name=["']viewport["']/i.test(html)) {
    html = html.replace(/<head(\s[^>]*)?>/i, match => `${match}\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`);
  }
  if (!/<title\b/i.test(html)) {
    html = html.replace(/<head(\s[^>]*)?>/i, match => `${match}\n<title>${title}</title>`);
  }
  if (manifestExists && !/<link\s+[^>]*rel=["']manifest["']/i.test(html)) {
    html = html.replace(/<head(\s[^>]*)?>/i, match => `${match}\n<link rel="manifest" href="/manifest.json">`);
  }


  // Universal visual/content contract: every shipped content page receives the
  // same restrained background and the shared platform runtime. Existing page
  // scripts remain in place; bg.js is internally guarded against duplication.
  if (!/omega-unified-background\.css/i.test(html)) {
    html = html.replace(/<head(\s[^>]*)?>/i, match => `${match}
<link rel="stylesheet" href="/omega-unified-background.css" data-omega-unified-background="1">`);
  }
  if (!/data-omega-global-bg="1"/i.test(html) && !/<script[^>]+src=["'][^"']*\/bg\.js/i.test(html)) {
    html = html.replace(/<body(\s[^>]*)?>/i, match => `${match}
<script src="/bg.js" defer data-omega-global-bg="1"></script>`);
  }

  const scripts = [];
  if (engine && !/omega-visual-engine\.js/i.test(html)) scripts.push(`<script src="${engine}" defer></script>`);
  if (observability && !/omega-runtime-observability\.js/i.test(html)) scripts.push(`<script src="${observability}" defer></script>`);
  if (offlineExists && !/omega-service-worker-registration/i.test(html)) {
    scripts.push(`<script id="omega-service-worker-registration">(function(){if(!('serviceWorker' in navigator))return;window.addEventListener('load',function(){navigator.serviceWorker.register('/service-worker.js',{scope:'/'}).catch(function(error){if(window.omegaRuntime&&typeof window.omegaRuntime.record==='function')window.omegaRuntime.record('service_worker_registration_error',{name:error&&error.name||'Error'});});});})();</script>`);
  }
  if (scripts.length && /<\/body>/i.test(html)) html = html.replace(/<\/body>/i, `\n${scripts.join('\n')}\n</body>`);

  if (html !== original) { await writeFile(file, html); changed++; }
}

console.log(`VERCEL_ARTIFACT_ENHANCE=PASS html=${files.length} changed=${changed} engine=${engine ?? 'not-found'} observability=${observability ?? 'not-found'} manifest=${manifestExists ?? 'not-found'} offline=${offlineExists ?? 'not-found'}`);
if (engine === null) console.log('visual_engine=source-page-runtime-only');
if (observability === null) console.log('observability=not-installed');
if (offlineExists === null) console.log('offline_recovery=not-installed');
