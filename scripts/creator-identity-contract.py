#!/usr/bin/env python3
"""Guard the Creator surface against synthetic member identities.

Usage:
  python3 scripts/creator-identity-contract.py
"""
from pathlib import Path
import sys

if "--help" in sys.argv[1:] or "-h" in sys.argv[1:]:
    print(__doc__.strip())
    raise SystemExit(0)

ROOT = Path(__file__).resolve().parents[1]
path = ROOT / "omega-creator.js"
errors = []
if not path.is_file():
    errors.append("omega-creator.js: missing")
else:
    text = path.read_text(encoding="utf-8")
    if "'user_' + Math.random()" in text or '"user_" + Math.random()' in text:
        errors.append("omega-creator.js: synthetic user identity remains")
    if "getAuthenticatedMember" not in text:
        errors.append("omega-creator.js: member actions lack an authenticated identity boundary")
if errors:
    print("CREATOR IDENTITY CONTRACT: FAIL")
    for e in errors: print(" - " + e)
    sys.exit(1)
print("CREATOR IDENTITY CONTRACT: PASS")
