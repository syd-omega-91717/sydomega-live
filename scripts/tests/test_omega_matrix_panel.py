"""The map's matrix panel (omega-one-shell.js) draws the lattice with omega-sculpture.js and prints figures from the canon.

Two promises are pinned here, both CLAUDE.md 8.1 class 9 (fabricated data rendered as fact):
  1. every figure on the panel comes from omega-canon.json at run time; the shell contains none of them;
  2. the cube that is DRAWN is the cube the canon DESCRIBES (same depth, same number of axes), so the picture cannot drift from the caption.
The lit nodes are decorative and the panel says so; no per-member progress is implied.
"""
import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CANON = json.loads((ROOT / "omega-canon.json").read_text(encoding="utf-8"))["structure"]
SHELL = (ROOT / "omega-one-shell.js").read_text(encoding="utf-8")
SCULPT = (ROOT / "omega-sculpture.js").read_text(encoding="utf-8")


def matrix_scene():
    start = SCULPT.index("SCENES.matrix = function")
    return SCULPT[start:SCULPT.index("SCENES.", start + 20)] if "SCENES." in SCULPT[start + 20:] else SCULPT[start:]


class MatrixPanelTests(unittest.TestCase):
    def test_the_canon_agrees_with_itself(self):
        c = CANON
        self.assertEqual(c["axis_depth"] ** c["axes"], c["nodes_per_track_per_phase"])
        self.assertEqual(c["tracks"] * c["phases"] * c["nodes_per_track_per_phase"], c["total_nodes"])
        self.assertEqual(len(c["axes_names"]), c["axes"])

    def test_the_cube_that_is_drawn_is_the_cube_the_canon_describes(self):
        scene = matrix_scene()
        m = re.search(r"var S = (\d+), N = S \* S \* S", scene)
        self.assertIsNotNone(m, "the scene's size declaration changed: re-check it against the canon")
        self.assertEqual(int(m.group(1)), CANON["axis_depth"])
        self.assertEqual(CANON["axes"], 3, "the scene loops three axes (x, y, z)")
        self.assertEqual(len(re.findall(r"for \(var [xyz] = 0; [xyz] < S; [xyz]\+\+\)", scene)), 3)

    def test_matrix_sparkle_pattern_is_deterministic(self):
        scene = matrix_scene()
        self.assertIn("Math.imul(i, 1664525)", scene)
        self.assertIn("sparkle < 0.06", scene)
        self.assertNotIn("Math.random()", scene, "matrix nodes must render identically for the same scene")

    def test_the_shell_contains_none_of_the_figures(self):
        for fig in (str(CANON["nodes_per_track_per_phase"]), str(CANON["total_nodes"]),
                    "{:,}".format(CANON["total_nodes"]), "Knowledge", "Contribution"):
            self.assertNotIn(fig, SHELL, "a canon figure is written into the shell: read it from OmegaCanon.structure")

    def test_the_figures_are_read_from_the_canon_and_checked(self):
        self.assertIn("window.OmegaCanon.structure", SHELL)
        self.assertIn("Math.pow(depth, axes) === per && tracks * phases * per === total", SHELL)
        self.assertIn("so no figures are shown", SHELL, "an unreadable or self-contradicting canon must show nothing")

    def test_the_panel_says_the_lit_nodes_are_decorative(self):
        self.assertIn("The lit nodes are decorative. This shows the structure, not your progress.", SHELL)

    def test_it_is_a_sculpture_mount_not_a_second_webgl_owner(self):
        self.assertIn("cube.setAttribute('data-omega-sculpture', 'matrix')", SHELL)
        for sink in (r"WebGLRenderer", r"getContext\(\s*['\"]webgl", r"three\.module"):
            self.assertIsNone(re.search(sink, SHELL), sink)

    def test_the_cube_is_inert_and_off_on_phones(self):
        self.assertIn(".ons-cube{position:relative;width:100%;aspect-ratio:1;min-height:0 !important;pointer-events:none}", SHELL)
        self.assertIn(".ons-signet,.ons-cube{display:none !important}", SHELL)


if __name__ == "__main__":
    unittest.main()
