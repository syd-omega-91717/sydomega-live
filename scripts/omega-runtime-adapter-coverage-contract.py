#!/usr/bin/env python3
"""Require every canonical module action to have a concrete runtime adapter."""
from __future__ import annotations
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RUNTIME = ROOT / "config/omega-module-runtime.json"
OBSERVATIONS = ROOT / "config/omega-live-module-runtime-observations.json"
MIGRATION = ROOT / "supabase/migrations/20261111190000_omega_runtime_dispatch_adapter_reconciliation.sql"
GATEWAY = ROOT / "supabase/functions/omega-runtime-gateway/index.ts"

def fail(message: str) -> int:
    print(f"OMEGA RUNTIME ADAPTER COVERAGE: FAIL — {message}")
    return 1

def main() -> int:
    try:
        runtime = json.loads(RUNTIME.read_text(encoding="utf-8"))
        snapshot = json.loads(OBSERVATIONS.read_text(encoding="utf-8"))
        sql = MIGRATION.read_text(encoding="utf-8")
        gateway = GATEWAY.read_text(encoding="utf-8")
        expected = {
            f"{module['id']}.{action}"
            for module in runtime.get("modules", [])
            for action in module.get("actions", [])
        }
        if len(runtime.get("modules", [])) != 18 or len(expected) != 54:
            return fail("canonical registry must contain exactly 18 modules and 54 unique actions")

        implemented: set[str] = set()
        for match in re.finditer(
            r"(?:if|elsif)\s+v_module\s*=\s*'([A-Z0-9_]+)'\s+and\s+v_action_name\s*=\s*'([^']+)'",
            sql,
            re.IGNORECASE,
        ):
            implemented.add(f"{match.group(1).upper()}.{match.group(2)}")
        for match in re.finditer(
            r"(?:if|elsif)\s+v_module\s+in\s*\(([^)]+)\)\s+and\s+v_action_name\s*=\s*'([^']+)'",
            sql,
            re.IGNORECASE,
        ):
            modules = re.findall(r"'([A-Z0-9_]+)'", match.group(1), re.IGNORECASE)
            implemented.update(f"{module.upper()}.{match.group(2)}" for module in modules)

        elemental = re.search(
            r"elsif\s+v_module\s*=\s*'ELEMENTAL'\s+and\s+v_action_name\s+in\s*\(([^)]+)\)",
            sql,
            re.IGNORECASE,
        )
        if elemental:
            implemented.update(f"ELEMENTAL.{action}" for action in re.findall(r"'([^']+)'", elemental.group(1)))

        # These two actions deliberately use dedicated authenticated gateway actions,
        # not the generic module_read dispatcher branch.
        if "when 'create_consult_intake' then" in sql and "omega_private.create_consult_intake(" in sql and "'create_consult_intake'" in gateway:
            implemented.add("CONSULTANCY.intake.create")
        if "BLOCKCHAIN_NFT.ownership.verify" in implemented and "verify_blockchain_ownership" in gateway and "record_blockchain_ownership_verification" in gateway:
            pass

        missing = sorted(expected - implemented)
        extra = sorted(implemented - expected)
        if missing or extra:
            return fail(f"module action coverage mismatch; missing={missing}; extra={extra}")
        for marker in (
            "createSupabaseContext(req, { auth: 'user' })",
            "ctx.userClaims.sub",
            "ctx.supabaseAdmin.rpc('omega_runtime_dispatch'",
            "'create_consult_intake'",
            "'verify_blockchain_ownership'",
            "'elemental_simulation_run'",
        ):
            if marker not in gateway:
                return fail(f"authenticated gateway marker missing: {marker}")
        for marker in (
            "security definer",
            "set search_path=''",
            "revoke all on function public.omega_runtime_dispatch(uuid,text,jsonb) from public,anon,authenticated",
            "grant execute on function public.omega_runtime_dispatch(uuid,text,jsonb) to service_role",
            "on conflict (user_id,runtime_idempotency_key)",
            "confidentiality_acceptance_required",
            "ADAPTER_REQUIRED",
        ):
            if marker not in sql:
                return fail(f"dispatcher migration safety/contract marker missing: {marker}")
        if "pg_catalog.trim(" in sql:
            return fail("dispatcher migration calls TRIM as a pg_catalog function")
        if "government_identity',false" not in sql or "travel_document',false" not in sql:
            return fail("platform credential must explicitly not be a government/travel document")
        if "Interpretive content for reflection and entertainment only" not in sql:
            return fail("horoscope interpretation disclaimer missing")
        if "where s.status='approved'" not in sql:
            return fail("knowledge retrieval must be restricted to approved sources")
        if "where user_id=p_actor_user_id" not in sql:
            return fail("member-owned data adapters must be actor scoped")

        investment = next(x for x in snapshot["domain_observations"] if x["domain_id"] == "investment")
        investment_modes = {
            action["execution_mode"]
            for module in investment["observations"]
            for action in module["runtime_actions"]
        }
        if investment_modes - {"READ", "SIMULATION"}:
            return fail(f"investment scope expanded beyond read/simulation: {sorted(investment_modes)}")
        blockchain = next(x for x in snapshot["domain_observations"] if x["domain_id"] == "blockchain")
        blockchain_ids = {
            action["id"].lower()
            for module in blockchain["observations"]
            for action in module["runtime_actions"]
        }
        if any(token in action_id for action_id in blockchain_ids for token in ("mint", "transfer", "custody", "trade")):
            return fail("unapproved blockchain mutation action present")
        print("OMEGA RUNTIME ADAPTER COVERAGE: PASS — 18 modules / 54 concrete actions")
        print("Member reads are actor-scoped; investment remains read/simulation; blockchain mutation remains absent.")
        return 0
    except (OSError, json.JSONDecodeError, KeyError, StopIteration) as exc:
        return fail(str(exc))

if __name__ == "__main__":
    raise SystemExit(main())
