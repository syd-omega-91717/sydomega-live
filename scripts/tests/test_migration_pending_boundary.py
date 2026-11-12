#!/usr/bin/env python3
"""Regression tests for the distinction between source-pending and live-applied migrations."""

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
        self.remote_versions = {str(v) for v in self.remote.get("versions", [])}

    def test_pending_registry_never_claims_live_application(self) -> None:
        pending_versions = set()
        for entry in self.pending:
            version = str(entry["version"])
            filename = str(entry["file"])
            self.assertNotIn(version, pending_versions, "duplicate pending migration")
            self.assertNotIn(version, self.remote_versions, "pending version also claimed live-applied")
            self.assertEqual(entry.get("status"), "PENDING_REVIEW")
            self.assertEqual(entry.get("liveStatus"), "NOT_APPLIED")
            self.assertIs(entry.get("blocksProduction"), True)
            self.assertTrue((MIGRATIONS / filename).is_file(), filename)
            self.assertTrue(filename.startswith(version + "_"), filename)
            pending_versions.add(version)

    def test_provider_confirmed_november_migrations_are_in_remote_not_pending(self) -> None:
        for version in ("20261103230000", "20261104090000", "20261111190000"):
            self.assertIn(version, self.remote_versions)
            self.assertNotIn(version, {str(item["version"]) for item in self.pending})
        self.assertEqual(self.remote.get("remoteMigrationCount"), len(self.remote_versions))
        self.assertIn("20261111190000", self.remote_versions)
        self.assertNotIn("20261111190000", {str(item["version"]) for item in self.pending})
        self.assertIn("20261112091300", {str(item["version"]) for item in self.pending})
        self.assertIn("20261112091400", {str(item["version"]) for item in self.pending})
        self.assertIn("20261112091500", {str(item["version"]) for item in self.pending})
        self.assertEqual(self.remote.get("latestRemoteMigration"), self.remote.get("versions", [])[-1])
        self.assertEqual(self.remote.get("_captured"), "2026-11-12")
        self.assertNotIn("ydqhzvvoyufiiqvzcjns", self.remote.get("source", ""))

    def test_source_inventory_replay_contract_includes_pending_without_claiming_live(self) -> None:
        result = run_script("scripts/migration-replay-contract.py")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn(f"remote_count={len(self.remote_versions)}", result.stdout)
        self.assertIn(f"pending_count={len(self.pending)}", result.stdout)
        self.assertIn("pending versions are not asserted applied", result.stdout)

    def test_points_leaderboard_definer_is_a_narrow_privacy_projection(self) -> None:
        path = MIGRATIONS / "20261013160000_secure_public_points_leaderboard_projection.sql"
        sql = path.read_text(encoding="utf-8").lower()
        self.assertIn("security definer", sql)
        self.assertIn("set search_path = ''", sql)
        self.assertIn("p.is_public is true or p.id = v_uid", sql)
        self.assertIn("p.access_approved is true or p.is_owner is true", sql)
        self.assertIn("p.deactivated_at is null", sql)
        self.assertIn("p.family_of is null or p.id = v_uid", sql)
        self.assertIn("revoke all on function public.get_points_leaderboard(integer) from public, anon", sql)
        self.assertIn("grant execute on function public.get_points_leaderboard(integer) to authenticated", sql)

    def test_latest_public_points_rpc_is_invoker_wrapper(self) -> None:
        path = MIGRATIONS / "20261015220000_restore_points_leaderboard_invoker_wrapper.sql"
        sql = path.read_text(encoding="utf-8")
        definition = sql.split("CREATE OR REPLACE FUNCTION public.get_points_leaderboard", 1)[1].split("AS $function$", 1)[0].lower()
        body = sql.split("AS $function$", 1)[1].split("$function$", 1)[0].lower()
        self.assertIn("security invoker", definition)
        self.assertNotIn("security definer", definition)
        self.assertEqual(" ".join(body.split()), "select * from private.get_points_leaderboard($1);")
        self.assertIn("revoke all on function public.get_points_leaderboard(integer) from public, anon", sql.lower())
        self.assertIn("grant execute on function public.get_points_leaderboard(integer) to authenticated", sql.lower())

    def test_generated_skill_registry_migration_census_matches_disk(self) -> None:
        registry = (ROOT / "OMEGA_SKILL_REGISTRY.md").read_text(encoding="utf-8")
        match = re.search(
            r"\| `supabase/migrations/\*\.sql` \| (\d+) \((\d+) numbered.*?, (\d+) timestamped\) \|",
            registry,
        )
        self.assertIsNotNone(match, "generated registry migration census row is missing")
        migrations = list(MIGRATIONS.glob("*.sql"))
        numbered = sum(bool(re.match(r"^\d{4}_", path.name)) for path in migrations)
        timestamped = sum(bool(re.match(r"^\d{8}", path.name)) for path in migrations)
        self.assertEqual(tuple(map(int, match.groups())), (len(migrations), numbered, timestamped))

    def test_search_index_runtime_probe_checks_dispatch_and_direct_rls_isolation(self) -> None:
        probe = (ROOT / "scripts/tests/omega-runtime-adapter-reconciliation-probe.sql").read_text(encoding="utf-8")
        for marker in (
            "search-shared",
            "search-owner-one",
            "search-owner-two",
            "search-org-only",
            "search dispatcher owner/org isolation failed",
            "$search_rls_probe$",
            "search_index RLS exposed",
        ):
            self.assertIn(marker, probe)

    def test_search_index_reconciliation_preserves_both_shapes_and_tightens_rls(self) -> None:
        path = MIGRATIONS / "20261112091500_omega_search_index_schema_reconciliation.sql"
        sql = path.read_text(encoding="utf-8").lower()
        for column in (
            "add column if not exists body text",
            "add column if not exists content text",
            "add column if not exists keywords text",
            "add column if not exists owner_id uuid",
            "add column if not exists organization_id uuid",
            "add column if not exists indexed_at timestamptz",
            "add column if not exists updated_at timestamptz",
            "add column if not exists created_at timestamptz",
        ):
            self.assertIn(column, sql)
        self.assertIn("coalesce(body,content)", sql)
        self.assertIn("coalesce(content,body)", sql)
        self.assertIn("owner_id is null and organization_id is null", sql)
        self.assertIn("owner_id=auth.uid()", sql)
        self.assertIn("coalesce(body,content) as body", sql)
        self.assertNotIn("drop table", sql)
        self.assertNotIn("drop column", sql)
        self.assertTrue(sql.strip().endswith("commit;"))

    def test_refund_state_foreign_key_index_migration_is_narrow_and_non_destructive(self) -> None:
        path = MIGRATIONS / "20261112091400_omega_stripe_refund_state_fk_index.sql"
        sql = path.read_text(encoding="utf-8").lower()
        self.assertIn("create index if not exists stripe_refund_state_last_reversal_transaction_idx", sql)
        self.assertIn("on omega_private.stripe_refund_state(last_reversal_transaction_id)", sql)
        self.assertNotIn("drop index", sql)
        self.assertNotIn("drop table", sql)
        self.assertTrue(sql.strip().endswith("commit;"))

    def test_source_only_gate_and_strict_release_gate_are_distinct(self) -> None:
        source = run_script("scripts/migration-drift.py", "--source-only")
        self.assertEqual(source.returncode, 0, source.stdout + source.stderr)

        strict = run_script("scripts/migration-drift.py")
        if self.pending:
            self.assertNotEqual(strict.returncode, 0, strict.stdout + strict.stderr)
            self.assertIn("MIGRATION DRIFT: BLOCKED", strict.stdout)
            self.assertIn("production release is blocked", strict.stdout)
        else:
            self.assertEqual(strict.returncode, 0, strict.stdout + strict.stderr)


if __name__ == "__main__":
    unittest.main()
