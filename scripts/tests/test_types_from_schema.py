#!/usr/bin/env python3
"""Tests for scripts/types-from-schema.py"""

import os
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SCRIPT_SRC = os.path.join(ROOT, "scripts", "types-from-schema.py")


def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)


class TypesFromSchemaFixture:
    """Fixture for testing types-from-schema.py"""

    def __init__(self):
        self.dir = tempfile.mkdtemp(prefix="types-test-")
        os.makedirs(os.path.join(self.dir, "scripts"), exist_ok=True)
        os.makedirs(os.path.join(self.dir, "supabase"), exist_ok=True)
        os.makedirs(os.path.join(self.dir, "types"), exist_ok=True)
        shutil.copy(SCRIPT_SRC, os.path.join(self.dir, "scripts", "types-from-schema.py"))

    def write_sql(self, filename, content):
        write_file(os.path.join(self.dir, "supabase", filename), content)

    def read_types(self):
        types_file = os.path.join(self.dir, "types", "database.types.ts")
        if os.path.exists(types_file):
            with open(types_file, "r", encoding="utf-8") as f:
                return f.read()
        return None

    def run(self):
        r = subprocess.run(
            [sys.executable, os.path.join("scripts", "types-from-schema.py")],
            cwd=self.dir,
            capture_output=True,
            text=True,
        )
        return r.returncode, r.stdout + r.stderr

    def cleanup(self):
        shutil.rmtree(self.dir, ignore_errors=True)


class TypesFromSchemaTests(unittest.TestCase):
    def setUp(self):
        self.fx = TypesFromSchemaFixture()

    def tearDown(self):
        self.fx.cleanup()

    def test_generates_types_from_schema(self):
        self.fx.write_sql(
            "schema.sql",
            """
            CREATE TABLE IF NOT EXISTS public.profiles (
              id uuid PRIMARY KEY,
              email text,
              age int
            );
            """,
        )
        code, out = self.fx.run()
        self.assertEqual(code, 0)
        self.assertIn("OK", out)
        self.assertIn("table interfaces", out)

    def test_generated_types_have_correct_format(self):
        self.fx.write_sql(
            "schema.sql",
            """
            CREATE TABLE IF NOT EXISTS public.users (
              id uuid PRIMARY KEY,
              name text NOT NULL,
              email text,
              created_at timestamp
            );
            """,
        )
        code, out = self.fx.run()
        self.assertEqual(code, 0)

        types_content = self.fx.read_types()
        self.assertIsNotNone(types_content)
        self.assertIn("export interface Users", types_content)
        self.assertIn("id: string", types_content)
        self.assertIn("name: string", types_content)
        self.assertIn("email: string | null", types_content)

    def test_converts_column_names_to_camel_case(self):
        self.fx.write_sql(
            "schema.sql",
            """
            CREATE TABLE IF NOT EXISTS public.user_profiles (
              user_id uuid PRIMARY KEY,
              first_name text,
              last_name text,
              created_at timestamp
            );
            """,
        )
        code, out = self.fx.run()
        self.assertEqual(code, 0)

        types_content = self.fx.read_types()
        self.assertIsNotNone(types_content)
        self.assertIn("userId: string", types_content)
        self.assertIn("firstName: string", types_content)
        self.assertIn("lastName: string", types_content)
        self.assertIn("createdAt: string", types_content)

    def test_handles_nullable_columns(self):
        self.fx.write_sql(
            "schema.sql",
            """
            CREATE TABLE IF NOT EXISTS public.posts (
              id uuid PRIMARY KEY,
              title text NOT NULL,
              description text,
              published boolean
            );
            """,
        )
        code, out = self.fx.run()
        self.assertEqual(code, 0)

        types_content = self.fx.read_types()
        self.assertIsNotNone(types_content)
        self.assertIn("title: string", types_content)
        self.assertIn("description: string | null", types_content)
        self.assertIn("published: boolean | null", types_content)


if __name__ == "__main__":
    unittest.main()
