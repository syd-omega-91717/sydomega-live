#!/usr/bin/env python3
"""Validate the captured live module runtime observations without contacting providers."""
from __future__ import annotations
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOMAINS = ROOT / "config/omega-product-domain-registry.json"
OBSERVATIONS = ROOT / "config/omega-live-module-runtime-observations.json"
EXPECTED_DOMAINS = {
    "platform-core", "consultancy", "gaming", "achievements", "family", "media",
    "blockchain", "communication-security", "horoscope-elements", "news",
    "heritage", "progress", "passport", "legal", "cosmology", "investment",
    "intelligence", "hierarchy",
}
REQUIRED_ACTION_FIELDS = {
    "id", "name", "endpoint", "executor", "authorization", "execution_mode",
    "data_class", "lifecycle", "evidence_required", "idempotency_required", "rollback",
}
ALLOWED_MODES = {"READ", "SIMULATION", "WRITE", "EXTERNAL"}

def fail(message: str) -> None:
    raise ValueError(message)

def main() -> int:
    if any(arg in {"--help", "-h"} for arg in sys.argv[1:]):
        print(__doc__.strip())
        return 0
    try:
        domains = json.loads(DOMAINS.read_text(encoding="utf-8"))
        snapshot = json.loads(OBSERVATIONS.read_text(encoding="utf-8"))
        domain_rows = domains.get("domains", [])
        observations = snapshot.get("domain_observations", [])
        ids = {item.get("domain_id") for item in domain_rows}
        observed_ids = {item.get("domain_id") for item in observations}
        if len(domain_rows) != 18 or ids != EXPECTED_DOMAINS:
            fail("product domain registry must preserve exactly the historical 18 domain IDs")
        if len(observations) != 18 or observed_ids != EXPECTED_DOMAINS:
            fail("runtime observation snapshot must map each historical product domain exactly once")
        if snapshot.get("status") != "READ_ONLY_PROVIDER_SNAPSHOT_NOT_PRODUCTION_PROOF":
            fail("snapshot must retain the non-production-proof status")
        counts = snapshot.get("source", {}).get("row_counts", {})
        if counts != {"omega_capabilities": 24, "omega_services": 24, "omega_module_runtime_actions": 54}:
            fail(f"unexpected provider catalog row counts: {counts}")
        modules, actions = set(), set()
        for domain in observations:
            for module in domain.get("observations", []):
                module_id = module.get("runtime_module_id")
                if not module_id or module_id in modules:
                    fail(f"missing or duplicate runtime module ID: {module_id}")
                modules.add(module_id)
                cap = module.get("capability", {})
                if not cap.get("id") or cap.get("default_authorization") != "DENY_BY_DEFAULT":
                    fail(f"{module_id}: capability ID and DENY_BY_DEFAULT policy are required")
                if cap.get("lifecycle") not in {"DESIGNED", "INTEGRATED", "TESTED", "DEPLOYED", "VERIFIED", "BLOCKED"}:
                    fail(f"{module_id}: invalid capability lifecycle")
                service = module.get("service")
                if service is not None and service.get("status") not in {"DESIGNED", "INTEGRATED", "TESTED", "DEPLOYED", "VERIFIED", "BLOCKED"}:
                    fail(f"{module_id}: invalid service status")
                rows = module.get("runtime_actions", [])
                if len(rows) != 3:
                    fail(f"{module_id}: expected three captured runtime actions; found {len(rows)}")
                for action in rows:
                    missing = REQUIRED_ACTION_FIELDS - set(action)
                    if missing:
                        fail(f"{module_id}/{action.get('id')}: missing {sorted(missing)}")
                    if action["id"] in actions:
                        fail(f"duplicate action ID: {action['id']}")
                    actions.add(action["id"])
                    if action["execution_mode"] not in ALLOWED_MODES or action["lifecycle"] != "INTEGRATED":
                        fail(f"{action['id']}: invalid execution mode or lifecycle")
                    if not isinstance(action["evidence_required"], bool) or not isinstance(action["idempotency_required"], bool):
                        fail(f"{action['id']}: evidence/idempotency flags must be boolean")
        if len(modules) != 18 or len(actions) != 54:
            fail(f"expected 18 runtime modules and 54 unique actions; found {len(modules)} and {len(actions)}")
        investment = next(x for x in observations if x["domain_id"] == "investment")
        modes = {a["execution_mode"] for m in investment["observations"] for a in m["runtime_actions"]}
        if modes - {"READ", "SIMULATION"}:
            fail(f"investment action scope expanded unexpectedly: {sorted(modes)}")
        blockchain = next(x for x in observations if x["domain_id"] == "blockchain")
        action_ids = {a["id"].lower() for m in blockchain["observations"] for a in m["runtime_actions"]}
        if any(token in ident for ident in action_ids for token in ("mint", "transfer", "custody", "trade")):
            fail("blockchain snapshot contains an unapproved asset-mutation action")
        for domain in domain_rows:
            if domain.get("implementation_state") != "UNVERIFIED":
                fail(f"{domain['domain_id']}: catalog snapshot cannot promote implementation_state")
            if domain.get("canonical_capabilities"):
                fail(f"{domain['domain_id']}: canonical capabilities require reviewed implementation evidence")
            if domain.get("runtime_observation_ref") != f"config/omega-live-module-runtime-observations.json#{domain['domain_id']}":
                fail(f"{domain['domain_id']}: runtime observation reference mismatch")
        print("LIVE MODULE RUNTIME CONTRACT: PASSED")
        print("18 product domains mapped; 18 runtime modules; 54 provider-declared actions.")
        print("Catalog lifecycle is not promoted to production verification.")
        return 0
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        print(f"LIVE MODULE RUNTIME CONTRACT: FAILED — {exc}")
        return 1

if __name__ == "__main__":
    raise SystemExit(main())
