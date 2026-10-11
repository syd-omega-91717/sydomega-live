#!/usr/bin/env python3
"""Regression tests for scripts/omega-schema-evidence.py.

Each case is a real way this checker was wrong on 2026-10-04:
  - snapshot keys became "public.x" while migration names are bare, so the
    overlap read 0 and all 273 live tables read "live-only" -- under PASS;
  - prose in SQL comments ("-- create table if ... above") yielded relations
    named "--", "above", "as", "if";
  - a naive regex pass over string literals let an apostrophe in a comment
    swallow real DDL (40 tables vanished);
  - a table created and later dropped still counted as declared;
  - "ALTER PUBLICATION ... DROP TABLE x" was read as dropping x.

Run: python3 -m unittest scripts/tests/test_omega_schema_evidence.py -v
"""

import importlib.util
import pathlib
import tempfile
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location(
    "omega_schema_evidence", ROOT / "scripts" / "omega-schema-evidence.py")
MOD = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MOD)


class MigrationTablesTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.dir = pathlib.Path(self.tmp.name)
        self._orig = MOD.MIGRATIONS
        MOD.MIGRATIONS = self.dir

    def tearDown(self):
        MOD.MIGRATIONS = self._orig
        self.tmp.cleanup()

    def write(self, name, sql):
        (self.dir / name).write_text(sql, encoding="utf-8")

    def test_comment_and_literal_prose_is_not_a_table(self):
        self.write("0001.sql", "-- create table if not exists above the line\n"
                               "/* create table alone */\n"
                               "select 'CREATE TABLE AS';\n"
                               "create table public.real_one (id int);\n")
        self.assertEqual(MOD.migration_tables(), {"real_one"})

    def test_apostrophe_in_comment_does_not_swallow_ddl(self):
        self.write("0001.sql", "-- don't forget\ncreate table public.kept (id int);\n"
                               "-- it's fine\ncreate table public.also_kept (id int);\n")
        self.assertEqual(MOD.migration_tables(), {"kept", "also_kept"})

    def test_ddl_inside_a_do_block_counts(self):
        self.write("0001.sql", "do $$ begin create table if not exists public.in_do (id int); end $$;")
        self.assertEqual(MOD.migration_tables(), {"in_do"})

    def test_a_later_drop_removes_the_table(self):
        self.write("0001.sql", "create table public.temp_t (id int);")
        self.write("0002.sql", "drop table if exists public.temp_t cascade;")
        self.assertEqual(MOD.migration_tables(), set())

    def test_publication_drop_table_is_not_a_drop(self):
        self.write("0001.sql", "create table public.presence (id int);")
        self.write("0002.sql", "alter publication supabase_realtime drop table public.presence;")
        self.assertEqual(MOD.migration_tables(), {"presence"})

    def test_schema_qualified_and_bare_names_normalise_alike(self):
        self.assertEqual(MOD.unquote("public.Profiles"), "profiles")
        self.assertEqual(MOD.unquote('"profiles"'), "profiles")


if __name__ == "__main__":
    unittest.main()
