const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');

const root=path.resolve(__dirname,'../..');

function load(file,name){
  const source=fs.readFileSync(path.join(root,file),'utf8');
  const context={console,globalThis:{},Set,Array,Number,JSON,Math};
  vm.createContext(context);
  vm.runInContext(source,context);
  assert(context.globalThis[name],name+' must expose a runtime contract');
  return context.globalThis[name];
}

const graph=load('omega-execution-graph.js','OmegaExecutionGraph');
const immune=load('omega-architectural-immune-system.js','OmegaArchitecturalImmuneSystem');

const blocked=graph.build({
  intentId:'intent-1',
  intent:'Complete a governed service order',
  authorization:{canExecute:false},
  capabilities:[{id:'commerce',name:'Commerce',enabled:true}],
  services:[{id:'marketplace',name:'Marketplace',state:'LIVE'}],
  tasks:[{id:'order',name:'Service Order',authorized:true}],
  evidenceIds:[],
  outcome:'Order completed'
});
assert.strictEqual(blocked.status,'BLOCKED');
assert(blocked.blockers.some(x=>x.includes('authority')));
assert(blocked.blockers.some(x=>x.includes('evidence')));
assert.strictEqual(graph.validate(blocked).valid,true);

const ready=graph.build({
  intentId:'intent-2',
  intent:'Review verified research',
  authorization:{canExecute:true},
  capabilities:[{id:'intel',enabled:true}],
  services:[{id:'intelligence',state:'LIVE'}],
  tasks:[{id:'review',authorized:true}],
  evidenceIds:['evidence-1'],
  outcome:'Verified brief'
});
assert.strictEqual(ready.status,'READY_FOR_GOVERNED_EXECUTION');
assert.strictEqual(graph.validate(ready).valid,true);

const unhealthy=immune.audit({
  canonicalSystems:{
    identity:'auth',events:'events',evidence:'evidence',missions:'missions',
    capabilities:'caps',lineage:'lineage',atlas:'atlas',objectModel:'objects',progression:'729'
  },
  webglRendererCount:2,
  objects:[
    {id:'fake-live',state:'LIVE',evidenceRequired:true,evidencePresent:false},
    {id:'sim-live',state:'SIMULATED',advertisedAsLive:true}
  ],
  routes:[{path:'/admin',required:true,reachable:true,protected:true,authorizationVerified:false}],
  capabilities:[{id:'orphan',enabled:true,authoritativeSystemMissing:true}],
  providers:[{id:'stripe',required:true,healthy:false}]
});
assert.strictEqual(unhealthy.status,'PROMOTION_BLOCKED');
assert(unhealthy.summary.critical>=4);

const healthy=immune.audit({
  canonicalSystems:{
    identity:'auth',events:'events',evidence:'evidence',missions:'missions',
    capabilities:'caps',lineage:'lineage',atlas:'atlas',objectModel:'objects',progression:'729'
  },
  webglRendererCount:1,
  objects:[{id:'live-evidence',state:'LIVE',evidenceRequired:true,evidencePresent:true}],
  routes:[{path:'/admin',required:true,reachable:true,protected:true,authorizationVerified:true}],
  capabilities:[{id:'real',enabled:true,authoritativeSystemMissing:false}],
  providers:[{id:'stripe',required:true,healthy:true}]
});
assert.strictEqual(healthy.status,'ARCHITECTURE_HEALTHY');

console.log('OMEGA_EXECUTION_GRAPH_AND_IMMUNE_SYSTEM=PASS');
