"""One member, one source: the character page shows the member's tree, plays their element and reads their house, all from the canon.

Rendered in headless Chromium on desktop and phone (character.html, signed-in stub: Aries): the tree is live with 2,953 lattice records, nothing plays before a press, the music
starts and stops, the voice is handed the canon's own text, 0 console errors - see docs/fixes/2026-11-15-one-entity-sense.md. This file keeps what CI can:
no hand-typed sign table in the card module, sound only from a button press, the caveats stay readable, and the music module's own sign->element copy cannot drift from the canon.
"""
import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CARD = (ROOT / "omega-character-card.js").read_text(encoding="utf-8")
PAGE = (ROOT / "character.html").read_text(encoding="utf-8")
MUSIC = (ROOT / "omega-music.js").read_text(encoding="utf-8")
SCULPT = (ROOT / "omega-sculpture.js").read_text(encoding="utf-8")
ELEMENTS = json.loads((ROOT / "omega-elements.json").read_text(encoding="utf-8"))
SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"]


def sense_body():
    start = CARD.index("function bootSense(")
    end = CARD.index("async function bootRoster(", start)
    return CARD[start:end]


def music_sign_elem():
    m = re.search(r"SIGN_ELEM=\{([^}]*)\}", MUSIC)
    return {k: v for k, v in re.findall(r"(\w+):'(\w+)'", m.group(1))}


class OneEntitySense(unittest.TestCase):
    def test_page_mounts_both(self):
        self.assertIn('data-omega-sculpture="chronos"', PAGE)
        self.assertIn("data-omega-character-sense", PAGE)

    def test_everything_is_read_from_the_canon(self):
        body = sense_body()
        for needed in ("canon.trackBySign(", "canon.elementFor(", "canon.houses", "track.sign"):
            self.assertIn(needed, body)
        for sign in SIGNS:
            self.assertNotRegex(CARD, rf"\b{sign}\s*[:=]\s*['\"]", f"a hand-typed table entry for {sign}")

    def test_sound_only_from_a_button_press(self):
        body = sense_body()
        # the whole module, not just this function: autoplay added anywhere else in the file must fail too
        self.assertEqual(len(re.findall(r"\.play\(", CARD)), 1, "exactly one place in the whole module may start the music")
        self.assertEqual(len(re.findall(r"\.speak\(", CARD)), 1, "exactly one place in the whole module may start the voice")
        i = body.index("M.play(")
        self.assertIn("addEventListener('click'", body[max(0, i - 700):i], "the music may start only inside a click handler")
        j = body.index("SS.speak(")
        self.assertIn("addEventListener('click'", body[max(0, j - 900):j], "the voice may start only inside a click handler")
        self.assertIn("pagehide", body, "sound must stop when the page is left")

    def test_caveats_stay_readable(self):
        self.assertIn("note.setAttribute('data-no-clamp', '')", sense_body(), "the platform's read-more clamp would fold the caveats away")
        for said in ("no stage is measured for you", "sends nothing anywhere", "Both start only when you press"):
            self.assertIn(said, sense_body())

    def test_tree_reads_the_sign_after_it_loads(self):
        update = SCULPT[SCULPT.index("SCENES.chronos = function"):SCULPT.index("/* ── AGENTS")]
        tail = update[update.index("update: function"):]
        self.assertIn("getAttribute('data-sculpt-sign')", tail, "the sign is set after the profile loads, which is after the scene starts")

    def test_music_module_copy_of_sign_to_element_matches_the_canon(self):
        canon = {k: v.lower() for k, v in ELEMENTS["sign_element"].items()}
        mine = {k: v.lower() for k, v in music_sign_elem().items()}
        self.assertEqual(sorted(mine), sorted(SIGNS))
        self.assertEqual(mine, canon, "omega-music.js carries a hand-typed copy of the canon's sign->element table")

    def test_every_element_a_sign_can_have_has_a_recipe(self):
        recipes = set(re.findall(r"^\s{1,3}(\w+):\{", MUSIC[MUSIC.index("var RECIPES={"):MUSIC.index("};", MUSIC.index("var RECIPES={"))], re.M))
        for element in set(v.title() for v in ELEMENTS["sign_element"].values()):
            self.assertIn(element, recipes, f"no music recipe for {element}")


if __name__ == "__main__":
    unittest.main()
