#!/usr/bin/env node
const fs=require('fs');
const html=fs.readFileSync('govern.html','utf8');
const js=fs.readFileSync('omega-govern-native.js','utf8');
const required=[
  'governance_policies','capability_registry','feature_flags',
  'data_lineage','security_policies','audit_logs',
  'SIGN_IN_REQUIRED','UNAVAILABLE','Read-only projection'
];
for(const x of required){
  if(!js.includes(x)) throw new Error('missing native contract: '+x);
}
if(!html.includes('omega-govern-native.js')) throw new Error('govern.html missing native script');
if((html.match(/<script src="\/bg\.js"><\/script>/g)||[]).length>1) throw new Error('duplicate bg.js include');
if(html.includes('setInterval')||js.includes('setInterval')) throw new Error('no polling loop allowed');
console.log('OMEGA_GOVERN_NATIVE_CONSOLIDATION=PASS');
