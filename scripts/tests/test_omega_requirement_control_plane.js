#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const cfgPath = path.join(root, 'config/omega-requirement-control-plane.json');
const docPath = path.join(root, 'docs/OMEGA_REQUIREMENT_CONTROL_PLANE.md');

function fail(message) {
  console.error('OMEGA REQUIREMENT CONTROL PLANE: FAIL ' + message);
  process.exit(1);
}

const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
if (cfg.schema_version !== 1) fail('schema_version');
if (cfg.corpus?.sources !== 5) fail('source count');
if (cfg.corpus?.total_lines !== 4068) fail('line count');
if (cfg.corpus?.total_words !== 31212) fail('word count');
if (cfg.corpus?.normalized_requirement_records !== 1622) fail('requirement count');

const requiredStates = new Set([
  'LIVE','IMPLEMENTED','RUNTIME-VERIFIED','PRODUCTION-VERIFIED','PARTIAL',
  'CALCULATED','SIMULATED','USER-CREATED','EMPTY','UNAVAILABLE','UNVERIFIED',
  'BLOCKED','LORE','FUTURE','REJECTED','REPLACED'
]);
for (const state of cfg.states) {
  if (!requiredStates.has(state)) fail('unknown state ' + state);
}
if (cfg.rule !== 'IMPLEMENTATION_IS_NOT_PROVIDER_EVIDENCE') fail('truth rule');
if (!Array.isArray(cfg.priorities) || cfg.priorities.length !== 20) fail('priority count');

const ids = new Set();
for (const row of cfg.priorities) {
  if (!Array.isArray(row) || row.length !== 4) fail('priority shape');
  if (ids.has(row[0])) fail('duplicate requirement ' + row[0]);
  ids.add(row[0]);
  if (!['IMPLEMENTED','PARTIAL','UNVERIFIED','BLOCKED','PENDING'].includes(row[2])) fail('invalid priority status ' + row[2]);
}

const doc = fs.readFileSync(docPath, 'utf8');
for (const token of [
  'IMPLEMENTATION → AUTHORIZATION → TEST → CI',
  'RC-001',
  'RC-020',
  'WORKSPACES',
  'High-risk blueprint concepts'
]) {
  if (!doc.includes(token)) fail('documentation missing ' + token);
}

console.log('OMEGA REQUIREMENT CONTROL PLANE: PASS');
console.log('20 controlled priorities; 1,622 normalized source records; 4,068 source lines.');
