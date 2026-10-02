#!/usr/bin/env python3
"""Validate the canonical 18-module runtime contract against repository artifacts."""

from __future__ import annotations
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "config" / "omega-product-catalog.json"
RUNTIME = ROOT / "config" / "omega-module-runtime.json"
MIGRATIONS = ROOT / "supabase" / "migrations"

def fail(message: str) -> int:
    print(f"OMEGA MODULE RUNTIME CONTRACT: FAIL — {message}")
    return 1

def main() -> int:
    if "--help" in sys.argv:
        print(__doc__.strip())
        return 0

    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    runtime = json.loads(RUNTIME.read_text(encoding="utf-8"))

    catalog_ids = [m["id"] for m in catalog["modules"]]
    runtime_ids = [m["id"] for m in runtime["modules"]]
    if len(catalog_ids) != 18 or len(set(catalog_ids)) != 18:
        return fail("product catalog must contain exactly 18 unique modules")
    if runtime_ids != catalog_ids:
        return fail("runtime module order/identity diverges from product catalog")

    sql_path = MIGRATIONS / "20261002084512_omega_unified_product_runtime_contract_20261002.sql"
    sql = sql_path.read_text(encoding="utf-8")
    found = re.findall(r"\('([^']+)',\s*'([A-Z0-9_]+)',\s*'([^']+)'", sql)
    action_ids = {f"{module}.{action}" for _, module, action in found}

    expected = {f"{m['id']}.{a}" for m in runtime["modules"] for a in m["actions"]}
    if action_ids != expected:
        missing = sorted(expected - action_ids)
        extra = sorted(action_ids - expected)
        return fail(f"SQL action registry mismatch; missing={missing}; extra={extra}")

    counts = {m["id"]: len(m["actions"]) for m in runtime["modules"]}
    if any(v != 3 for v in counts.values()):
        return fail(f"each module must expose 3 canonical actions: {counts}")

    if len(action_ids) != 54:
        return fail(f"expected 54 module actions, found {len(action_ids)}")

    print("OMEGA MODULE RUNTIME CONTRACT: PASS — 18 modules / 54 governed actions")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
