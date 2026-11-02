#!/usr/bin/env python3
"""FIXES_LOG.md is frozen history; new entries are files under docs/fixes/. Also keeps volatile counts out of CLAUDE.md.

WHY THIS EXISTS

Every PR appended its entry to the end of FIXES_LOG.md, so any two open PRs conflicted on the same lines: all 12 of
the last 12 merges touched that file, and 7 touched a count line in CLAUDE.md. GitHub does not honour a `merge=union`
rule (tested on real PRs, 2026-11-02), so the only fix is for PRs to stop sharing lines. New entries are new files
(scripts/new-fix-entry.py). This gate is what makes that stick: without it the next session that follows the old habit
brings the conflicts back.

WHAT IT CHECKS
  1. sha256(FIXES_LOG.md) equals config/fixes-log-frozen.json. An append, or any edit, fails with where to put the entry.
  2. Every file in docs/fixes/ (except README.md) is named YYYY-MM-DD-slug.md, so two entries cannot share a name by accident.
  3. CLAUDE.md states no count that changes on every PR ("**N** tests", "**N** blocking checks", "**N** gates"):
     such a line is edited by almost every PR, so it is a guaranteed conflict. Run the command to read the number.

Correcting history on purpose: edit FIXES_LOG.md, run `python3 scripts/fixes-log-frozen.py --update`, say why in the PR.

Usage: python3 scripts/fixes-log-frozen.py [--update]        Exit 0 on pass, 1 on failure.
"""
from __future__ import annotations

import sys as _sys
if "--help" in _sys.argv[1:] or "-h" in _sys.argv[1:]:
    print(__doc__.strip())
    raise SystemExit(0)

import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LOG = ROOT / "FIXES_LOG.md"
FROZEN = ROOT / "config" / "fixes-log-frozen.json"
FIXES = ROOT / "docs" / "fixes"
CLAUDE = ROOT / "CLAUDE.md"
NAME = re.compile(r"^\d{4}-\d{2}-\d{2}-[a-z0-9][a-z0-9-]{2,59}\.md$")
VOLATILE = re.compile(r"\*\*\d[\d,]*\*\*\s+(?:tests|blocking checks)|holds\s+\*\*\d+\*\*\s+gates", re.I)


def digest() -> str:
    return hashlib.sha256(LOG.read_bytes()).hexdigest()


def problems() -> list[str]:
    out = []
    want = json.loads(FROZEN.read_text())["sha256"] if FROZEN.exists() else None
    if want != digest():
        out.append("FIXES_LOG.md changed. It is frozen history: put the new entry in its own file with "
                   "`python3 scripts/new-fix-entry.py <slug> \"<title>\"` (docs/fixes/), so it cannot conflict "
                   "with another PR. To correct history on purpose, run this script with --update and say why.")
    if FIXES.is_dir():
        for p in sorted(FIXES.iterdir()):
            if p.is_file() and p.name != "README.md" and not NAME.match(p.name):
                out.append(f"docs/fixes/{p.name} must be named YYYY-MM-DD-slug.md")
    if CLAUDE.exists():
        for n, line in enumerate(CLAUDE.read_text(encoding="utf-8").splitlines(), 1):
            if VOLATILE.search(line):
                out.append(f"CLAUDE.md:{n} states a count that changes on every PR, a guaranteed merge conflict: "
                           "remove the number and say how to read it (run the command).")
    return out


def main(argv: list[str]) -> int:
    if "--update" in argv:
        FROZEN.parent.mkdir(parents=True, exist_ok=True)
        FROZEN.write_text(json.dumps({"_doc": "sha256 of FIXES_LOG.md. See scripts/fixes-log-frozen.py.",
                                      "sha256": digest()}, indent=1) + "\n")
        print("frozen hash written:", digest()[:16])
        return 0
    found = problems()
    if found:
        print(f"FIXES-LOG FROZEN CHECK FAILED ({len(found)}):")
        for f in found:
            print("  - " + f)
        return 1
    n = sum(1 for p in FIXES.iterdir() if p.is_file() and p.name != "README.md") if FIXES.is_dir() else 0
    print(f"FIXES-LOG FROZEN CHECK PASSED: FIXES_LOG.md unchanged, {n} entry file(s) in docs/fixes/")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(_sys.argv[1:]))
