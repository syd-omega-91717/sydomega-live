#!/usr/bin/env node
const fs=require('fs');
const js=fs.readFileSync('omega-media-native.js','utf8');
const html=fs.readFileSync('media.html','utf8');
for(const x of ['CALCULATED','LORE','UNAVAILABLE','UNVERIFIED','does not claim publication'])if(!js.includes(x))throw new Error('missing MEDIA truth contract: '+x);
if(!html.includes('omega-media-native.js'))throw new Error('media.html missing native script');
console.log('OMEGA_MEDIA_NATIVE_TRUTH=PASS');
