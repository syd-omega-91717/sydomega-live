#!/usr/bin/env python3
"""Validate the canonical Ω Object contract against live-schema evidence."""
from __future__ import annotations
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
MODEL=ROOT/"config/omega-object-model.json"
SCHEMA=ROOT/"supabase/live-schema.json"
def main():
 model=json.loads(MODEL.read_text())
 schema=json.loads(SCHEMA.read_text())
 tables=set(schema.get("tables",{}))
 assert model["contract"]=="OmegaObject"
 objects=model["objects"]
 assert objects and len({x["type"] for x in objects})==len(objects)
 missing={}
 for obj in objects:
  if not any(s in tables for s in obj["sources"]): missing[obj["type"]]=obj["sources"]
 if missing: raise SystemExit("OMEGA_OBJECT_CONTRACT=FAIL missing source tables: "+json.dumps(missing,sort_keys=True))
 assert model["relations"] and all({"type","from","to"}<=set(r) for r in model["relations"])
 allowed={"LIVE","VERIFIED","CALCULATED","SOURCE","SIMULATED","STALE","UNAVAILABLE","UNKNOWN"}
 assert set(model["truth"]["allowedStates"])==allowed
 print(f"OMEGA_OBJECT_CONTRACT=PASS objects={len(objects)} relations={len(model['relations'])} tables={len(tables)}")
if __name__=="__main__": main()
