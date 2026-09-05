#!/usr/bin/env python3
"""Tests for scripts/supabase-migration-security-audit.py

The audit blocks "newly introduced patterns that can silently expose the public
API or weaken RLS" -- its own words -- but it scanned every file in
supabase/migrations/, including the 24 already-applied ones, and so demanded
edits to files that must never be rewritten (migrations/README.md:60). It was
unsatisfiable, the same shape as the version-width rule in
migration-history-contract.py.

Its 67 findings also described a state production had already left behind:
verified live on 2026-09-05, pg_proc reports 107 SECURITY DEFINER functions
across public+private with 0 lacking an explicit search_path, and Supabase's
own security advisors return no function_search_path_mutable finding.

So applied findings are baselined as a FINGERPRINT. The tests below exist to
prove that is not the same as switching the gate off: every passing case is
paired with a violator (CLAUDE.md 8.4).
"""

import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SCRIPT_SRC = os.path.join(ROOT, "scripts", "supabase-migration-security-audit.py")

UNSAFE = """
CREATE OR REPLACE FUNCTION public.risky() RETURNS void
LANGUAGE sql SECURITY DEFINER AS $$ SELECT 1 $$;
"""
SAFE = """
CREATE OR REPLACE FUNCTION public.careful() RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_temp AS $$ SELECT 1 $$;
"""


class Fixture:
    def __init__(self):
        self.dir = tempfile.mkdtemp(prefix="migration-security-test-")
        os.makedirs(os.path.join(self.dir, "scripts"))
        self.migrations = os.path.join(self.dir, "supabase", "migrations")
        os.makedirs(self.migrations)
        shutil.copy(SCRIPT_SRC, os.path.join(self.dir, "scripts", "supabase-migration-security-audit.py"))

    def add(self, name, body):
        with open(os.path.join(self.migrations, name), "w", encoding="utf-8") as fh:
            fh.write(body)

    def set_baseline(self, findings):
        path = os.path.join(self.dir, "scripts", "supabase-migration-security-baseline.json")
        with open(path, "w", encoding="utf-8") as fh:
            json.dump({"findings": findings}, fh)

    def run(self, *args):
        # ROOT is a RELATIVE path in the audit, so cwd is what selects the tree.
        r = subprocess.run(
            [sys.executable, os.path.join("scripts", "supabase-migration-security-audit.py"), *args],
            cwd=self.dir, capture_output=True, text=True,
        )
        return r.returncode, r.stdout + r.stderr

    def cleanup(self):
        shutil.rmtree(self.dir, ignore_errors=True)


SECDEF = "SECURITY DEFINER function without explicit search_path"


class MigrationSecurityAuditTests(unittest.TestCase):
    def setUp(self):
        self.fx = Fixture()

    def tearDown(self):
        self.fx.cleanup()

    def test_help_prints_the_docstring_without_scanning(self):
        code, out = self.fx.run("--help")
        self.assertEqual(code, 0, out)
        self.assertIn("fail-closed audit", out)
        self.assertNotIn("SUPABASE_MIGRATION_SECURITY_AUDIT=", out)

    def test_a_safe_function_passes(self):
        self.fx.add("0001_safe.sql", SAFE)
        code, out = self.fx.run()
        self.assertEqual(code, 0, out)
        self.assertIn("PASSED", out)

    def test_an_unbaselined_unsafe_function_fails(self):
        """VIOLATOR. The whole point of the gate: a NEW SECURITY DEFINER with no
        search_path must still be blocked."""
        self.fx.add("0001_new_and_unsafe.sql", UNSAFE)
        code, out = self.fx.run()
        self.assertEqual(code, 1, out)
        self.assertIn("FAILED", out)
        self.assertIn("0001_new_and_unsafe.sql", out)

    def test_a_baselined_applied_finding_passes(self):
        """THE REGRESSION. An applied migration cannot be edited, so its
        historical finding must not block every future change."""
        self.fx.add("0001_applied.sql", UNSAFE)
        self.fx.set_baseline({f"0001_applied.sql::{SECDEF}": 1})
        code, out = self.fx.run()
        self.assertEqual(code, 0, out)

    def test_a_new_unsafe_function_in_a_baselined_file_fails_as_drift(self):
        """VIOLATOR, and the one that makes the baseline safe. Baselining a file
        must not turn it into a place to hide new unsafe code."""
        self.fx.add("0001_applied.sql", UNSAFE + UNSAFE)
        self.fx.set_baseline({f"0001_applied.sql::{SECDEF}": 1})
        code, out = self.fx.run()
        self.assertEqual(code, 1, out)
        self.assertIn("baseline drift", out)
        self.assertIn("baseline 1, found 2", out)

    def test_a_baselined_finding_that_disappears_fails_as_drift(self):
        """An applied migration is immutable, so a finding vanishing means the
        file was edited -- forbidden in the other direction."""
        self.fx.add("0001_applied.sql", SAFE)
        self.fx.set_baseline({f"0001_applied.sql::{SECDEF}": 1})
        code, out = self.fx.run()
        self.assertEqual(code, 1, out)
        self.assertIn("baseline drift", out)

    def test_a_different_rule_is_not_covered_by_a_secdef_baseline(self):
        """VIOLATOR. The fingerprint key carries the rule, so baselining one
        rule for a file cannot silence a different one in that same file."""
        self.fx.add("0001_applied.sql", "GRANT ALL ON public.t TO anon;\n")
        self.fx.set_baseline({f"0001_applied.sql::{SECDEF}": 0})
        code, out = self.fx.run()
        self.assertEqual(code, 1, out)
        self.assertIn("unsafe privilege grant", out)

    def test_the_real_repo_baseline_matches_the_real_tree(self):
        """The committed baseline must describe this repo exactly -- a stale one
        would either block every PR or hide a real finding."""
        r = subprocess.run(
            [sys.executable, "scripts/supabase-migration-security-audit.py"],
            cwd=ROOT, capture_output=True, text=True,
        )
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assertIn("PASSED", r.stdout)


if __name__ == "__main__":
    unittest.main()
