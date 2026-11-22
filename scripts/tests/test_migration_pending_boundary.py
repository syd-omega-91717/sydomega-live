#!/usr/bin/env python3
"""Regression tests for source-pending versus provider-applied migrations."""
from __future__ import annotations

import json
import re
import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MIGRATIONS = ROOT / "supabase" / "migrations"
REMOTE = ROOT / "supabase" / "remote-migrations.json"
PENDING = ROOT / "supabase" / "pending-migrations.json"


def run_script(path: str, *args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, str(ROOT / path), *args],
        cwd=ROOT,
        text=True,
        capture_output=True,
        check=False,
    )


class MigrationPendingBoundaryTests(unittest.TestCase):
    def setUp(self) -> None:
        self.remote = json.loads(REMOTE.read_text(encoding="utf-8"))
        self.pending_doc = json.loads(PENDING.read_text(encoding="utf-8"))
        self.pending = self.pending_doc.get("pending", [])
        self.remote_versions = {str(value) for value in self.remote.get("versions", [])}

    def test_pending_registry_is_valid_unique_and_matches_provider_ledger(self) -> None:
        pending_versions: set[str] = set()
        for entry in self.pending:
            version = str(entry["version"])
            filename = str(entry["file"])
            self.assertNotIn(version, pending_versions, "duplicate pending migration")
            self.assertNotIn(version, self.remote_versions, "pending version also marked applied")
            self.assertEqual(entry.get("status"), "PENDING_REVIEW")
            self.assertEqual(entry.get("liveStatus"), "NOT_APPLIED")
            self.assertIs(entry.get("blocksProduction"), True)
            self.assertTrue((MIGRATIONS / filename).is_file(), filename)
            self.assertTrue(filename.startswith(version + "_"), filename)
            pending_versions.add(version)
        local_versions: set[str] = set()
        for path in MIGRATIONS.glob("*.sql"):
            match = re.match(r"^(\d+)_.*\.sql$", path.name)
            self.assertIsNotNone(match, path.name)
            local_versions.add(match.group(1))
        self.assertEqual(pending_versions, local_versions - self.remote_versions)
        self.assertEqual(pending_versions, set(), "no source migrations may remain pending after provider confirmation")

    def test_provider_confirmed_november_migrations_are_live_only(self) -> None:
        applied_versions = {
            "20261103230000", "20261104090000", "20261111190000",
            "20261112091300", "20261112091400", "20261112091500",
            "20261112091600",
            "20261112103000", "20261112110000", "20261112111000",
            "20261112120000", "20261112121000", "20261112130000", "20261113010000", "20261113020000", "20261113030000", "20261113062812", "20261116214052", "20261116214700", "20261116214842", "20261117002651", "20261117003721", "20261117004605", "20261118090000", "20261122100837", "20261122100946", "20261122101614", "20261122105012",
        }
        pending_versions = {str(entry["version"]) for entry in self.pending}
        self.assertTrue(applied_versions.issubset(self.remote_versions))
        self.assertTrue(applied_versions.isdisjoint(pending_versions))
        self.assertEqual(self.remote.get("remoteMigrationCount"), len(self.remote_versions))
        self.assertEqual(len(self.remote.get("migrations", [])), len(self.remote_versions))
        self.assertEqual({str(m["version"]) for m in self.remote["migrations"]}, self.remote_versions)
        self.assertEqual(self.remote.get("latestRemoteMigration"), "20261122105012")
        self.assertEqual(self.remote.get("latestRemoteMigration"), self.remote.get("versions", [])[-1])
        self.assertEqual(self.remote.get("_captured"), "2026-11-22")
        self.assertNotIn("ydqhzvvoyufiiqvzcjns", self.remote.get("source", ""))

    def test_media_catalog_select_migration_is_authenticated_only_and_provider_applied(self) -> None:
        version = "20261116214052"
        path = MIGRATIONS / f"{version}_media_items_authenticated_select.sql"
        sql = path.read_text(encoding="utf-8").lower()
        self.assertIn("grant select on table public.media_items to authenticated", sql)
        self.assertNotIn("to anon", sql)
        self.assertNotIn("to public", sql)
        self.assertNotIn("grant insert", sql)
        self.assertNotIn("grant update", sql)
        self.assertNotIn("grant delete", sql)
        self.assertIn(version, self.remote_versions)
        self.assertNotIn(version, {str(entry["version"]) for entry in self.pending})

    def test_sensitive_read_grants_remain_column_scoped(self) -> None:
        grants = json.loads((ROOT / "supabase" / "live-grants.json").read_text(encoding="utf-8"))
        relations = grants["relations"]
        api_keys = relations["api_keys"]
        consent = relations["consent_records"]
        self.assertEqual(api_keys["table"][0], "-")
        self.assertEqual(set(api_keys["columns"]["SELECT"]), {
            "id", "name", "scopes", "last_used_at", "expires_at", "active", "created_at"
        })
        self.assertNotIn("api_key", api_keys["columns"]["SELECT"])
        self.assertNotIn("api_secret", api_keys["columns"]["SELECT"])
        self.assertEqual(consent["table"][0], "-")
        self.assertEqual(set(consent["columns"]["SELECT"]), {
            "user_id", "consent_type", "granted", "granted_at", "revoked_at"
        })
        self.assertNotIn("ip_hash", consent["columns"]["SELECT"])
        self.assertNotIn("user_agent", consent["columns"]["SELECT"])
        self.assertIn("omega_record_simulation_run", grants["functions"])
        self.assertIn("omega_record_world_action", grants["functions"])

    def test_safe_column_read_migration_is_provider_applied(self) -> None:
        version = "20261116214842"
        path = MIGRATIONS / f"{version}_authenticated_safe_column_read_grants.sql"
        sql = path.read_text(encoding="utf-8").lower()
        self.assertIn("grant select (id, name, scopes, last_used_at, expires_at, active, created_at)", sql)
        self.assertIn("on table public.api_keys to authenticated", sql)
        self.assertIn("grant select (user_id, consent_type, granted, granted_at, revoked_at)", sql)
        self.assertIn("on table public.consent_records to authenticated", sql)
        self.assertNotIn("api_key,", sql)
        self.assertNotIn("api_secret", sql)
        self.assertNotIn("ip_hash", sql)
        self.assertNotIn("user_agent", sql)
        self.assertIn(version, self.remote_versions)
        self.assertNotIn(version, {str(entry["version"]) for entry in self.pending})

    def test_api_keys_live_column_compatibility_is_provider_applied(self) -> None:
        version = "20261116214700"
        path = MIGRATIONS / f"{version}_api_keys_live_column_compatibility.sql"
        sql = path.read_text(encoding="utf-8").lower()
        self.assertIn(version, self.remote_versions)
        self.assertNotIn(version, {str(entry["version"]) for entry in self.pending})
        self.assertIn("rename column key_name to name", sql)
        self.assertIn("rename column is_active to active", sql)
        self.assertIn("add column name text", sql)
        self.assertIn("add column active boolean default true", sql)
        self.assertNotIn("drop column", sql)
        self.assertNotIn("drop table", sql)
        self.assertNotIn("grant ", sql)
        self.assertEqual(self.remote.get("remoteMigrationCount"), 441)
        self.assertEqual(self.remote.get("latestRemoteMigration"), "20261122105012")



    def test_upload_bucket_limit_is_provider_applied_and_source_registered(self) -> None:
        path = MIGRATIONS / "20261117004605_uploads_bucket_size_limit_50mb.sql"
        sql = path.read_text(encoding="utf-8").lower()
        self.assertIn("set file_size_limit = 52428800", sql)
        self.assertIn("where id = 'uploads'", sql)
        self.assertIn("bucket_public is distinct from false", sql)
        self.assertIn("20261117004605", self.remote_versions)
        self.assertEqual(self.remote.get("remoteMigrationCount"), 441)
        self.assertEqual(self.remote.get("latestRemoteMigration"), "20261122105012")

    def test_ai_usage_telemetry_schema_and_exact_privileges_are_provider_applied(self) -> None:
        schema = (MIGRATIONS / "20261117002651_omega_ai_requests_service_role_insert_grant.sql").read_text(encoding="utf-8").lower()
        privileges = (MIGRATIONS / "20261117003721_omega_ai_requests_privilege_tightening.sql").read_text(encoding="utf-8").lower()
        self.assertIn("create table if not exists public.omega_ai_requests", schema)
        self.assertIn("omega_ai_requests_request_id_key", schema)
        self.assertIn("omega_ai_requests_risk_check", schema)
        self.assertIn("omega_ai_requests_status_check", schema)
        self.assertIn("omega_deny_by_default", schema)
        self.assertIn("enable row level security", schema)
        self.assertIn("revoke all privileges on table public.omega_ai_requests from anon, authenticated, service_role", schema)
        self.assertIn("grant insert on table public.omega_ai_requests to service_role", schema)
        self.assertIn("20261117002651", self.remote_versions)
        self.assertIn("20261117003721", self.remote_versions)
        for privilege in ("select", "update", "delete", "truncate", "references", "trigger", "maintain"):
            self.assertIn(f"'{privilege.lower()}'", privileges)
        self.assertIn("omega_ai_requests_service_role_privilege_too_broad", privileges)
        self.assertIn("omega_ai_requests_client_privilege_must_remain_denied", privileges)
        self.assertEqual(self.remote.get("remoteMigrationCount"), 441)
        self.assertEqual(self.remote.get("latestRemoteMigration"), "20261122105012")

    def test_local_migration_versions_are_unique_and_inventory_matches_truth(self) -> None:
        versions: list[str] = []
        for path in MIGRATIONS.glob("*.sql"):
            match = re.match(r"^(\d+)_.*\.sql$", path.name)
            self.assertIsNotNone(match, path.name)
            versions.append(match.group(1))
        self.assertEqual(len(versions), len(set(versions)), "migration versions must be unique")
        self.assertEqual(set(versions), self.remote_versions | {str(x["version"]) for x in self.pending})

    def test_source_inventory_contract_passes_without_claiming_pending_as_applied(self) -> None:
        result = run_script("scripts/migration-replay-contract.py")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn(f"remote_count={len(self.remote_versions)}", result.stdout)
        self.assertIn(f"pending_count={len(self.pending)}", result.stdout)
        self.assertIn("pending versions are not asserted applied", result.stdout)

    def test_source_and_strict_release_drift_pass_with_no_pending_migrations(self) -> None:
        source = run_script("scripts/migration-drift.py", "--source-only")
        self.assertEqual(source.returncode, 0, source.stdout + source.stderr)
        strict = run_script("scripts/migration-drift.py")
        self.assertEqual(strict.returncode, 0, strict.stdout + strict.stderr)
        self.assertIn("MIGRATION DRIFT: PASS", strict.stdout)
        self.assertNotIn("20261116214700", strict.stdout)

    def test_release_readiness_records_current_cloudflare_and_remaining_vercel_blocker(self) -> None:
        snapshot_path = ROOT / "config" / "omega-live-module-runtime-observations.json"
        snapshot = json.loads(snapshot_path.read_text(encoding="utf-8"))
        readiness = snapshot["release_readiness"]
        self.assertEqual(
            readiness.get("status"),
            "CLOUDFLARE_PRODUCTION_VERIFIED_VERCEL_PROMOTION_POSTPONED",
        )
        latest_probe = readiness.get("latest_production_probe", {})
        self.assertEqual(latest_probe.get("status"), "PASS")
        self.assertEqual(latest_probe.get("expected_commit_sha"), "122d8d0741cb39b78233c0f6f3606bf73de48d1d")
        self.assertEqual(latest_probe.get("served_commit_sha"), "122d8d0741cb39b78233c0f6f3606bf73de48d1d")
        self.assertEqual(latest_probe.get("workflow_run_id"), 44259163200)
        self.assertEqual(latest_probe.get("pages_passed"), 241)
        self.assertEqual(latest_probe.get("references_passed"), 368)
        self.assertEqual(latest_probe.get("root_manifest_sha"), "122d8d0741cb39b78233c0f6f3606bf73de48d1d")
        self.assertEqual(latest_probe.get("www_manifest_sha"), "122d8d0741cb39b78233c0f6f3606bf73de48d1d")
        self.assertEqual(readiness.get("production_verification", {}).get("status"), "PASS")
        self.assertEqual(
            readiness.get("production_verification", {}).get("commit_sha"),
            "122d8d0741cb39b78233c0f6f3606bf73de48d1d",
        )
        self.assertEqual(
            readiness.get("production_verification", {}).get("workflow_run_id"),
            44259163200,
        )
        vercel = readiness.get("vercel_promotion", {})
        self.assertEqual(vercel.get("status"), "POSTPONED_NOT_DEPLOYED")
        self.assertEqual(vercel.get("vercel_deployment_steps"), "SKIPPED")
        self.assertIn("VERCEL_PROMOTION_POSTPONED=true", vercel.get("reason", ""))
        failover = readiness.get("failover_verification", {})
        self.assertEqual(failover.get("provider"), "GitHub Pages")
        self.assertEqual(failover.get("status"), "PASS")
        self.assertEqual(failover.get("commit_sha"), "d62168f2d8dd3504d5f2809128c64af1113984b1")
        self.assertEqual(failover.get("workflow_run_id"), 43985648579)
        self.assertEqual(failover.get("build_job_id"), 133712987454)
        self.assertEqual(failover.get("deploy_job_id"), 133713176244)
        raw_blockers = readiness.get("blockers", [])
        blockers = raw_blockers if isinstance(raw_blockers, str) else " ".join(str(item) for item in raw_blockers)
        self.assertIn("Vercel production deployment remains intentionally postponed", blockers)
        self.assertNotIn("Cloudflare exact-SHA production verification has not passed", blockers)
        self.assertNotIn("54-action behavioral SQL probe", blockers)
        self.assertNotIn("20261116214700", blockers)
        self.assertNotIn("production release remains blocked", blockers.lower())
        self.assertNotIn("15b96312dd46b18913cd001dbc57072b52695eda", blockers)
        self.assertNotIn("issue #1346", blockers)
        runtime = snapshot["runtime_probe_status"]
        self.assertEqual(runtime.get("status"), "PASS_DATABASE_AND_BEHAVIORAL_VERIFICATION")
        self.assertEqual(runtime.get("migration_replay"), "PASS — all 437 source migrations replayed from zero on PR #1386 head 5d013f12b0fb90536ff919a70fbbd7670477aa10 (run #44258659682). The guarded reservation UUID-to-bigint reconciliation, RLS/RPC migration, and complete replay all passed.")
        self.assertEqual(runtime.get("migration_security_audit"), "PASS on PR #1386 head 5d013f12b0fb90536ff919a70fbbd7670477aa10 (run #44258659810). The owner reservation migration enforces least-privilege SELECT/INSERT RLS, revokes authenticated UPDATE, and gates status transitions on platform-owner membership plus AAL2.")
        self.assertEqual(runtime.get("hardening_contract"), "PASS on main commit 20f8dcfa9e20da66f129420f736c3470431c2c70 (run #43981760062).")
        self.assertEqual(runtime.get("stripe_refund_lifecycle_probe"), "PASS on main commit 20f8dcfa9e20da66f129420f736c3470431c2c70 (run #43981760062).")
        self.assertEqual(runtime.get("runtime_adapter_probe"), "PASS — 54/54 governed actions on PR #1386 head 5d013f12b0fb90536ff919a70fbbd7670477aa10 (full migration replay run #44258659682).")
        self.assertEqual(runtime.get("family_access_probe"), "PASS in the fresh full migration replay on PR #1386 head 5d013f12b0fb90536ff919a70fbbd7670477aa10 (run #44258659682).")
        self.assertEqual(runtime.get("content_pipeline_e2e"), "PASS — authenticated local-only content pipeline in the fresh full migration replay on PR #1386 head 5d013f12b0fb90536ff919a70fbbd7670477aa10 (run #44258659682).")
        self.assertEqual(runtime.get("provider_migration_ledger", {}).get("applied_count"), 437)
        self.assertEqual(runtime.get("provider_migration_ledger", {}).get("latest_version"), "20261118090000")
        self.assertIn("Cloudflare Pages exact-SHA production verification passed", runtime.get("remediation", ""))
        self.assertIn("241/241 registered pages", runtime.get("remediation", ""))
        self.assertIn("no pending migrations remain", runtime.get("remediation", ""))
        self.assertIn("auth.mfa_factors count returned 0 total factors and 0 verified factors", runtime.get("remediation", ""))
        remediation = runtime.get("remediation", "").lower()
        self.assertIn("vercel production promotion remains", remediation)
        self.assertIn("intentionally postponed", remediation)
        self.assertIn("vercel deploy steps were skipped", remediation)

    def test_agent_task_service_role_grants_are_provider_applied_without_anon_expansion(self) -> None:
        path = MIGRATIONS / "20261113010000_omega_agent_task_service_role_read_grants.sql"
        sql = path.read_text(encoding="utf-8").lower()
        self.assertIn("grant select on table", sql)
        self.assertIn("public.omega_agent_tasks", sql)
        self.assertIn("public.omega_agent_task_events", sql)
        self.assertIn("to service_role", sql)
        self.assertIn("has_table_privilege('anon'", sql)
        self.assertNotIn("to authenticated", sql)
        self.assertTrue(sql.strip().endswith("commit;"))
        self.assertIn("20261113010000", self.remote_versions)
        self.assertNotIn("20261113010000", {str(x["version"]) for x in self.pending})

    def test_notification_service_role_grant_matches_existing_live_privilege_without_anon_expansion(self) -> None:
        path = MIGRATIONS / "20261113020000_omega_notification_service_role_read_grant.sql"
        sql = path.read_text(encoding="utf-8").lower()
        self.assertIn("grant select on table public.omega_notifications to service_role", sql)
        self.assertIn("has_table_privilege('service_role','public.omega_notifications','select')", sql)
        self.assertIn("has_table_privilege('anon','public.omega_notifications','select')", sql)
        self.assertNotIn("to authenticated", sql)
        self.assertTrue(sql.strip().endswith("commit;"))
        self.assertIn("20261113020000", self.remote_versions)

    def test_achievement_assignment_insert_remains_server_only_and_matches_live_acl(self) -> None:
        path = MIGRATIONS / "20261113062812_omega_user_achievement_service_role_insert_grant.sql"
        sql = path.read_text(encoding="utf-8").lower()
        self.assertIn("grant select, insert on table public.omega_user_achievements to service_role", sql)
        self.assertIn("grant select on table public.omega_achievement_verifications to service_role", sql)
        self.assertIn("has_table_privilege('service_role','public.omega_user_achievements','select')", sql)
        self.assertIn("has_table_privilege('service_role','public.omega_user_achievements','insert')", sql)
        self.assertIn("has_table_privilege('service_role','public.omega_achievement_verifications','select')", sql)
        self.assertIn("has_table_privilege('authenticated','public.omega_user_achievements','insert')", sql)
        self.assertIn("has_table_privilege('anon','public.omega_user_achievements','insert')", sql)
        self.assertIn("has_table_privilege('authenticated','public.omega_achievement_verifications','select')", sql)
        self.assertIn("has_table_privilege('anon','public.omega_achievement_verifications','select')", sql)
        self.assertNotIn("create policy", sql)
        self.assertTrue(sql.strip().endswith("commit;"))
        self.assertIn("20261113062812", self.remote_versions)

    def test_runtime_probe_uses_transaction_scoped_definer_inspector_for_restricted_evidence_tables(self) -> None:
        path = ROOT / "scripts" / "tests" / "omega-runtime-adapter-reconciliation-probe.sql"
        sql = path.read_text(encoding="utf-8").lower()
        self.assertIn("create or replace function public.omega_runtime_probe_assert_counts_20261113(", sql)
        self.assertIn("security definer", sql)
        self.assertIn("set search_path = ''", sql)
        self.assertIn("revoke all on function public.omega_runtime_probe_assert_counts_20261113", sql)
        self.assertIn("grant execute on function public.omega_runtime_probe_assert_counts_20261113", sql)
        self.assertIn("rollback;", sql)
        self.assertNotIn("select count(*) into v_count from public.omega_platform_events", sql)
        self.assertNotIn("select count(*) into v_count from public.omega_audit_log", sql)
        self.assertNotIn("select count(*) into v_count from public.sovereign_events", sql)

    def test_public_points_projection_remains_privacy_scoped(self) -> None:
        path = MIGRATIONS / "20261013160000_secure_public_points_leaderboard_projection.sql"
        sql = path.read_text(encoding="utf-8").lower()
        for marker in (
            "security definer", "set search_path = ''",
            "p.is_public is true or p.id = v_uid",
            "p.access_approved is true or p.is_owner is true",
            "p.deactivated_at is null",
            "p.family_of is null or p.id = v_uid",
            "revoke all on function public.get_points_leaderboard(integer) from public, anon",
            "grant execute on function public.get_points_leaderboard(integer) to authenticated",
        ):
            self.assertIn(marker, sql)

    def test_search_index_reconciliation_is_additive_and_owner_scoped(self) -> None:
        path = MIGRATIONS / "20261112091500_omega_search_index_schema_reconciliation.sql"
        sql = path.read_text(encoding="utf-8").lower()
        for marker in (
            "add column if not exists body text",
            "add column if not exists content text",
            "add column if not exists owner_id uuid",
            "add column if not exists organization_id uuid",
            "owner_id is null and organization_id is null",
            "owner_id=auth.uid()",
            "coalesce(body,content)",
        ):
            self.assertIn(marker, sql)
        self.assertNotIn("drop table", sql)
        self.assertNotIn("drop column", sql)
        self.assertTrue(sql.strip().endswith("commit;"))

    def test_consultancy_schema_parity_preserves_existing_identifier_types(self) -> None:
        path = MIGRATIONS / "20261112091600_omega_consultancy_runtime_schema_parity.sql"
        sql = path.read_text(encoding="utf-8").lower()
        for marker in (
            "add column if not exists domain text",
            "returning id::text into v_id",
            "return v_id;",
            "v_request_id text",
            "owner_id=(select auth.uid())",
        ):
            self.assertIn(marker, sql)
        self.assertNotIn("drop table", sql)
        self.assertNotIn("delete from public.consult_requests", sql)
        self.assertTrue(sql.strip().endswith("commit;"))


    def test_latest_consultancy_dispatcher_normalizes_uuid_and_bigint_ids_to_text(self) -> None:
        path = MIGRATIONS / "20261112130000_omega_consultancy_request_id_text_compat.sql"
        sql = path.read_text(encoding="utf-8").lower()
        self.assertIn("v_request_id text", sql)
        self.assertNotIn("v_request_id bigint", sql)
        self.assertIn("omega_private.create_consult_intake", sql)
        self.assertIn("v_request_id:=omega_private.create_consult_intake", sql)
        parity_sql = (MIGRATIONS / "20261112091600_omega_consultancy_runtime_schema_parity.sql").read_text(encoding="utf-8").lower()
        self.assertIn("returning id::text into v_id", parity_sql)
        self.assertIn("grant execute on function public.omega_runtime_dispatch", sql)
        self.assertTrue(sql.strip().endswith("commit;"))


if __name__ == "__main__":
    unittest.main()
