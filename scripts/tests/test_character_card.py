"""The main-character card must stay honest (CLAUDE.md 8.1 class 9) and reachable.

Static contract only; the render proof lives in docs/fixes/2026-11-15-character-card.md.
"""
import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = (ROOT / "omega-character-card.js").read_text(encoding="utf-8")
CARD_SRC = SRC


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

    def test_alive_character_scene_is_data_only_and_never_invents(self):
        sc = (ROOT / "omega-sculpture.js").read_text(encoding="utf-8")
        i = sc.index("SCENES.character = function")
        body = sc[i:sc.index("  /* \u2500\u2500 ASCENSION", i)]
        # data arrives after mount, so the scene must read its attributes every frame (inside update)
        upd = body[body.index("update: function"):]
        for attr in ("readGates()", "readMana()", "applyElement()"):
            self.assertIn(attr, upd)
        self.assertIn("data-sculpt-gates", body)
        self.assertIn("data-sculpt-mana", body)
        # unknown gates are never drawn as lit; a null mana component is a hollow ghost, not a small value
        self.assertIn("passed >= 0 && i < passed", body)
        self.assertIn("s.body.visible = v !== null", body)
        self.assertIn("s.ghost.visible = v === null", body)
        # colours come from the palette, never from a copy of the nine element colours or a sign table
        self.assertIn("elementColour(key", body)
        self.assertNotRegex(body, r"#[0-9a-fA-F]{6}'\s*,\s*'#")
        for sign in ("Aries", "Taurus", "Capricorn", "Ares", "Poseidon"):
            self.assertNotIn(sign, body)
        self.assertNotRegex(body, r"Math\.random")

    def test_card_feeds_the_scene_from_the_same_rules(self):
        self.assertIn("bootSigil", SRC)
        self.assertIn("fetchMana", SRC)           # the one owner of the member-activity read
        self.assertIn("gatesPassed(auth, canon)", SRC.replace("authorityOf(p, canon)", "auth"))
        page = (ROOT / "character.html").read_text(encoding="utf-8")
        self.assertIn('data-omega-sculpture="character"', page)
        self.assertIn("data-omega-character-sigil-note", page)
        self.assertIn("/omega-relearn-sigil-mana.js", page)
        self.assertIn("data-omega-character-sigil-note", (ROOT / "bg.js").read_text(encoding="utf-8"))


class EntityFacets(unittest.TestCase):
    """One entity, not six services: the facets a sign already has in the canon, joined, each linking to the page that owns it."""

    CANON = json.loads((ROOT / "omega-canon.json").read_text(encoding="utf-8"))
    ELEM = json.loads((ROOT / "omega-elements.json").read_text(encoding="utf-8"))

    def join(self, sign):
        """The same join facets() does in the browser, so the data contract runs without one."""
        track = next((t for t in self.CANON["tracks"] if t["sign"] == sign), None)
        ename = (self.ELEM["sign_element"].get(sign) or (track or {}).get("element") or "").upper()
        elem = next((e for e in self.ELEM["elements"] if e["name"].upper() == ename), None)
        house = next((h for h in self.CANON["lore_lattice"]["houses"] if h["sign"] == sign), None)
        return track, elem, house

    def test_every_sign_resolves_every_facet_from_the_canon(self):
        signs = [t["sign"] for t in self.CANON["tracks"]]
        self.assertEqual(len(signs), 12)
        for sign in signs:
            track, elem, house = self.join(sign)
            self.assertTrue(track and track["god"] and track["agent"] and track["gate"], sign)
            self.assertTrue(elem and elem["domain"], "%s: element has no canon text" % sign)
            self.assertTrue(house and house["domain"] and house["desc"], "%s: house has no domain" % sign)
            for k in ("medal", "trophy", "certificate"):
                self.assertTrue(track[k], "%s: %s" % (sign, k))

    def test_the_join_can_fail(self):
        """Zero findings only counts if a missing facet is seen."""
        track, elem, house = self.join("Ophiuchus")
        self.assertIsNone(track)
        self.assertIsNone(house)

    def test_loader_publishes_the_house_table(self):
        loader = (ROOT / "omega-canon.js").read_text(encoding="utf-8")
        self.assertIn("api.houses", loader)
        self.assertIn("lore_lattice", loader)

    def test_every_facet_links_to_a_page_that_exists(self):
        body = re.search(r"function facets\(track, canon\) \{(.*?)\n  \}\n", CARD_SRC, re.S)
        self.assertTrue(body, "facets() not found")
        hrefs = re.findall(r"href: '(/[a-z0-9_-]+\.html)'", body.group(1))
        self.assertEqual(len(hrefs), 6)
        for h in hrefs:
            self.assertTrue((ROOT / h.lstrip("/")).is_file(), h)

    def test_facets_are_built_from_text_nodes_only(self):
        body = re.search(r"function facets\(track, canon\) \{(.*?)\n  \}\n", CARD_SRC, re.S).group(1)
        self.assertNotRegex(body, r"innerHTML|insertAdjacentHTML|document\.write")

    def test_row_css_beats_the_global_a_href_rule(self):
        """A global sheet styles every a[href] as centred inline-flex (more specific than a bare class), which turned
        these rows into one centred line. Measured in a render; the selector must carry the .occ ancestor."""
        self.assertIn(".occ .occ-f{", CARD_SRC)
        self.assertNotRegex(CARD_SRC, r"'\.occ-f\{")


if __name__ == "__main__":
    unittest.main()
