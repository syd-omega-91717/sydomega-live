#!/usr/bin/env python3
"""
if __name__ == "__main__" and ("--help" in sys.argv or "-h" in sys.argv):
    print(__doc__)
    raise SystemExit(0)
Machine-check the Ω runtime, action and truth contracts.

This gate validates architecture declarations before they can drift into
unverifiable prose. It intentionally checks repository evidence only; live
provider state remains a separate verification boundary.
"""
from __future__ import annotations
import json, pathlib, sys

ROOT=pathlib.Path(__file__).resolve().parents[1]
CONFIG=ROOT/"config"
required=[
    "omega-runtime-manifest.json",
    "omega-action-contract.json",
    "omega-truth-model.json",
]

def fail(msg):
    print("OMEGA_PLATFORM_CONTRACT=FAIL")
    print(msg)
    raise SystemExit(1)

docs={}
for name in required:
    p=CONFIG/name
    if not p.is_file(): fail(f"missing {p}")
    try: docs[name]=json.loads(p.read_text(encoding="utf-8"))
    except Exception as exc: fail(f"invalid JSON {name}: {exc}")

runtime=docs[required[0]]
action=docs[required[1]]
truth=docs[required[2]]

if runtime.get("runtimeVersion")!="3.0.0": fail("runtimeVersion must be 3.0.0")
caps=runtime.get("capabilities")
if not isinstance(caps,list) or not caps: fail("capabilities must be non-empty")
ids=[c.get("id") for c in caps]
if any(not isinstance(x,str) or not x for x in ids): fail("every capability needs an id")
if len(ids)!=len(set(ids)): fail("duplicate capability id")
for c in caps:
    for key in ("version","owner","scope","critical","entry","dataSources","permissions"):
        if key not in c: fail(f"capability {c.get('id')} missing {key}")
    if not c["entry"]: fail(f"capability {c['id']} has no entrypoint")

objects=runtime.get("objectTypes",[])
if len(objects)!=len(set(objects)): fail("duplicate object type")
states=runtime.get("universalStates",[])
if "UNKNOWN" not in states or "UNAVAILABLE" not in states: fail("truth-safe universal states missing")

for key in ("required","statuses","truthStates","idempotency","authorization","audit","events"):
    if key not in action: fail(f"action contract missing {key}")
if action["authorization"].get("default")!="deny": fail("action authorization must default deny")
if action["idempotency"].get("required") is not True: fail("idempotency must be required")

truth_states=truth.get("states",{})
for key in ("UNKNOWN","UNAVAILABLE","LIVE","VERIFIED","CALCULATED","SOURCE","SIMULATED","STALE"):
    if key not in truth_states: fail(f"truth state missing {key}")

# Entrypoints that claim to be shipped must exist in source.
for c in caps:
    for entry in c["entry"]:
        p=ROOT/entry.lstrip("/")
        if not p.exists():
            # Some artifacts are generated into public/; allow a source alias
            # only when the same basename is present elsewhere in the repo.
            if not any(x.name==p.name for x in ROOT.rglob(p.name)):
                fail(f"capability {c['id']} missing source entry {entry}")

print(f"OMEGA_PLATFORM_CONTRACT=PASS capabilities={len(caps)} objects={len(objects)} states={len(states)}")
