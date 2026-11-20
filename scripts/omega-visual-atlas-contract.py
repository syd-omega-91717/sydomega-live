#!/usr/bin/env python3
"""Contract for the governed Ω visual atlas.

Run: python3 scripts/omega-visual-atlas-contract.py
"""
import json
from pathlib import Path
import re
import sys
from urllib.parse import unquote

if "--help" in sys.argv or "-h" in sys.argv:
    print(__doc__)
    raise SystemExit(0)

ROOT = Path(__file__).resolve().parents[1]
html = (ROOT / "visual-atlas.html").read_text(encoding="utf-8")
js = (ROOT / "omega-visual-atlas.js").read_text(encoding="utf-8")
css = (ROOT / "omega-visual-atlas.css").read_text(encoding="utf-8")
rights = json.loads((ROOT / "docs" / "media-rights.json").read_text(encoding="utf-8"))

assert 'href="/omega-visual-atlas.css"' in html, "atlas must use canonical stylesheet"
assert 'src="/omega-visual-atlas.js"' in html, "atlas runtime missing"
assert 'href="/world.html"' in html, "atlas must expose a return path"
assert "REFERENCE ONLY" in html or "REFERENCE ONLY" in js, "truth boundary missing"
assert "RIGHTS STATUS: UNVERIFIED" in html, "atlas must disclose the current rights state"
assert "RIGHTS UNVERIFIED" in js, "each source card must disclose its rights state"
assert len(re.findall(r"<main\b", html, re.I)) == 1, "atlas must expose exactly one main landmark"
assert '<section id="ova-grid"' in html, "visual grid must not be a nested main landmark"

# Match both single-quoted and double-quoted p: fields, then normalize URL
# escapes before checking uniqueness, repository presence and rights records.
raw_paths = re.findall(r"""\bp\s*:\s*(['"])(.*?)\1""", js)
paths = [unquote(path) for _, path in raw_paths]
assert len(paths) == 46, f"expected 46 curated source references, found {len(paths)}"
assert len(set(paths)) == len(paths), "curated visual atlas contains duplicate source paths"

rights_paths = set(rights.get("baseline", []))
rights_paths.update(
    record.get("path") for record in rights.get("records", [])
    if isinstance(record, dict) and isinstance(record.get("path"), str)
)

for path in paths:
    relative = Path(path)
    assert path.startswith("BlockChain_Market_Analysis_syd_omega_91717/"), path
    assert not relative.is_absolute() and ".." not in relative.parts, path
    assert "javascript:" not in path.lower(), path
    target = ROOT / relative
    assert not target.is_symlink(), f"source visual must not be a symlink: {path}"
    resolved = target.resolve(strict=True)
    assert resolved.is_relative_to(ROOT.resolve()), f"source visual escaped repository root: {path}"
    assert resolved.is_file(), f"source visual is not a file: {path}"
    assert path in rights_paths, f"source visual is missing from media-rights.json: {path}"

for forbidden in ("ownership", "balance", "authorization", "entitlement", "credential"):
    assert forbidden in js.lower(), f"truth boundary vocabulary missing: {forbidden}"

assert "prefers-reduced-motion" in css
print(f"OMEGA VISUAL ATLAS CONTRACT: PASS ({len(paths)} unique, present, rights-registered references)")
