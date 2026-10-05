const assert=require('assert');const fs=require('fs');const path=require('path');const vm=require('vm');const root=path.resolve(__dirname,'../..');const source=fs.readFileSync(path.join(root,'omega-control-plane-contracts.js'),'utf8');const context={console,globalThis:{},Set,Array};vm.createContext(context);vm.runInContext(source,context);const c=context.globalThis.OmegaControlPlaneContracts;assert(c);
assert.strictEqual(c.assessProvider({id:'stripe',configured:true,authorizationVerified:true,failureTested:true,idempotencyVerified:true,productionEvidence:true}).truthState,'LIVE');
assert.strictEqual(c.assessProvider({id:'stripe',configured:true}).truthState,'UNVERIFIED');
assert.strictEqual(c.assessEntitlement({providerWebhookVerified:true,signatureVerified:true,idempotencyVerified:true,paymentState:'PENDING',authorizationVerified:true}).grant,false);
assert.strictEqual(c.assessEntitlement({providerWebhookVerified:true,signatureVerified:true,idempotencyVerified:true,paymentState:'PAID',authorizationVerified:true}).grant,true);
assert.strictEqual(c.assessDataExport({authenticated:true,authorizationVerified:false,scopeVerified:false}).ready,false);
assert.strictEqual(c.assessNotification({providerConfirmed:false,preferenceAllowed:true,authorized:true}).deliver,false);
console.log('OMEGA_CONTROL_PLANE_CONTRACTS=PASS');
