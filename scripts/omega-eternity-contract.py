#!/usr/bin/env python3
"""Validate the Ω Eternal Continuity and Temporal Replay contract without network access."""
from pathlib import Path
import sys
ROOT = Path(__file__).resolve().parents[1]
REQUIRED_FILES = [
    ROOT / "eternity.html", ROOT / "omega-eternity-engine.js", ROOT / "omega-eternity.css",
    ROOT / "docs" / "OMEGA_ETERNAL_CONTINUITY.md", ROOT / "replay.html",
    ROOT / "omega-temporal-replay.js", ROOT / "omega-temporal-replay.css",
    ROOT / "docs" / "OMEGA_TEMPORAL_REPLAY.md",
]
REQUIRED_MARKERS = ["Eternal Continuity","omega_platform_events","activity_feed","capability_registry","omega_event_queue","omega_dead_letters","UNAVAILABLE","read-only","Temporal Replay","PERSISTED EVENT"]
def main() -> int:
    """Run deterministic file and marker checks."""
    missing_files=[str(p.relative_to(ROOT)) for p in REQUIRED_FILES if not p.is_file()]
    if missing_files:
        print("OMEGA ETERNAL CONTRACT: FAIL — missing files: "+", ".join(missing_files)); return 1
    corpus="\n".join(p.read_text(encoding="utf-8") for p in REQUIRED_FILES)
    missing=[m for m in REQUIRED_MARKERS if m not in corpus]
    if missing:
        print("OMEGA ETERNAL CONTRACT: FAIL — missing markers: "+", ".join(missing)); return 1
    for js in ((ROOT/"omega-temporal-replay.js").read_text(encoding="utf-8"),(ROOT/"omega-eternity-engine.js").read_text(encoding="utf-8")):
        if "innerHTML" in js or "from('omega_event_queue')" in js or "from('omega_dead_letters')" in js:
            print("OMEGA ETERNAL CONTRACT: FAIL — unsafe sink or server-only queue access detected"); return 1
    print("OMEGA ETERNAL CONTRACT: PASS (CONTINUITY + TEMPORAL REPLAY)"); return 0
if __name__ == "__main__":
    if "-h" in sys.argv or "--help" in sys.argv: print(__doc__); raise SystemExit(0)
    raise SystemExit(main())
