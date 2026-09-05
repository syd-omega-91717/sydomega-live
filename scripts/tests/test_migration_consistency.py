#!/usr/bin/env python3
"""Tests for scripts/migration-consistency.py

The gate was rebuilt on 2026-09-05 around a different invariant, so two tests
here are deliberately INVERTED from their original form. The old gate demanded
that supabase/*.sql and supabase/migrations/ hold identical CREATE-definition
hash sets; production says migrations/ is the deployment sequence (its ledger
matched that directory 169-for-169) and the flat bag is reference material, so
a difference between them is not by itself a defect. What matters is one
direction only: schema the flat bag declares and migrations/ never applies.

Every "must pass" case below is paired with a violator, because a gate that
reports nothing would satisfy the passing cases on its own (CLAUDE.md 8.4).
"""

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

    def run(self, *args):
        r = subprocess.run(
            [sys.executable, os.path.join("scripts", "migration-consistency.py"), *args],
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

    def test_help_prints_the_docstring_without_running(self):
        code, out = self.fx.run("--help")
        self.assertEqual(code, 0, out)
        self.assertIn("Migration deployability validator", out)
        self.assertNotIn("Comparing schemas", out)

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
        self.assertEqual(code, 0, out)
        self.assertIn("OK", out)

    def test_a_stale_flat_bag_variant_is_not_a_defect(self):
        """INVERTED. This asserted exit 1 ("Definition mismatch") under the old
        gate, and that is what made every PR red: the flat bag is legacy
        reference material and is allowed to carry an older shape of a table
        migrations/ already defines. Nothing about it can stop a deployment."""
        self.fx.write_flat_sql("schema.sql", """
            CREATE TABLE IF NOT EXISTS public.profiles (
              id uuid PRIMARY KEY,
              name text,
              age int
            );
        """)
        self.fx.write_migration_sql("0001_schema.sql", """
            CREATE TABLE IF NOT EXISTS public.profiles (
              id uuid PRIMARY KEY,
              name text
            );
        """)
        code, out = self.fx.run()
        self.assertEqual(code, 0, out)

    def test_a_table_only_in_migrations_is_not_a_defect(self):
        """The other direction of the old symmetric check. migrations/ is the
        deployment sequence; it needs no flat-bag twin."""
        self.fx.write_flat_sql("schema.sql", "-- nothing here\n")
        self.fx.write_migration_sql("0001_schema.sql", """
            CREATE TABLE IF NOT EXISTS public.only_in_migrations (
              id uuid PRIMARY KEY
            );
        """)
        code, out = self.fx.run()
        self.assertEqual(code, 0, out)

    def test_a_table_only_in_the_flat_bag_is_reported(self):
        """VIOLATOR. `supabase db push` would never create it. This is the real
        class -- `advertisements` and `council_deliberations` are live instances
        the old gate never reported."""
        self.fx.write_flat_sql("schema.sql", """
            CREATE TABLE IF NOT EXISTS public.never_deploys (
              id uuid PRIMARY KEY
            );
        """)
        self.fx.write_migration_sql("0001_schema.sql", """
            CREATE TABLE IF NOT EXISTS public.something_else (
              id uuid PRIMARY KEY
            );
        """)
        code, out = self.fx.run()
        self.assertEqual(code, 1, out)
        self.assertIn("never_deploys", out)
        self.assertIn("would never deploy", out)

    def test_a_column_added_only_in_the_flat_bag_is_reported(self):
        self.fx.write_flat_sql("schema.sql", """
            CREATE TABLE IF NOT EXISTS public.profiles (id uuid PRIMARY KEY);
            ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
        """)
        self.fx.write_migration_sql("0001_schema.sql", """
            CREATE TABLE IF NOT EXISTS public.profiles (id uuid PRIMARY KEY);
        """)
        code, out = self.fx.run()
        self.assertEqual(code, 1, out)
        self.assertIn("email", out)

    def test_an_unrelated_alter_no_longer_hides_a_missing_column(self):
        """THE STRICTENING. The old form was `if flat_cols and not mig_cols`, so
        ANY ADD COLUMN in migrations/ cleared the whole table -- here `nickname`
        would have masked the genuinely missing `email`."""
        self.fx.write_flat_sql("schema.sql", """
            CREATE TABLE IF NOT EXISTS public.profiles (id uuid PRIMARY KEY);
            ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
        """)
        self.fx.write_migration_sql("0001_schema.sql", """
            CREATE TABLE IF NOT EXISTS public.profiles (id uuid PRIMARY KEY);
            ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nickname text;
        """)
        code, out = self.fx.run()
        self.assertEqual(code, 1, out)
        self.assertIn("email", out)

    def test_a_column_declared_inline_in_migrations_counts_as_deployed(self):
        """A column migrations/ carries in the CREATE body ships just as surely
        as one added by a later ALTER, so it must not be reported missing."""
        self.fx.write_flat_sql("schema.sql", """
            CREATE TABLE IF NOT EXISTS public.profiles (id uuid PRIMARY KEY);
            ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
        """)
        self.fx.write_migration_sql("0001_schema.sql", """
            CREATE TABLE IF NOT EXISTS public.profiles (
              id uuid PRIMARY KEY,
              email text
            );
        """)
        code, out = self.fx.run()
        self.assertEqual(code, 0, out)


if __name__ == "__main__":
    unittest.main()
