#!/usr/bin/env python3
"""Tests for scripts/rls-auditor.py"""

import os
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SCRIPT_SRC = os.path.join(ROOT, "scripts", "rls-auditor.py")


def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)


class RLSFixture:
    """Fixture for testing rls-auditor.py"""

    def __init__(self):
        self.dir = tempfile.mkdtemp(prefix="rls-test-")
        os.makedirs(os.path.join(self.dir, "scripts"), exist_ok=True)
        shutil.copy(SCRIPT_SRC, os.path.join(self.dir, "scripts", "rls-auditor.py"))

    def write_sql(self, filename, content):
        write_file(os.path.join(self.dir, "supabase", filename), content)

    def run(self):
        r = subprocess.run(
            [sys.executable, os.path.join("scripts", "rls-auditor.py")],
            cwd=self.dir,
            capture_output=True,
            text=True,
        )
        return r.returncode, r.stdout + r.stderr

    def cleanup(self):
        shutil.rmtree(self.dir, ignore_errors=True)


class RLSAuditorTests(unittest.TestCase):
    def setUp(self):
        self.fx = RLSFixture()

    def tearDown(self):
        self.fx.cleanup()

    def test_safe_rls_policy_passes(self):
        self.fx.write_sql(
            "schema.sql",
            """
            CREATE TABLE IF NOT EXISTS public.profiles (
              id uuid PRIMARY KEY,
              user_id uuid
            );

            ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

            CREATE POLICY "users_see_own" ON public.profiles FOR SELECT
              TO authenticated USING (auth.uid() = user_id);
            """,
        )
        code, out = self.fx.run()
        self.assertEqual(code, 0)
        self.assertIn("OK", out)

    def test_with_check_true_detected(self):
        self.fx.write_sql(
            "schema.sql",
            """
            CREATE TABLE IF NOT EXISTS public.profiles (
              id uuid PRIMARY KEY,
              user_id uuid
            );

            ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

            CREATE POLICY "bad_policy" ON public.profiles FOR INSERT
              TO authenticated WITH CHECK (true);
            """,
        )
        code, out = self.fx.run()
        self.assertEqual(code, 1)
        self.assertIn("CRITICAL", out)
        self.assertIn("WITH CHECK(true)", out)

    def test_missing_auth_uid_detected(self):
        self.fx.write_sql(
            "schema.sql",
            """
            CREATE TABLE IF NOT EXISTS public.profiles (
              id uuid PRIMARY KEY,
              user_id uuid
            );

            ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

            CREATE POLICY "unscoped_write" ON public.profiles FOR UPDATE
              TO authenticated WITH CHECK (true);
            """,
        )
        code, out = self.fx.run()
        self.assertEqual(code, 1)
        self.assertIn("CRITICAL", out)

    def test_public_on_sensitive_table_warned(self):
        self.fx.write_sql(
            "schema.sql",
            """
            CREATE TABLE IF NOT EXISTS public.profiles (
              id uuid PRIMARY KEY
            );

            ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

            CREATE POLICY "public_read" ON public.profiles FOR SELECT
              TO public USING (true);
            """,
        )
        code, out = self.fx.run()
        # Should warn or report, depends on implementation
        # At minimum, should not pass silently
        self.assertIn("WARNING", out)


