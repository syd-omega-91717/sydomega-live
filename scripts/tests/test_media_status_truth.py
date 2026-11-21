"""Truth-label regression tests for the legacy cinematic concept-reel page."""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]
PAGE = ROOT / "movies.html"


class MediaStatusTruthTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = PAGE.read_text(encoding="utf-8")

    def test_twelve_items_are_labelled_as_archetype_concept_reels(self):
        self.assertIn("VISUAL CONCEPT REELS", self.html)
        self.assertIn("12 sovereign archetypes", self.html)
        self.assertIn("not full-length films", self.html)
        self.assertNotIn("12 FRANCHISE FILMS", self.html)
        self.assertNotIn("Franchise films", self.html)

    def test_all_twelve_visual_previews_have_poster_and_video_sources(self):
        self.assertEqual(self.html.count('data-film="'), 12)
        self.assertEqual(self.html.count('src="/assets/movies/franchise-'), 24)
        self.assertIn("procedural preview loops", self.html)

    def test_feature_film_production_is_not_claimed_by_the_preview_page(self):
        self.assertIn("Feature-film screenplays, production footage, voice, score and release status are tracked separately", self.html)
        self.assertIn("not a completed feature film", self.html)

    def test_status_disclosure_has_a_mobile_layout(self):
        self.assertIn(".omv-status", self.html)
        self.assertIn("@media(max-width:620px){.omv-status{grid-template-columns:1fr}", self.html)


if __name__ == "__main__":
    unittest.main()
