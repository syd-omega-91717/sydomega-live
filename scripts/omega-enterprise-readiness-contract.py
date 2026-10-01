#!/usr/bin/env python3
"""Enterprise readiness contract for Ω SYD OMEGA 91717.

Checks repository-side invariants that must exist before a feature is treated
as production-capable. This is deliberately evidence-oriented: it never
claims that Vercel, Supabase, Stripe, or a browser runtime is live merely
because source files exist.
"""

from __future__ import annotations

import json
import pathlib
import re
import sys

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

TEXT_SUFFIXES = {".js", ".mjs", ".ts", ".tsx", ".html", ".css", ".json", ".yml", ".yaml", ".md", ".sql", ".sh", ".py"}

def scan_files():
    for path in ROOT.rglob("*"):
        if ".git" in path.parts or not path.is_file() or path.suffix.lower() not in TEXT_SUFFIXES:
            continue
        yield path

def main() -> int:
    missing = [name for name, path in REQUIRED.items() if not path.is_file()]
    empty = [name for name, path in REQUIRED.items() if path.is_file() and path.stat().st_size == 0]

    secret_hits = []
    for path in scan_files():
        if path.name in {".env", ".env.local", ".env.production", ".env.development"}:
            continue
        try:
            content = path.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        for pattern in SECRET_PATTERNS:
            if pattern.search(content):
                secret_hits.append(str(path.relative_to(ROOT)))
                break

    html_files = list(ROOT.rglob("public/*.html")) + list(ROOT.rglob("public/**/*.html"))
    html_files = sorted(set(p for p in html_files if p.is_file()))
    missing_viewport = []
    for path in html_files:
        content = path.read_text(encoding="utf-8", errors="ignore")
        if not re.search(r'<meta[^>]+name=["\']viewport["\'][^>]+>', content, re.I):
            missing_viewport.append(str(path.relative_to(ROOT)))

    workflow = REQUIRED["vercel_workflow"].read_text(encoding="utf-8", errors="ignore") if REQUIRED["vercel_workflow"].is_file() else ""
    required_workflow_contracts = [
        "omega-production-surface-contract.py",
        "omega-responsive-surface-contract.py",
        "production-proof-contract.py",
        "omega-convergence-audit.py",
    ]
    missing_workflow_contracts = [name for name in required_workflow_contracts if name not in workflow]

    result = {
        "schemaVersion": "1.0.0",
        "contract": "enterprise-readiness",
        "requiredFiles": {name: str(path.relative_to(ROOT)) for name, path in REQUIRED.items()},
        "missing": missing,
        "empty": empty,
        "secretPatternHits": sorted(set(secret_hits)),
        "publicHtmlPages": len(html_files),
        "publicHtmlMissingViewport": missing_viewport,
        "workflowMissingContracts": missing_workflow_contracts,
        "status": "PASS" if not (missing or empty or secret_hits or missing_viewport or missing_workflow_contracts) else "FAIL",
        "interpretation": (
            "PASS means repository-side enterprise gates are present. It does not "
            "prove live provider state, authenticated journeys, payment settlement, "
            "database policy semantics, backup restoration, or browser runtime behavior."
        ),
    }
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if result["status"] == "PASS" else 2

if __name__ == "__main__":
    raise SystemExit(main())
