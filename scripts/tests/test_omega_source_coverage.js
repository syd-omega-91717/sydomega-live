#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..', '..');
const configPath = path.join(root, 'config', 'omega-source-coverage.json');
const docPath = path.join(root, 'docs', 'OMEGA_SOURCE_COVERAGE_AUDIT.md');

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const doc = fs.readFileSync(docPath, 'utf8');

assert.equal(config.schemaVersion, '1.0.0');
assert.equal(config.sourceCorpus.length, 5);
assert.deepEqual(config.authorityOrder.slice(0, 3), [
  'LIVE_PRODUCTION_EVIDENCE',
  'REPOSITORY_CONTRACTS',
  'CURRENT_IMPLEMENTATION'
]);
assert.equal(config.sourceCorpus[0].declaredFrameworkPoints, 999);
assert.equal(config.sourceCorpus[0].explicitNumberedRecords, 391);
assert.equal(config.sourceCorpus[0].numberedRecordOccurrences, 399);
assert.equal(config.sourceCorpus[0].duplicateNumberRecords, 8);
assert.equal(config.sourceCorpus[0].nonDiscreteDeclaredNumbers, 608);
assert.equal(config.promotionLifecycle.at(-1), 'LIVE_VERIFY');

for (const required of [
  'IDENTITY_AND_ACCESS',
  '18_PRODUCT_MODULES',
  'AI_AND_AGENTS',
  'EVENTS_EVIDENCE_AND_LINEAGE',
  'LEGAL_PRIVACY_AND_COMPLIANCE',
  'SECURITY_AND_ZERO_TRUST',
  'CIVILIZATION_AND_CITY_OS',
  'ROBOTICS_AND_INTEROPERABILITY',
  'DIGITAL_TWINS'
]) {
  assert.ok(config.coverageDomains.includes(required), required);
}

for (const requiredText of [
  'Do not invent the missing 608 points',
  'SOURCE → CLASSIFY → SPECIFY → IMPLEMENT → CONNECT → PERSIST → SECURE → TEST → DEPLOY → LIVE-VERIFY',
  'Historical credentials',
  'Production promotion gate',
  'No future change may'
]) {
  assert.ok(doc.includes(requiredText), requiredText);
}

console.log('Ω source coverage audit contract: PASS');
