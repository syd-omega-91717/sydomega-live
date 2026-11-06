"""The Zodiac Wars canon bible is a DRAFT that must stay consistent with the platform's own canon.

docs/canon/zodiac-wars/BIBLE.md invents a structure around the founder's pitch. This pins what must not drift (CLAUDE.md
8.1 class 8: two divergent copies of one canonical table): the twelve sign, element and god pairs must equal
omega-agents.json, the founder's pitch must stay verbatim and equal the slate JSON, the draft banner must stay, and the
document must not claim anything exists (released, streaming, playable, a trailer).
"""
import json
import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
BIBLE = (ROOT / "docs" / "canon" / "zodiac-wars" / "BIBLE.md").read_text(encoding="utf-8")
SLATE = json.loads((ROOT / "config" / "omega-franchise-slate.json").read_text(encoding="utf-8"))
AGENTS = json.loads((ROOT / "omega-agents.json").read_text(encoding="utf-8"))
AGENTS = AGENTS if isinstance(AGENTS, list) else AGENTS["agents"]
CANON = json.loads((ROOT / "omega-canon.json").read_text(encoding="utf-8"))
ZW = next(f for f in SLATE["franchises"] if f["id"] == "zodiac-wars")


def table_rows(section_title):
    start = BIBLE.index(section_title)
    block = BIBLE[start:].split("\n## ", 1)[0]
    rows = []
    for line in block.splitlines():
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if line.startswith("|") and len(cells) >= 2 and not set(cells[0]) <= set("-: "):
            rows.append(cells)
    return rows[1:]  # drop the header


class ZodiacWarsCanon(unittest.TestCase):
    def test_it_is_marked_as_a_draft_and_not_approved(self):
        head = BIBLE[:900]
        self.assertIn("DRAFT CANON", head)
        self.assertIn("not approved", head)
        self.assertIs(ZW["canon"]["approvedByOwner"], False)
        self.assertEqual(ZW["canon"]["status"], "DRAFT")

    def test_the_founders_pitch_is_verbatim_and_matches_the_slate(self):
        self.assertIn(ZW["pitch"], BIBLE)

    def test_twelve_gods_match_the_platforms_sign_element_god_table(self):
        rows = table_rows("## 3. The Twelve Zodiac Gods")
        got = {(r[0], r[1], r[2]) for r in rows}  # (House, Element, Light ruler)
        want = {(a["sign"], a["element"], a["god"]) for a in AGENTS}
        self.assertEqual(len(rows), 12)
        self.assertEqual(got, want)

    def test_every_house_has_a_world_a_shadow_and_a_knight(self):
        gods = table_rows("## 3. The Twelve Zodiac Gods")
        self.assertEqual(len({r[3] for r in gods}), 12, "twelve distinct worlds")
        self.assertEqual(len({r[4] for r in gods}), 12, "twelve distinct shadows")
        knights = table_rows("## 5. The Celestial Knights")
        self.assertEqual([k[0] for k in knights], [g[0] for g in gods])

    def test_the_four_guardians_are_exactly_the_elements_with_no_house(self):
        houseless = [e["name"] for e in CANON["elements"] if not e["signs"]]
        self.assertEqual(sorted(houseless), ["SOUL", "SPACE", "THE ALL", "VOID"])
        for name in ("Soul", "Space", "Void", "The All"):
            self.assertIn(name, BIBLE.split("## 4.", 1)[1].split("## 5.", 1)[0])

    def test_no_claim_that_anything_exists(self):
        claims = re.compile(r"\b(now streaming|streaming now|released on|out now|in theatres|in theaters|playable now|"
                            r"available now|watch the trailer|download the game)\b", re.I)
        self.assertIsNone(claims.search(BIBLE))
        self.assertIn("Nothing in this document claims a release", BIBLE)


if __name__ == "__main__":
    unittest.main()
