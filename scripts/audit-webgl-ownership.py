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
# omega-page-features.js probes WebGL support on a canvas it creates,
# reads, and discards -- never attaches to the DOM, never renders -- as one
# of ~15 sibling capability checks (canvas 2d, audioContext, fetch,
# websocket...) in the same file. That is feature detection, not a second
# rendering owner; confirmed by grep it is the only other getContext('webgl')
# call site in the repo besides OWNER itself.
ALLOWED_DETECTION_FILES = {"omega-page-features.js"}
EXTENSIONS = {".js", ".mjs", ".cjs", ".ts", ".tsx", ".html"}
# vendor/ is self-hosted third-party code (CLAUDE.md 4: "audit.py tracks
# them apart from root modules"). three.module.js's own source necessarily
# defines THREE.WebGLRenderer and calls getContext('webgl2') internally --
# that's the library implementation omega-sculpture.js calls into, not a
# second owner. Excluding it here matches how audit.py already treats vendor/.
SKIP_PARTS = {".git", "node_modules", "dist", "build", "coverage", "vendor"}
PATTERNS = (
    re.compile(r"\bTHREE\s*\.\s*WebGLRenderer\b"),
    re.compile(r"\b(?:canvas\.)?getContext\s*\(\s*['\"]webgl(?:2)?['\"]"),
    re.compile(r"\bWebGLRenderingContext\b"),
    re.compile(r"\bWebGL2RenderingContext\b"),
)


def should_scan(path: Path) -> bool:
    return path.suffix.lower() in EXTENSIONS and not (SKIP_PARTS & set(path.parts))


def main(argv: list[str]) -> int:
    if "--help" in argv or "-h" in argv:
        print(__doc__)
        return 0

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
                if path.name != OWNER and path.name not in ALLOWED_DETECTION_FILES:
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
    sys.exit(main(sys.argv[1:]))
