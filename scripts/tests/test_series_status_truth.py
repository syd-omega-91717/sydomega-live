"""Truth-label regression tests for the Twelve Houses short-form series player."""
from pathlib import Path
import json
import unittest

ROOT = Path(__file__).resolve().parents[2]
PAGE = ROOT / "series.html"
DATA = ROOT / "assets" / "series" / "twelve-houses-s1.json"


class SeriesStatusTruthTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = PAGE.read_text(encoding="utf-8")
        cls.data = json.loads(DATA.read_text(encoding="utf-8"))

    def test_player_is_identified_as_twelve_houses_season_one(self):
        self.assertIn("THE TWELVE HOUSES", self.html)
        self.assertIn("12 VERTICAL MICRO-EPISODES", self.html)
        self.assertEqual(self.data["series"], "THE TWELVE HOUSES")
        self.assertEqual(self.data["season"], 1)
        self.assertEqual(len(self.data["episodes"]), 12)

    def test_unverified_catalogue_claim_is_not_displayed(self):
        self.assertNotIn("144 SERIES ACROSS 12 TRACKS", self.html)
        self.assertIn("not a catalogue of 144 completed series", self.html)

    def test_short_form_player_is_distinguished_from_studios_teleplays(self):
        self.assertIn("SHORT-FORM VISUAL SERIES", self.html)
        self.assertIn("separate Studios registry tracks screenplay drafts", self.html)

    def test_status_disclosure_is_responsive(self):
        self.assertIn(".series-status", self.html)
        self.assertIn("@media(max-width:620px){.series-status{grid-template-columns:1fr}", self.html)


if __name__ == "__main__":
    unittest.main()
