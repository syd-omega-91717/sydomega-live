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

    def test_pending_registry_is_valid_unique_and_blocks_production(self) -> None:
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
        self.assertEqual(pending_versions, {"20261112111000", "20261112121000"})

    def test_provider_confirmed_november_migrations_are_live_only(self) -> None:
        applied_versions = {
            "20261103230000", "20261104090000", "20261111190000",
            "20261112091300", "20261112091400", "20261112091500",
            "20261112091600", "20261112103000", "20261112110000", "20261112120000",
        }
        pending_versions = {str(entry["version"]) for entry in self.pending}
        self.assertTrue(applied_versions.issubset(self.remote_versions))
        self.assertTrue(applied_versions.isdisjoint(pending_versions))
        self.assertEqual(self.remote.get("remoteMigrationCount"), len(self.remote_versions))
        self.assertEqual(self.remote.get("latestRemoteMigration"), "20261112091500")
        self.assertEqual(self.remote.get("latestRemoteMigration"), self.remote.get("versions", [])[-1])
        self.assertEqual(self.remote.get("_captured"), "2026-11-12")
        self.assertNotIn("ydqhzvvoyufiiqvzcjns", self.remote.get("source", ""))

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

    def test_source_only_drift_check_passes_but_release_check_remains_blocked(self) -> None:
        source = run_script("scripts/migration-drift.py", "--source-only")
        self.assertEqual(source.returncode, 0, source.stdout + source.stderr)
        strict = run_script("scripts/migration-drift.py")
        self.assertNotEqual(strict.returncode, 0, strict.stdout + strict.stderr)
        self.assertIn("MIGRATION DRIFT: BLOCKED", strict.stdout)
        self.assertIn("production release is blocked", strict.stdout)

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


if __name__ == "__main__":
    unittest.main()
