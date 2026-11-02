#!/usr/bin/env python3
"""Create a new fix-log entry as its own file: docs/fixes/<YYYY-MM-DD>-<slug>.md.

WHY: entries used to be appended to the end of FIXES_LOG.md, so every pair of open PRs conflicted on the same lines
(all 12 of the last 12 merges touched it). A new file cannot conflict with another PR's new file. See
docs/fixes/README.md.

Usage:
  python3 scripts/new-fix-entry.py <slug> ["Title of the entry"] [--date YYYY-MM-DD]

<slug> is lowercase letters, digits and hyphens (3-60 characters). Prints the created path. Refuses to overwrite.
"""
from __future__ import annotations

import sys as _sys
if "--help" in _sys.argv[1:] or "-h" in _sys.argv[1:]:
    print(__doc__.strip())
    raise SystemExit(0)

import datetime
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIR = ROOT / "docs" / "fixes"
SLUG = re.compile(r"^[a-z0-9][a-z0-9-]{2,59}$")
DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")

TEMPLATE = """### {title} ({date})

**Why.** What was wrong, and the evidence (file:line, command output, query result).

**Fix.** What changed.

**Verified.** The exact command or render, and its actual output. Before and after where it is a bug.

**Not done / not verified.** Say it plainly. An unverified item stays unverified.
"""


def main(argv: list[str]) -> int:
    args = list(argv)
    date = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d")
    if "--date" in args:
        i = args.index("--date")
        date = args[i + 1] if i + 1 < len(args) else ""
        del args[i:i + 2]
    if not args or not SLUG.match(args[0]) or not DATE.match(date):
        print("usage: new-fix-entry.py <slug> [title] [--date YYYY-MM-DD]   (slug: a-z 0-9 -, 3-60 chars)")
        return 2
    slug, title = args[0], " ".join(args[1:]).strip() or args[0].replace("-", " ")
    path = DIR / f"{date}-{slug}.md"
    if path.exists():
        print(f"refusing to overwrite {path.relative_to(ROOT)}")
        return 1
    DIR.mkdir(parents=True, exist_ok=True)
    path.write_text(TEMPLATE.format(title=title, date=date), encoding="utf-8")
    print(path.relative_to(ROOT))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(_sys.argv[1:]))
