"""Winged-lion scene (omega-sculpture.js SCENES.lion): static contracts plus the browser suite (scripts/verify-lion-scene.js).

The browser suite reads canvas pixels (wings present on both sides, wings move, reduced motion holds still, no-WebGL fallback). It is skipped
when no browser exists and fails instead when OMEGA_REQUIRE_BROWSER is set.
"""
import os
import pathlib
import re
import shutil
import subprocess
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
SC = (ROOT / "omega-sculpture.js").read_text(encoding="utf-8")
LION = SC[SC.index("SCENES.lion = function"):SC.index("/* ── THE COUNCIL CHAMBER")]   # ends where the next scene begins


class Static(unittest.TestCase):
    def test_registered_labelled_and_given_a_flat_fallback(self):
        self.assertIn("    lion:   '", SC)                                   # SCULPT_LABEL entry: every canvas needs an accessible name
        self.assertIn("if (kind === 'lion') {", SC)                          # fallback() branch for WebGL-absent browsers
        self.assertIn("/assets/omega-legion-of-wisdom-seal.svg", SC)         # ... which is the real seal artwork
        self.assertTrue((ROOT / "assets" / "omega-legion-of-wisdom-seal.svg").exists())

    def test_no_debug_residue(self):
        for needle in ("TEMP-DEBUG", "__lionDbg", "MUTATION", "BUG-REPRO", "console.log"):
            self.assertNotIn(needle, LION, needle)
            self.assertNotIn(needle, SC, needle)

    def test_reduced_motion_draws_one_still_frame(self):
        self.assertIn("matchMedia('(prefers-reduced-motion: reduce)').matches", LION)
        self.assertIn("var tt = reduceMotion ? 0 : t;", LION)
        self.assertIn("var lx = reduceMotion ? 0 : px, ly = reduceMotion ? 0 : py;", LION)

    def test_feathers_are_double_sided_and_wings_are_attached(self):
        self.assertIn("m.side = T.DoubleSide", LION)                         # the left wing is a mirror; negative scale flips winding
        self.assertEqual(LION.count("lion.add(pivot);"), 1)
        self.assertEqual(LION.count("wing(1)"), 1)
        self.assertEqual(LION.count("wing(-1)"), 1)

    def test_wings_clear_the_mane(self):  # the first design hid the wings inside the mane's silhouette in the same gold
        lens = [float(x) for x in re.search(r"WING_LEN = \[([^\]]+)\]", LION).group(1).split(",")]
        mane_reach = max(0.60 + 0.60, 0.50 + 0.42)                           # ring radius + spike length of the outer ring
        self.assertGreaterEqual(max(lens), 1.5 * mane_reach)
        self.assertEqual(len(lens), 6)

    def test_narrow_mounts_pull_the_camera_back(self):
        self.assertIn("var ws = Math.max(0.55, Math.min(1, asp / 1.3));", LION)               # wings fold in as the mount narrows, never below 55%
        self.assertIn("cam.position.z = Math.max(6.6, needHalf / (0.344 * asp));", LION)      # the camera never comes closer than the wide-mount distance
        self.assertIn("wingR.scale.setScalar(ws); wingL.scale.setScalar(ws);", LION)

    def test_claims_nothing(self):  # an illustration: no figure, no award, no data
        self.assertNotRegex(LION, r"fetch\(|supabase|localStorage|\$\d|revenue|balance|token")

    def test_mounted_on_the_sculpture_hall_with_a_label(self):
        page = (ROOT / "sculpture.html").read_text(encoding="utf-8")
        m = re.search(r'<div class="sc-stage" data-omega-sculpture="lion"[^>]*data-sculpt-label="[^"]+"', page, re.S)
        self.assertIsNotNone(m)


class Browser(unittest.TestCase):
    def test_browser_validation(self):
        node = shutil.which("node")
        if not node:
            self.skipTest("node not available")
        r = subprocess.run([node, str(ROOT / "scripts" / "verify-lion-scene.js")], capture_output=True, text=True, timeout=420)
        out = r.stdout + r.stderr
        if "SKIPPED" in out and not os.environ.get("OMEGA_REQUIRE_BROWSER"):
            self.skipTest("no browser available")
        self.assertEqual(r.returncode, 0, out)


if __name__ == "__main__":
    unittest.main()
