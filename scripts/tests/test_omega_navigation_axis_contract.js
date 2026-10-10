#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const source = fs.readFileSync(path.join(__dirname, '..', '..', 'nav.js'), 'utf8');

const psStart = source.indexOf('var PS={');
const sectionsStart = source.indexOf('var SECTIONS=[');
const cssStart = source.indexOf('/* INJECT CSS */');
if (psStart < 0 || sectionsStart < 0 || cssStart < 0) throw new Error('Navigation contract anchors missing');

const psSource = source.slice(psStart, sectionsStart);
const sectionSource = source.slice(sectionsStart, cssStart);
const psExecutable = psSource
  .replace(/\/\*[\\s\\S]*?\*\//g, '')
  .replace(/(^|\\n)\\s*\/\/.*$/gm, '');
const psKeys = new Set();
const psDuplicates = new Set();
for (const match of psExecutable.matchAll(/(?:^|,)\\s*['"]?([A-Za-z0-9_-]+)['"]?\\s*:/g)) {
  if (psKeys.has(match[1])) psDuplicates.add(match[1]);
  psKeys.add(match[1]);
}
if (psDuplicates.size) throw new Error('Duplicate PS axis mappings silently override earlier values: ' + [...psDuplicates].join(', '));

const subKeys = new Set();
for (const match of sectionSource.matchAll(/\\[\\s*['\"]([A-Za-z0-9_-]+)['\"]\\s*,/g)) subKeys.add(match[1]);

const ignored = /^.+-alias-\\d+$/;
const missing = [...subKeys].filter((key) => !ignored.test(key) && !psKeys.has(key));
if (missing.length) throw new Error('Reachable navigation pages missing PS axis mapping: ' + missing.join(', '));

const requiredMappings = {
  'simulation-arena': 'arena',
  'achieve-home': 'achieve',
  'knowledge-loom': 'govern',
  'billing': 'vault',
  'vault-settings': 'vault',
  'horoscope-page': 'intel'
};

for (const [page, section] of Object.entries(requiredMappings)) {
  const needle = page + ":'" + section + "'";
  if (!source.includes(needle)) throw new Error('Missing canonical PS mapping: ' + page + ' -> ' + section);
}

if (!source.includes("var activeSection=PS[dp]||'command';")) throw new Error('Navigation active-section fallback contract changed unexpectedly');
if (!source.includes('window.OmegaAxis')) throw new Error('Canonical OmegaAxis publication contract missing');
console.log('PASS navigation axis contract: every reachable non-alias route has a canonical workspace mapping.');