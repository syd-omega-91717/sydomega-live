#!/usr/bin/env node
const fs=require('fs');
const gate=JSON.parse(fs.readFileSync('config/omega-production-10-10-evidence-gate.json','utf8'));
if(gate.truth_rule!=='IMPLEMENTATION_IS_NOT_PROVIDER_EVIDENCE')throw new Error('truth rule changed');
if(!Array.isArray(gate.domains)||gate.domains.length!==12)throw new Error('unexpected gate domain count');
const allowed=new Set(gate.statuses);
for(const d of gate.domains){if(!d.id||!allowed.has(d.status)||!Array.isArray(d.evidence_required)||!d.evidence_required.length)throw new Error('invalid domain: '+JSON.stringify(d));}
const blocked=gate.domains.filter(d=>d.status==='BLOCKED');
if(blocked.length<3)throw new Error('gate unexpectedly lost provider blockers');
console.log('OMEGA_PRODUCTION_10_10_EVIDENCE_GATE=PASS');
console.log('BLOCKED_DOMAINS='+blocked.map(d=>d.id).join(','));
