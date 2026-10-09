#!/usr/bin/env node
const fs=require('fs');
const bg=fs.readFileSync('bg.js','utf8');
const manifest=JSON.parse(fs.readFileSync('config/omega-runtime-manifest.json','utf8'));
for(const [needle,label] of [
  ['src='/omega-action-runtime.js'','action runtime'],
  ['src='/omega-data-runtime.js'','data runtime'],
  ['src='/omega-mission-state.js'','mission state']
]) if(!bg.includes(needle)) throw new Error('bg.js missing '+label);
if(manifest.entrypoints.actionRuntime!='/omega-action-runtime.js') throw new Error('action entrypoint drift');
if(manifest.entrypoints.dataRuntime!='/omega-data-runtime.js') throw new Error('data entrypoint drift');
if(manifest.entrypoints.missionState!='/omega-mission-state.js') throw new Error('mission entrypoint drift');
if(!bg.includes('[data-omega-mission-state]')) throw new Error('mission runtime is not conditionally scoped');
console.log('OMEGA_GOVERNED_RUNTIME_MODULE_WIRING=PASS');
