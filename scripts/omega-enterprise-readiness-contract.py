#!/usr/bin/env python3
"""Repository-side enterprise readiness contract for Ω SYD OMEGA 91717."""

from __future__ import annotations

import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[1]

REQUIRED = {
    "production_truth_matrix": ROOT / "docs/PRODUCTION_TRUTH_MATRIX.md",
    "responsive_standard": ROOT / "docs/RESPONSIVE_PRODUCTION_STANDARD.md",
    "production_proof": ROOT / "scripts/production-proof-contract.py",
    "surface_contract": ROOT / "scripts/omega-production-surface-contract.py",
    "responsive_contract": ROOT / "scripts/omega-responsive-surface-contract.py",
    "convergence_audit": ROOT / "scripts/omega-convergence-audit.py",
    "vercel_build": ROOT / "scripts/vercel-build.sh",
    "vercel_workflow": ROOT / ".github/workflows/vercel-production.yml",
    "vercel_config": ROOT / "vercel.json",
    "env_example": ROOT / ".env.example",
}

SECRET_PATTERNS = [
    re.compile(r"sk_(?:live|test)_[A-Za-z0-9]{16,}"),
    re.compile(r"AKIA[0-9A-Z]{16}"),
    re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    re.compile(r"ghp_[A-Za-z0-9]{30,}"),
    re.compile(r"xox[baprs]-[A-Za-z0-9-]{20,}"),
]
TEXT_SUFFIXES = {".js",".mjs",".ts",".tsx",".html",".css",".json",".yml",".yaml",".md",".sql",".sh",".py"}

def scan_files():
    for path in ROOT.rglob("*"):
        if ".git" not in path.parts and path.is_file() and path.suffix.lower() in TEXT_SUFFIXES:
            yield path

def main() -> int:
    missing = [k for k,p in REQUIRED.items() if not p.is_file()]
    empty = [k for k,p in REQUIRED.items() if p.is_file() and p.stat().st_size == 0]
    secret_hits = []
    for path in scan_files():
        if path.name in {".env",".env.local",".env.production",".env.development"}:
            continue
        try:
            content = path.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        if any(pattern.search(content) for pattern in SECRET_PATTERNS):
            secret_hits.append(str(path.relative_to(ROOT)))

    html_files = sorted(set(p for p in ROOT.rglob("public/**/*.html") if p.is_file()))
    missing_viewport = []
    for path in html_files:
        content = path.read_text(encoding="utf-8", errors="ignore")
        if not re.search(r'<meta[^>]+name=["\']viewport["\'][^>]+>', content, re.I):
            missing_viewport.append(str(path.relative_to(ROOT)))

    workflow = REQUIRED["vercel_workflow"].read_text(encoding="utf-8", errors="ignore") if REQUIRED["vercel_workflow"].is_file() else ""
    contracts = ["omega-production-surface-contract.py","omega-responsive-surface-contract.py","production-proof-contract.py","omega-convergence-audit.py"]
    workflow_missing = [name for name in contracts if name not in workflow]

    result = {
        "schemaVersion":"1.0.0",
        "contract":"enterprise-readiness",
        "missing":missing,
        "empty":empty,
        "secretPatternHits":sorted(set(secret_hits)),
        "publicHtmlPages":len(html_files),
        "publicHtmlMissingViewport":missing_viewport,
        "workflowMissingContracts":workflow_missing,
        "status":"PASS" if not (missing or empty or secret_hits or missing_viewport or workflow_missing) else "FAIL",
        "interpretation":"Repository evidence only; does not prove live provider state, authenticated journeys, payment settlement, database policy semantics, backup restoration, or browser runtime behavior."
    }
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if result["status"] == "PASS" else 2

if __name__ == "__main__":
    raise SystemExit(main())
