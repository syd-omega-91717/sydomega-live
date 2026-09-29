#!/usr/bin/env python3
"""Contract for the governed Ω visual atlas.

Run: python3 scripts/omega-visual-atlas-contract.py
"""
from pathlib import Path
import re
import sys

if "--help" in sys.argv or "-h" in sys.argv:
    print(__doc__)
    raise SystemExit(0)

ROOT = Path(__file__).resolve().parents[1]
html = (ROOT / "visual-atlas.html").read_text(encoding="utf-8")
js = (ROOT / "omega-visual-atlas.js").read_text(encoding="utf-8")
css = (ROOT / "omega-visual-atlas.css").read_text(encoding="utf-8")

assert 'href="/omega-visual-atlas.css"' in html, "atlas must use canonical stylesheet"
assert 'src="/omega-visual-atlas.js"' in html, "atlas runtime missing"
assert 'href="/world.html"' in html, "atlas must expose a return path"
assert "REFERENCE ONLY" in html or "REFERENCE ONLY" in js, "truth boundary missing"

entries = re.findall(r"""[{"']f:([^,]+),n:([^,]+),p:(["'])(.*?)\\3,r:(["']).*?\\5}""", js)
paths = [row[3] for row in entries]
assert len(paths) == 46, f"expected 46 curated source references, found {len(paths)}"

for path in paths:
    assert path.startswith("BlockChain_Market_Analysis_syd_omega_91717/"), path
    assert ".." not in path, path
    assert "javascript:" not in path.lower(), path

for forbidden in ("ownership", "balance", "authorization", "entitlement", "credential"):
    assert forbidden in js.lower(), f"truth boundary vocabulary missing: {forbidden}"

assert "prefers-reduced-motion" in css
print(f"OMEGA VISUAL ATLAS CONTRACT: PASS ({len(paths)} curated references)")
