"""A hand-typed score must not be shown as if it were measured (CLAUDE.md 8.1 class 9).

omega-pml.js keeps a table of per-page "PMI" scores that somebody typed (PAGE_SCORES, and PLATFORM_PMI = 87 "weighted average" of them). On 2026-09-27 the owner ruled
that text with no role is not shown, and the topbar badge was removed; dashboard.html still showed the table in two places (a mission-bar "PMI 91" and a PLATFORM PMI tile
"87", the latter inside a tile claiming to "measure operational discipline"). Both are gone. This keeps them gone, keeps the table's API for the owner's tooling, and keeps the
module from writing into its own <script> tag (a guard attribute is not a display attribute).

Rendered before and after in headless Chromium: see docs/fixes/2026-11-15-dashboard-hand-typed-pmi.md.
Run: python3 -m unittest scripts/tests/test_no_hand_typed_score_shown.py -v
"""
import glob
import os
import re
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PML = open(os.path.join(ROOT, "omega-pml.js"), encoding="utf-8").read()
DASH = open(os.path.join(ROOT, "dashboard.html"), encoding="utf-8").read()


class NoHandTypedScoreShown(unittest.TestCase):
    def test_no_page_displays_the_score(self):
        hits = []
        for f in sorted(glob.glob(os.path.join(ROOT, "*.html"))):
            s = open(f, encoding="utf-8", errors="ignore").read()
            for pat in ('id="mb-pmi"', 'data-omega-pmi="page"', 'data-omega-pmi="platform"'):
                if pat in s:
                    hits.append("%s shows the hand-typed score (%s)" % (os.path.basename(f), pat))
        self.assertEqual(hits, [])

    def test_the_topbar_badge_stays_off(self):
        self.assertRegex(PML, r"function injectPMIBadge\(\)\{\s*return;")

    def test_the_table_stays_for_the_owners_tooling(self):
        self.assertIn("var PAGE_SCORES", PML)
        self.assertIn("window.OmegaPMI={", PML)

    def test_the_module_does_not_write_into_its_own_script_tag(self):
        # bg.js loads omega-pml.js with data-omega-pmi="1" as a guard; the bare attribute selector matched that <script>
        self.assertNotRegex(PML, r"querySelectorAll\('\[data-omega-pmi\]'\)")
        self.assertIn("""querySelectorAll('[data-omega-pmi="page"],[data-omega-pmi="platform"]')""", PML)

    def test_the_tile_grid_has_no_hole_where_the_tile_was(self):
        self.assertRegex(DASH, r"#kpi-platform \.kpi:last-child\{grid-column:span 2\}")


if __name__ == "__main__":
    unittest.main()
