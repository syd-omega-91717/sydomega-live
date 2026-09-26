#!/usr/bin/env python3
"""Fail closed when service-role Edge Functions lack an explicit auth boundary."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
FUNCTIONS = ROOT / "supabase" / "functions"
ALLOWLIST = {"stripe-webhook", "weekly-digest"}

def main() -> int:
    failures = []
    checked = 0
    for path in sorted(FUNCTIONS.glob("*/index.ts")):
        source = path.read_text(encoding="utf-8")
        if "SUPABASE_SERVICE_ROLE_KEY" not in source:
            continue
        checked += 1
        name = path.parent.name
        if name in ALLOWLIST:
            continue
        has_identity_check = bool(re.search(r"auth\.getUser\s*\(", source))
        has_authorization = "Authorization" in source
        if not (has_identity_check and has_authorization):
            failures.append(f"{name}: service-role function lacks explicit caller authentication")
    if failures:
        print("EDGE SERVICE-ROLE AUTH AUDIT: FAIL")
        for failure in failures:
            print(" - " + failure)
        return 1
    print(f"EDGE SERVICE-ROLE AUTH AUDIT: PASS ({checked} service-role functions reviewed)")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
