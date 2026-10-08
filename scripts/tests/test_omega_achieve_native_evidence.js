#!/usr/bin/env node
const fs=require('fs');
const js=fs.readFileSync('omega-achieve-native.js','utf8');
const html=fs.readFileSync('achieve.html','utf8');
for(const x of ['task_completions','evolution_events','trophies','medals','certificates','omega_platform_evidence','SIGN_IN_REQUIRED','UNAVAILABLE','does not independently prove'])if(!js.includes(x))throw new Error('missing ACHIEVE evidence contract: '+x);
if(!html.includes('omega-achieve-native.js'))throw new Error('achieve.html missing native script');
console.log('OMEGA_ACHIEVE_NATIVE_EVIDENCE=PASS');
