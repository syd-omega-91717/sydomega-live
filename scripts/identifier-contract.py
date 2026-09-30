#!/usr/bin/env python3
from pathlib import Path
import sys
ROOT=Path(__file__).resolve().parents[1]
errors=[]
for rel in ("omega-sync-engine.js","omega-creator.js"):
 p=ROOT/rel
 if not p.is_file(): errors.append(rel+": missing"); continue
 t=p.read_text(encoding="utf-8")
 if "Math.random()" in t and rel=="omega-sync-engine.js": errors.append(rel+": synthetic event id remains")
if errors:
 print("IDENTIFIER CONTRACT: FAIL"); [print(" - "+e) for e in errors]; sys.exit(1)
print("IDENTIFIER CONTRACT: PASS")
