"""Contract tests for the member-bound 3D Character Core on Profile."""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]
PAGE = (ROOT / "profile.html").read_text(encoding="utf-8")
STYLE = (ROOT / "assets" / "profile-character-3d.css").read_text(encoding="utf-8")
CANON = (ROOT / "omega-elements.json").read_text(encoding="utf-8")
SCULPTURE = (ROOT / "omega-sculpture.js").read_text(encoding="utf-8")


class ProfileCharacterCoreTests(unittest.TestCase):
    def test_character_scene_is_inside_the_character_tab(self):
        start = PAGE.index('id="tab-character"')
        end = PAGE.index('id="tab-', start + 8)
        panel = PAGE[start:end]
        self.assertIn('id="profile-character-core"', panel)
        self.assertIn("stage.setAttribute('data-omega-sculpture','character')", PAGE)
        self.assertIn("api.mount(stage)", PAGE)
        self.assertIn('id="profile-character-element-state"', panel)

    def test_element_binding_uses_canonical_sign_registry(self):
        self.assertIn("fetch('/omega-elements.json'", PAGE)
        self.assertIn("canon.sign_element", PAGE)
        self.assertIn("profile.sign", PAGE)
        self.assertIn("data-sculpt-element", PAGE)
        self.assertIn("window.OmegaRealm&&window.OmegaRealm.palette", PAGE)
        self.assertIn("api.mount(stage)", PAGE)
        self.assertLess(PAGE.index("stage.setAttribute('data-sculpt-element',paletteKey)"), PAGE.index("stage.setAttribute('data-omega-sculpture','character')"))
        self.assertIn('"sign_element"', CANON)

    def test_element_binding_is_case_insensitive_and_validated(self):
        self.assertIn("key.toLowerCase()===savedSign.toLowerCase()", PAGE)
        self.assertIn("key.toLowerCase()===elementName.toLowerCase()", PAGE)
        self.assertIn("WAITING FOR ELEMENT PALETTE", PAGE)
        self.assertIn("WAITING FOR 3D CHARACTER ENGINE", PAGE)
        self.assertIn("attempts++<50", PAGE)
        self.assertIn("paletteAttempts<20", PAGE)
        self.assertIn("ELEMENT PALETTE UNAVAILABLE", PAGE)
        self.assertIn("NO CANON ELEMENT FOR SAVED SIGN", PAGE)

    def test_unknown_progression_is_not_fabricated(self):
        self.assertNotIn("data-sculpt-gates", PAGE)
        self.assertNotIn("data-sculpt-mana", PAGE)
        self.assertIn("GATE PROGRESSION · NOT CONNECTED", PAGE)
        self.assertIn("MASTERY FEED · NOT CONNECTED", PAGE)
        self.assertIn("remain neutral until their own verified member data sources are connected", PAGE)

    def test_failed_canon_read_keeps_a_neutral_state(self):
        self.assertIn("CANON ELEMENT SOURCE UNAVAILABLE · NEUTRAL CORE", PAGE)
        self.assertIn("NO SAVED SIGN · NEUTRAL CORE", PAGE)

    def test_visual_panel_is_mobile_readable_and_reduced_motion_compatible(self):
        self.assertIn("@media(max-width:620px)", STYLE)
        self.assertIn("@media(prefers-reduced-motion:reduce)", STYLE)
        self.assertIn("font:700 12px", STYLE)
        self.assertNotRegex(STYLE, r"#[0-9a-fA-F]{3,8}")
        self.assertNotIn("!important", STYLE)
        start = SCULPTURE.index("SCENES.character = function")
        end = SCULPTURE.index("SCENES.ascension = function", start)
        character_scene = SCULPTURE[start:end]
        self.assertIn("matchMedia('(prefers-reduced-motion: reduce)')", character_scene)
        self.assertIn("if (!reduceMotion)", character_scene)


if __name__ == "__main__":
    unittest.main()
