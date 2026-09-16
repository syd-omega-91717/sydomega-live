#!/usr/bin/env python3
"""Ω SYD OMEGA 91717 — deterministic information-architecture audit.

Finds navigation overlap before a UI refactor: duplicate route targets, duplicate
labels, repeated page keys, and HTML pages that are not referenced by nav.js.
This is an audit gate only; it never modifies application files.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).resolve().parents[1]
NAV = ROOT / "nav.js"


def fail(message: str) -> None:
    print(f"IA-AUDIT: FAIL: {message}")


def main() -> int:
    if not NAV.exists():
        fail("nav.js is missing")
        return 1

    text = NAV.read_text(encoding="utf-8")

    # Capture hrefs from the navigation source without executing JavaScript.
    hrefs = re.findall(r"\[['\"][^'\"]+['\"],['\"][^'\"]+['\"],['\"]([^'\"]+)['\"]\]", text)
    labels = re.findall(r"\[['\"][^'\"]+['\"],['\"]([^'\"]+)['\"],['\"]([^'\"]+)['\"]\]", text)
    keys = re.findall(r"\[['\"]([^'\"]+)['\"],['\"][^'\"]+['\"],['\"]([^'\"]+)['\"]\]", text)

    def groups(values):
        out = defaultdict(list)
        for index, value in enumerate(values, 1):
            out[value].append(index)
        return {k: v for k, v in out.items() if len(v) > 1}

    duplicate_targets = groups(hrefs)
    duplicate_labels = groups(label for label, _ in labels)
    duplicate_keys = groups(key for key, _ in keys)

    html_pages = {p.name for p in ROOT.glob("*.html")}
    nav_pages = {Path(href.split("#", 1)[0]).name for href in hrefs if href.startswith("/") and href.endswith(".html")}
    orphan_pages = sorted(html_pages - nav_pages)

    print(f"IA-AUDIT: nav_targets={len(hrefs)} unique_targets={len(set(hrefs))}")
    print(f"IA-AUDIT: nav_labels={len(labels)} unique_labels={len(set(label for label, _ in labels))}")
    print(f"IA-AUDIT: html_pages={len(html_pages)} nav_referenced_pages={len(html_pages & nav_pages)}")

    for title, values in (
        ("duplicate route targets", duplicate_targets),
        ("duplicate navigation labels", duplicate_labels),
        ("duplicate page keys", duplicate_keys),
    ):
        if values:
            print(f"IA-AUDIT: {title}: {len(values)}")
            for value, positions in sorted(values.items()):
                print(f"  - {value}: occurrences={len(positions)}")
        else:
            print(f"IA-AUDIT: {title}: 0")

    print(f"IA-AUDIT: html pages without a nav target: {len(orphan_pages)}")
    for page in orphan_pages:
        print(f"  - {page}")

    # This gate intentionally reports findings but does not fail merely because
    # overlap exists. The existing navigation is legacy data that must be
    # measured before it can be safely consolidated. CI should therefore fail
    # only on malformed/missing inputs, while preserving the audit report.
    if not hrefs:
        fail("no navigation targets were detected")
        return 1

    print("IA-AUDIT: PASS: deterministic overlap inventory generated")
    return 0


if __name__ == "__main__":
    sys.exit(main())
