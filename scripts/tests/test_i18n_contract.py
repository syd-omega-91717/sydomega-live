#!/usr/bin/env python3
"""
Unit/regression tests for scripts/i18n-contract.py — the i18n dictionary gate.

Like the other scripts here it resolves its own ROOT from __file__, so it
cannot be imported and pointed at a fixture. These tests build throwaway repo
fixtures, copy the real script in at scripts/i18n-contract.py so its ROOT
resolution lands on the fixture, and run it as a subprocess exactly as CI does.

Every check is tested in BOTH directions. A gate that always exits 0 passes a
naive test, and this repo has shipped exactly that mistake before — a scan run
against a stopped server reported a clean 0 — so each clean-fixture assertion
is paired with a perturbation asserting a non-zero exit and the right message.

Run: python3 -m unittest scripts/tests/test_i18n_contract.py -v
"""

import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, "scripts", "i18n-contract.py")

I18N_JS = """/* fixture */
var T_EN={
%s
};
var T={};
"""


def write(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)


class Fixture:
    """A throwaway repo with the minimum shape i18n-contract.py reads."""

    def __init__(self):
        self.dir = tempfile.mkdtemp(prefix="i18n-contract-test-")

    def path(self, *parts):
        return os.path.join(self.dir, *parts)

    def setup(self, en=None, packs=None, pages=None):
        en = en if en is not None else {"greeting": "Hello", "farewell": "Goodbye"}
        packs = packs if packs is not None else {
            "fr": {"greeting": "Bonjour", "farewell": "Au revoir"}}
        pages = pages if pages is not None else {
            "index.html": '<div data-i18n="greeting">Hello</div>'}
        os.makedirs(self.path("scripts"), exist_ok=True)
        shutil.copy(SRC, self.path("scripts", "i18n-contract.py"))
        body = ",\n".join('"%s":%s' % (k, json.dumps(v, ensure_ascii=False))
                          for k, v in en.items())
        write(self.path("i18n.js"), I18N_JS % body)
        for lang, data in packs.items():
            write(self.path("i18n", "%s.json" % lang),
                  json.dumps(data, ensure_ascii=False))
        for name, html in pages.items():
            write(self.path(name), html)
        return self

    def run(self, *args):
        return subprocess.run(
            [sys.executable, self.path("scripts", "i18n-contract.py"), *args],
            capture_output=True, text=True, cwd=self.dir, timeout=90)

    def cleanup(self):
        shutil.rmtree(self.dir, ignore_errors=True)


class TestClean(unittest.TestCase):
    def setUp(self):
        self.fx = Fixture().setup()
        self.addCleanup(self.fx.cleanup)

    def test_clean_repo_passes(self):
        r = self.fx.run()
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assertIn("No i18n contract violations", r.stdout)

    def test_reports_coverage(self):
        r = self.fx.run()
        self.assertIn("Translation coverage", r.stdout)
        self.assertIn("2 / 2", r.stdout)

    def test_help_exits_zero_without_running(self):
        r = self.fx.run("--help")
        self.assertEqual(r.returncode, 0)
        self.assertIn("i18n", r.stdout.lower())
        self.assertNotIn("Translation coverage", r.stdout)


class TestMissingKey(unittest.TestCase):
    """B: a data-i18n the dictionary has no entry for can never be translated."""

    def test_unresolved_key_fails(self):
        fx = Fixture().setup(pages={
            "index.html": '<div data-i18n="nope">Text</div>'})
        self.addCleanup(fx.cleanup)
        r = fx.run()
        self.assertEqual(r.returncode, 1, r.stdout)
        self.assertIn('data-i18n="nope"', r.stdout)
        self.assertIn("index.html", r.stdout)

    def test_runtime_built_key_is_skipped_not_guessed(self):
        """'data-i18n="'+k+'"' is not a key; flagging it would be a false positive."""
        fx = Fixture().setup(pages={
            "index.html": '<div data-i18n="greeting">Hi</div>'
                          "<script>h+='data-i18n=\"'+k+'\"'</script>"})
        self.addCleanup(fx.cleanup)
        r = fx.run()
        self.assertEqual(r.returncode, 0, r.stdout)

    def test_single_quoted_attribute_is_checked_too(self):
        fx = Fixture().setup(pages={"index.html": "<div data-i18n='nope'>T</div>"})
        self.addCleanup(fx.cleanup)
        r = fx.run()
        self.assertEqual(r.returncode, 1, r.stdout)
        self.assertIn("nope", r.stdout)


