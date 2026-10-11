#!/usr/bin/env node
const fs=require('fs');
const js=fs.readFileSync('omega-achieve-native.js','utf8');
const html=fs.readFileSync('achieve.html','utf8');
for(const x of ['omega_achievement_definitions','omega_user_achievements','omega_achievement_verifications','omega_certificates','omega_platform_evidence','SIGN_IN_REQUIRED','verification_status','No browser-side award minting'])if(!js.includes(x))throw new Error('missing canonical ACHIEVE contract: '+x);
if(!html.includes('omega-achieve-native.js'))throw new Error('achieve.html missing native script');
console.log('OMEGA_ACHIEVE_NATIVE_EVIDENCE=PASS');
