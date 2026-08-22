#!/usr/bin/env python3
"""Tests for scripts/migration-consistency.py"""

import os
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SCRIPT_SRC = os.path.join(ROOT, "scripts", "migration-consistency.py")


def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)


class MigrationConsistencyFixture:
    """Fixture for testing migration-consistency.py"""

    def __init__(self):
        self.dir = tempfile.mkdtemp(prefix="migration-test-")
        os.makedirs(os.path.join(self.dir, "scripts"), exist_ok=True)
        os.makedirs(os.path.join(self.dir, "supabase", "migrations"), exist_ok=True)
        shutil.copy(SCRIPT_SRC, os.path.join(self.dir, "scripts", "migration-consistency.py"))

    def write_flat_sql(self, filename, content):
        write_file(os.path.join(self.dir, "supabase", filename), content)

    def write_migration_sql(self, filename, content):
        write_file(os.path.join(self.dir, "supabase", "migrations", filename), content)

    def run(self):
        r = subprocess.run(
            [sys.executable, os.path.join("scripts", "migration-consistency.py")],
            cwd=self.dir,
            capture_output=True,
            text=True,
        )
        return r.returncode, r.stdout + r.stderr

    def cleanup(self):
        shutil.rmtree(self.dir, ignore_errors=True)


class MigrationConsistencyTests(unittest.TestCase):
    def setUp(self):
        self.fx = MigrationConsistencyFixture()

    def tearDown(self):
        self.fx.cleanup()

    def test_consistent_schemas_pass(self):
        schema_sql = """
            CREATE TABLE IF NOT EXISTS public.profiles (
              id uuid PRIMARY KEY,
              user_id uuid,
              name text
            );
        """
        self.fx.write_flat_sql("schema.sql", schema_sql)
        self.fx.write_migration_sql("0001_schema.sql", schema_sql)
        code, out = self.fx.run()
        self.assertEqual(code, 0)
        self.assertIn("OK", out)

    def test_conflicting_definitions_detected(self):
        flat_sql = """
            CREATE TABLE IF NOT EXISTS public.profiles (
              id uuid PRIMARY KEY,
              name text,
              age int
            );
        """
        migration_sql = """
            CREATE TABLE IF NOT EXISTS public.profiles (
              id uuid PRIMARY KEY,
              name text
            );
        """
        self.fx.write_flat_sql("schema.sql", flat_sql)
        self.fx.write_migration_sql("0001_schema.sql", migration_sql)
        code, out = self.fx.run()
        self.assertEqual(code, 1)
        self.assertIn("Definition mismatch", out)

    def test_missing_alter_detected(self):
        flat_sql = """
            CREATE TABLE IF NOT EXISTS public.profiles (
              id uuid PRIMARY KEY
            );
            ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
        """
        migration_sql = """
            CREATE TABLE IF NOT EXISTS public.profiles (
              id uuid PRIMARY KEY
            );
        """
        self.fx.write_flat_sql("schema.sql", flat_sql)
        self.fx.write_migration_sql("0001_schema.sql", migration_sql)
        code, out = self.fx.run()
        self.assertEqual(code, 1)
        self.assertIn("missing in migrations", out)


if __name__ == "__main__":
    unittest.main()
