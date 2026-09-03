#!/usr/bin/env python3
"""Regression tests for scripts/brand-glyph-check.py.

WHY THESE EXIST

The gate's whole value is that it fails on the right things. A gate that
reports "0 findings" because it looked in the wrong place is worse than no
gate -- CLAUDE.md 8.4 records exactly that failure ("verify a 0 findings
result is real") after a scan against a stopped server reported clean.

So each test hands the scanner a file that MUST be caught, and one that must
NOT be, for each of the three rules it enforces. The two cases most worth
pinning are the ones a naive implementation gets wrong in opposite directions:

  * `♈` (U+2648) is an ordinary BMP symbol that a grep for the emoji planes
    never sees, yet its DEFAULT Unicode presentation is emoji -- measured
    rendering colour in the harness Chromium. It must be caught.
  * `♈` followed by U+FE0E is the same character pinned to its text form. It
    renders monochrome and must NOT be caught, or the fix would be rejected
    by the gate that asked for it.

Run: python3 -m unittest scripts.tests.test_brand_glyph_check -v
"""

import io
import os
import subprocess
import sys
import tempfile
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
GATE = os.path.join(ROOT, 'scripts', 'brand-glyph-check.py')

VS15 = u'︎'   # text presentation
VS16 = u'️'   # emoji presentation


def run_against(body, name='probe.html'):
    """Run the gate over a throwaway tree holding exactly one file."""
    with tempfile.TemporaryDirectory() as tmp:
        os.mkdir(os.path.join(tmp, 'scripts'))
        with io.open(GATE, encoding='utf-8') as fh:
            gate_src = fh.read()
        with io.open(os.path.join(tmp, 'scripts', 'brand-glyph-check.py'), 'w',
                     encoding='utf-8') as fh:
            fh.write(gate_src)
        with io.open(os.path.join(tmp, name), 'w', encoding='utf-8') as fh:
            fh.write(body)
        proc = subprocess.run(
            [sys.executable, os.path.join(tmp, 'scripts', 'brand-glyph-check.py')],
            capture_output=True, text=True, errors='replace')
        return proc.returncode, (proc.stdout or '') + (proc.stderr or '')


class BrandGlyphCheck(unittest.TestCase):

    def test_astral_pictograph_is_caught(self):
        rc, out = run_against(u'<p>\U0001F525 fire</p>')
        self.assertEqual(rc, 1, out)
        self.assertIn('astral-plane', out)

    def test_vs16_is_caught(self):
        """U+FE0F exists only to request the colour form."""
        rc, out = run_against(u'<p>⚔' + VS16 + u'</p>')
        self.assertEqual(rc, 1, out)
        self.assertIn('U+FE0F', out)

    def test_bare_zodiac_sign_is_caught(self):
        """The case a grep for the emoji planes cannot see."""
        rc, out = run_against(u'<p>♈ aries</p>')
        self.assertEqual(rc, 1, out)
        self.assertIn('2648', out)

    def test_zodiac_sign_pinned_to_text_is_allowed(self):
        """The fix the gate is meant to accept, not reject."""
        rc, out = run_against(u'<p>♈' + VS15 + u' aries</p>')
        self.assertEqual(rc, 0, out)

    def test_typographic_marks_are_allowed(self):
        """These look like emoji to a grep and are pure typography."""
        rc, out = run_against(u'<p>✓ ★ ☰ ✦ ⚔ △ ▽</p>')
        self.assertEqual(rc, 0, out)

    def test_reports_file_and_line(self):
        rc, out = run_against(u'<p>ok</p>\n<p>ok</p>\n<p>\U0001F4DA</p>\n')
        self.assertEqual(rc, 1, out)
        self.assertIn('probe.html', out)
        self.assertIn(':3', out)

    def test_help_does_not_run_the_job(self):
        """CLAUDE.md 8.4: every agent-facing script answers --help and exits 0."""
        proc = subprocess.run([sys.executable, GATE, '--help'],
                              capture_output=True, text=True)
        self.assertEqual(proc.returncode, 0)
        self.assertIn('colour emoji', proc.stdout)
        self.assertNotIn('file(s) scanned', proc.stdout)

    def test_repo_is_clean(self):
        """The live assertion: the shipped surface carries no colour emoji."""
        proc = subprocess.run([sys.executable, GATE], cwd=ROOT,
                              capture_output=True, text=True, errors='replace')
        self.assertEqual(proc.returncode, 0, proc.stdout + proc.stderr)


if __name__ == '__main__':
    unittest.main()
