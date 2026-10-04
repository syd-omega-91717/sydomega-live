const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(root, 'omega-execution-os.js'), 'utf8');
const context = { console, globalThis: {}, TextEncoder, Set, Array, Number, JSON, Math };
vm.createContext(context);
vm.runInContext(source, context);
const os = context.globalThis.OmegaExecutionOS;

assert(os, 'execution OS must expose a runtime contract');

const open = os.compileIntent({
  goal: 'Find the best verified academy service',
  capabilities: [{action:'search', enabled:true}],
  authorization: {canExecute:false}
});
assert.strictEqual(open.status, 'READY_FOR_AUTHORIZED_RUNTIME');
assert(open.plan.some(step => step.action === 'verify'));

const protectedPlan = os.compileIntent({
  goal: 'purchase a service and transfer funds',
  capabilities: [],
  authorization: {canExecute:false}
});
assert.strictEqual(protectedPlan.status, 'BLOCKED');
assert(protectedPlan.blockedReasons.length >= 1);

const city = os.deriveCityState(
  'omega-prime',
  [
    {cityId:'omega-prime',serviceId:'academy',type:'action_completed'},
    {cityId:'omega-prime',serviceId:'academy',type:'action_failed'},
    {cityId:'other',serviceId:'academy',type:'action_completed'}
  ],
  [{id:'academy',cityId:'omega-prime'}],
  [{id:'mission-1',cityId:'omega-prime'}]
);
assert.strictEqual(city.eventDensity, 2);
assert.strictEqual(city.serviceHealth[0].state, 'DEGRADED');
assert.strictEqual(city.missionFlow.total, 1);
assert(city.note.includes('No population'));

const learning = os.createLearningRecord(
  {id:'attempt-1'},
  {reason:'provider unavailable',missingCapability:'notification'},
  ['evidence-1']
);
assert.strictEqual(learning.requiresHumanReview, true);
assert.strictEqual(learning.retryPolicy, 'REVIEW_BEFORE_RETRY');

const ranked = os.rankOpportunities([
  {id:'a',category:'commerce',score:92,evidenceIds:['e1']},
  {id:'b',category:'research',score:88,evidenceIds:[]}
], ['research']);
assert.strictEqual(ranked[0].id, 'a');
assert.strictEqual(ranked[1].blocked, true);
assert.strictEqual(ranked[1].truthState, 'UNKNOWN');

console.log('OMEGA_EXECUTION_OS_CONTRACT=PASS');
