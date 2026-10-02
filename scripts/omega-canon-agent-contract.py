#!/usr/bin/env python3
"""Validate the canonical dimensional and agent product registries."""

from __future__ import annotations
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]

def load(name):
    return json.loads((ROOT/"config"/name).read_text(encoding="utf-8"))

def main():
    canon=load("omega-canon-registry.json")
    agents=load("omega-agent-registry.json")
    errors=[]
    dims={d["id"]:d for d in canon["dimensions"]}
    expected={"NINE_CUBE_3D":729,"NINE_FRACTAL_5D":59049,"TWELVE_AGENT_SET":12,
              "TWELVE_BY_TWELVE_BY_NINE_BY_NINE_BY_NINE":104976}
    for key,value in expected.items():
        if dims.get(key,{}).get("cardinality")!=value:
            errors.append(f"{key}: expected cardinality {value}")
    if len(agents.get("agents",[]))!=12:
        errors.append("agent registry must contain exactly 12 canonical agents")
    ids=[a["id"] for a in agents["agents"]]
    if len(ids)!=len(set(ids)):
        errors.append("duplicate agent ids")
    for a in agents["agents"]:
        if a["allowedTools"] or a["budget"]["maxPerTask"]!=0:
            errors.append(f"{a['id']}: default tool/budget must remain closed")
        if not a["auditPolicy"]=="REQUIRED":
            errors.append(f"{a['id']}: audit policy must be REQUIRED")
    if errors:
        print("OMEGA CANON/AGENT CONTRACT: FAIL")
        for e in errors: print(" -",e)
        return 1
    print("OMEGA CANON/AGENT CONTRACT: PASS — distinct dimensions and 12 governed agents validated")
    return 0

if __name__=="__main__":
    raise SystemExit(main())

import sys

if "--help" in sys.argv:
    print(__doc__ or "")
    raise SystemExit(0)
