#!/usr/bin/env python3
"""Fail-closed content uniqueness contract for the SYD OMEGA page estate.

The platform is intentionally multi-page, but pages must have distinct purpose
and navigation identity. This contract detects duplicate canonical titles and
near-identical page metadata without deleting or rewriting existing content.
"""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
IGNORE = {"node_modules", ".git", ".next", "dist", "build"}
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
