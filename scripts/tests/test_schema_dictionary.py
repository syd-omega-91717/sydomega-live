#!/usr/bin/env python3
"""Tests for scripts/schema-dictionary.py"""

import os
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SCRIPT_SRC = os.path.join(ROOT, "scripts", "schema-dictionary.py")


def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)


class SchemaFixture:
    """Fixture for testing schema-dictionary.py"""

    def __init__(self):
        self.dir = tempfile.mkdtemp(prefix="schema-test-")
        os.makedirs(os.path.join(self.dir, "scripts"), exist_ok=True)
        shutil.copy(SCRIPT_SRC, os.path.join(self.dir, "scripts", "schema-dictionary.py"))

    def write_sql(self, filename, content):
        write_file(os.path.join(self.dir, "supabase", filename), content)

    def write_html(self, filename, content):
        write_file(os.path.join(self.dir, filename), content)

    def run(self):
        r = subprocess.run(
            [sys.executable, os.path.join("scripts", "schema-dictionary.py")],
            cwd=self.dir,
            capture_output=True,
            text=True,
        )
        return r.returncode, r.stdout + r.stderr

    def cleanup(self):
        shutil.rmtree(self.dir, ignore_errors=True)


class SchemaDictionaryTests(unittest.TestCase):
    def setUp(self):
        self.fx = SchemaFixture()

    def tearDown(self):
        self.fx.cleanup()

    def test_valid_schema_passes(self):
        self.fx.write_sql(
            "schema.sql",
            """
            CREATE TABLE IF NOT EXISTS public.profiles (
              id uuid PRIMARY KEY,
              email text,
              name text
            );
            """,
        )
        self.fx.write_html(
            "page.html",
            "<script>sb.from('profiles').select('id,email,name');</script>",
        )
        code, out = self.fx.run()
        self.assertEqual(code, 0)
        self.assertIn("OK", out)

    def test_missing_column_detected(self):
        self.fx.write_sql(
            "schema.sql",
            """
            CREATE TABLE IF NOT EXISTS public.profiles (
              id uuid PRIMARY KEY,
              email text
            );
            """,
        )
        self.fx.write_html(
            "page.html",
            "<script>sb.from('profiles').select('id,email,nonexistent');</script>",
        )
        code, out = self.fx.run()
        self.assertEqual(code, 1)
        self.assertIn("nonexistent", out)
        self.assertIn("column does not exist", out)

    def test_alter_table_columns_recognized(self):
        self.fx.write_sql(
            "base.sql",
            """
            CREATE TABLE IF NOT EXISTS public.profiles (
              id uuid PRIMARY KEY
            );
            """,
        )
        self.fx.write_sql(
            "extend.sql",
            """
            ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
            """,
        )
        self.fx.write_html(
            "page.html",
            "<script>sb.from('profiles').select('id,email');</script>",
        )
        code, out = self.fx.run()
        self.assertEqual(code, 0)
        self.assertIn("OK", out)

    def test_insert_validation(self):
        self.fx.write_sql(
            "schema.sql",
            """
            CREATE TABLE IF NOT EXISTS public.profiles (
              id uuid PRIMARY KEY,
              email text
            );
            """,
        )
        self.fx.write_html(
            "page.html",
            """
            <script>
              sb.from('profiles').insert({
                id: 'uuid',
                email: 'test@example.com',
                bad_column: 'value'
              });
            </script>
            """,
        )
        code, out = self.fx.run()
        self.assertEqual(code, 1)
        self.assertIn("bad_column", out)


if __name__ == "__main__":
    unittest.main()