class ClauseBoundaryTests(unittest.TestCase):
    """A policy must be judged on its OWN clauses.

    Both cases here were real: on origin/main the auditor reported 39 CRITICAL
    findings against a database that, measured live on 2026-09-05, had 304
    policies, 197 carrying a WITH CHECK clause, and zero whose WITH CHECK was
    `true`. These are the two defects that produced them.
    """

    def setUp(self):
        self.fx = RLSFixture()

    def tearDown(self):
        self.fx.cleanup()

    def test_select_policy_does_not_inherit_a_later_policys_with_check(self):
        # Verbatim shape of supabase/refinements.sql lines 8-10. The SELECT
        # policy has no WITH CHECK and cannot have one -- Postgres rejects
        # WITH CHECK on FOR SELECT. The clause search used to run to the end of
        # the FILE, so it picked up the UPDATE policy's `true` two lines down.
        self.fx.write_sql(
            "refinements.sql",
            """
            CREATE TABLE IF NOT EXISTS public.publications (
              id uuid PRIMARY KEY,
              user_id uuid
            );
            ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;

            CREATE POLICY "owner reads publications" ON public.publications
              FOR SELECT TO authenticated USING (public.is_platform_owner());
            CREATE POLICY "owner updates publications" ON public.publications
              FOR UPDATE TO authenticated
              USING (public.is_platform_owner()) WITH CHECK (true);
            """,
        )
        code, out = self.fx.run()
        self.assertNotIn("owner reads publications", out,
                         "a FOR SELECT policy was reported for a WITH CHECK it "
                         "cannot have and does not declare")
        self.assertEqual(code, 0, out)

    def test_owner_gated_update_is_not_called_unconditional(self):
        # supabase/chunk_05_migrations.sql:39's shape. USING restricts the rows
        # to the owner; WITH CHECK(true) then lets the owner write any value
        # into rows only the owner can reach. That is what "owner" means.
        self.fx.write_sql(
            "schema.sql",
            """
            CREATE TABLE IF NOT EXISTS public.publications (
              id uuid PRIMARY KEY,
              user_id uuid
            );
            ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;

            CREATE POLICY "owner updates" ON public.publications FOR UPDATE
              TO authenticated
              USING (public.is_platform_owner()) WITH CHECK (true);
            """,
        )
        code, out = self.fx.run()
        self.assertEqual(code, 0, out)

    def test_unscoped_insert_still_fails_the_gate(self):
        # THE VIOLATOR. Without this the two tests above would be satisfied by
        # an auditor that reports nothing at all -- CLAUDE.md 8.4, verify a
        # "0 findings" result is real. An INSERT policy has no USING clause, so
        # WITH CHECK is the only gate and `true` admits any row, attributed to
        # anyone (8.1 class 6b).
        self.fx.write_sql(
            "schema.sql",
            """
            CREATE TABLE IF NOT EXISTS public.telemetry_events (
              id uuid PRIMARY KEY,
              user_id uuid
            );
            ALTER TABLE public.telemetry_events ENABLE ROW LEVEL SECURITY;

            CREATE POLICY "member inserts telemetry" ON public.telemetry_events
              FOR INSERT TO authenticated WITH CHECK (true);
            """,
        )
        code, out = self.fx.run()
        self.assertEqual(code, 1, out)
        self.assertIn("CRITICAL", out)
        self.assertIn("user_id", out, "the user_id case should say what is at risk")

    def test_ungated_update_still_fails_the_gate(self):
        # The other half of the violator: an UPDATE whose USING is `true` has
        # no gate either, so WITH CHECK(true) really is unconditional.
        self.fx.write_sql(
            "schema.sql",
            """
            CREATE TABLE IF NOT EXISTS public.notes (
              id uuid PRIMARY KEY,
              user_id uuid
            );
            ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

            CREATE POLICY "anyone updates" ON public.notes FOR UPDATE
              TO authenticated USING (true) WITH CHECK (true);
            """,
        )
        code, out = self.fx.run()
        self.assertEqual(code, 1, out)
        self.assertIn("CRITICAL", out)

    def test_one_finding_per_policy_not_two(self):
        # The old code emitted "WITH CHECK(true)" AND a separate "Permissive X
        # without auth.uid()" for the same condition, double-counting every hit
        # on a table with a user_id column.
        self.fx.write_sql(
            "schema.sql",
            """
            CREATE TABLE IF NOT EXISTS public.telemetry_events (
              id uuid PRIMARY KEY,
              user_id uuid
            );
            ALTER TABLE public.telemetry_events ENABLE ROW LEVEL SECURITY;

            CREATE POLICY "member inserts telemetry" ON public.telemetry_events
              FOR INSERT TO authenticated WITH CHECK (true);
            """,
        )
        code, out = self.fx.run()
        self.assertEqual(code, 1, out)
        self.assertIn("CRITICAL — 1 RLS policy issue(s)", out)


if __name__ == "__main__":
    unittest.main()