class TestPackIntegrity(unittest.TestCase):
    def test_unparseable_pack_fails(self):
        """A: the exact shape that shipped -- a pack left mid-edit."""
        fx = Fixture().setup()
        self.addCleanup(fx.cleanup)
        with open(fx.path("i18n", "fr.json"), "w", encoding="utf-8") as f:
            f.write('{"greeting":"Bonjour" "farewell":"Au revoir"}')
        r = fx.run()
        self.assertEqual(r.returncode, 1, r.stdout)
        self.assertIn("does not parse", r.stdout)

    def test_orphan_pack_key_fails(self):
        """C: a pack key T_EN lacks is never merged, so it is dead weight."""
        fx = Fixture().setup(packs={"fr": {
            "greeting": "Bonjour", "farewell": "Au revoir", "ghost": "Fantôme"}})
        self.addCleanup(fx.cleanup)
        r = fx.run()
        self.assertEqual(r.returncode, 1, r.stdout)
        self.assertIn("ghost", r.stdout)

    def test_pack_missing_a_key_is_reported_but_not_blocking(self):
        """An untranslated key falls back to English by design, so it must not block.

        Blocking here would only pressure a contributor into inventing
        translations to get CI green.
        """
        fx = Fixture().setup(packs={"fr": {"greeting": "Bonjour"}})
        self.addCleanup(fx.cleanup)
        r = fx.run()
        self.assertEqual(r.returncode, 0, r.stdout)
        self.assertIn("1 untranslated", r.stdout)


class TestEntities(unittest.TestCase):
    """D: every write path is textual, so an entity reaches the reader literally."""

    def test_entity_in_english_fails(self):
        fx = Fixture().setup(en={"greeting": "Hello &mdash; friend", "farewell": "Bye"},
                             packs={"fr": {"greeting": "Salut", "farewell": "Adieu"}})
        self.addCleanup(fx.cleanup)
        r = fx.run()
        self.assertEqual(r.returncode, 1, r.stdout)
        self.assertIn("&mdash;", r.stdout)

    def test_entity_in_a_pack_fails(self):
        fx = Fixture().setup(packs={"fr": {"greeting": "Salut &#9670;",
                                           "farewell": "Adieu"}})
        self.addCleanup(fx.cleanup)
        r = fx.run()
        self.assertEqual(r.returncode, 1, r.stdout)
        self.assertIn("i18n/fr.json", r.stdout)

    def test_bare_ampersand_is_not_flagged(self):
        """'Q&A' and 'R&D' are prose, not markup -- flagging them is noise."""
        fx = Fixture().setup(en={"greeting": "Q&A and R&D", "farewell": "Bye"},
                             packs={"fr": {"greeting": "Q&R et R&D", "farewell": "Adieu"}})
        self.addCleanup(fx.cleanup)
        r = fx.run()
        self.assertEqual(r.returncode, 0, r.stdout)


class TestReportMode(unittest.TestCase):
    def test_report_mode_still_lists_problems_but_exits_zero(self):
        fx = Fixture().setup(pages={"index.html": '<div data-i18n="nope">T</div>'})
        self.addCleanup(fx.cleanup)
        self.assertEqual(fx.run().returncode, 1)
        r = fx.run("--report")
        self.assertEqual(r.returncode, 0, r.stdout)
        self.assertIn("nope", r.stdout)


if __name__ == "__main__":
    unittest.main()
