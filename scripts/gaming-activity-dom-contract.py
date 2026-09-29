#!/usr/bin/env python3
"""Guard the gaming activity feed against persisted-data HTML injection."""
from pathlib import Path
import re
p=Path(__file__).resolve().parents[1]/"gaming.html"
s=p.read_text(encoding="utf-8")
start=s.find("var al=document.getElementById('activity-log');")
end=s.find("/* Completed cards looked",start)
assert start >= 0 and end > start
block=s[start:end]
assert "al.innerHTML" not in block
assert "name.textContent" in block
assert "pts.textContent" in block
assert "kind.textContent" in block
print("GAMING ACTIVITY DOM CONTRACT: PASS")
