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
