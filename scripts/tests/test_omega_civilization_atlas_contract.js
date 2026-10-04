const assert=require('assert');
const fs=require('fs');
const path=require('path');

const root=path.resolve(__dirname,'../..');
const atlas=JSON.parse(fs.readFileSync(path.join(root,'config/omega-civilization-atlas.json'),'utf8'));
const model=JSON.parse(fs.readFileSync(path.join(root,'config/omega-object-model.json'),'utf8'));
const runtime=fs.readFileSync(path.join(root,'omega-world-atlas.js'),'utf8');

const bodies=atlas.bodies||[];
const objects=atlas.objects||[];
assert.strictEqual(bodies.filter(x=>x.type==='PLANETARY_CORE').length,1,'atlas must contain one Solar Core');
assert.strictEqual(bodies.filter(x=>x.type==='PLANET').length,8,'atlas must contain eight orbital planets');
assert.strictEqual(bodies.length,9,'atlas must expose nine canonical ledger bodies');
assert(objects.some(x=>x.id==='earth-world'&&x.state==='LIVE'),'Earth production world must exist');
assert.strictEqual((atlas.cityProfiles||[]).length,3,'city profiles must be registered for seeded cities');
assert.strictEqual((atlas.agents||[]).length,12,'all twelve canonical agents must be mapped');
assert.strictEqual(atlas.progression.matrix,'9x9x9','progression matrix must remain canonical');
assert(atlas.integration.progressionContract.includes('729-node matrix'),'progression contract must bind the 729-node model');
for(const type of ['planetary_body','world','country','empire','city','district','building','service','resource','mission','task']){
  assert(model.objects.some(x=>x.type===type),`object model missing atlas type: ${type}`);
}
for(const relation of ['CONTAINS','LOCATED_IN','IMPLEMENTS','VERIFIED_BY','PROGRESSES']){
  assert(model.relations.some(x=>x.type===relation),`object model missing atlas relation: ${relation}`);
}
assert(runtime.includes("data-filter=\"PRODUCTION\"")===false,'runtime must not hard-code HTML filters');
assert(runtime.includes("PRODUCTION:function(x){return x.state==='LIVE';}"),'production truth mapping must be explicit');
assert(runtime.includes('ATLAS SOURCE UNAVAILABLE — no fallback state is fabricated.'),'failure state must not fabricate fallback data');
assert(!/WebGLRenderer|THREE\s*\./.test(runtime),'atlas runtime must not own a second WebGL renderer');

console.log('OMEGA_CIVILIZATION_ATLAS_CONTRACT=PASS');
