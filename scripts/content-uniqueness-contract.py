#!/usr/bin/env python3
"""Fail-closed content uniqueness contract for the SYD OMEGA page estate.

The platform is intentionally multi-page, but pages must have distinct purpose
and navigation identity. This contract detects duplicate canonical titles and
near-identical page metadata without deleting or rewriting existing content.
"""
from pathlib import Path
import re
import sys

# CLAUDE.md 8.4: "Ask a script what it does before reading it." That only works
# if asking is cheap and safe. This gate used to run its whole job on --help --
# a repo-wide scan, or in one case an O(n^2) page comparison that never
# returned -- so the cheapest way to learn what it did was to read it. The
# guard runs before any work, and must stay ahead of it.
if __name__ == "__main__" and ("--help" in sys.argv or "-h" in sys.argv):
    print(__doc__)
    raise SystemExit(0)

ROOT = Path(__file__).resolve().parents[1]
IGNORE = {"node_modules", ".git", ".next", "dist", "build", "public"}  # public/ is this repo's build output
# (scripts/vercel-build.sh copies the whole web surface into it), so leaving it
# in scope makes every page a duplicate of itself. The set already excluded
# dist/ and build/ for exactly this reason; it just did not know our name for it.
errors = []

def norm(value: str) -> str:
    value = re.sub(r"<[^>]+>", " ", value)
    value = value.lower().replace("&amp;", "and")
    return re.sub(r"[^a-z0-9]+", " ", value).strip()

pages = []
for path in ROOT.rglob("*.html"):
    if any(part in IGNORE for part in path.parts):
        continue
    try:
        text = path.read_text(encoding="utf-8", errors="ignore")
    except OSError:
        continue
    title_match = re.search(r"<title[^>]*>(.*?)</title>", text, re.I | re.S)
    desc_match = re.search(
        r'<meta[^>]+name=["\']description["\'][^>]+content=["\'](.*?)["\']',
        text, re.I | re.S,
    )
    title = norm(title_match.group(1)) if title_match else ""
    desc = norm(desc_match.group(1)) if desc_match else ""
    pages.append((path.relative_to(ROOT).as_posix(), title, desc))

# Empty titles are a usability defect; allow explicitly utility fragments only
# when they are outside the root page estate.
for path, title, _ in pages:
    if not title:
        errors.append(f"missing <title>: {path}")

by_title = {}
for path, title, _ in pages:
    if title:
        by_title.setdefault(title, []).append(path)
for title, paths in sorted(by_title.items()):
    if len(paths) > 1:
        errors.append("duplicate page title '{}': {}".format(title, ", ".join(paths)))

# Exact duplicate descriptions are also a strong signal of copy/paste content.
by_desc = {}
for path, _, desc in pages:
    if desc:
        by_desc.setdefault(desc, []).append(path)
for desc, paths in sorted(by_desc.items()):
    if len(paths) > 1:
        errors.append("duplicate page description: {}".format(", ".join(paths)))

if errors:
    print("CONTENT UNIQUENESS CONTRACT: FAIL")
    for error in errors[:200]:
        print(f"- {error}")
    if len(errors) > 200:
        print(f"- ... {len(errors) - 200} additional findings")
    sys.exit(1)

print(f"CONTENT UNIQUENESS CONTRACT: PASS ({len(pages)} HTML pages checked)")
