"""The main-character card must stay honest (CLAUDE.md 8.1 class 9) and reachable.

Static contract only; the render proof lives in docs/fixes/2026-11-15-character-card.md.
"""
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = (ROOT / "omega-character-card.js").read_text(encoding="utf-8")


class CharacterCard(unittest.TestCase):
    def test_no_html_sinks_and_no_writes(self):
        self.assertNotRegex(SRC, r"innerHTML|outerHTML|insertAdjacentHTML|document\.write")
        self.assertNotRegex(SRC, r"\.(insert|update|upsert|delete)\(")
        # The only RPC allowed is the read my_matrix() (it seeds the caller's own
        # missing matrix_progress rows, as it does on every page that calls it);
        # never advance_matrix or any other writer.
        self.assertEqual(set(re.findall(r"\.rpc\('([a-z_]+)'", SRC)), {"my_matrix"})
        self.assertNotIn("advance_matrix", re.sub(r"/\*.*?\*/", "", SRC, flags=re.S))

    def test_no_invented_values(self):
        self.assertNotRegex(SRC, r"Math\.random|getMonth\(\)")

    def test_signs_come_from_the_canon_not_a_copy(self):
        for name in ("Aries", "Taurus", "Capricorn", "Ares", "Poseidon"):
            self.assertNotIn(name, SRC)
        self.assertIn("trackBySign", SRC)

    def test_authority_uses_the_page_rule(self):
        self.assertIn("Math.pow(x, 3)", SRC)
        self.assertIn("a.phi / a.euler", SRC)
        self.assertIn("is_owner", SRC)

    def test_selects_only_columns_that_exist(self):
        cols = re.search(r"var COLS = '([^']+)'", SRC).group(1).split(",")
        import json
        live = json.loads((ROOT / "supabase" / "live-schema.json").read_text(encoding="utf-8"))
        tables = live.get("tables", live)
        prof = tables.get("public.profiles") or tables.get("profiles")
        have = set(prof.get("columns", prof) if isinstance(prof, dict) else prof)
        self.assertEqual([c for c in cols if c not in have], [])

    def test_loaded_only_where_mounted_and_mount_exists(self):
        bg = (ROOT / "bg.js").read_text(encoding="utf-8")
        self.assertIn("data-omega-character-card-js", bg)
        self.assertIn("/omega-character-card.js", bg)
        self.assertIn("data-omega-character-card", (ROOT / "character.html").read_text(encoding="utf-8"))

    def test_character_page_never_guesses_a_sign(self):
        page = (ROOT / "character.html").read_text(encoding="utf-8")
        self.assertNotIn("getMonth()", page)
        self.assertIn("hasSign", page)
        self.assertNotRegex(page, r"if\(signIdx<0\)signIdx=0")

    def test_roster_reads_my_matrix_and_checks_the_error(self):
        self.assertIn("rpc('my_matrix')", SRC)
        self.assertRegex(SRC, r"if \(m\.error\)")

    def test_roster_never_uses_platform_layout_class_tokens(self):
        """`.main` is the content column: omega-legal.js / omega-ui.js append the
        footer to it, so a tile classed `main` swallowed the site footer."""
        for cls in re.findall(r"el\('div', '([^']*)'", SRC) + re.findall(r"'(ocr-t[^']*)'", SRC):
            for tok in cls.split():
                self.assertNotIn(tok, {"main", "on", "lf", "card", "side", "shell"}, cls)
        self.assertNotRegex(SRC, r"\.ocr-t\.(main|on)\b")

    def test_roster_mount_exists_and_is_injected(self):
        self.assertIn("data-omega-character-roster", (ROOT / "character.html").read_text(encoding="utf-8"))
        self.assertIn("data-omega-character-roster", (ROOT / "bg.js").read_text(encoding="utf-8"))

    def test_stories_match_the_canon_and_stay_safe(self):
        import json
        canon = json.loads((ROOT / "omega-canon.json").read_text(encoding="utf-8"))
        doc = json.loads((ROOT / "omega-stories.json").read_text(encoding="utf-8"))
        self.assertEqual(doc["truth"], "RETELLING")
        self.assertEqual(len(doc["chapter_gates"]), 4)
        self.assertEqual(doc["chapter_gates"], sorted(doc["chapter_gates"]))
        self.assertEqual(doc["chapter_gates"][0], 0)  # chapter I is open to everyone
        self.assertLessEqual(max(doc["chapter_gates"]), len(canon["authority"]["gates"]))
        self.assertEqual(sorted(doc["stories"]), sorted(t["sign"] for t in canon["tracks"]))
        for t in canon["tracks"]:
            st = doc["stories"][t["sign"]]
            self.assertEqual(len(st["chapters"]), 4, t["sign"])
            # gods, agents and gates are canon: a story may name them but must name the canon's, so it cannot drift
            self.assertIn(t["agent"], st["chapters"][1], t["sign"])
            self.assertIn(t["god"], st["chapters"][2], t["sign"])
            self.assertIn(t["gate"], st["chapters"][3], t["sign"])
            self.assertTrue(st["sources"], t["sign"])
            self.assertTrue(st["variant"], t["sign"])
            for ch in st["chapters"]:
                self.assertRegex(ch, r"^[^<>]+$")  # plain prose, no markup

    def test_story_never_ships_locked_text_and_is_mounted(self):
        self.assertIn("renderStory", SRC)
        self.assertIn("if (open) el('p', 'ocs-p', text, ch);", SRC)  # locked chapters get a gate line, never the text
        self.assertIn("data-omega-character-story", (ROOT / "character.html").read_text(encoding="utf-8"))
        self.assertIn("data-omega-character-story", (ROOT / "bg.js").read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
