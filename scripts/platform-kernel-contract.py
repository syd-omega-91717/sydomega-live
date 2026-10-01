#!/usr/bin/env python3
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; MANIFEST=ROOT/"omega-platform-manifest.json"
ALLOWED={"specified","implemented","tested","runtime_verified","production_verified","observed","scaled","blocked"}
def fail(x): raise SystemExit("PLATFORM KERNEL CONTRACT: FAIL — "+x)
def main():
    if not MANIFEST.exists(): fail("manifest missing")
    d=json.loads(MANIFEST.read_text())
    if d.get("schema_version")!="1.0.0": fail("schema")
    caps=d.get("capabilities",[]); layers=d.get("layers",[])
    if not caps or not layers: fail("empty contract")
    ids=[x.get("id") for x in caps]
    if len(ids)!=len(set(ids)): fail("duplicate capability id")
    for c in caps:
        if c.get("state") not in ALLOWED: fail("invalid state: "+str(c.get("id")))
        route=c.get("route","").lstrip("/")
        if not route or not (ROOT/route).exists(): fail("missing route: "+route)
    p=d.get("truth_policy",{})
    if p.get("unknown_is_not_zero") is not True or p.get("no_fabricated_metrics") is not True: fail("truth policy weakened")
    print(f"PLATFORM KERNEL CONTRACT: PASS — {len(layers)} layers / {len(caps)} capabilities")
if __name__=="__main__": main()
