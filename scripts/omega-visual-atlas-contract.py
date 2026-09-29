#!/usr/bin/env python3
"""Contract for the governed Ω visual atlas.\n\nRun: python3 scripts/omega-visual-atlas-contract.py\n"""
from pathlib import Path
import re

import sys\n\nif "--help" in sys.argv or "-h" in sys.argv:\n    print(__doc__)\n    raise SystemExit(0)\n\nROOT = Path(__file__).resolve().parents[1]
html = (ROOT / "visual-atlas.html").read_text(encoding="utf-8")
js = (ROOT / "omega-visual-atlas.js").read_text(encoding="utf-8")
css = (ROOT / "omega-visual-atlas.css").read_text(encoding="utf-8")

assert 'href="/omega-visual-atlas.css"' in html, "atlas must use canonical stylesheet"
assert 'src="/omega-visual-atlas.js"' in html, "atlas runtime missing"
assert 'href="/world.html"' in html, "atlas must expose a return path"
assert "REFERENCE ONLY" in html or "REFERENCE ONLY" in js, "truth boundary missing"

entries = re.findall(r"\{f:'[^']+',n:'[^']+',p:'([^']+)',r:'[^']+'\}", js)
assert len(entries) == 18, f"expected 18 curated source references, found {len(entries)}"

for path in entries:
    assert path.startswith("BlockChain_Market_Analysis_syd_omega_91717/"), path
    assert ".." not in path, path
    assert "javascript:" not in path.lower(), path

for forbidden in ("ownership", "balance", "authorization", "entitlement", "credential"):
    assert forbidden in js.lower(), f"truth boundary vocabulary missing: {forbidden}"

assert "prefers-reduced-motion" in css
print(f"OMEGA VISUAL ATLAS CONTRACT: PASS ({len(entries)} curated references)")
