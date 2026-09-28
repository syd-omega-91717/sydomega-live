#!/usr/bin/env python3
"""Validate the Ω Eternal Continuity Layer contract without network access."""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
REQUIRED_FILES = [
    ROOT / "eternity.html",
    ROOT / "omega-eternity-engine.js",
    ROOT / "omega-eternity.css",
    ROOT / "docs" / "OMEGA_ETERNAL_CONTINUITY.md",
]
REQUIRED_MARKERS = [
    "Eternal Continuity",
    "omega_platform_events",
    "activity_feed",
    "capability_registry",
    "omega_event_queue",
    "omega_dead_letters",
    "UNAVAILABLE",
    "read-only",
]

def main() -> int:
    """Run deterministic file and marker checks."""
    if any(not p.is_file() for p in REQUIRED_FILES):
        missing = [str(p.relative_to(ROOT)) for p in REQUIRED_FILES if not p.is_file()]
        print("OMEGA ETERNAL CONTRACT: FAIL — missing " + ", ".join(missing))
        return 1
    html = (ROOT / "eternity.html").read_text(encoding="utf-8")
    js = (ROOT / "omega-eternity-engine.js").read_text(encoding="utf-8")
    doc = (ROOT / "docs" / "OMEGA_ETERNAL_CONTINUITY.md").read_text(encoding="utf-8")
    corpus = html + "\n" + js + "\n" + doc
    missing = [m for m in REQUIRED_MARKERS if m not in corpus]
    if missing:
        print("OMEGA ETERNAL CONTRACT: FAIL — missing markers: " + ", ".join(missing))
        return 1
    if "from('omega_event_queue')" in js or "from('omega_dead_letters')" in js:
        print("OMEGA ETERNAL CONTRACT: FAIL — browser must not read server-only queues")
        return 1
    if "innerHTML" in js:
        print("OMEGA ETERNAL CONTRACT: FAIL — unsafe HTML sink detected")
        return 1
    print("OMEGA ETERNAL CONTRACT: PASS")
    return 0

if __name__ == "__main__":
    if "-h" in sys.argv or "--help" in sys.argv:
        print(__doc__)
        raise SystemExit(0)
    raise SystemExit(main())
