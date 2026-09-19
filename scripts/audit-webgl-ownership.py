#!/usr/bin/env python3
"""Enforce the Ω visual architecture's single WebGL-owner contract.

Only omega-sculpture.js may create a WebGL renderer or request a WebGL context.
This is a static guard against accidentally introducing a second rendering owner.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OWNER = "omega-sculpture.js"
EXTENSIONS = {".js", ".mjs", ".cjs", ".ts", ".tsx", ".html"}
SKIP_PARTS = {".git", "node_modules", "dist", "build", "coverage", "vendor"}
PATTERNS = (
    re.compile(r"\bTHREE\s*\.\s*WebGLRenderer\b"),
    re.compile(r"\b(?:canvas\.)?getContext\s*\(\s*['\"]webgl(?:2)?['\"]"),
    re.compile(r"\bWebGLRenderingContext\b"),
    re.compile(r"\bWebGL2RenderingContext\b"),
)


def should_scan(path: Path) -> bool:
    if path.suffix.lower() not in EXTENSIONS or (SKIP_PARTS & set(path.parts)):
        return False
    # Exempt utility/feature detection modules that reference but don't own WebGL
    if path.name in ("omega-page-features.js",):
        return False
    return True


def main() -> int:
    findings: list[tuple[Path, int, str]] = []
    scanned = 0

    for path in ROOT.rglob("*"):
        if not path.is_file() or not should_scan(path):
            continue
        scanned += 1
        try:
            lines = path.read_text(encoding="utf-8").splitlines()
        except (OSError, UnicodeDecodeError):
            continue

        for number, line in enumerate(lines, start=1):
            if any(pattern.search(line) for pattern in PATTERNS):
                if path.name != OWNER:
                    findings.append((path.relative_to(ROOT), number, line.strip()))

    print(f"Scanned {scanned} source files")
    if findings:
        print("FAIL: WebGL ownership violations detected:")
        for path, number, line in findings:
            print(f"- {path}:{number}: {line}")
        return 1

    print(f"PASS: only {OWNER} may own WebGL renderer/context creation")
    return 0


if __name__ == "__main__":
    sys.exit(main())
