"""scripts/ladder-copy-contract.py must catch a divergent copy of the 12-gate ladder, and must not cry wolf on
display variants (APEX SOVEREIGN) or a named last constant. Planted violators, not the live tree."""
import importlib.util
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("lc", ROOT / "scripts" / "ladder-copy-contract.py")
lc = importlib.util.module_from_spec(spec)
spec.loader.exec_module(lc)

NAMES = ",".join("'%s'" % n for n in lc.NAMES)
GATES = ",".join(str(g) for g in lc.GATES)


class Names(unittest.TestCase):
    def test_canon_sequence_passes(self):
        got = lc.name_copies("var N=[%s];" % NAMES)
        self.assertEqual([ok for ok, _ in got], [True])

    def test_shifted_names_are_caught(self):
        # the levels.html shape: NOVICE inserted, ADEPT/MASTER substituted
        bad = NAMES.replace("'KEEPER'", "'ADEPT'").replace("'ARCHITECT'", "'MASTER'")
        got = lc.name_copies("var N=['NOVICE',%s];" % bad)
        self.assertEqual([ok for ok, _ in got], [False])

    def test_apex_display_variant_is_not_a_disagreement(self):
        got = lc.name_copies("var N=[%s];" % NAMES.replace("'APEX'", "'APEX SOVEREIGN'"))
        self.assertEqual([ok for ok, _ in got], [True])


class Thresholds(unittest.TestCase):
    def test_canon_thresholds_pass(self):
        self.assertEqual([ok for ok, _ in lc.numeric_copies("var G=[%s];" % GATES)], [True])

    def test_a_wrong_threshold_is_caught(self):
        bad = GATES.replace("9.2789", "9.3")
        self.assertEqual([ok for ok, _ in lc.numeric_copies("var G=[%s];" % bad)], [False])

    def test_named_last_constant_passes(self):
        eleven = ",".join(str(g) for g in lc.GATES[:11])
        self.assertEqual([ok for ok, _ in lc.numeric_copies("var G=[%s,APEX];" % eleven)], [True])

    def test_unrelated_numbers_are_not_a_copy(self):
        self.assertEqual(lc.numeric_copies("var A=[1,2,3,4,5,6,7,8,9,10,11,12,13];"), [])


class LiveTree(unittest.TestCase):
    def test_no_copy_in_the_repo_disagrees_with_the_canon(self):
        bad = [f for f, d in lc.scan().items() for ok, _ in d["numeric"] + d["names"] if not ok]
        self.assertEqual(bad, [])


if __name__ == "__main__":
    unittest.main()
