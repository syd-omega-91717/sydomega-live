#!/usr/bin/env python3
"""Check first-party JavaScript syntax without treating vendored/generated bundles as source.

Production JavaScript is validated here; third-party/vendor bundles and generated
deployment output are intentionally excluded because they are not maintained as
first-party Node-parsable source and may use browser/bundler syntax that
node --check is not the right validator for.
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

if __name__ == "__main__" and ("--help" in sys.argv or "-h" in sys.argv):
    print(__doc__)
    raise SystemExit(0)

ROOT = Path(__file__).resolve().parents[1]
EXCLUDED = {".git", "node_modules", "dist", "build", "public", "vendor"}
checked = 0
failures: list[tuple[Path, str]] = []

for path in sorted(ROOT.rglob("*.js")):
    if any(part in EXCLUDED for part in path.parts):
        continue
    checked += 1
    result = subprocess.run(
        ["node", "--check", str(path)],
        cwd=ROOT,
        text=True,
        capture_output=True,
    )
    if result.returncode:
        detail = (result.stderr or result.stdout).strip().splitlines()
        failures.append((path.relative_to(ROOT), detail[-1] if detail else "node --check failed"))

print(f"FIRST_PARTY_JS_CHECK checked={checked}")
if failures:
    print(f"FIRST_PARTY_JS_CHECK failed={len(failures)}")
    for path, detail in failures:
        print(f"::error file={path}::{detail}")
    raise SystemExit(1)
print("FIRST_PARTY_JS_CHECK=PASS")
