#!/usr/bin/env python3
"""
One gate ladder, from one owner.

omega-canon.json defines the 12 gates of authority (structure.gate_thresholds
and authority.gates): 2.3197, 4.6394, 6.9592 ... 27.8367. Until 2026-10-17, 21
pages and modules carried a second, hard-coded curve -- 2.32, 3.98, 5.95, 8.29,
11, 13.92, 17.21, 20.87, 24.01, 25.9, 27.1, 27.8367 -- so a member at authority
4.0 was SCHOLAR on profile.html and ACOLYTE on dashboard.html (CLAUDE.md 8.1
class 8). They were swept onto the canon values; this test keeps it that way.

Run: python3 -m unittest scripts/tests/test_gate_curve.py -v
"""
import glob
import json
import os
import re
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# Values only the retired curve has; the shared ends (2.32, 27.8367) are excluded.
RETIRED = ["3.98", "5.95", "8.29", "13.92", "17.21", "20.87", "24.01"]
TOKEN = re.compile(r"(?<![\d.])(" + "|".join(re.escape(v) for v in RETIRED) + r")(?![\d])")


class GateCurveContract(unittest.TestCase):
    def test_canon_agrees_with_itself(self):
        with open(os.path.join(ROOT, "omega-canon.json"), encoding="utf-8") as fh:
            canon = json.load(fh)
        a = canon["structure"]["gate_thresholds"]
        b = canon["authority"]["gates"]
        self.assertEqual(len(a), 12)
        self.assertEqual(a, b)
        self.assertEqual(len(canon["authority"]["gate_names"]), 12)

    def test_no_page_or_module_carries_the_retired_curve(self):
        files = glob.glob(os.path.join(ROOT, "*.html")) + glob.glob(os.path.join(ROOT, "*.js"))
        offenders = []
        for path in files:
            with open(path, encoding="utf-8", errors="ignore") as fh:
                found = set(TOKEN.findall(fh.read()))
            if len(found) >= 3:        # one stray number is not a ladder; three is
                offenders.append("%s %s" % (os.path.basename(path), sorted(found)))
        self.assertEqual(offenders, [], "use OmegaCanon.structure.gate_thresholds")

    def test_the_detector_finds_the_retired_curve(self):
        sample = "var T=[2.32,3.98,5.95,8.29,11,13.92,17.21,20.87,24.01,25.9,27.1,27.8367];"
        self.assertGreaterEqual(len(set(TOKEN.findall(sample))), 3)


if __name__ == "__main__":
    unittest.main()
