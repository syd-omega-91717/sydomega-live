"""The universe canon must partition the saga's 12 chapters and match what media.html and universe.html say."""
import json
import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
CANON = json.loads((ROOT / "config" / "omega-universe-canon.json").read_text(encoding="utf-8"))
SLATE = json.loads((ROOT / "config" / "omega-franchise-slate.json").read_text(encoding="utf-8"))
MEDIA = (ROOT / "media.html").read_text(encoding="utf-8")
PAGE = (ROOT / "universe.html").read_text(encoding="utf-8")
RX = r"\{n:(\d+),title:'[^']+',sub:'[^']*',year:\d+,el:'([^']+)'"
CHAPTERS = {int(n): el for n, el in re.findall(RX, MEDIA)}


class UniverseCanon(unittest.TestCase):
    def test_media_has_twelve_chapters(self):
        self.assertEqual(sorted(CHAPTERS), list(range(1, 13)))

    def test_anchors_partition_the_chapters_exactly_once(self):
        seen = [c for a in CANON["anchors"] for c in a["chapters"]]
        self.assertEqual(sorted(seen), list(range(1, 13)))

    def test_anchors_name_the_slate_franchises(self):
        self.assertEqual(sorted(a["franchise"] for a in CANON["anchors"]), sorted(f["id"] for f in SLATE["franchises"]))

    def test_elements_match_media(self):
        for a in CANON["anchors"]:
            self.assertEqual(a["elements"], [CHAPTERS[c] for c in a["chapters"]], a["franchise"])

    def test_cards_show_the_chapter_line(self):
        for a in CANON["anchors"]:
            c = a["chapters"]
            rng = str(c[0]) if len(c) == 1 else "%d-%d" % (c[0], c[-1])
            line = "SAGA CH. %s &middot; %s" % (rng, a.get("cardElements") or ", ".join(x.upper() for x in a["elements"]))
            self.assertIn(line, PAGE, a["franchise"])

    def test_nothing_is_approved_or_released(self):
        self.assertFalse(CANON["approvedByOwner"])
        self.assertTrue(all(f["status"] == "CONCEPT" for f in SLATE["franchises"]))

    def test_matrix_decision_is_104976(self):
        self.assertTrue(any("104,976" in d["decision"] for d in CANON["decisions"]))


if __name__ == "__main__":
    unittest.main()
