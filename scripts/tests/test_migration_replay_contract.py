#!/usr/bin/env python3
"""Tests for local migration inventory and live-vs-pending truth boundaries."""
from __future__ import annotations

import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location(
    "migration_replay_contract", ROOT / "scripts" / "migration-replay-contract.py"
)
assert SPEC is not None and SPEC.loader is not None
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)
inspect_inventory = MODULE.inspect_inventory
inspect_release_inventory = MODULE.inspect_release_inventory


class MigrationReplayInventoryTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory(prefix="omega-migration-inventory-")
        self.root = Path(self.temp.name)
        self.remote_path = self.root.parent / (self.root.name + "-remote.json")
        self.pending_path = self.root.parent / (self.root.name + "-pending.json")

    def tearDown(self) -> None:
        self.remote_path.unlink(missing_ok=True)
        self.pending_path.unlink(missing_ok=True)
        self.temp.cleanup()

    def add(self, *names: str) -> None:
        for name in names:
            (self.root / name).write_text("-- fixture\n", encoding="utf-8")

    def write_release_manifests(self, pending_filename: str = "20261012150000_family_access.sql") -> None:
        self.remote_path.write_text(
            json.dumps({
                "remoteMigrationCount": 1,
                "latestRemoteMigration": "0001",
                "versions": ["0001"],
            }),
            encoding="utf-8",
        )
        self.pending_path.write_text(
            json.dumps({
                "pending": [{
                    "version": "20261012150000",
                    "file": pending_filename,
                    "status": "PENDING_REVIEW",
                    "liveStatus": "NOT_APPLIED",
                    "blocksProduction": True,
                }]
            }),
            encoding="utf-8",
        )

    def test_local_only_migration_is_valid_for_fresh_replay(self) -> None:
        self.add("0001_base.sql", "20261012150000_family_access.sql")
        versions, errors = inspect_inventory(self.root)
        self.assertEqual(errors, [])
        self.assertEqual(versions, ["0001", "20261012150000"])

    def test_duplicate_versions_fail_closed(self) -> None:
        self.add("20261012150000_family_access.sql", "20261012150000_family_access_fix.sql")
        _, errors = inspect_inventory(self.root)
        self.assertTrue(any("duplicate migration versions" in error for error in errors))

    def test_malformed_filename_fails_closed(self) -> None:
        self.add("family_access.sql")
        _, errors = inspect_inventory(self.root)
        self.assertTrue(any("numeric version prefix" in error for error in errors))

    def test_empty_inventory_fails_closed(self) -> None:
        _, errors = inspect_inventory(self.root)
        self.assertTrue(any("no SQL migration files" in error for error in errors))

    def test_live_and_pending_migrations_are_reconciled_without_conflation(self) -> None:
        self.add("0001_base.sql", "20261012150000_family_access.sql")
        self.write_release_manifests()
        versions, errors = inspect_inventory(self.root)
        self.assertEqual(errors, [])
        summary, release_errors = inspect_release_inventory(
            self.root, versions, self.remote_path, self.pending_path
        )
        self.assertEqual(release_errors, [])
        self.assertIsNotNone(summary)
        self.assertIn("remote_count=1", summary or "")
        self.assertIn("pending_count=1", summary or "")
        self.assertIn("pending versions are not asserted applied", summary or "")

    def test_unregistered_local_migration_blocks_inventory(self) -> None:
        self.add(
            "0001_base.sql",
            "20261012150000_family_access.sql",
            "20261013120000_unregistered.sql",
        )
        self.write_release_manifests()
        versions, errors = inspect_inventory(self.root)
        self.assertEqual(errors, [])
        _, release_errors = inspect_release_inventory(
            self.root, versions, self.remote_path, self.pending_path
        )
        self.assertTrue(any("inventory mismatch" in error for error in release_errors))

    def test_pending_entry_cannot_claim_live_application(self) -> None:
        self.add("0001_base.sql", "20261012150000_family_access.sql")
        self.write_release_manifests()
        doc = json.loads(self.pending_path.read_text(encoding="utf-8"))
        doc["pending"][0]["liveStatus"] = "APPLIED"
        self.pending_path.write_text(json.dumps(doc), encoding="utf-8")
        versions, errors = inspect_inventory(self.root)
        self.assertEqual(errors, [])
        _, release_errors = inspect_release_inventory(
            self.root, versions, self.remote_path, self.pending_path
        )
        self.assertTrue(any("PENDING_REVIEW / NOT_APPLIED" in error for error in release_errors))


if __name__ == "__main__":
    unittest.main()
