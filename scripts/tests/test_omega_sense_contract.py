"""Contract for omega-sense.js: element-tuned interaction tones and haptics."""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[2]
JS = (ROOT / "omega-sense.js").read_text(encoding="utf-8")
CODE = JS.split("*/", 1)[1]
BG = (ROOT / "bg.js").read_text(encoding="utf-8")


class OmegaSenseContract(unittest.TestCase):
    def test_injected_by_bg_under_its_own_guard(self):
        self.assertIn("script[data-omega-sense]", BG)
        self.assertIn("_osns.src='/omega-sense.js'", BG)

    def test_element_comes_from_theme_js_not_a_copy(self):
        self.assertIn("store('omega_theme_element')", CODE)
        self.assertNotRegex(CODE, r"ARIES|TAURUS|GEMINI|elementFor\(")

    def test_success_is_never_inferred(self):
        # bg.js echoes a gold toast on SAVE/SUBMIT clicks before any write resolves.
        self.assertNotIn("cue('success')", CODE)
        self.assertIn("if (type === 'error') cue('error');", CODE)

    def test_sound_is_explicit_opt_in_and_reduced_motion_silences_both(self):
        self.assertIn("store('omega_sound') === 'on'", CODE)
        self.assertRegex(CODE, r"function soundOn\(\) \{ return !REDUCED")
        self.assertRegex(CODE, r"function hapticsOn\(\) \{ return !REDUCED")

    def test_one_engine_per_click(self):
        nine = (ROOT / "omega-9d.js").read_text(encoding="utf-8")
        self.assertIn("if (window.OmegaSense) return;", nine)
        sdt = (ROOT / "omega-sdt.js").read_text(encoding="utf-8")
        self.assertIn("window.OmegaSense.cue('unlock')", sdt)

    def test_press_has_no_haptic(self):
        self.assertRegex(CODE, r"press:\s+\{[^}]*haptic: null")


if __name__ == "__main__":
    unittest.main()
