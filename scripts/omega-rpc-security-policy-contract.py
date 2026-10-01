#!/usr/bin/env python3
"""Validate the repository-side RPC security policy registry."""

from __future__ import annotations
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
POLICY=ROOT/"config/omega-rpc-security-policy.json"

def main():
    data=json.loads(POLICY.read_text(encoding="utf-8"))
    categories=data.get("categories",{})
    required={"service_only","owner_or_admin","member_self","public_read_candidate"}
    errors=[]
    if set(categories)!=required:
        errors.append(f"category set mismatch: {sorted(set(categories)^required)}")
    seen=[]
    for category,items in categories.items():
        for name in items:
            if name in seen:
                errors.append(f"duplicate RPC policy: {name}")
            seen.append(name)
    expected=int(data.get("coverage",{}).get("expectedSecurityDefinerPublicFunctions",0))
    if len(seen)!=expected:
        errors.append(f"expected {expected} registered functions, found {len(seen)}")
    rules=data.get("rules",{})
    for category in required:
        if not rules.get(category):
            errors.append(f"missing rule for {category}")
    if errors:
        print("OMEGA RPC SECURITY POLICY CONTRACT: FAIL")
        for error in errors:
            print(" -",error)
        return 1
    print(f"OMEGA RPC SECURITY POLICY CONTRACT: PASS — {len(seen)} RPCs classified")
    print("anonymousPublicExecute=DENY")
    return 0

if __name__=="__main__":
    raise SystemExit(main())
