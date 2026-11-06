"""The franchise slate on universe.html is a concept list, and it must say so.

config/omega-franchise-slate.json is the one source for the founder's seven planned franchises. The SLATE tab on
universe.html renders the same seven cards. Nothing may claim a title is released, streaming, playable or in production
without evidence recorded in the JSON (CLAUDE.md 8.1 class 9: fabricated data presented as fact). Counts are PLANNED.
"""
import json
import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
SLATE = json.loads((ROOT / "config" / "omega-franchise-slate.json").read_text(encoding="utf-8"))
PAGE = (ROOT / "universe.html").read_text(encoding="utf-8")
PANEL = re.search(r'<div class="tab-panel" id="tab-slate">.*?(?=<div class="tab-panel" id="tab-science">)', PAGE, re.S)
CLAIMS = re.compile(r"\b(streaming now|now streaming|released|playable|available now|out now|in production|in theatres|in theaters)\b", re.I)


class FranchiseSlate(unittest.TestCase):
    def test_page_has_the_tab_and_panel(self):
        self.assertIsNotNone(PANEL, "universe.html has no SLATE panel")
        self.assertIn("setTab('slate')", PAGE)
        self.assertIn("'slate'][i]===name", PAGE)

    def test_page_lists_exactly_the_franchises_in_the_json(self):
        ids = re.findall(r'data-franchise="([a-z0-9-]+)"', PANEL.group(0))
        self.assertEqual(ids, [f["id"] for f in SLATE["franchises"]])

    def test_statuses_come_from_the_vocabulary_and_need_evidence(self):
        for f in SLATE["franchises"]:
            self.assertIn(f["status"], SLATE["statuses"], f["id"])
            if f["status"] != "CONCEPT":
                self.assertTrue(f["evidence"], f["id"] + " claims " + f["status"] + " with no evidence")

    def test_every_card_shows_its_status(self):
        for f in SLATE["franchises"]:
            card = re.search(r'data-franchise="%s".*?</div>\s*</div>' % re.escape(f["id"]), PANEL.group(0), re.S)
            self.assertIsNotNone(card, f["id"])
            self.assertIn("STATUS: " + f["status"], card.group(0))

    def test_the_panel_makes_no_availability_claim_without_evidence(self):
        if all(f["status"] == "CONCEPT" for f in SLATE["franchises"]):
            text = re.sub(r"<[^>]+>", " ", PANEL.group(0))
            self.assertIsNone(CLAIMS.search(text), "availability claim on a concept-only slate")

    def test_planned_film_total_is_stated_correctly(self):
        total = sum(f["filmsPlanned"] for f in SLATE["franchises"])
        self.assertIn("%d films across %d franchises" % (total, len(SLATE["franchises"])), PANEL.group(0))


if __name__ == "__main__":
    unittest.main()
