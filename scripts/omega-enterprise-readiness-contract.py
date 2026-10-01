#!/usr/bin/env python3
"""Enterprise readiness contract for Ω SYD OMEGA 91717.

Repository-side gate only. It validates that the evidence, capability,
deployment and security contracts exist and that tracked text does not contain
common credential formats. It deliberately does not claim live provider state.
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
    "capability_catalog": ROOT / "config/omega-capability-catalog.json",
    "capability_registry": ROOT / "config/omega-capabilities.json",
    "capability_contract": ROOT / "scripts/omega-capability-contract.py",
    "implementation_ledger": ROOT / "config/omega-implementation-ledger.json",
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

TEXT_SUFFIXES = {
    ".js", ".mjs", ".ts", ".tsx", ".html", ".css", ".json", ".yml", ".yaml",
    ".md", ".sql", ".sh", ".py",
}
SKIP_NAMES = {".env", ".env.local", ".env.production", ".env.development"}


def scan_files():
    for path in ROOT.rglob("*"):
        if ".git" in path.parts or not path.is_file():
            continue
        if path.suffix.lower() in TEXT_SUFFIXES:
            yield path


def load_json(path: pathlib.Path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None


def main() -> int:
    missing = [name for name, path in REQUIRED.items() if not path.is_file()]
    empty = [
        name for name, path in REQUIRED.items()
        if path.is_file() and path.stat().st_size == 0
    ]

    secret_hits = []
    for path in scan_files():
        if path.name in SKIP_NAMES:
            continue
        try:
            content = path.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        if any(pattern.search(content) for pattern in SECRET_PATTERNS):
            secret_hits.append(str(path.relative_to(ROOT)))

    registry = load_json(REQUIRED["capability_registry"])
    registry_errors = []
    capability_count = 0
    if registry is not None:
        if registry.get("schemaVersion") != "1.0.0":
            registry_errors.append("capability registry schemaVersion must be 1.0.0")
        capabilities = registry.get("capabilities")
        if not isinstance(capabilities, list):
            registry_errors.append("capabilities must be an array")
        else:
            capability_count = len(capabilities)
            ids = set()
            for index, item in enumerate(capabilities):
                if not isinstance(item, dict):
                    registry_errors.append(f"capability[{index}] must be an object")
                    continue
                cid = item.get("id")
                if not cid:
                    registry_errors.append(f"capability[{index}] missing id")
                elif cid in ids:
                    registry_errors.append(f"duplicate capability id: {cid}")
                else:
                    ids.add(cid)
                for field in ("name", "type", "version", "status", "purpose", "owner", "route"):
                    if not item.get(field):
                        registry_errors.append(f"{cid or index} missing {field}")
    elif "capability_registry" not in missing:
        registry_errors.append("capability registry is not valid JSON")

    catalog = load_json(REQUIRED["capability_catalog"])
    catalog_errors = []
    if catalog is not None:
        required_fields = set(catalog.get("requiredFields", []))
        if not required_fields:
            catalog_errors.append("capability catalog has no requiredFields")
    elif "capability_catalog" not in missing:
        catalog_errors.append("capability catalog is not valid JSON")

    workflow = (
        REQUIRED["vercel_workflow"].read_text(encoding="utf-8", errors="ignore")
        if REQUIRED["vercel_workflow"].is_file() else ""
    )
    required_workflow_contracts = [
        "omega-production-surface-contract.py",
        "omega-responsive-surface-contract.py",
        "production-proof-contract.py",
        "omega-convergence-audit.py",
        "omega-enterprise-readiness-contract.py",
        "omega-capability-contract.py",
    ]
    workflow_missing = [
        name for name in required_workflow_contracts if name not in workflow
    ]

    result = {
        "schemaVersion": "1.0.0",
        "contract": "enterprise-readiness",
        "missing": missing,
        "empty": empty,
        "secretPatternHits": sorted(set(secret_hits)),
        "capabilityCount": capability_count,
        "capabilityRegistryErrors": registry_errors,
        "capabilityCatalogErrors": catalog_errors,
        "workflowMissingContracts": workflow_missing,
        "status": "PASS" if not (
            missing or empty or secret_hits or registry_errors or
            catalog_errors or workflow_missing
        ) else "FAIL",
        "interpretation": (
            "Repository evidence only; this gate does not prove live Vercel, "
            "Supabase, Stripe, authenticated browser journeys, payment "
            "settlement, backup restoration, or database policy semantics."
        ),
    }
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if result["status"] == "PASS" else 2


if __name__ == "__main__":
    raise SystemExit(main())
