import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
AD = (ROOT / "advertising.html").read_text(encoding="utf-8")
SEARCH = (ROOT / "search.html").read_text(encoding="utf-8")


class AdvertisingReachTruthContract(unittest.TestCase):
    def test_matrix_model_count_is_not_claimed_as_audience_reach(self):
        self.assertIn("AUDIENCE REACH · NOT MEASURED", AD)
        self.assertIn("104,976 FIGURE IS AN INTERNAL MATRIX MODEL COUNT", AD)
        self.assertNotIn("104,976-NODE REACH", AD.upper())
        self.assertNotIn("NODE REACH", AD.upper())

    def test_unavailable_ad_delivery_and_analytics_are_not_sold_as_live(self):
        self.assertIn("NO PAID DELIVERY", AD)
        self.assertIn("NO PAID DELIVERY, VERIFIED AUDIENCE REACH", AD)
        self.assertIn("Audience reach metrics not available", AD)
        self.assertIn("Analytics suite (planned; not active)", AD)
        self.assertIn("Direct outreach (planned; not active)", AD)
        self.assertIn("Approved submissions remain queued and are not live placements.", AD)

    def test_rate_card_and_tier_benefits_are_explicitly_proposed(self):
        self.assertGreaterEqual(AD.count("PROPOSED RATE"), 3)
        self.assertIn("Timeline banner placement (proposed)", AD)
        self.assertIn("Featured placement (proposed)", AD)
        self.assertIn("TIER III &middot; PROPOSED ONE-TIME", AD)

    def test_search_index_does_not_repeat_the_false_reach_claim(self):
        self.assertNotIn("104,976-node reach", SEARCH)
        self.assertIn("proposed campaign tiers; audience reach is not measured", SEARCH)


if __name__ == "__main__":
    unittest.main()
