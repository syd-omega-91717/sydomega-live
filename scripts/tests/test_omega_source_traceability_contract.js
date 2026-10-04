const assert=require('assert');
const fs=require('fs');
const path=require('path');

const root=path.resolve(__dirname,'../..');
const registry=JSON.parse(fs.readFileSync(path.join(root,'config/omega-source-traceability.json'),'utf8'));

assert.strictEqual(registry.sourceCorpus.length,5,'source corpus must contain the five uploaded source documents');
assert.strictEqual(registry.auditAccounting.declaredFrameworkPoints,999,'declared blueprint count must remain 999');
assert.strictEqual(registry.auditAccounting.explicitNumberedPointRecords,391,'explicit numbered source records must remain auditable');
assert.strictEqual(registry.auditAccounting.declaredButNotDiscreteSourceRecords,608,'unrepresented declared records must remain explicitly accounted for');
assert.strictEqual(
  registry.auditAccounting.explicitNumberedPointRecords + registry.auditAccounting.declaredButNotDiscreteSourceRecords,
  registry.auditAccounting.declaredFrameworkPoints,
  'source accounting must reconcile without fabricating records'
);
assert(registry.auditAccounting.rule.includes('Never synthesize'),'registry must prohibit fabricated numbered points');
assert(registry.implementationRule.architectureConstraint.includes('static/Supabase/Vercel'),'current architecture continuity must be explicit');
for(const system of ['identity','events','evidence','missions','capabilities','lineage','atlas','objectModel','progression']){
  assert(registry.currentCanonicalSystems[system],`canonical system missing: ${system}`);
}
for(const field of ['sourceId','sourceLocator','concept','domain','truthState','implementationPath','authoritativeSystem','verification','productionEvidence']){
  assert(registry.traceabilityFields.includes(field),`traceability field missing: ${field}`);
}
assert(registry.implementationRule.minimumProductionEvidence.length>=7,'production evidence gate must remain comprehensive');

console.log('OMEGA_SOURCE_TRACEABILITY_CONTRACT=PASS');
