"""Keep Academy as the single learning catalogue and Gaming as the play surface."""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[2]
ACADEMY = (ROOT / "academy.html").read_text(encoding="utf-8")
GAMING = (ROOT / "gaming.html").read_text(encoding="utf-8")


class AcademyGamingBoundaryTests(unittest.TestCase):
    def test_gaming_routes_exam_catalogue_to_academy(self):
        self.assertIn('href="/academy.html"', GAMING)
        self.assertIn("Exam pathways and assessment cards have one home in Sovereign Academy", GAMING)
        self.assertNotIn('id="tab-exams"', GAMING)
        self.assertNotIn('data-tab="exams"', GAMING)

    def test_duplicate_academy_course_descriptions_are_absent_from_gaming(self):
        duplicate_copy = (
            "Cell biology through ecology",
            "All body systems — medical school first year standard",
            "Chartered Financial Analyst",
            "Neural networks, transformers",
            "SHRM/CIPD",
            "All matrix systems — 28×28 to 9×9×9",
        )
        for phrase in duplicate_copy:
            with self.subTest(phrase=phrase):
                self.assertNotIn(phrase, GAMING)
        self.assertIn("Cell biology through ecology", ACADEMY)
        self.assertIn("Chartered Financial Analyst", ACADEMY)

    def test_game_catalogue_and_mastery_surface_remain(self):
        self.assertIn('id="tab-arcade"', GAMING)
        self.assertIn('data-task="The Apex Trial"', GAMING)
        self.assertIn('data-task-type="mastery"', GAMING)
        self.assertIn('id="tab-progress_tab"', GAMING)

    def test_task_card_ownership_is_disjoint(self):
        academy_tasks = set(re.findall(r'data-task="([^"]+)"', ACADEMY))
        gaming_tasks = set(re.findall(r'data-task="([^"]+)"', GAMING))
        self.assertTrue(academy_tasks)
        self.assertFalse(academy_tasks & gaming_tasks)
        self.assertIn('data-task-type="knowledge"', ACADEMY)
        self.assertNotIn('data-task-type="knowledge"', GAMING)
        self.assertIn('data-task-type="mastery"', GAMING)

    def test_every_visible_tab_button_has_a_live_tab_group(self):
        for tab in ("games", "progress", "science"):
            self.assertIn('data-tab="' + tab + '"', GAMING)
        self.assertNotIn('data-tab="exams"', GAMING)


if __name__ == "__main__":
    unittest.main()
