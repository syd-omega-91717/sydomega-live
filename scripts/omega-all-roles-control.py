#!/usr/bin/env python3
"""Validate the Ω all-roles control matrix against the documented 18-module model.

This is a governance gate, not a production claim. It prevents a module or
cross-functional release control from silently disappearing from the audit.

Usage:
  python3 scripts/omega-all-roles-control.py
  python3 scripts/omega-all-roles-control.py --help
"""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
MATRIX = ROOT / "docs/OMEGA_ALL_ROLES_CONTROL_MATRIX.md"

MODULES = [
    "Platform Core",
    "Consultancy",
    "Gaming & Characters",
    "Achievements",
    "Family & Tree Links",
    "Media",
    "Blockchain / Crypto / NFT",
    "Communication & Security",
    "Horoscope & Elements",
    "News",
    "Heritage",
    "Evaluation & Progress",
    "Passport / Crypto Card",
    "Legal",
    "Gods / Planets / Elements",
    "Investment Engine",
    "AI & System Intelligence",
    "Level & Ownership Hierarchy",
]

def main() -> int:
    if "--help" in sys.argv[1:] or "-h" in sys.argv[1:]:
        print(__doc__.strip())
        return 0

    text = MATRIX.read_text(encoding="utf-8")
    failures = []
    if "SPECIFIED → IMPLEMENTED → CONNECTED → PERSISTED → SECURED → TESTED → DEPLOYED → LIVE-VERIFIED" not in text:
        failures.append("evidence ladder is missing or changed")
    rows = {}
    for line in text.splitlines():
        if not line.startswith("|") or not re.match(r"\|\s*\d+\s*\|", line):
            continue
        cells = [c.strip() for c in line.strip("|").split("|")]
        if len(cells) < 9:
            failures.append("module row has fewer than 9 columns: " + line)
            continue
        try:
            number = int(cells[0])
        except ValueError:
            continue
        rows[number] = cells
    if sorted(rows) != list(range(1, 19)):
        failures.append(f"expected module rows 1..18, found {sorted(rows)}")
    for index, name in enumerate(MODULES, 1):
        cells = rows.get(index, [])
        if not cells or cells[1] != name:
            failures.append(f"module {index} is missing or renamed: {name!r}")
        if cells and any(not c for c in cells[2:]):
            failures.append(f"module {index} has an empty control field")
    for required in [
        "Identity / session", "Authorization", "Storage", "Payments",
        "AI", "Production", "Privacy", "Accessibility", "Recovery",
        "Supply chain", "Observability", "Governance",
    ]:
        if not re.search(r"\|\s*" + re.escape(required) + r"\s*\|", text, re.I):
            failures.append(f"release control missing: {required}")
    if failures:
        print("Ω ALL-ROLES CONTROL: FAIL")
        for failure in failures:
            print("  - " + failure)
        return 1
    print("Ω ALL-ROLES CONTROL: PASS — 18/18 modules and 12 cross-functional release controls present")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
