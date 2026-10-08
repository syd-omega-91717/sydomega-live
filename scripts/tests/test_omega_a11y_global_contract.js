#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'../..');
const f=fs.readFileSync(path.join(root,'omega-wcag-aaa.js'),'utf8');
function fail(m){console.error('A11Y GLOBAL CONTRACT: FAIL '+m);process.exit(1);}
if(!f.includes('const a11y = window.OmegaA11y || {};')) fail('does not preserve existing API');
if(f.includes('window.OmegaA11y = {')) fail('still replaces global API');
if(!f.includes("typeof a11y.announce !== 'function'")) fail('announce guard missing');
if(!f.includes("typeof a11y.label !== 'function'")) fail('label guard missing');
if(!f.includes("hasAttribute('aria-label')")) fail('label duplication guard missing');
console.log('A11Y GLOBAL CONTRACT: PASS');
