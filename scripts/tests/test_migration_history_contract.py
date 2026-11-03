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


class RemoteOutputTests(unittest.TestCase):
    """The `--remote-output` path compares `supabase migration list` with the local files.

    It had no tests, and parse_remote() counted a row whose REMOTE column is blank as applied
    remotely (it fell back to the LOCAL column), so a migration that existed only locally was
    reported as "exactly synchronized". Every passing case here is paired with a violator.
    """

    HEADER = "        LOCAL      \u2502     REMOTE     \u2502     TIME (UTC)\n  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n"

    def setUp(self):
        self.fx = Fixture()
        for name in ("0001_baseline.sql", "20260902_reset_migration_state.sql", "20261001000000_a.sql", "20261002000000_b.sql"):
            self.fx.add(name)
        self.out = os.path.join(self.fx.dir, "list.txt")

    def tearDown(self):
        self.fx.cleanup()

    @staticmethod
    def row(local, remote, time="2026-10-02 00:00:00"):
        return f"  {local or '':>14} \u2502 {remote or '':<14} \u2502 {time}\n"

    def check(self, rows, header=True):
        text = (self.HEADER if header else "") + "".join(self.row(l, r) for l, r in rows)
        with open(self.out, "w", encoding="utf-8") as fh:
            fh.write(text)
        return self.fx.run("--remote-output", self.out)

    ALL = [("0001", "0001"), ("20260902", "20260902"), ("20261001000000", "20261001000000"), ("20261002000000", "20261002000000")]

    def test_fully_synchronized_passes(self):
        code, out = self.check(self.ALL)
        self.assertEqual(code, 0, out)
        self.assertIn("exactly synchronized", out)

    def test_a_local_only_row_fails(self):
        """VIOLATOR, the reported bug: blank REMOTE column means NOT applied remotely."""
        rows = self.ALL[:-1] + [("20261002000000", None)]
        code, out = self.check(rows)
        self.assertEqual(code, 1, out)
        self.assertIn("missing remotely", out)
        self.assertIn("20261002000000", out)

    def test_a_remote_only_row_fails(self):
        """VIOLATOR. A version applied remotely with no local file."""
        code, out = self.check(self.ALL + [(None, "20261003000000")])
        self.assertEqual(code, 1, out)
        self.assertIn("missing locally", out)
        self.assertIn("20261003000000", out)

    def test_a_local_file_absent_from_the_output_fails(self):
        """VIOLATOR. Truncated output must not read as synchronized."""
        code, out = self.check(self.ALL[:-1])
        self.assertEqual(code, 1, out)
        self.assertIn("missing remotely", out)

    def test_the_time_column_is_not_read_as_a_version(self):
        """A remote-only row used to leak its '2026' time-column digits into the remote set."""
        code, out = self.check(self.ALL + [(None, "20261003000000")])
        self.assertEqual(code, 1, out)
        self.assertNotIn("\n  2026\n", out)

    def test_an_unparseable_row_fails_closed(self):
        """VIOLATOR. A separator-and-digits line that is not a recognised row is an error,
        not something to skip and then report 'synchronized'."""
        with open(self.out, "w", encoding="utf-8") as fh:
            fh.write(self.HEADER + "".join(self.row(l, r) for l, r in self.ALL) + "garbled | 20261009000000 text\n")
        code, out = self.fx.run("--remote-output", self.out)
        self.assertEqual(code, 1, out)
        self.assertIn("could not parse", out)

    def test_empty_output_fails(self):
        with open(self.out, "w", encoding="utf-8") as fh:
            fh.write("")
        code, out = self.fx.run("--remote-output", self.out)
        self.assertEqual(code, 1, out)

    def test_ascii_pipe_separators_are_accepted(self):
        text = "   Local | Remote | Time\n" + "".join(f"   {l} | {r} | 2026-10-02 00:00:00\n" for l, r in self.ALL)
        with open(self.out, "w", encoding="utf-8") as fh:
            fh.write(text)
        code, out = self.fx.run("--remote-output", self.out)
        self.assertEqual(code, 0, out)


if __name__ == "__main__":
    unittest.main()
