#!/usr/bin/env python3
"""Static contract checks for the live Nexus state surface."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
HTML = (ROOT / "nexus.html").read_text(encoding="utf-8")

def main():
    assert "get_activity_feed" in HTML
    assert "NO PERSISTED PUBLIC ACTIVITY" in HTML
    assert "LIVE ACTIVITY UNAVAILABLE" in HTML
    assert "Connections are calculated from persisted profile attributes" in HTML
    assert "Math.random()" not in HTML
    assert "stableUnit(n.id,'x')" in HTML and "stableUnit(n.id,'y')" in HTML
    assert "activity_feed" in HTML and "filter:'is_public=eq.true'" in HTML
    assert "title.textContent=' — '+(row.title||row.activity_type||'Activity')" in HTML
    print("NEXUS CONTRACT: PASS")

if __name__ == "__main__":
    main()
