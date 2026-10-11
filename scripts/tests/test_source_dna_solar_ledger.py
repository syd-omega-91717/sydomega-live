#!/usr/bin/env python3
"""Contract for the source-DNA solar-system ledger visualization."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
html = (ROOT / "cosmos.html").read_text(encoding="utf-8")

BODIES = ["SUN","MERCURY","VENUS","EARTH","MARS","JUPITER","SATURN","URANUS","NEPTUNE"]

def main():
    assert "omega-solar-stage" in html
    assert "omega-solar-ledger" in html
    assert html.count("data-solar-body=") == 8
    for body in BODIES[1:]:
        assert f'data-solar-body="{body}"' in html
    assert "SOURCE-DNA SYMBOLIC" in html
    assert "NOT A FINANCIAL LEDGER" in html
    # The source example listed Earth twice; the canonical solar layer contains it once.
    assert html.count('data-solar-body="EARTH"') == 1
    print("PASS: source-DNA solar-system ledger contract")

if __name__ == "__main__":
    main()
