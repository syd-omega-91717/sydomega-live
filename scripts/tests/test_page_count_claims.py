#!/usr/bin/env python3
"""Regression tests for scripts/page-count-claims.py.

The gate exists because five separate "N pages" claims in member-visible copy
had all drifted (CLAUDE.md 8.4: "a number stored in prose drifts"). A gate that
cannot fail would be worse than none, so the planted-violator case comes first
and the clean case is asserted only alongside it.

Run: python3 -m unittest scripts/tests/test_page_count_claims.py -v
"""
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
SCRIPT = ROOT / 'scripts' / 'page-count-claims.py'


class Fixture(unittest.TestCase):
    def setUp(self):
        self.dir = Path(tempfile.mkdtemp(prefix='omega-pagecount-'))
        (self.dir / 'scripts').mkdir()
        shutil.copy(str(SCRIPT), str(self.dir / 'scripts' / 'page-count-claims.py'))

    def tearDown(self):
        shutil.rmtree(str(self.dir), ignore_errors=True)

    def write(self, name, text):
        (self.dir / name).write_text(text, encoding='utf-8')

    def run_gate(self, *args):
        return subprocess.run([sys.executable, str(self.dir / 'scripts' / 'page-count-claims.py')]
                              + list(args), capture_output=True, text=True,
                              cwd=str(self.dir), stdin=subprocess.DEVNULL)


class TestGate(Fixture):

    def test_control_a_wrong_claim_fails(self):
        """PLANTED POSITIVE. Three pages exist; a page claiming 170 must fail."""
        for n in ('a.html', 'b.html', 'c.html'):
            self.write(n, '<p>nothing</p>')
        self.write('a.html', '<p>ALL 170 PAGES</p>')
        r = self.run_gate()
        self.assertEqual(r.returncode, 1, r.stdout)
        self.assertIn('170', r.stdout)

    def test_a_claim_matching_the_estate_passes(self):
        """The clean case — asserted only because the control above fails."""
        for n in ('a.html', 'b.html', 'c.html'):
            self.write(n, '<p>nothing</p>')
        self.write('a.html', '<p>all 3 pages</p>')
        r = self.run_gate()
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)

    def test_uppercase_and_plus_forms_are_caught(self):
        """'170 PAGES' and '150+ pages' both appeared in the real estate."""
        for n in ('a.html', 'b.html'):
            self.write(n, '<p>x</p>')
        self.write('a.html', '<p>150+ pages</p>')
        self.assertEqual(self.run_gate().returncode, 1)
        self.write('a.html', '<p>99 PAGES</p>')
        self.assertEqual(self.run_gate().returncode, 1)

    def test_diagnostic_harnesses_are_skipped(self):
        """verify-*.html are tools, not member-visible copy."""
        self.write('a.html', '<p>x</p>')
        self.write('verify-modules.html', '<p>999 pages</p>')
        self.assertEqual(self.run_gate().returncode, 0)

    def test_help_prints_docstring_and_does_not_scan(self):
        self.write('a.html', '<p>4321 pages</p>')
        r = self.run_gate('--help')
        self.assertEqual(r.returncode, 0)
        self.assertIn('Refuse a page-count claim', r.stdout)


if __name__ == '__main__':
    unittest.main()
