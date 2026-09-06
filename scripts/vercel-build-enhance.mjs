#!/usr/bin/env node
/**
 * Finalizes the static artifact after it has been copied into public/.
 * Every shipped page receives the same baseline shell: viewport, title,
 * canonical visual runtime, and privacy-safe runtime observability.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const ROOT = join(process.cwd(), 'public');
const ENGINE_CANDIDATES = [
  'omega-visual-engine.js',
  'assets/js/omega-visual-engine.js',
  'js/omega-visual-engine.js',
  'assets/omega-visual-engine.js',
];
const OBSERVABILITY_CANDIDATES = [
  'omega-runtime-observability.js',
  'assets/js/omega-runtime-observability.js',
  'js/omega-runtime-observability.js',
];

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
    try {
      await readFile(join(ROOT, relative));
      return `/${relative}`;
    } catch {}
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
let changed = 0;

for (const file of files) {
  let html = await readFile(file, 'utf8');
  const original = html;
  const title = fallbackTitle(file);

  if (!/<meta\s+[^>]*name=["']viewport["']/i.test(html)) {
    html = html.replace(/<head(\s[^>]*)?>/i, match => `${match}\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`);
  }

  if (!/<title\b/i.test(html)) {
    html = html.replace(/<head(\s[^>]*)?>/i, match => `${match}\n<title>${title}</title>`);
  }

  const scripts = [];
  if (engine && !/omega-visual-engine\.js/i.test(html)) scripts.push(`<script src="${engine}" defer></script>`);
  if (observability && !/omega-runtime-observability\.js/i.test(html)) scripts.push(`<script src="${observability}" defer></script>`);
  if (scripts.length && /<\/body>/i.test(html)) {
    html = html.replace(/<\/body>/i, `\n${scripts.join('\n')}\n</body>`);
  }

  if (html !== original) {
    await writeFile(file, html);
    changed++;
  }
}

console.log(`VERCEL_ARTIFACT_ENHANCE=PASS html=${files.length} changed=${changed} engine=${engine ?? 'not-found'} observability=${observability ?? 'not-found'}`);
if (engine === null) console.log('visual_engine=source-page-runtime-only');
if (observability === null) console.log('observability=not-installed');
