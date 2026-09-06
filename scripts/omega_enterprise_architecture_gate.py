#!/usr/bin/env python3
"""Deterministic architecture-quality gate for SYD OMEGA 91717.

The repository is currently a framework-free static web surface backed by
Supabase. This gate prevents accidental architectural drift while allowing
future capabilities to be added behind explicit, testable contracts.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKFLOWS = ROOT / ".github" / "workflows"
REQUIRED = [
    ROOT / "vercel.json",
    ROOT / "scripts" / "vercel-build.sh",
    ROOT / "scripts" / "vercel-build-enhance.mjs",
    ROOT / "scripts" / "repository_integrity_audit.py",
    ROOT / "scripts" / "omega_fabric_audit.py",
    ROOT / "scripts" / "omega_fabric_platform_gate.py",
]

FAIL = []
WARN = []

def require(path: Path) -> None:
    if not path.is_file() or path.stat().st_size == 0:
        FAIL.append(f"missing_required_file:{path.relative_to(ROOT)}")

def main() -> int:
    for path in REQUIRED:
        require(path)

    vercel = ROOT / "vercel.json"
    if vercel.is_file():
        try:
            cfg = json.loads(vercel.read_text(encoding="utf-8"))
        except Exception as exc:
            FAIL.append(f"invalid_vercel_json:{exc}")
        else:
            if cfg.get("framework", "__missing__") is not None:
                FAIL.append("architecture_drift:vercel_framework_must_be_null")
            if cfg.get("outputDirectory") != "public":
                FAIL.append("artifact_contract:outputDirectory_must_be_public")
            if cfg.get("buildCommand") != "bash scripts/vercel-build.sh":
                FAIL.append("artifact_contract:unexpected_build_command")
            if cfg.get("installCommand") != "":
                FAIL.append("artifact_contract:install_command_must_be_empty")
            if cfg.get("git", {}).get("deploymentEnabled", {}).get("*") is not False:
                FAIL.append("deployment_policy:wildcard_git_deployments_must_be_disabled")

    workflow_files = sorted(WORKFLOWS.glob("*.yml")) + sorted(WORKFLOWS.glob("*.yaml"))
    if not workflow_files:
        FAIL.append("ci_contract:no_workflows_found")
    else:
        names = [p.name for p in workflow_files]
        malformed = [n for n in names if "," in n or " " in n]
        if malformed:
            FAIL.append("ci_contract:malformed_workflow_filename:" + ",".join(malformed))
        for path in workflow_files:
            text = path.read_text(encoding="utf-8", errors="replace")
            if "runs-on: self-hosted" in text or "runs-on: [self-hosted" in text:
                FAIL.append(f"ci_contract:self_hosted_runner:{path.relative_to(ROOT)}")
            if re.search(r"runs-on:\s*windows-latest", text):
                WARN.append(f"ci_portability:windows_runner:{path.relative_to(ROOT)}")

    # Reject common credential literals while allowing environment-variable names.
    secret_patterns = [
        r"sk-[A-Za-z0-9]{20,}",
        r"AKIA[0-9A-Z]{16}",
        r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----",
    ]
    tracked_text = list(ROOT.glob("*.html")) + list(ROOT.glob("*.js"))
    tracked_text += list((ROOT / "scripts").glob("*.py"))
    for path in tracked_text:
        text = path.read_text(encoding="utf-8", errors="replace")
        for pattern in secret_patterns:
            if re.search(pattern, text):
                FAIL.append(f"secret_pattern:{path.relative_to(ROOT)}")
                break

    print("OMEGA_ENTERPRISE_ARCHITECTURE_GATE")
    print(f"workflows={len(workflow_files)}")
    print(f"warnings={len(WARN)}")
    print(f"failures={len(FAIL)}")
    for item in WARN:
        print(f"WARN {item}")
    for item in FAIL:
        print(f"FAIL {item}")
    if FAIL:
        print("OMEGA_ENTERPRISE_ARCHITECTURE=FAIL")
        return 1
    print("OMEGA_ENTERPRISE_ARCHITECTURE=PASS")
    return 0

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] in ("-h", "--help"):
        print(__doc__)
        sys.exit(0)
    sys.exit(main())
