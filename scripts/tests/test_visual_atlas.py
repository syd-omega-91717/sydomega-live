#!/usr/bin/env python3
"""Static contract checks for the governed visual atlas."""
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[2]
ATLAS = (ROOT / "omega-visual-atlas.js").read_text(encoding="utf-8")
MANIFEST = json.loads((ROOT / "config/omega-source-dna.json").read_text(encoding="utf-8"))

def main():
    paths = re.findall(r"p:'([^']+)'", ATLAS)
    assert len(paths) == 46, f"expected 46 curated atlas references, found {len(paths)}"
    assert len(set(paths)) == len(paths), "visual atlas contains duplicate source paths"
    assert "TOTAL_SOURCE_VISUALS=291" in ATLAS
    va = MANIFEST["visual_atlas"]
    assert va["curated_reference_count"] == 46
    assert va["total_source_visual_count"] == 291
    assert va["additional_collections_exposed"] == 16
    assert va["policy"] == "reference_only"
    assert "decodeURIComponent(x.p)" in ATLAS
    assert "REFERENCE ONLY" in (ROOT / "visual-atlas.html").read_text(encoding="utf-8")
    print("VISUAL ATLAS CONTRACT: PASS")

if __name__ == "__main__":
    main()
