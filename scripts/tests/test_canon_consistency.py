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

    # --- whole-table shapes (check_tables): a one-line map and parallel arrays -----------------------------
    SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"]

    def god_map(self, **over):
        t = {s: self.t[s]["god"] for s in self.SIGNS}
        t.update(over)
        return "var SIGN_GOD={" + ",".join("%s:'%s'" % (k, v) for k, v in t.items()) + "};"

    def element_map(self, **over):
        t = {s: self.t[s]["element"].title() for s in self.SIGNS}
        t.update(over)
        return "var SIGN_ELEM={" + ",".join("%s:'%s'" % (k, v) for k, v in t.items()) + "};"

    def test_a_correct_god_map_passes(self):
        self.assertEqual(self.check(self.god_map()), [])
        self.assertEqual(self.check(self.element_map()), [])

    def test_wrong_god_in_a_map_is_caught(self):
        found = self.check(self.god_map(Gemini="Ares"))
        self.assertTrue(any("Gemini" in x and "god Ares" in x for x in found), found)

    def test_wrong_element_in_a_map_is_caught(self):
        found = self.check(self.element_map(Virgo="Metal"))
        self.assertTrue(any("Virgo" in x and "element METAL" in x for x in found), found)

    def test_wrong_agent_in_a_map_is_caught(self):
        t = {s: self.t[s]["agent"] for s in self.SIGNS}
        t["Leo"] = "Scout"
        found = self.check("const PP_AGENT={" + ",".join("%s:'%s'" % kv for kv in t.items()) + "};")
        self.assertTrue(any("Leo" in x and "agent Scout" in x for x in found), found)

    def test_an_agent_keyed_map_with_the_wrong_sign_is_caught(self):
        t = {self.t[s]["agent"].upper(): s for s in self.SIGNS}
        t["SCOUT"] = "Taurus"
        found = self.check("window.m={" + ",".join("%s:'%s'" % kv for kv in t.items()) + "};")
        self.assertTrue(any("SCOUT" in x for x in found), found)

    def test_maps_that_claim_nothing_are_left_alone(self):
        glyphs = "var GLY={" + ",".join("%s:'\\u26%02d'" % (s, i) for i, s in enumerate(self.SIGNS)) + "};"
        factions = "var F={Aries:'Aegis Order',Taurus:'Gilded Hand',Gemini:'Lumen Choir',Cancer:'Tidewardens',Leo:'Solar Crown',Virgo:'Grain Covenant',Aquarius:'Aether Senate'};"
        self.assertEqual(self.check(glyphs), [])
        self.assertEqual(self.check(factions), [], "a faction called 'Aether Senate' is not a claim about the element")

    def test_a_small_map_is_not_a_table(self):
        self.assertEqual(self.check("var m={Aries:'Zeus',Taurus:'Zeus',Gemini:'Zeus'};"), [])

    def arrays(self, gods=None, elems=None):
        gods = gods or [self.t[s]["god"] for s in self.SIGNS]
        elems = elems or [self.t[s]["element"].title() + " *" for s in self.SIGNS]
        q = lambda xs: "[" + ",".join("'%s'" % x for x in xs) + "]"
        return "var SIGNS=%s;\nvar GODS=%s;\nvar ELEMS=%s;" % (q(self.SIGNS), q(gods), q(elems))

    def test_correct_parallel_arrays_pass(self):
        self.assertEqual(self.check(self.arrays()), [])

    def test_two_swapped_gods_in_parallel_arrays_are_caught(self):
        gods = [self.t[s]["god"] for s in self.SIGNS]
        gods[2], gods[3] = gods[3], gods[2]
        found = self.check(self.arrays(gods=gods))
        self.assertEqual(len(found), 2, found)

    def test_a_wrong_element_in_a_parallel_array_is_caught(self):
        elems = [self.t[s]["element"].title() + " *" for s in self.SIGNS]
        elems[11] = "Fire *"
        found = self.check(self.arrays(elems=elems))
        self.assertTrue(any("Pisces" in x for x in found), found)

    def test_an_array_of_twelve_signs_alone_is_not_a_finding(self):
        self.assertEqual(self.check("var SIGNS=[" + ",".join("'%s'" % s for s in self.SIGNS) + "];"), [])

    def test_the_planted_estate_cases_from_2026_11_15_are_caught(self):
        # the three plants that passed the gate before check_tables existed
        self.assertTrue(self.check(self.god_map(Gemini="Ares")))
        self.assertTrue(self.check(self.element_map(Pisces="Fire")))
        gods = [self.t[s]["god"] for s in self.SIGNS]
        gods[2], gods[3] = gods[3], gods[2]
        self.assertTrue(self.check(self.arrays(gods=gods)))

    def test_the_estate_passes(self):
        r = subprocess.run([sys.executable, SCRIPT], cwd=ROOT, capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, r.stdout[-2000:])

    def test_registered_in_contract_suite(self):
        with open(os.path.join(ROOT, "scripts", "contract-suite.py"), encoding="utf-8") as f:
            self.assertIn("'scripts/canon-consistency.py'", f.read())


if __name__ == "__main__":
    unittest.main()
