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

    def test_entity_encoded_emoji_is_caught(self):
        """A browser decodes &#127942; before painting, so the gate must too.

        Measured 2026-09-03: 11 shipped files carried astral codepoints in this
        form and 9 of them painted a colour emoji in a real render, with this
        gate green throughout.
        """
        rc, out = run_against(u'<p>&#127942;</p>\n')
        self.assertEqual(rc, 1, out)
        self.assertIn('&#127942;', out)

    def test_js_escape_encoded_emoji_is_caught(self):
        """`'\\u{1F311}'` is eight ASCII characters in source, an emoji on screen."""
        rc, out = run_against(u"<script>var a='\\u{1F311}';</script>\n")
        self.assertEqual(rc, 1, out)
        rc2, out2 = run_against(u"<script>var a='\\uD83C\\uDFA4';</script>\n")
        self.assertEqual(rc2, 1, out2)

    def test_entity_already_pinned_to_text_form_passes(self):
        """&#9889;&#65038; is lightning pinned to its text form -- not a finding."""
        rc, out = run_against(u'<p>&#9889;&#65038;</p>\n')
        self.assertEqual(rc, 0, out)

    def test_monochrome_blocks_are_not_flagged(self):
        """Alchemical, geometric-extended and chess symbols are ordinary type.

        The first version of the astral rule spanned 1F300-1FAFF and called
        consultancy.html's U+1F701 a colour emoji. Canvas pixel readback in the
        harness Chromium measured spread 0 for each of these and 76-231 for a
        real emoji, so the rule is the emoji sub-ranges, not the whole span.
        """
        for ch in (u'\U0001F701', u'\U0001F780', u'\U0001FA00', u'\U0001F650'):
            rc, out = run_against(u'<p>%s</p>\n' % ch)
            self.assertEqual(rc, 0, 'U+%05X should not be flagged\n%s' % (ord(ch), out))
        for ch in (u'\U0001F3A4', u'\U0001F3C6', u'\U0001F9EC'):
            rc, out = run_against(u'<p>%s</p>\n' % ch)
            self.assertEqual(rc, 1, 'U+%05X should be flagged\n%s' % (ord(ch), out))

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
