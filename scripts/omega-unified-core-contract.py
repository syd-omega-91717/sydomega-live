#!/usr/bin/env python3
"""Validate the canonical Ω unified-core contract without contacting providers."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / "config" / "omega-unified-platform-fabric.json"
REQUIRED_AUTHORITIES = {
    "page_contracts": "config/omega-page-contracts.json",
    "content_registry": "config/content-registry.json",
    "requirement_traceability": "config/omega-requirement-control-plane.json and config/omega-source-traceability-v2.json",
    "release_evidence": "config/omega-production-10-10-evidence-gate.json",
    "product_domain_registry": "config/omega-product-domain-registry.json",
}
REQUIRED_CORE_INVARIANTS = {
    "ONE_IDENTITY_AND_POLICY_BOUNDARY",
    "ONE_CANONICAL_TRUTH_VOCABULARY",
    "ONE_GOVERNED_TASK_LIFECYCLE",
    "ONE_VERSIONED_EVENT_AND_EVIDENCE_MODEL",
    "ONE_RELEASE_EVIDENCE_GATE",
    "DOMAIN_OWNERSHIP_MUST_BE_EXPLICIT",
    "DOMAIN_MODULES_MUST_NOT_CREATE_PARALLEL_CORE_REGISTRIES",
    "CLIENT_RENDERING_IS_NOT_AUTHORIZATION",
    "SOURCE_IMPLEMENTATION_IS_NOT_PROVIDER_OR_PRODUCTION_EVIDENCE",
    "UNKNOWN_ACTIONS_GENERATE_REMEDIATION_NOT_SYNTHETIC_MAPPINGS",
}
REQUIRED_TASK_FIELDS = {
    "task_id", "user_problem", "expected_outcome", "source_traceability",
    "page_and_domain_ids", "capability_id", "authoritative_data",
    "authorization_cases", "truth_state", "acceptance_criteria",
    "failure_and_retry_behavior", "tests", "owner", "cost_and_risk",
    "deployment_evidence", "rollback", "residual_risks",
}
REQUIRED_DOMAIN_FIELDS = {
    "domain_id", "customer_job", "accountable_owner", "canonical_capabilities",
    "authoritative_data_sources", "authorization_boundary", "truth_states",
    "dependencies", "failure_paths", "telemetry", "acceptance_tests",
    "cost_and_operational_owner", "release_evidence", "rollback_or_retirement",
}


def main() -> int:
    if any(arg in {"--help", "-h"} for arg in sys.argv[1:]):
        print(__doc__.strip())
        return 0

    errors = []
    if not CONFIG.is_file():
        print("UNIFIED_CORE=FAIL missing config/omega-unified-platform-fabric.json")
        return 1

    try:
        config = json.loads(CONFIG.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        print(f"UNIFIED_CORE=FAIL invalid config: {exc}")
        return 1

    if config.get("version", 0) < 2:
        errors.append("fabric config must declare version >= 2")
    if config.get("operating_model") != "ONE_GOVERNED_CORE_MANY_DOMAIN_PROJECTIONS":
        errors.append("operating_model must be ONE_GOVERNED_CORE_MANY_DOMAIN_PROJECTIONS")

    authorities = config.get("canonical_authorities", {})
    for key, expected in REQUIRED_AUTHORITIES.items():
        if authorities.get(key) != expected:
            errors.append(f"canonical authority mismatch: {key}")
    for key in ("page_contracts", "content_registry", "release_evidence", "product_domain_registry"):
        target = ROOT / authorities.get(key, "__missing__")
        if not target.is_file():
            errors.append(f"canonical authority file missing: {authorities.get(key)}")
    for path in ("config/omega-requirement-control-plane.json", "config/omega-source-traceability-v2.json"):
        if not (ROOT / path).is_file():
            errors.append(f"traceability authority file missing: {path}")

    registry_path = ROOT / "config/omega-product-domain-registry.json"
    try:
        registry = json.loads(registry_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"invalid product domain registry: {exc}")
        registry = {}
    domains = registry.get("domains", [])
    domain_ids = [d.get("domain_id") for d in domains if isinstance(d, dict)]
    if len(domains) != 18:
        errors.append(f"product domain registry must contain exactly 18 historical domains; found {len(domains)}")
    if len(set(domain_ids)) != len(domain_ids):
        errors.append("product domain registry contains duplicate domain_id values")
    for domain in domains:
        if not isinstance(domain, dict):
            errors.append("product domain registry contains a non-object domain")
            continue
        for field in REQUIRED_DOMAIN_FIELDS:
            if field not in domain:
                errors.append(f"product domain {domain.get('domain_id', 'UNKNOWN')} missing field: {field}")
        if domain.get("implementation_state") not in {"UNVERIFIED","PARTIAL","IMPLEMENTED","RUNTIME-VERIFIED","PRODUCTION-VERIFIED","BLOCKED","UNAVAILABLE"}:
            errors.append(f"product domain {domain.get('domain_id', 'UNKNOWN')} has invalid implementation_state")
        if domain.get("implementation_state") == "UNVERIFIED" and domain.get("canonical_capabilities"):
            errors.append(f"unverified product domain {domain.get('domain_id')} must not claim canonical capabilities")

    invariants = set(config.get("core_invariants", []))
    for item in sorted(REQUIRED_CORE_INVARIANTS - invariants):
        errors.append(f"missing core invariant: {item}")

    task_fields = set(config.get("task_contract_required", []))
    for item in sorted(REQUIRED_TASK_FIELDS - task_fields):
        errors.append(f"missing task contract field: {item}")
    domain_fields = set(config.get("domain_module_contract_required", []))
    for item in sorted(REQUIRED_DOMAIN_FIELDS - domain_fields):
        errors.append(f"missing domain contract field: {item}")

    for section in ("truth_states", "page_contract_required", "content_contract_required", "task_states", "task_types"):
        if not isinstance(config.get(section), list) or not config[section]:
            errors.append(f"{section} must be a non-empty list")
    if "UNVERIFIED" not in config.get("truth_states", []):
        errors.append("UNVERIFIED truth state must remain available")
    if "BLOCKED" not in config.get("truth_states", []):
        errors.append("BLOCKED truth state must remain available")
    if not config.get("task_done_rule"):
        errors.append("task_done_rule is required")
    if not config.get("unification_rule"):
        errors.append("unification_rule is required")

    print(f"UNIFIED_CORE_VERSION={config.get('version')}")
    print(f"CANONICAL_AUTHORITIES={len(authorities)}")
    print(f"CORE_INVARIANTS={len(invariants)}")
    print(f"DOMAIN_CONTRACT_FIELDS={len(domain_fields)}")
    print(f"TASK_CONTRACT_FIELDS={len(task_fields)}")
    print(f"UNIFIED_CORE={'FAIL' if errors else 'PASS'}")
    for error in errors:
        print("ERROR " + error)
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
