#!/usr/bin/env python3
"""Validate GitHub Actions workflow contracts before execution.

This is a source-level gate. It proves workflow structure, not that GitHub
actually scheduled a runner. Runtime execution is proven only by job evidence.
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

    # Production CI intentionally uses GitHub-hosted runners. Self-hosted
    # infrastructure is optional and must never be a prerequisite for the
    # repository's mandatory quality gates.
    if not re.search(r"runs-on:\s*ubuntu-latest\b", text):
        ERRORS.append(f"{name}: mandatory quality gate must use GitHub-hosted ubuntu-latest")
    if re.search(r"runs-on:\s*self-hosted\b", text):
        ERRORS.append(f"{name}: self-hosted runner must not block the mandatory quality gate")
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

for name in ("production-contract.yml", "capability-evidence.yml"):
    path = WORKFLOWS / name
    if path.is_file():
        text = path.read_text(encoding="utf-8")
        if "continue-on-error: true" in text:
            ERRORS.append(f"{name}: production gate cannot use continue-on-error")

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
    print(f"- {name}: hosted-runner structure, blocking behavior and execution evidence hooks verified")
print("- Runtime execution is evaluated separately from this source-level contract.")
