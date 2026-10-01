#!/usr/bin/env python3
"""Validate the canonical OmegaEvent contract and its relationship to the object kernel."""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
MODEL=ROOT/"config/omega-event-model.json"; SCHEMA=ROOT/"config/omega-event-contract.schema.json"; OBJECT=ROOT/"config/omega-object-model.json"
def fail(message): raise SystemExit("OMEGA EVENT CONTRACT: FAIL — "+message)
def main():
    for p in (MODEL,SCHEMA,OBJECT):
        if not p.is_file(): fail("missing "+str(p.relative_to(ROOT)))
    model=json.loads(MODEL.read_text()); schema=json.loads(SCHEMA.read_text()); obj=json.loads(OBJECT.read_text())
    if model.get("contract")!="OmegaEvent" or model.get("schemaVersion")!="1.0.0": fail("invalid event model")
    if schema.get("$id")!="https://sydomega.com/schemas/omega-event-contract.v1.json": fail("schema id drift")
    if set(schema.get("required",[]))!={"id","type","occurredAt","actorType","actorId","truth","source","state"}: fail("required event fields drift")
    if "UNKNOWN" not in set(model.get("truth",{}).get("allowed",[])): fail("truth policy weakened")
    if "event" not in [x.get("type") for x in obj.get("objects",[])]: fail("object model must retain event object")
    if "omega_platform_events" not in obj.get("sourceRegistry",{}).get("authoritativeEventStream",[]): fail("authoritative event stream missing")
    print("OMEGA EVENT CONTRACT: PASS — canonical event envelope, schema, object linkage and authoritative stream are present")
if __name__=="__main__": main()
