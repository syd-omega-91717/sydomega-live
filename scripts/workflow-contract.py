#!/usr/bin/env python3
"""Validate GitHub Actions workflow contracts before execution.

This check is intentionally source-level. It may prove that the workflow is
well formed and blocking, but it must never claim that GitHub executed it.
Execution is proven only by GitHub run/job evidence with a real runner and
executed steps.
"""

from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
WORKFLOWS = ROOT / ".github" / "workflows"
REQUIRED = {
    "ci.yml": [
        "actions/checkout@v4",
        "actions/setup-node@v4",
        "actions/setup-python@v5",
        "python scripts/audit.py",
        "python -m unittest discover -s scripts/tests -v",
        "python scripts/omega-registry.py --check",
    ],
    "production-contract.yml": [
        "actions/checkout@v4",
        "actions/setup-python@v5",
        "python scripts/production-contract.py",
    ],
    "capability-evidence.yml": [
        "actions/checkout@v4",
        "actions/setup-python@v5",
        "python scripts/capability-audit.py --check",
        "python scripts/capability-audit.py",
        "python -m json.tool docs/capabilities/registry.json",
    ],
}

# Requirements that are about WHAT a workflow runs, not how a particular shell
# spells it. `production-contract.yml` must syntax-check every root .js file,
# but the loop that does it is written in whichever shell the runner uses. When
# that workflow moved from PowerShell to cmd, the literal
# `node --check $file.FullName` this contract used to demand stopped appearing
# and the gate failed on `main` while the workflow itself was perfectly correct
# -- a contract that tracked the spelling instead of the requirement. Matching
# the invocation rather than the loop syntax survives the next shell change.
REQUIRED_PATTERNS = {
    "production-contract.yml": [
        (r"node\s+--check\b", "node --check over the root .js files"),
    ],
}

ERRORS: list[str] = []

for name, required in REQUIRED.items():
    path = WORKFLOWS / name
    if not path.is_file():
        ERRORS.append(f"missing workflow: {path.relative_to(ROOT)}")
        continue

    text = path.read_text(encoding="utf-8")

    if not re.search(r"runs-on:\s*self-hosted\b", text):
        ERRORS.append(f"{name}: expected runs-on: self-hosted for the registered Windows runner")
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

    for pattern, description in REQUIRED_PATTERNS.get(name, []):
        if not re.search(pattern, text):
            ERRORS.append(f"{name}: missing required contract: {description}")

# Production evidence gates are never advisory.
for name in ("production-contract.yml", "capability-evidence.yml"):
    path = WORKFLOWS / name
    if path.is_file():
        text = path.read_text(encoding="utf-8")
        if "continue-on-error: true" in text:
            ERRORS.append(f"{name}: production gate cannot use continue-on-error")

# Every blocking workflow must expose an execution marker. This makes a
# successful source check distinguishable from a job that never executed.
for name in REQUIRED:
    path = WORKFLOWS / name
    if path.is_file():
        text = path.read_text(encoding="utf-8")
        if "Execution marker" not in text:
            ERRORS.append(f"{name}: missing execution marker step")
        if "RUNNER_NAME" not in text:
            ERRORS.append(f"{name}: missing runner identity diagnostic")

if ERRORS:
    print("WORKFLOW CONTRACT: FAIL")
    for error in ERRORS:
        print(f"- {error}")
    raise SystemExit(1)

print("WORKFLOW CONTRACT: PASS")
for name in REQUIRED:
    print(f"- {name}: structure, blocking behavior and execution evidence hooks verified")
print("- Runtime execution is evaluated separately from this source-level contract.")
