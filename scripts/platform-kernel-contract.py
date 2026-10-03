#!/usr/bin/env python3
"""Deterministic contract for the Omega Platform Kernel and its evidence bridges."""
from __future__ import annotations
import json
import sys
from pathlib import Path
if __name__ == "__main__" and ("--help" in sys.argv or "-h" in sys.argv):
    print(__doc__)
    raise SystemExit(0)

ROOT=Path(__file__).resolve().parents[1]
MANIFEST=ROOT/"omega-platform-manifest.json"
REGISTRY=ROOT/"docs/capabilities/registry.json"
ALLOWED={"specified","implemented","partial","tested","runtime_verified","production_verified","observed","scaled","blocked"}
def fail(message): raise SystemExit("PLATFORM KERNEL CONTRACT: FAIL — "+message)
def main():
    if not MANIFEST.exists(): fail("manifest missing")
    d=json.loads(MANIFEST.read_text())
    if d.get("schema_version")!="1.1.0": fail("unsupported manifest schema")
    caps=d.get("capabilities",[]); layers=d.get("layers",[])
    if not caps or not layers: fail("empty contract")
    ids=[x.get("id") for x in caps]
    if len(ids)!=len(set(ids)): fail("duplicate capability id")
    registry=json.loads(REGISTRY.read_text()) if REGISTRY.exists() else {}
    registry_ids={x.get("id") for x in registry.get("capabilities",[]) if isinstance(x,dict)}
    for c in caps:
        if c.get("state") not in ALLOWED: fail("invalid state: "+str(c.get("id")))
        route=str(c.get("route","")).lstrip("/")
        if not route or not (ROOT/route).exists(): fail("missing route: "+route)
        rid=c.get("registry_id")
        if rid and rid not in registry_ids: fail(f"{c.get('id')}: registry_id does not exist: {rid}")
    p=d.get("truth_policy",{})
    if p.get("unknown_is_not_zero") is not True or p.get("no_fabricated_metrics") is not True: fail("truth policy weakened")
    for key in ("capability_registry","object_contract","object_model","event_fabric","production_truth"):
        ref=d.get("integration_policy",{}).get(key)
        if not ref or not (ROOT/ref).exists(): fail(f"missing integration evidence: {key} -> {ref}")
    gates=d.get("proof_gates",[])
    if not gates: fail("proof gates missing")
    for gate in gates:
        if gate.get("status") not in ALLOWED: fail("invalid proof gate state: "+str(gate.get("id")))
        source=gate.get("source","")
        if not source or not (ROOT/source).exists(): fail("proof gate source missing: "+str(source))
        if not gate.get("evidence"): fail("proof gate evidence missing: "+str(gate.get("id")))
    print(f"PLATFORM KERNEL CONTRACT: PASS — {len(layers)} layers / {len(caps)} capabilities / {len(gates)} proof gates")
if __name__=="__main__": main()
