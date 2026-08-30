#!/usr/bin/env python3
"""Validate GitHub Actions workflow contracts before execution.

This check proves workflow structure, not runtime execution. Runtime is proven
only by GitHub job evidence containing a real runner and executed steps.
"""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
WORKFLOWS = ROOT / ".github" / "workflows"
REQUIRED = {
    "ci.yml": ["actions/checkout@v4", "actions/setup-node@v4", "actions/setup-python@v5", "python scripts/audit.py", "python -m unittest discover -s scripts/tests -v", "python scripts/omega-registry.py --check"],
    "production-contract.yml": ["actions/checkout@v4", "actions/setup-python@v5", "python scripts/production-contract.py"],
    "capability-evidence.yml": ["actions/checkout@v4", "actions/setup-python@v5", "python scripts/capability-audit.py --check", "python scripts/capability-audit.py", "python -m json.tool docs/capabilities/registry.json"],
}
REQUIRED_PATTERNS = {"production-contract.yml": [(r"node\s+--check\b", "node --check over root .js files")]}
ERRORS: list[str] = []

for name, required in REQUIRED.items():
    path = WORKFLOWS / name
    if not path.is_file():
        ERRORS.append(f"missing workflow: {path.relative_to(ROOT)}")
        continue
    text = path.read_text(encoding="utf-8")
    # Assert the workflow names a runner it can actually get, NOT that the
    # runner is self-hosted specifically.
    #
    # This used to require `runs-on: self-hosted` outright. That made the repo
    # enforce the opposite of what issue #157 asks for: the moment GitHub-hosted
    # provisioning is restored, flipping a gate back to `ubuntu-latest` would
    # fail this very check, so the contract would block its own fix. #157's
    # acceptance criterion is a non-zero runner id, an executed step and a real
    # log -- which is about execution, not about which fleet provided it, and
    # the RUNNER_NAME / "Execution marker" assertions below are what actually
    # prove it.
    #
    # So: either a self-hosted label or a recognised GitHub-hosted image is
    # accepted, and an unrecognised label still fails (a typo'd or retired image
    # is how a job sits unassigned forever). `ubuntu-slim` is deliberately NOT
    # in this list: three days of runs on it produced the runner_id 0 / steps []
    # signature, and the hosted lane reproduced that on plain `ubuntu-latest`
    # too, so the label was never the cause -- but there is no reason to bless a
    # label this repo has no evidence ever worked here.
    runner = re.search(r"runs-on:\s*(\[[^\]]*\]|[^\n#]+)", text)
    if not runner:
        ERRORS.append(f"{name}: no runs-on declared")
    else:
        label = runner.group(1).strip()
        hosted = re.match(r"(ubuntu|windows|macos)-(latest|\d[\w.]*)$", label)
        if "self-hosted" not in label and not hosted:
            ERRORS.append(
                f"{name}: runs-on {label!r} is neither self-hosted nor a recognised "
                f"GitHub-hosted image (ubuntu-/windows-/macos-latest or a version)"
            )
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
    if path.is_file() and "continue-on-error: true" in path.read_text(encoding="utf-8"):
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
    print(f"- {name}: structure and execution-evidence hooks verified")
print("- Runtime execution remains a separate evidence gate.")
