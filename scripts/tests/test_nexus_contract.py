#!/usr/bin/env python3
"""Static contract checks for the live Nexus state surface."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
HTML = (ROOT / "nexus.html").read_text(encoding="utf-8")

def main():
    assert "get_activity_feed" in HTML, "Nexus must read persisted public activity"
    assert "NO PERSISTED PUBLIC ACTIVITY" in HTML, "Nexus needs a truthful empty feed"
    assert "LIVE ACTIVITY UNAVAILABLE" in HTML, "Nexus needs a truthful feed failure state"
    assert "Connections are calculated from persisted profile attributes" in HTML
    assert "var edges=[];" in HTML
    # Randomized business/activity state is prohibited. Deterministic visual seeding is
    # derived from member IDs instead, so the same persisted graph is reproducible.
    assert "Math.random()" not in HTML, "Nexus must not fabricate graph/activity state"
    assert "stableUnit(n.id,'x')" in HTML and "stableUnit(n.id,'y')" in HTML
    assert "activity_feed" in HTML and "filter:'is_public=eq.true'" in HTML
    # Activity text is assembled with textContent, not an HTML sink.
    assert "title.textContent=' — '+(row.title||row.activity_type||'Activity')" in HTML
    print("NEXUS CONTRACT: PASS")

if __name__ == "__main__":
    main()
