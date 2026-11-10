"""Catalogue status is stated once per section, and the exam-done marker keeps its container.

Academy owns 96 exam cards; Gaming retains 72 game catalogue cards. The 60 duplicated learning
cards were removed from Gaming so each page has one job. Status remains in each catalogue section
header (owner decision 2026-10-18: a catalogue card must never read as playable or as a sat exam).
The .ec-meta marker remains because academy.html's markDone() appends "RECORDED" into it.
"""
import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]


def read(name):
    return (ROOT / name).read_text(encoding="utf-8")


def sectionheads(src):
    return re.findall(r'<div class="sechead"[^>]*>([^<]*)</div>', src)


class CatalogueStatusOnce(unittest.TestCase):
    def test_gaming_catalogue_sections_state_the_status(self):
        heads = [h for h in sectionheads(read("gaming.html")) if "AXIS B MASTERY" in h or "AXIS A KNOWLEDGE" in h]
        self.assertEqual(len(heads), 6)
        for h in heads:
            self.assertIn("CATALOGUE &middot; NOT HOSTED", h)

    def test_gaming_cards_do_not_repeat_it(self):
        src = read("gaming.html")
        self.assertNotIn('class="c-pts"', src)
        self.assertEqual(len(re.findall(r'<div class="(?:g|e)-card card"', src)), 72)

    def test_academy_sections_state_the_status(self):
        heads = [h for h in sectionheads(read("academy.html")) if h.endswith("AXIS A &middot; CATALOGUE &middot; TEST IN ACADEMY")]
        self.assertEqual(len(heads), 8)

    def test_academy_exam_done_marker_keeps_its_container(self):
        src = read("academy.html")
        cards = len(re.findall(r'<div class="exam-card"', src))
        self.assertEqual(cards, 96)
        self.assertEqual(len(re.findall(r'<div class="ec-meta"></div>', src)), cards)
        self.assertIn("querySelector('.ec-meta')", src)

    def test_per_card_axis_is_kept_where_it_differs_from_the_header(self):
        self.assertIn("LEVEL", read("academy.html"))
        self.assertTrue(re.search(r'class="ec-level">LEVEL \d+ &middot; AXIS B', read("academy.html")))


if __name__ == "__main__":
    unittest.main()
