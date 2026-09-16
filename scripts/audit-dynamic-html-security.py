#!/usr/bin/env python3
"""Detect high-risk dynamic HTML sinks in browser runtime files.

This is a reporting-only audit. It intentionally does not rewrite source files.
Review findings manually because trusted static templates and escaped content
can produce false positives. Exit 1 only when a high-risk sink is found in a
runtime file, making the result suitable for local/CI security review.
"""
from __future__ import annotations

import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
EXCLUDED_PARTS = {".git", "node_modules", "vendor", "tests", "test", "docs"}
RUNTIME_EXTENSIONS = {".js", ".html"}
PATTERNS = (
    ("innerHTML assignment", re.compile(r"\.innerHTML\s*=\s*")),
    ("insertAdjacentHTML", re.compile(r"\.insertAdjacentHTML\s*\(")),
    ("document.write", re.compile(r"\bdocument\.write\s*\(")),
    ("template interpolation", re.compile(r"\$\{[^}]+\}")),
)


def candidate(path: pathlib.Path) -> bool:
    return (
        path.suffix in RUNTIME_EXTENSIONS
        and not any(part in EXCLUDED_PARTS for part in path.parts)
        and path.name not in {"audit-dynamic-html-security.py"}
    )


def main() -> int:
    findings: list[tuple[pathlib.Path, int, str, str]] = []
    for path in sorted(ROOT.rglob("*")):
        if not path.is_file() or not candidate(path):
            continue
        try:
            lines = path.read_text(encoding="utf-8").splitlines()
        except UnicodeDecodeError:
            continue
        for number, line in enumerate(lines, 1):
            for label, pattern in PATTERNS:
                if pattern.search(line):
                    findings.append((path.relative_to(ROOT), number, label, line.strip()))

    print(f"DYNAMIC_HTML_AUDIT_FILES={sum(1 for p in ROOT.rglob('*') if p.is_file() and candidate(p))}")
    print(f"DYNAMIC_HTML_AUDIT_FINDINGS={len(findings)}")
    for path, number, label, line in findings:
        print(f"FINDING|{path}:{number}|{label}|{line[:240]}")
    if findings:
        print("DYNAMIC_HTML_AUDIT=REVIEW_REQUIRED")
        return 1
    print("DYNAMIC_HTML_AUDIT=PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
