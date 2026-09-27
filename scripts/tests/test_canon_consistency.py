#!/usr/bin/env python3
"""
scripts/canon-consistency.py holds CLAUDE.md 8.1 class 8 (two divergent copies
of one canonical table): every page's sign/god/agent/element/token pairing must
match omega-canon.json `tracks`. These tests plant a violator of each kind and
confirm the gate catches it, and confirm the real estate passes.

Run: python3 -m unittest scripts/tests/test_canon_consistency.py -v
"""
import importlib.util
import os
import subprocess
import sys
import tempfile
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SCRIPT = os.path.join(ROOT, "scripts", "canon-consistency.py")

spec = importlib.util.spec_from_file_location("canon_consistency", SCRIPT)
cc = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cc)


class CanonConsistency(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tracks, cls.elements = cc.load_canon()
        cls.t = {t["sign"]: t for t in cls.tracks}

    def check(self, text):
        with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False, encoding="utf-8") as f:
            f.write(text)
        try:
            return cc.check_file(f.name, self.tracks, self.elements)
        finally:
            os.unlink(f.name)

    def test_ninth_element_is_the_all(self):
        self.assertEqual(self.elements[-1], "THE ALL")
        self.assertEqual(len(self.elements), 9)

    def test_canonical_record_passes(self):
        a = self.t["Aries"]
        rec = "{sign:'Aries', god:'%s', agent:'%s', token:'%s', element:'%s'}" % (
            a["god"], a["agent"], a["token"], a["element"])
        self.assertEqual(self.check(rec), [])

    def test_wrong_god_outside_the_twelve_is_caught(self):
        out = self.check("{sign:'Capricorn', god:'Cronus'}")
        self.assertTrue(any("god Cronus" in x for x in out), out)

    def test_wrong_agent_is_caught(self):
        a = self.t["Aries"]["agent"]
        wrong = next(t["agent"] for t in self.tracks if t["agent"] not in (a, "Sovereign"))
        out = self.check("<td>Aries // %s</td>" % wrong)
        self.assertTrue(any("agent " + wrong in x for x in out), out)

    def test_wrong_token_is_caught(self):
        out = self.check("{sign:'Aries', token:'PRIMUS'}")
        self.assertTrue(any("token PRIMUS" in x for x in out), out)

    def test_unknown_element_is_caught(self):
        out = self.check("{name:'x', element:'MIND'}")
        self.assertTrue(any("not one of the nine" in x for x in out), out)

    def test_retired_ninth_name_is_caught_but_not_in_comments(self):
        self.assertTrue(self.check("<b>THE NINTH</b>"))
        self.assertEqual(self.check("// THE NINTH was its old name"), [])

    def test_multi_sign_rows_are_not_pairings(self):
        self.assertEqual(self.check("Aries Taurus Gemini Cronus"), [])

    def test_the_estate_passes(self):
        r = subprocess.run([sys.executable, SCRIPT], cwd=ROOT, capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, r.stdout[-2000:])

    def test_registered_in_contract_suite(self):
        with open(os.path.join(ROOT, "scripts", "contract-suite.py"), encoding="utf-8") as f:
            self.assertIn("'scripts/canon-consistency.py'", f.read())


if __name__ == "__main__":
    unittest.main()
