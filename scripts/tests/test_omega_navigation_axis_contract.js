#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const source = fs.readFileSync(path.join(__dirname, '..', '..', 'nav.js'), 'utf8');

const requiredMappings = {
  'simulation-arena': 'arena',
  'achieve-home': 'achieve',
  'knowledge-loom': 'intel',
  'billing': 'vault',
  'vault-settings': 'vault'
};

for (const [page, section] of Object.entries(requiredMappings)) {
  const needle = page + ":'" + section + "'";
  if (!source.includes(needle)) throw new Error('Missing canonical PS mapping: ' + page + ' -> ' + section);
}

if (!source.includes("var activeSection=PS[dp]||'command';")) throw new Error('Navigation active-section fallback contract changed unexpectedly');
if (!source.includes('window.OmegaAxis')) throw new Error('Canonical OmegaAxis publication contract missing');
console.log('PASS navigation axis contract: required real routes resolve to their owning workspace.');