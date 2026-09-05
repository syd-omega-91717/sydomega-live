#!/usr/bin/env node
/**
 * Finalizes the static artifact after it has been copied into public/.
 *
 * This is deliberately build-time only: source pages remain independently
 * editable, while every production artifact receives the same baseline shell
 * contract (viewport, title fallback, and canonical visual runtime).
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

async function findEngine() {
  for (const relative of ENGINE_CANDIDATES) {
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
const engine = await findEngine();
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

  if (engine && !/omega-visual-engine\.js/i.test(html) && /<\/body>/i.test(html)) {
    html = html.replace(/<\/body>/i, `\n<script src="${engine}" defer></script>\n</body>`);
  }

  if (html !== original) {
    await writeFile(file, html);
    changed++;
  }
}

console.log(`VERCEL_ARTIFACT_ENHANCE=PASS html=${files.length} changed=${changed} engine=${engine ?? 'not-found'}`);
if (engine === null) console.log('visual_engine=source-page-runtime-only');
