#!/usr/bin/env python3
"""Tests for the local migration inventory gate; no provider state is required."""
from __future__ import annotations

import importlib.util
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


class MigrationReplayInventoryTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory(prefix="omega-migration-inventory-")
        self.root = Path(self.temp.name)

    def tearDown(self) -> None:
        self.temp.cleanup()

    def add(self, *names: str) -> None:
        for name in names:
            (self.root / name).write_text("-- fixture\n", encoding="utf-8")

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


if __name__ == "__main__":
    unittest.main()
