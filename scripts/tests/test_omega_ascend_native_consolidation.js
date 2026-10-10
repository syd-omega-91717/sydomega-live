#!/usr/bin/env node
const fs=require('fs');
const html=fs.readFileSync('ascend.html','utf8');
const js=fs.readFileSync('omega-ascend-native.js','utf8');
function ok(c,m){if(!c){console.error('FAIL:',m);process.exitCode=1;}else console.log('PASS:',m);}
ok(html.includes('data-omega-ascend-native'),'ASCEND native mount exists');
ok(html.includes('/omega-ascend-native.js'),'native adapter is loaded');
for(const key of ['profiles','task_completions','evolution_events']) ok(js.includes(key),key+' is observed');
ok(js.includes('eq(\'user_id\',u.id)'),'member-scoped persisted queries');
ok(js.includes('UNAVAILABLE')&&js.includes('EMPTY'),'truth states are explicit');
ok(js.includes('APEX=27.8367'),'established authority model is preserved');
ok(!js.includes('Math.random'),'no synthetic randomness');
