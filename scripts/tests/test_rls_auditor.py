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


if __name__ == "__main__":
    unittest.main()
