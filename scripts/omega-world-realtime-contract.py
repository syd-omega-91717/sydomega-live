#!/usr/bin/env python3
"""Validate the privacy-preserving Realtime World presence contract."""
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
WORLD=ROOT/"world.html"
RUNTIME=ROOT/"omega-world-realtime.js"
DOC=ROOT/"docs/OMEGA_REALTIME_WORLD.md"

def main():
    for p in (WORLD,RUNTIME,DOC):
        if not p.exists():
            raise SystemExit(f"OMEGA REALTIME WORLD CONTRACT: FAIL missing {p}")
    world=WORLD.read_text(encoding="utf-8")
    runtime=RUNTIME.read_text(encoding="utf-8")
    doc=DOC.read_text(encoding="utf-8")
    for marker in ('omega-world-realtime.js','ow-presence-count','ow-presence-status'):
        if marker not in world:
            raise SystemExit(f"OMEGA REALTIME WORLD CONTRACT: FAIL world missing {marker}")
    for marker in ("channel('omega-world-presence'", "presenceState()", ".track(", "CHANNEL_ERROR", "TIMED_OUT"):
        if marker not in runtime:
            raise SystemExit(f"OMEGA REALTIME WORLD CONTRACT: FAIL runtime missing {marker}")
    for forbidden in ("from('member_presence')", 'from("member_presence")', 'alter publication supabase_realtime add table public.member_presence'):
        if forbidden in runtime:
            raise SystemExit(f"OMEGA REALTIME WORLD CONTRACT: FAIL runtime touches persistent presence table: {forbidden}")
    for marker in ("self-readable only", "ephemeral", "does not prove"):
        if marker not in doc:
            raise SystemExit(f"OMEGA REALTIME WORLD CONTRACT: FAIL doc missing {marker}")
    print("OMEGA REALTIME WORLD CONTRACT: PASS (EPHEMERAL + PRIVACY-PRESERVING)")
    
if __name__=="__main__":
    import sys
    if "--help" in sys.argv or "-h" in sys.argv:
        print(__doc__)
        raise SystemExit(0)
    main()
