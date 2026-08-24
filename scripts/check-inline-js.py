#!/usr/bin/env python3
"""
SYD OMEGA 91717 — inline <script> syntax check.

Every page is a standalone .html file with its own inline JavaScript
(there is no build step to catch this at compile time). CI's JS syntax
step only runs `node --check` on the standalone *.js files — it has never
looked inside <script> blocks embedded in the ~250 HTML pages, so a broken
inline script can ship and only surface when a member actually loads that
page in a browser.

This extracts every inline <script> block (skipping ones with a `src`
attribute — those are covered by the existing check) and runs `node
--check` on each. Blocks that use `type="module"` or start with
`import`/`export` are checked as ES modules, since Node's default
(CommonJS) parser rejects valid module syntax and a naive check would
either miss real bugs after the first false error or report bugs that
aren't there.

Run from the repository root: python3 scripts/check-inline-js.py
Exit code 1 if any block fails to parse, so it can gate CI.
"""

import sys as _sys
if "--help" in _sys.argv[1:] or "-h" in _sys.argv[1:]:
    print(__doc__.strip())
    raise SystemExit(0)

import glob
import os
import re
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

SCRIPT_BLOCK = re.compile(r'<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)</script>', re.IGNORECASE)
MODULE_HINT = re.compile(r'^\s*(import|export)\s', re.MULTILINE)


def is_module(attrs: str, block: str) -> bool:
    if 'type="module"' in attrs or "type='module'" in attrs:
        return True
    return bool(MODULE_HINT.search(block))


def check_block(block: str, module: bool) -> str | None:
    suffix = ".mjs" if module else ".js"
    with tempfile.NamedTemporaryFile("w", suffix=suffix, delete=False, encoding="utf-8") as f:
        f.write(block)
        path = f.name
    try:
        r = subprocess.run(["node", "--check", path], capture_output=True, text=True)
    finally:
        os.unlink(path)
    if r.returncode != 0:
        first_line = next((l for l in r.stderr.splitlines() if "SyntaxError" in l or "Error" in l), r.stderr.strip().splitlines()[0] if r.stderr.strip() else "unknown error")
        return first_line
    return None


def main() -> int:
    failures = []
    for page in sorted(glob.glob("*.html")):
        with open(page, encoding="utf-8", errors="ignore") as f:
            src = f.read()
        for m in SCRIPT_BLOCK.finditer(src):
            attrs, block = m.group(1), m.group(2)
            if not block.strip():
                continue
            start_line = src[: m.start()].count("\n") + 1
            err = check_block(block, is_module(attrs, block))
            if err:
                failures.append((page, start_line, err))

    print("=" * 68)
    print("INLINE <script> SYNTAX CHECK")
    print("=" * 68)
    if not failures:
        print(f"  OK — every inline <script> block parses cleanly.")
        return 0

    print(f"  CRITICAL — {len(failures)} broken inline <script> block(s):\n")
    for page, line, err in failures:
        print(f"    {page}:{line}")
        print(f"      {err}\n")
    return 1


if __name__ == "__main__":
    sys.exit(main())
