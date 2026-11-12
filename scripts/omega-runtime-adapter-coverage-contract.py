#!/usr/bin/env python3
"""Require every canonical module action to have a concrete runtime adapter."""
from __future__ import annotations
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RUNTIME = ROOT / "config/omega-module-runtime.json"
OBSERVATIONS = ROOT / "config/omega-live-module-runtime-observations.json"
MIGRATION = ROOT / "supabase/migrations/20261111190000_omega_runtime_dispatch_adapter_reconciliation.sql"
IDEMPOTENCY_MIGRATION = ROOT / "supabase/migrations/20261112091300_omega_idempotency_payload_integrity.sql"
REFUND_INDEX_MIGRATION = ROOT / "supabase/migrations/20261112091400_omega_stripe_refund_state_fk_index.sql"
SEARCH_INDEX_MIGRATION = ROOT / "supabase/migrations/20261112091500_omega_search_index_schema_reconciliation.sql"
CONSULTANCY_SCHEMA_MIGRATION = ROOT / "supabase/migrations/20261112091600_omega_consultancy_runtime_schema_parity.sql"
GATEWAY = ROOT / "supabase/functions/omega-runtime-gateway/index.ts"

def fail(message: str) -> int:
    print(f"OMEGA RUNTIME ADAPTER COVERAGE: FAIL — {message}")
    return 1

