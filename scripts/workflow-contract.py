#!/usr/bin/env python3
"""Validate the repository's GitHub Actions workflow contracts without GitHub access.

This is deliberately structural: it catches future workflow drift locally before
an unavailable runner hides the mistake. It never claims that GitHub executed a
workflow; only GitHub's run/job data can prove execution.
"""

from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
WORKFLOWS = ROOT / ".github" / "workflows"
REQUIRED = {
    "ci.yml": [
        "actions/checkout@v4",
        "actions/setup-node@v4",
        "actions/setup-python@v5",
        "python3 scripts/audit.py",
        "python3 -m unittest discover -s scripts/tests -v",
        "python3 scripts/omega-registry.py --check",
    ],
    "production-contract.yml": [
        "actions/checkout@v4",
        "actions/setup-python@v5",
        "python3 scripts/production-contract.py",
        'node --check "$f"',
    ],
    "capability-evidence.yml": [
        "actions/checkout@v4",
        "actions/setup-python@v5",
        "python3 scripts/capability-audit.py --check",
        "python3 scripts/capability-audit.py",
        "python3 -m json.tool docs/capabilities/registry.json >/dev/null",
    ],
}

ERRORS = []

for name, required in REQUIRED.items():
    path = WORKFLOWS / name
    if not path.is_file():
        ERRORS.append(f"missing workflow: {path.relative_to(ROOT)}")
        continue

    text = path.read_text(encoding="utf-8")

    if "runs-on: ubuntu-latest" not in text:
        ERRORS.append(f"{name}: expected runs-on: ubuntu-latest")
    if not re.search(r"timeout-minutes:\s*\d+", text):
        ERRORS.append(f"{name}: missing timeout-minutes")
    if "permissions:" not in text or "contents: read" not in text:
        ERRORS.append(f"{name}: missing least-privilege contents: read permission")
    if "workflow_dispatch:" not in text:
        ERRORS.append(f"{name}: missing workflow_dispatch recovery trigger")
    if not re.search(r"\b(push|pull_request):", text):
        ERRORS.append(f"{name}: missing automatic push/pull_request trigger")

    for needle in required:
        if needle not in text:
            ERRORS.append(f"{name}: missing required contract: {needle}")

# Production contracts must never be made advisory accidentally.
for name in ("production-contract.yml", "capability-evidence.yml"):
    path = WORKFLOWS / name
    if path.is_file():
        text = path.read_text(encoding="utf-8")
        if "continue-on-error: true" in text:
            ERRORS.append(f"{name}: production gate cannot use continue-on-error")

if ERRORS:
    print("WORKFLOW CONTRACT: FAIL")
    for error in ERRORS:
        print(f"- {error}")
    raise SystemExit(1)

print("WORKFLOW CONTRACT: PASS")
for name in REQUIRED:
    print(f"- {name}: structure and blocking contracts verified")
print("- This check validates workflow source only; it does not fabricate GitHub execution evidence.")
