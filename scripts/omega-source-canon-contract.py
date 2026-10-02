"""Validate the source canon and conflict register.

This is a governance gate that prevents historical prompts or conceptual lore
from silently overriding the live repository architecture.
"""
import sys
from pathlib import Path

DOC=Path("docs/OMEGA_SOURCE_CANON_AND_CONFLICT_REGISTER.md")
MARKERS=[
    "Authority hierarchy","Live production evidence","Historical master prompts",
    "999-point Sovereign Blueprint","Current runtime vs historical React monorepo",
    "Financial rules","KYC/KYS","Medical, biological and mental-health concepts",
    "Cyber-warfare and autonomous defense language","Credential hygiene finding",
    "SOURCE → CLASSIFY → SPECIFY → IMPLEMENT → CONNECT → PERSIST → SECURE → TEST → DEPLOY → LIVE-VERIFY",
]

def main()->int:
    if "--help" in sys.argv or "-h" in sys.argv:
        print(__doc__.strip()); return 0
    if not DOC.exists():
        print("OMEGA SOURCE CANON CONTRACT: FAIL\n- missing source canon register")
        return 1
    text=DOC.read_text(encoding="utf-8")
    failures=[m for m in MARKERS if m not in text]
    if failures:
        print("OMEGA SOURCE CANON CONTRACT: FAIL")
        for m in failures: print("- missing marker: "+m)
        return 1
    print("OMEGA SOURCE CANON CONTRACT: PASS")
    print(f"Governance markers: {len(MARKERS)}/{len(MARKERS)}")
    return 0

if __name__=="__main__":
    raise SystemExit(main())
