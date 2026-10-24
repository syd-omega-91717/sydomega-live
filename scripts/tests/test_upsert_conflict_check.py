#!/usr/bin/env python3
"""Regression tests for scripts/upsert-conflict-check.py's unique-key parser.

The gate read only the flat supabase/*.sql bag and skipped every *named* unique
constraint, so it reported courses.html's academy_progress upsert as 42P10 while
both live and migration 20260921010709 (`ALTER TABLE ... ADD CONSTRAINT ...
UNIQUE (enrollment_id, lesson_id)`) had the key (2026-10-12). Each test plants a
real violator first, so a parser that recognises everything cannot pass.

Run: python3 -m unittest scripts/tests/test_upsert_conflict_check.py -v
"""
import os
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PAGE = "<script>sb.from('progress').upsert({a:1,b:2},{onConflict:'a,b'});</script>"


class UpsertConflictKeys(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.mkdtemp(prefix='omega-upsert-')
        os.makedirs(os.path.join(self.dir, 'scripts'))
        os.makedirs(os.path.join(self.dir, 'supabase', 'migrations'))
        for f in ('upsert-conflict-check.py', 'schema-dictionary.py'):
            shutil.copy(os.path.join(ROOT, 'scripts', f), os.path.join(self.dir, 'scripts', f))
        with open(os.path.join(self.dir, 'page.html'), 'w') as fh:
            fh.write(PAGE)
        self.sql('supabase/base.sql', 'create table if not exists public.progress (id uuid primary key, a int, b int);')

    def tearDown(self):
        shutil.rmtree(self.dir, ignore_errors=True)

    def sql(self, rel, text):
        with open(os.path.join(self.dir, rel), 'w') as fh:
            fh.write(text)

    def run_gate(self):
        return subprocess.run([sys.executable, os.path.join(self.dir, 'scripts', 'upsert-conflict-check.py')],
                              capture_output=True, text=True, stdin=subprocess.DEVNULL).stdout

    def test_control_missing_key_is_reported(self):
        """PLANTED POSITIVE: no unique key on (a, b) anywhere -> 42P10."""
        self.assertIn('42P10', self.run_gate())

    def test_alter_table_add_constraint_in_migrations_is_recognised(self):
        self.sql('supabase/migrations/20260101000000_k.sql',
                 'alter table public.progress\n  add constraint progress_ab_uk unique (a, b);')
        self.assertNotIn('42P10', self.run_gate())

    def test_named_constraint_inside_create_table_is_recognised(self):
        self.sql('supabase/base.sql', 'create table if not exists public.progress '
                 '(id uuid primary key, a int, b int, constraint progress_ab_uk unique (a, b));')
        self.assertNotIn('42P10', self.run_gate())

    def test_a_key_on_other_columns_still_reports(self):
        self.sql('supabase/migrations/20260101000000_k.sql',
                 'alter table public.progress add constraint progress_a_uk unique (a);')
        self.assertIn('42P10', self.run_gate())


FN_SQL = ('create table if not exists public.flags (id uuid primary key, member_id uuid, '
          'feature_id text, enabled boolean, constraint flags_mf_uk unique (member_id, feature_id));')
FN_BAD = ('const { error } = await supabase.from("flags").upsert({\n'
          '  member_id: memberId,\n  feature_id: featureId,\n  enabled: true,\n});\n')
FN_GOOD = ('const { error } = await supabase.from("flags").upsert({\n'
           '  member_id: memberId,\n  feature_id: featureId,\n  enabled: true,\n'
           '}, { onConflict: "member_id,feature_id" });\n')


class UpsertConflictEdgeFunctions(unittest.TestCase):
    """Edge Functions were out of scope, and the gate exited 0 on findings
    although ci.yml runs it as blocking. product-orchestrator's flag upsert
    (no onConflict, UNIQUE(member_id, feature_id)) passed both ways (2026-10-17)."""

    def setUp(self):
        self.dir = tempfile.mkdtemp(prefix='omega-upsert-fn-')
        os.makedirs(os.path.join(self.dir, 'scripts'))
        os.makedirs(os.path.join(self.dir, 'supabase', 'migrations'))
        os.makedirs(os.path.join(self.dir, 'supabase', 'functions', 'agent'))
        for f in ('upsert-conflict-check.py', 'schema-dictionary.py'):
            shutil.copy(os.path.join(ROOT, 'scripts', f), os.path.join(self.dir, 'scripts', f))
        with open(os.path.join(self.dir, 'supabase', 'base.sql'), 'w') as fh:
            fh.write(FN_SQL)

    def tearDown(self):
        shutil.rmtree(self.dir, ignore_errors=True)

    def run_fn(self, src):
        with open(os.path.join(self.dir, 'supabase', 'functions', 'agent', 'index.ts'), 'w') as fh:
            fh.write(src)
        return subprocess.run([sys.executable, os.path.join(self.dir, 'scripts', 'upsert-conflict-check.py')],
                              capture_output=True, text=True, stdin=subprocess.DEVNULL)

    def test_edge_function_upsert_without_on_conflict_fails_the_gate(self):
        r = self.run_fn(FN_BAD)
        self.assertEqual(r.returncode, 1, r.stdout)
        self.assertIn('supabase/functions/agent/index.ts', r.stdout)
        self.assertIn('23505', r.stdout)

    def test_edge_function_upsert_naming_the_unique_key_passes(self):
        r = self.run_fn(FN_GOOD)
        self.assertEqual(r.returncode, 0, r.stdout)
        self.assertNotIn('23505', r.stdout)


if __name__ == '__main__':
    unittest.main()
