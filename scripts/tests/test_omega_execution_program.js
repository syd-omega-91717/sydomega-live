#!/usr/bin/env node
"use strict";
const fs=require("fs"), path=require("path");
const root=path.resolve(__dirname,"../..");
const cfg=JSON.parse(fs.readFileSync(path.join(root,"config/omega-execution-program.json"),"utf8"));
if(cfg.waves.length!==7) throw new Error("wave count");
const tracks=cfg.waves.flatMap(w=>w.tracks);
if(new Set(tracks.map(t=>t.id)).size!==tracks.length) throw new Error("duplicate track ids");
const ids=new Set(tracks.map(t=>t.id));
for(const t of tracks){
  if(!t.name || !t.status || !Array.isArray(t.evidence)) throw new Error("invalid track "+t.id);
  for(const d of (t.depends||[])) if(!ids.has(d)) throw new Error("unknown dependency "+d);
}
for(const g of cfg.release_gates||[]){
  for(const r of g.requires||[]) if(!ids.has(r)) throw new Error("unknown gate dependency "+r);
}
if(cfg.truth_rule!=="IMPLEMENTATION_IS_NOT_PROVIDER_EVIDENCE") throw new Error("truth rule");
console.log("OMEGA EXECUTION PROGRAM TEST: PASS");