def main() -> int:
    try:
        runtime = json.loads(RUNTIME.read_text(encoding="utf-8"))
        snapshot = json.loads(OBSERVATIONS.read_text(encoding="utf-8"))
        sql = MIGRATION.read_text(encoding="utf-8")
        idempotency_sql = IDEMPOTENCY_MIGRATION.read_text(encoding="utf-8")
        refund_index_sql = REFUND_INDEX_MIGRATION.read_text(encoding="utf-8")
        search_index_sql = SEARCH_INDEX_MIGRATION.read_text(encoding="utf-8")
        consultancy_schema_sql = CONSULTANCY_SCHEMA_MIGRATION.read_text(encoding="utf-8")
        all_sql = "\\n".join((sql, idempotency_sql, refund_index_sql, search_index_sql, consultancy_schema_sql))
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

        search_dispatcher_actions: set[str] = set()
        for match in re.finditer(
            r"(?:if|elsif)\s+v_module\s*=\s*'([A-Z0-9_]+)'\s+and\s+v_action_name\s*=\s*'([^']+)'",
            search_index_sql,
            re.IGNORECASE,
        ):
            search_dispatcher_actions.add(f"{match.group(1).upper()}.{match.group(2)}")
        for match in re.finditer(
            r"(?:if|elsif)\s+v_module\s+in\s*\(([^)]+)\)\s+and\s+v_action_name\s*=\s*'([^']+)'",
            search_index_sql,
            re.IGNORECASE,
        ):
            modules = re.findall(r"'([A-Z0-9_]+)'", match.group(1), re.IGNORECASE)
            search_dispatcher_actions.update(f"{module.upper()}.{match.group(2)}" for module in modules)
        elemental_search = re.search(
            r"elsif\s+v_module\s*=\s*'ELEMENTAL'\s+and\s+v_action_name\s+in\s*\(([^)]+)\)",
            search_index_sql,
            re.IGNORECASE,
        )
        if elemental_search:
            search_dispatcher_actions.update(
                f"ELEMENTAL.{action}" for action in re.findall(r"'([^']+)'", elemental_search.group(1))
            )
        if "when 'create_consult_intake' then" in search_index_sql and "omega_private.create_consult_intake(" in search_index_sql:
            search_dispatcher_actions.add("CONSULTANCY.intake.create")
        if search_dispatcher_actions != expected:
            return fail(
                "search-index dispatcher replacement lost canonical actions; "
                f"missing={sorted(expected - search_dispatcher_actions)}; "
                f"extra={sorted(search_dispatcher_actions - expected)}"
            )
        for marker in (
            "coalesce(body,content) as body",
            "owner_id is null and organization_id is null",
            "owner_id=p_actor_user_id",
            "create policy search_index_read",
            "using ((owner_id is null and organization_id is null) or owner_id=auth.uid())",
            "add column if not exists content text",
            "add column if not exists body text",
            "add column if not exists organization_id uuid",
            "revoke all on table public.search_index from anon,authenticated",
            "search_index_owner_updated_idx",
        ):
            if marker not in search_index_sql:
                return fail(f"search-index schema/RLS/runtime marker missing: {marker}")
        if search_index_sql.lower().count("security definer set search_path=''") != 1:
            return fail("search-index dispatcher replacement must pin an empty search_path")
        normalized_consultancy_sql = " ".join(consultancy_schema_sql.lower().split())
        if "alter table public.consult_requests add column if not exists domain text" not in normalized_consultancy_sql:
            return fail("clean-replay consultancy domain column reconciliation is missing")
        if "returns text language plpgsql security definer set search_path=''" not in normalized_consultancy_sql:
            return fail("consultancy intake helper must return a schema-neutral text ID and pin an empty search_path")
        if "returning id::text into v_id" not in normalized_consultancy_sql or "return v_id;" not in normalized_consultancy_sql:
            return fail("consultancy intake helper must return the inserted or idempotently reused row ID")
        if "v_request_id text" not in normalized_consultancy_sql:
            return fail("runtime dispatcher request ID variable must accept UUID and BIGINT source IDs")
        if "sort_order,created_at from public.media_items" not in normalized_consultancy_sql:
            return fail("MEDIA.library.read must retain created_at in its ordered derived-table projection")
        if "order by p.last_seen desc" not in normalized_consultancy_sql or "p.last_seen_at" in normalized_consultancy_sql:
            return fail("COMMUNICATION.presence.read must use the canonical member_presence.last_seen column")
        if "owner_id=(select auth.uid())" not in normalized_consultancy_sql:
            return fail("search-index policy must use an initplan-safe scalar auth.uid() call")
        if "owner_id=auth.uid()" in normalized_consultancy_sql:
            return fail("search-index follow-up must not retain per-row auth.uid() evaluation")
        if "alter table public.consult_requests alter column id type" in normalized_consultancy_sql or "drop table" in normalized_consultancy_sql:
            return fail("consultancy schema parity migration must not rewrite or drop historical request IDs")
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
            "revoke all on function omega_private.enqueue_agent_task(uuid,text,text,jsonb,text,boolean) from public,anon,authenticated",
            "grant execute on function omega_private.enqueue_agent_task(uuid,text,text,jsonb,text,boolean) to service_role",
            "grant execute on function private.record_sovereign_event(text,jsonb,jsonb,text) to authenticated",
            "revoke all on function private.record_task_sovereign_event() from public,anon,authenticated",
            "consultancy_intake_helper_acl_invalid",
            "service_order_helper_acl_invalid",
            "agent_task_helper_acl_invalid",
            "notification_helper_acl_invalid",
            "platform_event_helper_acl_invalid",
            "achievement_verification_helper_acl_invalid",
            "sovereign_event_authenticated_acl_invalid",
            "sovereign_task_trigger_acl_invalid",
            "on conflict (user_id,runtime_idempotency_key)",
            "omega_service_orders_user_idempotency_uidx",
            "omega_service_orders_system_idempotency_uidx",
            "consult_requests_runtime_idempotency_uidx",
            "omega_agent_tasks_user_idempotency_uidx",
            "omega_agent_tasks_system_idempotency_uidx",
            "omega_notifications_user_idempotency_key_key",
            "sovereign_events_system_idempotency_uidx",
            "omega_achievement_verifications_subject_idempotency_key_key",
            "omega_platform_events_system_idempotency_uidx",
            "omega_audit_log_system_idempotency_uidx",
            "on conflict (idempotency_key) where user_id is null and idempotency_key is not null",
            "on conflict (user_id,idempotency_key) where user_id is not null and idempotency_key is not null",
            "and omega_service_orders.metadata=excluded.metadata",
            "and consult_requests.message=excluded.message",
            "and omega_agent_tasks.input=excluded.input",
            "and omega_notifications.body=excluded.body",
            "and omega_platform_events.payload is not distinct from excluded.payload",
            "and omega_audit_log.details=excluded.details",
            "service_order_idempotency_conflict",
            "consult_intake_idempotency_conflict",
            "agent_task_idempotency_conflict",
            "notification_idempotency_conflict",
            "platform_event_idempotency_conflict",
            "platform_event_audit_idempotency_conflict",
            "verification_idempotency_conflict",
            "sovereign_event_idempotency_conflict",
            "v_existing_evidence is distinct from coalesce(p_evidence,'{}'::jsonb)",
            "length(v_key)>122",
            "on conflict (idempotency_key) where actor_user_id is null and idempotency_key is not null",
            "on conflict (actor_user_id,idempotency_key) where actor_user_id is not null and idempotency_key is not null",
            "on conflict (user_id,idempotency_key) where user_id is not null and idempotency_key is not null do nothing",
            "omega_notifications_user_idempotency_key_key",
            "sovereign_events_user_idempotency_uidx",
            "omega_achievement_verifications_subject_idempotency_key_key",
            "omega_platform_events_actor_idempotency_uidx",
            "omega_audit_log_actor_idempotency_uidx",
            "pg_advisory_xact_lock",
            "on conflict (user_achievement_id,idempotency_key)",
            "on conflict (actor_user_id,idempotency_key)",
            "where user_id=_uid and idempotency_key=_key",
            "unique (user_id,idempotency_key)",
            "on conflict (user_id,idempotency_key)",
            "confidentiality_acceptance_required",
            "ADAPTER_REQUIRED",
        ):
            if marker not in all_sql:
                return fail(f"dispatcher/idempotency migration safety marker missing: {marker}")
        function_start = sql.find("create or replace function public.omega_runtime_dispatch(")
        function_end = sql.find("$" + "$;", function_start) + len("$" + "$;")
        if function_start < 0 or function_end < len("$" + "$;"):
            return fail("dispatcher function body is missing from reconciliation migration")
        function_body = sql[function_start:function_end]
        evidence_branch = re.search(
            r"INTELLIGENCE'\s+and\s+v_action_name='evidence\.read'\s+then(?P<body>.*?)(?:\n\s*elsif|\n\s*else)",
            function_body,
            re.IGNORECASE | re.DOTALL,
        )
        if not evidence_branch:
            return fail("intelligence evidence adapter branch is missing")
        if "e.created_at" in evidence_branch.group("body") or "e.extraction_timestamp" not in evidence_branch.group("body"):
            return fail("graph evidence adapter must use the live extraction_timestamp column")
        if "pg_catalog.trim(" in function_body:
            return fail("dispatcher function calls TRIM as a pg_catalog function")
        if "where idempotency_key=p_idempotency_key" in sql:
            return fail("service-order idempotency lookup is not actor-scoped")
        if sql.lower().count("security definer set search_path=''") != 9:
            return fail("all nine reconciliation helper/dispatcher functions must pin an empty search_path")
        if len(re.findall(r"create or replace function", idempotency_sql, re.IGNORECASE)) != 7:
            return fail("idempotency follow-up must replace exactly seven existing helper functions")
        if idempotency_sql.lower().count("security definer set search_path=''") != 7:
            return fail("all seven idempotency helper functions must pin an empty search_path")
        if not idempotency_sql.lstrip().startswith("--") or "\nbegin;" not in idempotency_sql or not idempotency_sql.rstrip().endswith("commit;"):
            return fail("idempotency follow-up must be a transactional migration")
        if re.search(r"\b(create|drop)\s+(unique\s+)?index\b|\balter\s+table\b", idempotency_sql, re.IGNORECASE):
            return fail("idempotency follow-up must not rewrite already-applied index/schema history")
        if "do update set input=excluded.input" in idempotency_sql:
            return fail("agent task idempotency retry must not overwrite the original task input")
        if "do update set payload=excluded.payload" in idempotency_sql or "do update set details=excluded.details" in idempotency_sql:
            return fail("event/audit idempotency retries must not overwrite original event evidence")
        if not re.search(r"create index if not exists stripe_refund_state_last_reversal_transaction_idx\s+on omega_private\.stripe_refund_state\s*\(last_reversal_transaction_id\)", refund_index_sql, re.IGNORECASE):
            return fail("refund-state last-reversal foreign key index migration is missing its exact covering index")
        if re.search(r"\bdrop\b|create\s+unique\s+index|\balter\s+table\b", refund_index_sql, re.IGNORECASE):
            return fail("refund-state index migration must remain additive and non-destructive")
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
    if "--help" in sys.argv[1:]:
        print(__doc__ or "")
        raise SystemExit(0)
    raise SystemExit(main())
