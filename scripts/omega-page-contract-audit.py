#!/usr/bin/env python3
"""Deterministic audit for the Ω unified page fabric.

The auditor validates declared contracts and emits remediation tasks for missing
contract facts. It never infers production truth from HTML.
"""
from __future__ import annotations
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
FABRIC=json.loads((ROOT/"config/omega-unified-platform-fabric.json").read_text())
REGISTRY=json.loads((ROOT/"config/omega-page-contracts.json").read_text())

def main()->int:
    required=FABRIC["page_contract_required"]
    valid=set(FABRIC["truth_states"])
    contracts=REGISTRY.get("contracts",[])
    errors=[]
    tasks=[]
    seen=set()
    for contract in contracts:
        page_id=contract.get("page_id","")
        if not page_id:
            errors.append("contract missing page_id")
            continue
        if page_id in seen:
            errors.append(f"duplicate page_id: {page_id}")
        seen.add(page_id)
        for key in required:
            value=contract.get(key)
            if value is None or value=="" or value==[]:
                tasks.append(f"PAGE-CONTRACT::{page_id}::MISSING::{key}")
        for state in contract.get("truth_states",[]):
            if state not in valid:
                errors.append(f"{page_id}: invalid truth state {state}")
        if contract.get("production_complete") is True:
            for key in ("authorization","evidence","traceability","failure_paths"):
                if not contract.get(key):
                    errors.append(f"{page_id}: production_complete requires {key}")
    print(f"PAGE_CONTRACTS={len(contracts)}")
    print(f"REMEDIATION_TASKS={len(tasks)}")
    print(f"ERRORS={len(errors)}")
    for task in tasks:
        print("TASK "+task)
    for error in errors:
        print("ERROR "+error)
    return 1 if errors else 0

if __name__=="__main__":
    raise SystemExit(main())
