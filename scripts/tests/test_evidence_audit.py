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
        with open(path, 'w', encoding='utf-8') as fh:
            fh.write(text)

    def run_audit(self, *args, **kwargs):
        env = dict(os.environ)
        env.update(kwargs.pop('env', {}))
        # When a test forces the child's stdout encoding to reproduce the
        # Windows runner, decode with that same codec. Otherwise the parent
        # decodes cp1252 bytes as UTF-8 and dies on the first `§` -- a harness
        # artifact that looks exactly like the script bug under test.
        forced = env.get('PYTHONIOENCODING')
        proc = subprocess.run(
            [sys.executable, os.path.join(self.dir, 'scripts', 'evidence-audit.py')]
            + list(args),
            capture_output=True, text=True, cwd=self.dir, env=env,
            encoding=forced, errors='replace' if forced else None, **kwargs)
        return proc

    def audit_stdout(self, *args, **kwargs):
        """run_audit(), but prove the child actually ran before asserting on it.

        A crashed child yields empty stdout, and `assertIn('UNREACHABLE 1', '')`
        reports only that the needle is missing -- it says nothing about the
        traceback that caused it. That is exactly how a Windows-runner failure
        read: six assertions all reporting `not found in \'\'`, with the real
        cause only visible by opening the raw job log. Surfacing the exit code
        and stderr here turns the next such failure into a one-line diagnosis.

        Only for calls whose stdout is asserted on; the deliberate non-zero
        cases (--strict) keep using run_audit() and check returncode directly.
        """
        proc = self.run_audit(*args, **kwargs)
        if proc.returncode != 0:
            self.fail(
                'evidence-audit.py exited {} (expected 0), so its stdout is '
                'empty and every assertion below would be misleading.\n'
                '--- stderr ---\n{}\n--- stdout ---\n{}'.format(
                    proc.returncode, proc.stderr or '(empty)',
                    proc.stdout or '(empty)'))
        return proc.stdout

    def report(self):
        with open(os.path.join(self.dir, 'EVIDENCE_MATRIX.md'),
                  encoding='utf-8') as fh:
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
        out = self.audit_stdout()
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
        out = self.audit_stdout()
        self.assertIn('LOCAL_ONLY     1', out)
        self.assertIn('signs the member in', self.report())


class TestViewsCountAsRelations(EvidenceAuditFixture):
    def test_page_reading_a_view_is_not_broken(self):
        self.write('nav.js', "var PS={'dash':'X'};")
        self.write('dash.html', "<script>sb.from('top_pages').select('page');</script>")
        self.write('supabase/a.sql',
                   'CREATE OR REPLACE VIEW public.top_pages AS SELECT 1;')
        out = self.audit_stdout()
        self.assertIn('BROKEN         0', out)


class TestBrokenDetection(EvidenceAuditFixture):
    def test_undeclared_table_is_broken_and_strict_exits_nonzero(self):
        self.write('nav.js', "var PS={'vaultish':'X'};")
        self.write('vaultish.html',
                   "<script>sb.from('wallet_balances').select('*');</script>")
        self.write('supabase/a.sql', 'CREATE TABLE public.other (id uuid);')
        out = self.audit_stdout()
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
        out = self.audit_stdout()
        self.assertIn('UNREACHABLE    0', out)

    def test_orphan_page_is_unreachable(self):
        self.write('nav.js', "var PS={};")
        self.write('orphan.html', '<html></html>')
        out = self.audit_stdout()
        self.assertIn('UNREACHABLE    1', out)


class TestNonUTF8Console(EvidenceAuditFixture):
    """The failure that made every other test in this file red on CI.

    CI runs on a self-hosted Windows runner with `shell: cmd`, where Python
    encodes stdout as cp1252. The script's banner is `Ω MASTER EVIDENCE AUDIT`
    and cp1252 cannot encode U+03A9, so `print()` raised UnicodeEncodeError
    before any classification happened: exit 1, empty stdout, no
    EVIDENCE_MATRIX.md. Every assertion here then failed as `not found in ''`,
    which reads like a broken scanner rather than a broken pipe encoding.

    PYTHONIOENCODING reproduces that on any platform. Both assertions fail
    against the pre-fix script -- checked by reverting it and re-running.
    """

    def _fixture(self):
        self.write('nav.js', "var PS={'alpha':'X'};")
        self.write('alpha.html', '<html></html>')
        self.write('supabase/a.sql', 'CREATE TABLE public.t (id uuid);')

    def test_banner_does_not_crash_on_a_cp1252_stdout(self):
        self._fixture()
        proc = self.run_audit(env={'PYTHONIOENCODING': 'cp1252'})
        self.assertEqual(proc.returncode, 0, proc.stderr)
        self.assertNotIn('UnicodeEncodeError', proc.stderr)
        self.assertIn('pages total', proc.stdout)

    def test_report_is_written_as_utf8_regardless_of_locale(self):
        """The matrix carries Ω too, so the write must pin UTF-8, not locale."""
        self._fixture()
        proc = self.run_audit(env={'PYTHONIOENCODING': 'cp1252'})
        self.assertEqual(proc.returncode, 0, proc.stderr)
        path = os.path.join(self.dir, 'EVIDENCE_MATRIX.md')
        self.assertTrue(os.path.exists(path), 'report was never written')
        with open(path, encoding='utf-8') as fh:
            self.assertIn('\u03a9 MASTER EVIDENCE MATRIX', fh.read())


