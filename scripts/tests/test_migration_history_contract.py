#!/usr/bin/env python3
"""Tests for scripts/migration-history-contract.py

The gate blanket-rejected every 8-digit YYYYMMDD version, and one such version
-- `20260902` -- is already APPLIED: it sits in the live
supabase_migrations.schema_migrations ledger and in
supabase/remote-migrations.json, so the file cannot be renumbered without
creating exactly the drift migration-drift.py exists to catch. The gate was
therefore unsatisfiable, and it stayed invisible because ci.yml's `verify` job
exits at the first failing step and migration-consistency ran before it.

The failure it names is a COLLISION, not a width: the Supabase CLI mis-orders
an 8-digit YYYYMMDD version against a 14-digit version sharing that prefix. So
the collision is now checked directly and that one applied version is
grandfathered.

Every "must pass" case below is paired with a violator, because a gate that
stopped reporting would satisfy the passing cases on its own (CLAUDE.md 8.4).
"""

import os
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SCRIPT_SRC = os.path.join(ROOT, "scripts", "migration-history-contract.py")


class Fixture:
    def __init__(self):
        self.dir = tempfile.mkdtemp(prefix="migration-history-test-")
        os.makedirs(os.path.join(self.dir, "scripts"))
        self.migrations = os.path.join(self.dir, "supabase", "migrations")
        os.makedirs(self.migrations)
        shutil.copy(SCRIPT_SRC, os.path.join(self.dir, "scripts", "migration-history-contract.py"))

    def add(self, name):
        with open(os.path.join(self.migrations, name), "w", encoding="utf-8") as fh:
            fh.write("SELECT 1;\n")

    def run(self, *args):
        r = subprocess.run(
            [sys.executable, os.path.join("scripts", "migration-history-contract.py"), *args],
            cwd=self.dir, capture_output=True, text=True,
        )
        return r.returncode, r.stdout + r.stderr

    def cleanup(self):
        shutil.rmtree(self.dir, ignore_errors=True)


class MigrationHistoryContractTests(unittest.TestCase):
    def setUp(self):
        self.fx = Fixture()

    def tearDown(self):
        self.fx.cleanup()

    def test_help_exits_zero_without_running(self):
        code, out = self.fx.run("--help")
        self.assertEqual(code, 0, out)
        self.assertNotIn("local migration versions:", out)

    def test_four_and_fourteen_digit_versions_pass(self):
        self.fx.add("0001_baseline.sql")
        self.fx.add("20260905211725_recent.sql")
        code, out = self.fx.run("--local")
        self.assertEqual(code, 0, out)
        self.assertIn("structurally valid", out)

    def test_the_applied_eight_digit_version_is_grandfathered(self):
        """THE REGRESSION. `20260902` is in the live ledger and immutable, so
        the gate must not demand a rename it can never get."""
        self.fx.add("0001_baseline.sql")
        self.fx.add("20260902_reset_migration_state.sql")
        code, out = self.fx.run("--local")
        self.assertEqual(code, 0, out)

    def test_a_new_eight_digit_version_still_fails(self):
        """VIOLATOR. Grandfathering one applied version must not open the door:
        any other 8-digit version is still rejected on width."""
        self.fx.add("20260906_new_and_wrong.sql")
        code, out = self.fx.run("--local")
        self.assertEqual(code, 1, out)
        self.assertIn("invalid migration version width", out)
        self.assertIn("20260906", out)

    def test_a_date_prefix_collision_fails_even_when_grandfathered(self):
        """VIOLATOR, and the hazard the width rule was standing in for. The
        Supabase CLI mis-orders `20260902` against `20260902083000`; being on
        the grandfather list does not exempt the pair."""
        self.fx.add("20260902_reset_migration_state.sql")
        self.fx.add("20260902083000_later_same_day.sql")
        code, out = self.fx.run("--local")
        self.assertEqual(code, 1, out)
        self.assertIn("shares a date prefix", out)
        self.assertIn("20260902083000", out)

    def test_duplicate_versions_still_fail(self):
        self.fx.add("0001_baseline.sql")
        self.fx.add("0001_baseline_again.sql")
        code, out = self.fx.run("--local")
        self.assertEqual(code, 1, out)
        self.assertIn("duplicate", out)


if __name__ == "__main__":
    unittest.main()
