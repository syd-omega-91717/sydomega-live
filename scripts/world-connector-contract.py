#!/usr/bin/env python3
"""Validate the World action/mission connector boundary.

The world-action and district-mission modules are deployed static JavaScript.
They must use the platform-owned Supabase client and secure idempotency keys;
they must never mint a second client or use Math.random() for request identity.
"""
from pathlib import Path
import sys

if "--help" in sys.argv[1:] or "-h" in sys.argv[1:]:
    print(__doc__.strip())
    raise SystemExit(0)

ROOT = Path(__file__).resolve().parents[1]
FILES = ("omega-world-actions.js", "omega-world-mission.js")
errors = []

for rel in FILES:
    path = ROOT / rel
    if not path.is_file():
        errors.append(f"{rel}: missing")
        continue
    text = path.read_text(encoding="utf-8")
    if "window.OmegaSB" not in text:
        errors.append(f"{rel}: does not use the canonical OmegaSB client")
    if "createClient(" in text:
        errors.append(f"{rel}: creates a second Supabase client")
    if "Math.random()" in text:
        errors.append(f"{rel}: uses Math.random() in a request/idempotency path")
    if "crypto.randomUUID" not in text and "crypto.getRandomValues" not in text:
        errors.append(f"{rel}: has no secure idempotency-key generator")

if errors:
    print("WORLD CONNECTOR CONTRACT: FAIL")
    for error in errors:
        print(" - " + error)
    sys.exit(1)

print("WORLD CONNECTOR CONTRACT: PASS")
print(" - canonical OmegaSB client only")
print(" - no embedded Supabase client")
print(" - secure idempotency keys")
