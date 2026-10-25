"""Contract for the sculpture's `sky` scene: the member's own records as stars."""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[2]
JS = (ROOT / "omega-sculpture.js").read_text(encoding="utf-8")
SKY = JS[JS.index("/* ── SKY ─"):JS.index("SCENES.sky = function")]
SCENE = JS[JS.index("SCENES.sky = function"):JS.index("/* ══", JS.index("SCENES.sky = function"))]
PAGE = (ROOT / "achievements.html").read_text(encoding="utf-8")


class OmegaSkyContract(unittest.TestCase):
    def test_every_read_is_filtered_to_the_viewer(self):
        # task_completions and certificates also pass private.is_platform_owner(),
        # so an unfiltered read is every member's rows for the owner.
        for table in ("task_completions", "lesson_completions", "certificates"):
            with self.subTest(table=table):
                self.assertRegex(SKY, r"sb\.from\('%s'\)\.select\([^)]*\)\.eq\('user_id', uid\)" % table)

    def test_read_errors_are_reported_not_drawn_as_empty(self):
        self.assertIn("!x || x.error", SKY)
        self.assertIn("Your record could not be read just now", SCENE)

    def test_no_decorative_stars_in_this_scene(self):
        self.assertNotIn("starfield(", SCENE)
        self.assertNotIn("Math.random", SKY + SCENE)

    def test_links_are_wired_after_the_records_arrive(self):
        self.assertIn("m.scene.ready.then(function () { wireNavigation(m);", JS)

    def test_mounted_on_achievements(self):
        self.assertIn('data-omega-sculpture="sky"', PAGE)


if __name__ == "__main__":
    unittest.main()
