#!/usr/bin/env python3
"""Validate GitHub Actions workflow contracts before execution.

This check proves workflow structure, not runtime execution. Runtime is proven
only by GitHub job evidence containing a real runner and executed steps.
"""
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
# What each gate must actually invoke.
#
# These are matched as REGEX against the workflow text, not as literal shell
# strings. They used to be literals like "python scripts/audit.py", which meant
# the contract asserted a *shell spelling* rather than the thing that matters --
# that the gate runs that script. The moment the workflows moved off Windows
# batch to `shell: python` (so they can run on a hosted runner as well as the
# registered one), every literal broke at once even though every gate still ran
# exactly the same checks. A contract that fails when the invocation style
# changes, while the behaviour does not, is testing the wrong thing.
#
# Anchored on the script path and its arguments, which is what actually has to
# be true, and is stable across cmd / bash / pwsh / python invocation.
REQUIRED = {
    "ci.yml": [
        r"actions/checkout@[0-9a-f]{40}",
        r"actions/setup-node@[0-9a-f]{40}",
        r"actions/setup-python@[0-9a-f]{40}",
        r"scripts/audit\.py",
        r"unittest['\"],\s*['\"]discover['\"],\s*['\"]-s['\"],\s*['\"]scripts/tests|unittest discover -s scripts/tests",
        r"scripts/omega-registry\.py['\"]?,?\s*['\"]?--check",
    ],
    "production-contract.yml": [
        r"actions/checkout@[0-9a-f]{40}",
        r"actions/setup-python@[0-9a-f]{40}",
        r"scripts/production-contract\.py",
    ],
    "capability-evidence.yml": [
        r"actions/checkout@[0-9a-f]{40}",
        r"actions/setup-python@[0-9a-f]{40}",
        r"scripts/capability-audit\.py['\"]?,?\s*['\"]?--check",
        r"scripts/capability-audit\.py",
        r"json\.tool['\"],\s*['\"]docs/capabilities/registry\.json|json\.tool docs/capabilities/registry\.json",
    ],
}

REQUIRED["vercel-production.yml"] = [
    r"actions/checkout@[0-9a-f]{40}",
    r"actions/setup-node@[0-9a-f]{40}",
    r"actions/setup-python@[0-9a-f]{40}",
    r"scripts/vercel_static_contract\.py",
    r"scripts/vercel-build\.sh",
    r"scripts/omega-production-surface-contract\.py",
]
REQUIRED["contracts.yml"] = [
    r"actions/checkout@[0-9a-f]{40}",
    r"actions/setup-python@[0-9a-f]{40}",
    r"scripts/contract-suite\.py",
]

REQUIRED_PATTERNS = {"production-contract.yml": [(r"scripts/check-js-syntax\.py", "first-party JavaScript syntax contract")]}
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
        if not re.search(needle, text):
            ERRORS.append(f"{name}: missing required contract: {needle}")
    for pattern, description in REQUIRED_PATTERNS.get(name, []):
        if not re.search(pattern, text):
            ERRORS.append(f"{name}: missing required contract: {description}")


# Production workflows must not resolve mutable action or CLI references.
for name in ("ci.yml", "contracts.yml", "production-contract.yml", "capability-evidence.yml", "vercel-production.yml"):
    path = WORKFLOWS / name
    if path.is_file():
        for line_no, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            if "uses:" in line and "./" not in line:
                ref = line.split("uses:", 1)[1].strip().split()[0]
                if "@" in ref and not re.search(r"@[0-9a-f]{40}$", ref):
                    ERRORS.append(f"{name}:{line_no}: mutable action reference: {ref}")
            if "vercel@latest" in line:
                ERRORS.append(f"{name}:{line_no}: mutable Vercel CLI reference: vercel@latest")

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
