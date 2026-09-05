#!/usr/bin/env python3
"""Fail-closed lint for GitHub Actions production workflow hazards."""
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
WORKFLOWS = ROOT / ".github" / "workflows"
errors = []

if not WORKFLOWS.is_dir():
    errors.append(".github/workflows is missing")
else:
    files = sorted(list(WORKFLOWS.glob("*.yml")) + list(WORKFLOWS.glob("*.yaml")))
    if not files:
        errors.append("no workflow files found")

    for path in files:
        text = path.read_text(encoding="utf-8", errors="replace")
        name = path.relative_to(ROOT)

        if re.search(r"continue-on-error:\s*true\b", text, re.I):
            errors.append(f"{name}: continue-on-error=true is forbidden in production workflows")

        if re.search(r"permissions:\s*\n\s*write-all\s*$", text, re.I | re.M):
            errors.append(f"{name}: permissions write-all is forbidden")

        if re.search(r"pull_request_target:", text):
            errors.append(f"{name}: pull_request_target requires explicit security review")

        # PR workflows must not execute repository-controlled shell with write credentials.
        if re.search(r"pull_request:\s*", text) and re.search(r"permissions:[\s\S]*?contents:\s*write", text):
            errors.append(f"{name}: PR workflow requests contents: write")

        if re.search(r"runs-on:\s*\[?self-hosted", text, re.I):
            if not re.search(r"timeout-minutes:\s*\d+", text):
                errors.append(f"{name}: self-hosted workflow has no timeout-minutes")

if errors:
    print("WORKFLOW CONTRACT LINT: FAIL")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)

print("WORKFLOW CONTRACT LINT: PASS")