class TestLiveSchemaCrossCheck(EvidenceAuditFixture):
    """The live axis: does production actually have what supabase/ declares?

    Every case here is a NEGATIVE one first. A cross-check that cannot fail is
    not a cross-check, and this repo has shipped three scanners in one session
    that reported a serene zero while being structurally incapable of finding
    anything (CLAUDE.md 8.4). So each test plants a case the scanner MUST
    catch, and the clean case is asserted only alongside them.
    """

    def _snapshot(self, tables, captured='2026-08-29'):
        import json as _json
        self.write('supabase/live-schema.json', _json.dumps({
            '_captured': captured,
            '_table_count': len(tables),
            'tables': {t: ['id'] for t in tables},
        }))

    def test_control_absent_relation_read_by_a_page_is_caught(self):
        """PLANTED POSITIVE. Declared in the bag, missing live, and queried."""
        self.write('nav.js', "var PS={'alpha':'X'};")
        self.write('alpha.html',
                   "<html><script>sb.from('ghost_table').select('*')</script></html>")
        self.write('supabase/a.sql', 'CREATE TABLE public.ghost_table (id uuid);')
        self._snapshot(['something_else'])
        out = self.audit_stdout()
        self.assertIn('absent from the live snapshot', out)
        self.assertIn('read by client code:    1', out)
        self.assertIn('ghost_table', self.report())
        self.assertIn('silent empty state', self.report())

    def test_control_gates_under_strict(self):
        """A silent empty state already shipping must fail --strict."""
        self.write('nav.js', "var PS={'alpha':'X'};")
        self.write('alpha.html',
                   "<html><script>sb.from('ghost_table').select('*')</script></html>")
        self.write('supabase/a.sql', 'CREATE TABLE public.ghost_table (id uuid);')
        self._snapshot(['something_else'])
        self.assertEqual(self.run_audit('--strict').returncode, 1)

    def test_absent_but_unread_is_reported_and_never_gates(self):
        """Declared, never applied, queried by nothing = dormant, not a failure.

        This repo ships dormant backends on purpose (CLAUDE.md 9), so this
        case must be visible in the report and must NOT fail --strict.
        """
        self.write('nav.js', "var PS={'alpha':'X'};")
        self.write('alpha.html', '<html></html>')
        self.write('supabase/a.sql', 'CREATE TABLE public.dormant_table (id uuid);')
        self._snapshot(['something_else'])
        proc = self.run_audit('--strict')
        self.assertEqual(proc.returncode, 0, proc.stderr)
        report = self.report()
        self.assertIn('declared and never applied', report)
        self.assertIn('dormant_table', report)

    def test_relation_present_live_is_not_flagged(self):
        """The clean case — asserted only because the two controls above pass."""
        self.write('nav.js', "var PS={'alpha':'X'};")
        self.write('alpha.html',
                   "<html><script>sb.from('real_table').select('*')</script></html>")
        self.write('supabase/a.sql', 'CREATE TABLE public.real_table (id uuid);')
        self._snapshot(['real_table'])
        out = self.audit_stdout()
        self.assertIn('absent from the live snapshot (2026-08-29): 0', out)
        self.assertIn('No absent relation is read by any page', self.report())

    def test_missing_snapshot_reports_not_checked_not_zero(self):
        """A missing snapshot and a clean one must not look identical.

        Reporting 0 for an axis that never ran is the exact shape of the
        stopped-static-server bug in CLAUDE.md 8.4.
        """
        self.write('nav.js', "var PS={'alpha':'X'};")
        self.write('alpha.html', '<html></html>')
        self.write('supabase/a.sql', 'CREATE TABLE public.t (id uuid);')
        out = self.audit_stdout()
        self.assertIn('NOT CHECKED', out)
        self.assertIn('not checked', self.report())

    def test_unreadable_snapshot_reports_not_checked(self):
        """Malformed JSON must degrade to NOT CHECKED, never to a clean pass."""
        self.write('nav.js', "var PS={'alpha':'X'};")
        self.write('alpha.html', '<html></html>')
        self.write('supabase/a.sql', 'CREATE TABLE public.t (id uuid);')
        self.write('supabase/live-schema.json', '{not json at all')
        out = self.audit_stdout()
        self.assertIn('NOT CHECKED', out)

    def test_capture_date_is_reported_with_the_finding(self):
        """A dated snapshot must date its own findings (CLAUDE.md 8.1 class 2)."""
        self.write('nav.js', "var PS={'alpha':'X'};")
        self.write('alpha.html', '<html></html>')
        self.write('supabase/a.sql', 'CREATE TABLE public.dormant_table (id uuid);')
        self._snapshot(['other'], captured='2024-01-15')
        out = self.audit_stdout()
        self.assertIn('2024-01-15', out)
        self.assertIn('captured **2024-01-15**', self.report())


