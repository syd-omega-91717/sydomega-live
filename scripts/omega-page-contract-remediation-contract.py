#!/usr/bin/env python3
"""Validate the canonical page-contract remediation queue rules."""
from __future__ import annotations

import json
from pathlib import Path
import sys

if "--help" in sys.argv:
    print(__doc__.strip())
    raise SystemExit(0)

ROOT = Path(__file__).resolve().parents[1]
CONTRACTS = ROOT / "config" / "omega-page-contracts.json"
FIELDS = (
    "workspace", "domain", "primary_role", "purpose", "data_sources",
    "capabilities", "authorization", "truth_states", "asset_requirements",
    "events", "failure_paths", "accessibility", "responsive",
)


def missing(value):
    if value is None:
        return True
    if isinstance(value, str):
        return value in {"UNVERIFIED", "OPEN_TASK", ""}
    if isinstance(value, list):
        return not value or "UNVERIFIED" in value
    if isinstance(value, dict):
        if value.get("state") == "OPEN_TASK":
            return True
        return any(missing(v) for v in value.values())
    return False


def main() -> int:
    data = json.loads(CONTRACTS.read_text(encoding="utf-8"))
    contracts = data.get("contracts", [])
    if not isinstance(contracts, list) or not contracts:
        print("PAGE_CONTRACT_REMEDIATION=FAIL no canonical contracts")
        return 1

    expected = 0
    duplicate_ids = set()
    seen = set()
    for page in contracts:
        page_id = page.get("page_id")
        if not page_id or page_id in seen:
            duplicate_ids.add(page_id)
        seen.add(page_id)
        for field in FIELDS:
            if missing(page.get(field)):
                expected += 1

    if duplicate_ids:
        print("PAGE_CONTRACT_REMEDIATION=FAIL duplicate page ids: "
              + ", ".join(sorted(str(x) for x in duplicate_ids)))
        return 1

    summary = data.get("audit_summary", {})
    if summary.get("page_count") != len(contracts):
        print("PAGE_CONTRACT_REMEDIATION=FAIL page_count mismatch")
        return 1

    print(f"PAGE_CONTRACT_PAGES={len(contracts)}")
    print(f"OPEN_FIELD_TASKS={expected}")
    print("PAGE_CONTRACT_REMEDIATION=PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
