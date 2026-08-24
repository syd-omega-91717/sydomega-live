#!/usr/bin/env python3
"""
Regression tests for scripts/evidence-audit.py — the Ω evidence matrix
generator.

Same black-box shape as test_audit.py: the script resolves its own ROOT from
`__file__` and chdir()s there, so these tests build a throwaway repo fixture,
copy the real script into <fixture>/scripts/, and run it as a subprocess.

The cases here are the ones that were actually wrong in the first working
version of the scanner, not hypotheticals:

  · SQL comments were matched as DDL, so the words `above`, `alone`, `bodies`,
    `for` and `is` were reported as tables defined in more than one file.
  · Supabase Auth calls were not counted as backend contact, so reset.html --
    a page that is entirely an auth operation, and complete -- was classified
    as having no backend call at all.
  · A view was not counted as a relation, so a page reading `top_pages` (a
    CREATE VIEW) looked like it referenced an undefined table.

Run: python3 -m unittest scripts/tests/test_evidence_audit.py -v
"""

import os
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SCRIPT = os.path.join(ROOT, 'scripts', 'evidence-audit.py')


class EvidenceAuditFixture(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.mkdtemp(prefix='omega-evidence-')
        os.makedirs(os.path.join(self.dir, 'scripts'))
        os.makedirs(os.path.join(self.dir, 'supabase'))
        os.makedirs(os.path.join(self.dir, 'supabase', 'functions'))
        shutil.copy(SCRIPT, os.path.join(self.dir, 'scripts', 'evidence-audit.py'))

    def tearDown(self):
        shutil.rmtree(self.dir, ignore_errors=True)

    def write(self, rel, text):
        path = os.path.join(self.dir, rel)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, 'w') as fh:
            fh.write(text)

    def run_audit(self, *args):
        proc = subprocess.run(
            [sys.executable, os.path.join(self.dir, 'scripts', 'evidence-audit.py')]
            + list(args),
            capture_output=True, text=True, cwd=self.dir)
        return proc

    def report(self):
        with open(os.path.join(self.dir, 'EVIDENCE_MATRIX.md')) as fh:
            return fh.read()


class TestCommentStripping(EvidenceAuditFixture):
    def test_prose_in_sql_comments_is_not_a_table(self):
        """`-- create table for X` must not register a table named `for`."""
        self.write('nav.js', "var PS={'alpha':'X'};")
        self.write('alpha.html', '<html></html>')
        self.write('supabase/a.sql',
                   '-- create table for the thing described above\n'
                   'CREATE TABLE IF NOT EXISTS public.real_one (id uuid);\n')
        self.write('supabase/b.sql',
                   '/* create table for the same thing, described above */\n'
                   'CREATE TABLE IF NOT EXISTS public.real_one (id uuid);\n')
        out = self.run_audit().stdout
        # real_one is genuinely in both files; `for` and `above` are not tables.
        self.assertIn('tables defined in >1 root SQL file: 1', out)
        body = self.report()
        self.assertIn('`real_one`', body)
        for word in ('| `for` |', '| `above` |'):
            self.assertNotIn(word, body)


class TestAuthIsBackendContact(EvidenceAuditFixture):
    def test_auth_only_page_reports_its_auth_calls(self):
        """A page whose only backend contact is auth must say so, not read as inert."""
        self.write('nav.js', "var PS={'resetish':'X'};")
        self.write('resetish.html',
                   "<script>sb.auth.resetPasswordForEmail(e);"
                   "sb.auth.updateUser({password:p});</script>")
        self.write('supabase/a.sql', 'CREATE TABLE public.t (id uuid);')
        self.run_audit()
        body = self.report()
        self.assertIn('2 auth calls', body)

    def test_auth_does_not_promote_a_device_local_page(self):
        """Signing a member in is not persisting their data."""
        self.write('nav.js', "var PS={'localish':'X'};")
        self.write('localish.html',
                   "<script>sb.auth.getSession();"
                   "localStorage.setItem('k',v);</script>")
        self.write('supabase/a.sql', 'CREATE TABLE public.t (id uuid);')
        out = self.run_audit().stdout
        self.assertIn('LOCAL_ONLY     1', out)
        self.assertIn('signs the member in', self.report())


class TestViewsCountAsRelations(EvidenceAuditFixture):
    def test_page_reading_a_view_is_not_broken(self):
        self.write('nav.js', "var PS={'dash':'X'};")
        self.write('dash.html', "<script>sb.from('top_pages').select('page');</script>")
        self.write('supabase/a.sql',
                   'CREATE OR REPLACE VIEW public.top_pages AS SELECT 1;')
        out = self.run_audit().stdout
        self.assertIn('BROKEN         0', out)


class TestBrokenDetection(EvidenceAuditFixture):
    def test_undeclared_table_is_broken_and_strict_exits_nonzero(self):
        self.write('nav.js', "var PS={'vaultish':'X'};")
        self.write('vaultish.html',
                   "<script>sb.from('wallet_balances').select('*');</script>")
        self.write('supabase/a.sql', 'CREATE TABLE public.other (id uuid);')
        out = self.run_audit().stdout
        self.assertIn('BROKEN         1', out)
        self.assertEqual(self.run_audit('--strict').returncode, 1)
        self.assertEqual(self.run_audit().returncode, 0,
                         'default mode must stay report-only so CI is not gated '
                         'on a judgement call')


class TestReachability(EvidenceAuditFixture):
    def test_public_pages_are_not_unreachable(self):
        self.write('nav.js', "var PS={};")
        for slug in ('index', 'enter', 'terms', 'pending', '404', 'offline',
                     'account', 'reset'):
            self.write(slug + '.html', '<html></html>')
        out = self.run_audit().stdout
        self.assertIn('UNREACHABLE    0', out)

    def test_orphan_page_is_unreachable(self):
        self.write('nav.js', "var PS={};")
        self.write('orphan.html', '<html></html>')
        out = self.run_audit().stdout
        self.assertIn('UNREACHABLE    1', out)


if __name__ == '__main__':
    unittest.main()
