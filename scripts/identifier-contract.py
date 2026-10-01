#!/usr/bin/env python3
"""Guard persistent client identifiers against Math.random().

Usage:
  python3 scripts/identifier-contract.py
"""
from pathlib import Path
import sys

if "--help" in sys.argv[1:] or "-h" in sys.argv[1:]:
    print(__doc__.strip())
    raise SystemExit(0)

ROOT=Path(__file__).resolve().parents[1]
errors=[]
for rel in ("omega-sync-engine.js","omega-creator.js"):
    p=ROOT/rel
    if not p.is_file(): errors.append(rel+": missing"); continue
    t=p.read_text(encoding="utf-8")
    if "Math.random()" in t and rel=="omega-sync-engine.js": errors.append(rel+": synthetic event id remains")
if errors:
    print("IDENTIFIER CONTRACT: FAIL")
    [print(" - "+e) for e in errors]
    sys.exit(1)
print("IDENTIFIER CONTRACT: PASS")
