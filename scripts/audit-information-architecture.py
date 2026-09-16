#!/usr/bin/env python3
"""Deterministic IA audit for the Ω SYD OMEGA 91717 static platform.

Reports duplicate navigation keys/labels/targets and HTML pages that are not
referenced by nav.js. It is intentionally read-only and exits non-zero only
when --strict is supplied and findings exist.
"""
from __future__ import annotations

import argparse
import re
import sys
from collections import Counter
from pathlib import Path

NAV_KEY = re.compile(r"\[['\"]([^'\"]+)['\"]\s*,\s*['\"]([^'\"]+)['\"]\s*,\s*['\"]([^'\"]+)['\"]\]")
HTML_HREF = re.compile(r"href\s*=\s*['\"]([^'\"]+\.html)(?:#[^'\"]*)?['\"]", re.I)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("root", nargs="?", default=".")
    parser.add_argument("--strict", action="store_true")
    args = parser.parse_args()
    root = Path(args.root).resolve()
    nav_path = root / "nav.js"
    if not nav_path.is_file():
        print("ERROR: nav.js not found", file=sys.stderr)
        return 2

    nav = nav_path.read_text(encoding="utf-8", errors="replace")
    entries = NAV_KEY.findall(nav)
    keys = Counter(k for k, _, _ in entries)
    labels = Counter(label for _, label, _ in entries)
    targets = Counter(target for _, _, target in entries)

    pages = {p.name for p in root.glob("*.html")}
    referenced = {Path(target.split("#", 1)[0].lstrip("/")).name for _, _, target in entries}
    referenced |= {Path(h.split("#", 1)[0].lstrip("/")).name for h in HTML_HREF.findall(nav)}

    duplicate_keys = sorted(k for k, n in keys.items() if n > 1)
    duplicate_labels = sorted((k, n) for k, n in labels.items() if n > 1)
    duplicate_targets = sorted((k, n) for k, n in targets.items() if n > 1)
    orphan_pages = sorted(p for p in pages if p not in referenced and p not in {"404.html"})

    print(f"NAV_ENTRIES={len(entries)}")
    print(f"HTML_PAGES={len(pages)}")
    print(f"DUPLICATE_KEYS={len(duplicate_keys)}")
    print(f"DUPLICATE_LABELS={len(duplicate_labels)}")
    print(f"DUPLICATE_TARGETS={len(duplicate_targets)}")
    print(f"ORPHAN_HTML_PAGES={len(orphan_pages)}")
    if duplicate_keys:
        print("DUPLICATE_KEY_NAMES=" + ",".join(duplicate_keys))
    if duplicate_labels:
        print("DUPLICATE_LABEL_NAMES=" + ",".join(f"{name}:{count}" for name, count in duplicate_labels))
    if duplicate_targets:
        print("DUPLICATE_TARGET_NAMES=" + ",".join(f"{name}:{count}" for name, count in duplicate_targets))
    if orphan_pages:
        print("ORPHAN_PAGE_NAMES=" + ",".join(orphan_pages))

    findings = bool(duplicate_keys or duplicate_labels or duplicate_targets or orphan_pages)
    return 1 if args.strict and findings else 0


if __name__ == "__main__":
    raise SystemExit(main())