class TestMirrorCoverage(EvidenceAuditFixture):
    """LOCAL_ONLY must not be read as "this data is lost with the cache".

    omega-member-state.js (bg.js, every page) mirrors every `omega`-prefixed
    localStorage key to public.member_state. The matrix used to assert the
    opposite as fact, and that wording nearly caused a session to rebuild
    member_state -- a table already live with correct RLS, GRANTs and a
    (user_id, key) primary key (FIXES_LOG.md 113).
    """

    def test_omega_prefixed_keys_are_reported_as_mirrored(self):
        self.write('nav.js', "var PS={'notes':'X'};")
        self.write('notes.html', "<script>localStorage.setItem('omega_notes', x)</script>")
        self.audit_stdout()
        row = self.report()
        self.assertIn('mirrored to `member_state`', row)
        self.assertNotIn('NOT `omega`-prefixed', row)

    def test_a_key_outside_the_prefix_is_flagged_not_mirrored(self):
        """THE CONTROL. Without this, a scanner that called everything mirrored
        would pass the test above and be exactly as wrong as the old wording."""
        self.write('nav.js', "var PS={'notes':'X'};")
        self.write('notes.html', "<script>localStorage.setItem('my_notes', x)</script>")
        self.audit_stdout()
        self.assertIn('NOT mirrored', self.report())

    def test_a_key_held_in_a_const_is_resolved(self):
        """journal.html writes ENC_KEY, not a literal. A literal-only scan
        reported ZERO setItem keys on such pages -- a serene zero that made
        every one of them look trivially covered."""
        self.write('nav.js', "var PS={'notes':'X'};")
        self.write('notes.html',
                   "<script>const ENC_KEY = 'omega_journal_enc';"
                   "localStorage.setItem(ENC_KEY, v)</script>")
        self.audit_stdout()
        self.assertIn('mirrored to `member_state`', self.report())

    def test_a_const_outside_the_prefix_is_still_caught(self):
        """The const path must not become a blanket pass."""
        self.write('nav.js', "var PS={'notes':'X'};")
        self.write('notes.html',
                   "<script>const K = 'journal_enc';"
                   "localStorage.setItem(K, v)</script>")
        self.audit_stdout()
        self.assertIn('NOT mirrored', self.report())

    def test_a_runtime_built_key_is_reported_unresolved_not_covered(self):
        """body.html/sleep.html/stoic.html funnel writes through save(k,v).
        Static analysis cannot see the key, and claiming coverage would be the
        same false confidence this whole class exists to remove."""
        self.write('nav.js', "var PS={'notes':'X'};")
        self.write('notes.html',
                   "<script>function save(k,v){localStorage.setItem(k,v)}</script>")
        self.audit_stdout()
        self.assertIn('unresolved by static scan', self.report())


class TestHelpDoesNotRun(EvidenceAuditFixture):
    def test_help_prints_and_writes_nothing(self):
        """Asking what a writer does must not make it do it (CLAUDE.md §8.4)."""
        self.write('nav.js', "var PS={'alpha':'X'};")
        self.write('alpha.html', '<html></html>')
        proc = self.run_audit('--help', env={'PYTHONIOENCODING': 'cp1252'})
        self.assertEqual(proc.returncode, 0, proc.stderr)
        self.assertIn('MASTER EVIDENCE AUDIT', proc.stdout)
        self.assertFalse(
            os.path.exists(os.path.join(self.dir, 'EVIDENCE_MATRIX.md')),
            '--help must not rewrite the report as a side effect')


if __name__ == '__main__':
    unittest.main()
