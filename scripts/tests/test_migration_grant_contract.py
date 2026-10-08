#!/usr/bin/env python3
"""Regression tests for scripts/migration-grant-contract.py.

On 2026-10-06 eight tables shipped with member policies and no GRANT, so every
member query failed 42501 (CLAUDE.md 8.1 class 6c). Run against that day's
pre-fix migrations, the gate names exactly those eight. Here each shape gets a
planted fixture, and the clean case is asserted only alongside a failing one.

Run: python3 -m unittest scripts/tests/test_migration_grant_contract.py -v
"""
import importlib.util
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
SCRIPT = ROOT / 'scripts' / 'migration-grant-contract.py'

spec = importlib.util.spec_from_file_location('grant_contract', SCRIPT)
gc = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gc)

TABLE = "create table if not exists public.widgets (id uuid primary key, owner_id uuid);\n"
RLS = "alter table public.widgets enable row level security;\n"
POLICY = ("create policy widgets_owner on public.widgets for all to authenticated "
          "using ((select auth.uid())=owner_id) with check ((select auth.uid())=owner_id);\n")


class Fixture(unittest.TestCase):
    def setUp(self):
        self.dir = Path(tempfile.mkdtemp(prefix='omega-grant-'))

    def tearDown(self):
        shutil.rmtree(str(self.dir), ignore_errors=True)

    def write(self, name, sql):
        (self.dir / name).write_text(sql, encoding='utf-8')

    def tables(self):
        return [t for t, _w, _r in gc.scan(self.dir)]

    def test_policy_without_grant_is_found(self):
        self.write('20261006134235_widgets.sql', TABLE + RLS + POLICY)
        self.assertEqual(self.tables(), ['widgets'])

    def test_grant_in_a_later_migration_clears_it(self):
        self.write('20261006134235_widgets.sql', TABLE + RLS + POLICY)
        self.assertEqual(self.tables(), ['widgets'])
        self.write('20261006170056_widgets_grants.sql',
                   'grant select, insert on public.widgets to authenticated;\n')
        self.assertEqual(self.tables(), [])

    def test_column_and_multi_table_grants_count(self):
        self.write('20261006134235_widgets.sql', TABLE + RLS + POLICY +
                   TABLE.replace('widgets', 'gadgets') +
                   POLICY.replace('widgets', 'gadgets'))
        self.assertEqual(sorted(self.tables()), ['gadgets', 'widgets'])
        self.write('20261006170056_g.sql',
                   'grant select (id) on public.widgets, public.gadgets to authenticated;\n')
        self.assertEqual(self.tables(), [])

    def test_public_policy_with_authenticated_grant_is_not_a_defect(self):
        # No TO clause = PUBLIC; anon deliberately ungranted is the normal shape.
        self.write('20261006134235_widgets.sql', TABLE + RLS +
                   'create policy w on public.widgets for select using (true);\n'
                   'grant select on public.widgets to authenticated;\n')
        self.assertEqual(self.tables(), [])

    def test_service_only_table_is_out_of_scope(self):
        self.write('20261006134235_widgets.sql', TABLE + RLS)
        self.assertEqual(self.tables(), [])

    def test_tables_before_the_default_revoke_are_out_of_scope(self):
        self.write('20260901000000_widgets.sql', TABLE + RLS + POLICY)
        self.assertEqual(self.tables(), [])
        self.write('20260903015535_revoke.sql', '')
        self.write('20260904000000_more.sql',
                   TABLE.replace('widgets', 'gadgets') + POLICY.replace('widgets', 'gadgets'))
        self.assertEqual(self.tables(), ['gadgets'])

    def test_comments_and_string_literals_cannot_fake_a_grant(self):
        self.write('20261006134235_widgets.sql', TABLE + RLS + POLICY +
                   '-- grant select on public.widgets to authenticated;\n'
                   "select 'grant select on public.widgets to authenticated;';\n")
        self.assertEqual(self.tables(), ['widgets'])


class Repository(unittest.TestCase):
    def test_repository_passes(self):
        r = subprocess.run([sys.executable, str(SCRIPT)], cwd=str(ROOT),
                           capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)

    def test_known_baseline_matches_findings_exactly(self):
        found = {t for t, _w, _r in gc.scan(gc.MIGRATIONS)}
        self.assertEqual(found, set(gc.KNOWN))

    def test_retired_agent_action_proposals_is_not_a_grant_finding(self):
        self.assertNotIn('omega_agent_action_proposals', gc.KNOWN)
        cleanup = gc.MIGRATIONS / '20260929115306_omega_agent_operations_proposal_cleanup_20260929.sql'
        self.assertTrue(cleanup.exists())
        self.assertIn('drop table if exists public.omega_agent_action_proposals cascade;', cleanup.read_text(encoding='utf-8'))


if __name__ == '__main__':
    unittest.main()
