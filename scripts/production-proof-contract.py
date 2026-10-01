#!/usr/bin/env python3
"""Machine-checkable production proof contract for Ω SYD OMEGA 91717.

This contract proves repository-side release prerequisites only. Live provider
claims must be supplied by the deployment/verification systems and recorded in
the production evidence ledger; this script never treats source files as proof
of live behavior.
"""

from __future__ import annotations

import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]

REQUIRED = {
    "convergence_audit": ROOT / "scripts/omega-convergence-audit.py",
    "surface_contract": ROOT / "scripts/omega-production-surface-contract.py",
    "vercel_build": ROOT / "scripts/vercel-build.sh",
    "vercel_workflow": ROOT / ".github/workflows/vercel-production.yml",
    "progression_migration": ROOT / "supabase/migrations/20261001090000_omega_authoritative_progression_events.sql",
    "event_bus": ROOT / "omega-event-bus.js",
    "workers": ROOT / "omega-workers.js",
    "truth_matrix": ROOT / "docs/PRODUCTION_TRUTH_MATRIX.md",
}

FORBIDDEN_PROOF_PATTERNS = {
    "vercel_workflow": (
        "VERCEL_PRODUCTION_DEPLOYMENT=SUCCESS",
    ),
}

def main() -> int:
    missing = [name for name, path in REQUIRED.items() if not path.is_file()]
    empty = [name for name, path in REQUIRED.items() if path.is_file() and path.stat().st_size == 0]

    violations: dict[str, list[str]] = {}
    for name, patterns in FORBIDDEN_PROOF_PATTERNS.items():
        path = REQUIRED[name]
        if not path.is_file():
            continue
        content = path.read_text(encoding="utf-8", errors="ignore")
        hits = [pattern for pattern in patterns if pattern in content]
        if hits:
            violations[name] = hits

    result = {
        "schemaVersion": "1.0.0",
        "contract": "repository-production-proof",
        "requiredFiles": {name: str(path.relative_to(ROOT)) for name, path in REQUIRED.items()},
        "missing": missing,
        "empty": empty,
        "proofClaimViolations": violations,
        "status": "PASS" if not missing and not empty and not violations else "FAIL",
        "interpretation": (
            "PASS means the repository contains the evidence machinery and "
            "does not manufacture live-provider success claims. It does not "
            "replace live Vercel, Supabase, Stripe, Auth, Storage, backup/restore, "
            "or browser journey verification."
        ),
    }

    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if result["status"] == "PASS" else 2


if __name__ == "__main__":
    raise SystemExit(main())
