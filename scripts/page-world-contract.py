#!/usr/bin/env python3
"""Verify that every root HTML page has exactly one canonical Omega City district.

Usage:
  python3 scripts/page-world-contract.py
  python3 scripts/page-world-contract.py --help
"""

import json
import re
import sys
from pathlib import Path

if "--help" in sys.argv[1:] or "-h" in sys.argv[1:]:
    print(__doc__.strip())
    raise SystemExit(0)

ROOT=Path(__file__).resolve().parents[1]
WORLD=ROOT/"config/omega-world-manifest.json"
OVERRIDES=ROOT/"config/page-world-overrides.json"

def slug(p): return p.stem

def main():
    world=json.loads(WORLD.read_text(encoding="utf-8"))
    overrides=json.loads(OVERRIDES.read_text(encoding="utf-8"))
    districts={d["id"] for d in world["districts"]}
    pages={slug(p) for p in ROOT.glob("*.html")}
    direct={}
    errors=[]
    for d in world["districts"]:
        for raw in d.get("pages",[]):
            p=re.sub(r"\.html$","",str(raw))
            if p in direct and direct[p]!=d["id"]:
                errors.append(f"page mapped to multiple districts: {p} -> {direct[p]}, {d['id']}")
            direct[p]=d["id"]
    entries=overrides.get("entries",{})
    for p,d in entries.items():
        if p not in pages:
            errors.append(f"override references missing page: {p}")
        if d not in districts:
            errors.append(f"override references unknown district: {p} -> {d}")
        if p in direct and direct[p]!=d:
            errors.append(f"override conflicts with direct district: {p} -> {direct[p]} vs {d}")
    resolved=set(direct)|set(entries)
    missing=sorted(pages-resolved)
    if missing:
        errors.append("unassigned pages: "+", ".join(missing))
    extra=sorted(set(entries)-pages)
    if extra:
        errors.append("orphan overrides: "+", ".join(extra))
    print(f"PAGE WORLD CONTRACT: pages={len(pages)} direct={len(direct)} overrides={len(entries)} resolved={len(pages & resolved)} districts={len(districts)}")
    if errors:
        print("PAGE WORLD CONTRACT: FAIL")
        for e in errors: print("- "+e)
        return 1
    print("PAGE WORLD CONTRACT: PASS — every root HTML page resolves to exactly one City district")
    return 0

if __name__=="__main__":
    sys.exit(main())
