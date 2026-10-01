#!/usr/bin/env python3
"""
if __name__ == "__main__" and ("--help" in sys.argv or "-h" in sys.argv):
    print(__doc__)
    raise SystemExit(0)
Validate the evidence-bound Omega implementation ledger."""
from __future__ import annotations
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LEDGER = ROOT / "config" / "omega-implementation-ledger.json"
ALLOWED = {"SPECIFIED","DESIGNED","BUILT","INTEGRATED","TESTED","DEPLOYED","VERIFIED","BLOCKED"}

def main() -> int:
    data = json.loads(LEDGER.read_text(encoding="utf-8"))
    if data.get("schemaVersion") != "1.0.0":
        raise SystemExit("LEDGER CONTRACT: FAIL — unsupported schemaVersion")
    items = data.get("items")
    if not isinstance(items, list) or not items:
        raise SystemExit("LEDGER CONTRACT: FAIL — no ledger items")
    ids = set()
    errors = []
    for item in items:
        item_id = item.get("id")
        state = item.get("state")
        if not item_id or item_id in ids:
            errors.append(f"duplicate or missing id: {item_id!r}")
        ids.add(item_id)
        if state not in ALLOWED:
            errors.append(f"{item_id}: invalid state {state!r}")
        if not item.get("source"):
            errors.append(f"{item_id}: missing source")
        if not item.get("requirement"):
            errors.append(f"{item_id}: missing requirement")
        if state in {"TESTED","DEPLOYED","VERIFIED"} and not item.get("evidence"):
            errors.append(f"{item_id}: {state} requires evidence")
        if state == "BLOCKED" and not item.get("blocker"):
            errors.append(f"{item_id}: BLOCKED requires a blocker")
        if state == "VERIFIED":
            proof = " ".join(str(x) for x in item.get("evidence", []))
            if not any(token in proof.upper() for token in ("LIVE","PROD","RUNTIME","VERIFIED","HTTP","SUPA","VERCEL")):
                errors.append(f"{item_id}: VERIFIED lacks an explicit live/runtime evidence marker")
    if errors:
        print("LEDGER CONTRACT: FAIL")
        for error in errors:
            print(" - " + error)
        return 1
    print(f"LEDGER CONTRACT: PASS ({len(items)} items)")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
