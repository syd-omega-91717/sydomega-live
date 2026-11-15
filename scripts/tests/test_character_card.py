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
        self.assertNotRegex(SRC, r"\.(insert|update|upsert|delete|rpc)\(")

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


if __name__ == "__main__":
    unittest.main()
