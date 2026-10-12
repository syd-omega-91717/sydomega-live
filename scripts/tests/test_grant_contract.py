#!/usr/bin/env python3
"""Regression tests for scripts/grant-contract.py.

Every rule is proven able to FAIL with a planted violator before its clean case
is trusted (CLAUDE.md 8.4: verify a "0 findings" result is real). The first case
is the bug that motivated the gate: account.html's sign-up upsert, 2026-10-12.

Run: python3 -m unittest scripts/tests/test_grant_contract.py -v
"""
import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SCRIPT = os.path.join(ROOT, 'scripts', 'grant-contract.py')

GRANTS = {
    'profiles': {'table': 'S---', 'columns': {'UPDATE': ['birth_date', 'sign', 'bio']}},
    'questions': {'table': '-IUD', 'columns': {'SELECT': ['id', 'question']}},
    'server_only': {'table': '----'},
    'notes': {'table': 'SIU-'},
    'logs': {'table': 'SI--'},
}


class GrantContract(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.mkdtemp(prefix='omega-grants-')
        os.mkdir(os.path.join(self.dir, 'supabase'))
        with open(os.path.join(self.dir, 'supabase', 'live-grants.json'), 'w') as fh:
            json.dump({'relations': GRANTS}, fh)

    def tearDown(self):
        shutil.rmtree(self.dir, ignore_errors=True)

    def run_with(self, js, known='none'):
        with open(os.path.join(self.dir, 'page.js'), 'w') as fh:
            fh.write(js)
        env = dict(os.environ, OMEGA_ROOT=self.dir)
        if known:
            env['OMEGA_GRANT_KNOWN'] = known
        else:
            env.pop('OMEGA_GRANT_KNOWN', None)
        return subprocess.run([sys.executable, SCRIPT], capture_output=True, text=True, env=env,
                              stdin=subprocess.DEVNULL)

    def assertFails(self, js, *needles):
        r = self.run_with(js)
        self.assertEqual(r.returncode, 1, r.stdout)
        for n in needles:
            self.assertIn(n, r.stdout)

    def assertPasses(self, js):
        r = self.run_with(js)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)

    # -- the motivating bug, and its fix
    def test_signup_upsert_with_ungranted_columns_fails(self):
        self.assertFails("sb.from('profiles').upsert({id:u,email:e,sign:s,birth_date:d},{onConflict:'id'});",
                         'no INSERT grant', 'email')

    def test_update_of_granted_columns_passes(self):
        self.assertPasses("sb.from('profiles').update({ birth_date: d }).eq('id', u).select('sign');")

    def test_update_naming_one_ungranted_column_fails(self):
        self.assertFails("sb.from('profiles').update({birth_date:d, access_approved:true}).eq('id',u);",
                         'access_approved')

    def test_update_with_non_literal_payload_on_column_grant_fails(self):
        self.assertFails("sb.from('profiles').update(payload).eq('id',u);", 'not a literal')

    # -- selects against a column-level grant
    def test_select_star_on_column_grant_fails(self):
        self.assertFails("sb.from('questions').select('*').eq('id',1);", 'not a literal')

    def test_select_granted_columns_passes(self):
        self.assertPasses("sb.from('questions').select('id,question').eq('id',1);")

    def test_select_one_ungranted_column_fails(self):
        self.assertFails("sb.from('questions').select('id,question,correct_answer');", 'correct_answer')

    # -- table-level privileges
    def test_read_of_server_only_table_fails(self):
        self.assertFails("sb.from('server_only').select('id');", 'no SELECT grant')

    def test_delete_without_grant_fails(self):
        self.assertFails("sb.from('notes').delete().eq('id',1);", 'no DELETE grant')

    def test_upsert_needs_update_too(self):
        self.assertFails("sb.from('logs').upsert({id:1});", 'no UPDATE grant')

    def test_table_level_grants_pass(self):
        self.assertPasses("sb.from('notes').select('*'); sb.from('notes').insert({a:1}); sb.from('logs').insert([{a:1}]);")

    # -- what must not count
    def test_comment_and_storage_and_unknown_tables_are_ignored(self):
        self.assertPasses("// sb.from('server_only').select('id');\n"
                          "/* sb.from('server_only').delete(); */\n"
                          "sb.storage.from('server_only').upload(p, f);\n"
                          "sb.from('not_in_snapshot').delete();")

    # -- the allowlist cannot outlive its bug
    def test_known_entry_without_a_matching_call_is_stale(self):
        r = self.run_with("sb.from('notes').select('*');", known=None)
        self.assertEqual(r.returncode, 1, r.stdout)
        self.assertIn('STALE KNOWN entry', r.stdout)

    def test_the_repository_itself_passes(self):
        r = subprocess.run([sys.executable, SCRIPT], capture_output=True, text=True, stdin=subprocess.DEVNULL,
                           env={k: v for k, v in os.environ.items() if k not in ('OMEGA_ROOT', 'OMEGA_GRANT_KNOWN')})
        self.assertEqual(r.returncode, 0, r.stdout)


if __name__ == '__main__':
    unittest.main()
