#!/usr/bin/env python3
"""Validate the executable SYD OMEGA product catalog."""

from __future__ import annotations
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
CATALOG=ROOT/"config/omega-product-catalog.json"

def main():
    data=json.loads(CATALOG.read_text(encoding="utf-8"))
    required={"id","name","products","state"}
    modules=data.get("modules",[])
    errors=[]
    ids=set()
    for item in modules:
        cid=item.get("id")
        if cid in ids:
            errors.append(f"duplicate module: {cid}")
        ids.add(cid)
        missing=required-set(item)
        if missing:
            errors.append(f"{cid}: missing {sorted(missing)}")
        if not item.get("products"):
            errors.append(f"{cid}: no products")
    if len(modules)!=18:
        errors.append(f"expected 18 canonical modules, found {len(modules)}")
    rules=data.get("productizationRules",{})
    for key in ("fictional_physical_claims","financial_actions","health_features",
                "surveillance_features","competitive_intelligence","autonomous_agents",
                "blockchain","oracle_features"):
        if not rules.get(key):
            errors.append(f"missing productization rule: {key}")
    if errors:
        print("OMEGA PRODUCT CATALOG CONTRACT: FAIL")
        for e in errors:
            print(" -",e)
        return 1
    print("OMEGA PRODUCT CATALOG CONTRACT: PASS — 18 modules validated")
    return 0

if __name__=="__main__":
    raise SystemExit(main())
