"""Contract tests for the canonical, session-only Elemental Resonance Composer."""
from pathlib import Path
import json
import re
import unittest

ROOT = Path(__file__).resolve().parents[2]
PAGE = (ROOT / "elements.html").read_text(encoding="utf-8")
SCRIPT = (ROOT / "elemental-resonance.js").read_text(encoding="utf-8")
STYLE = (ROOT / "assets" / "elemental-resonance.css").read_text(encoding="utf-8")
CANON = json.loads((ROOT / "omega-elements.json").read_text(encoding="utf-8"))


class ElementalResonanceComposerTests(unittest.TestCase):
    def test_composer_is_mounted_in_elements_tab(self):
        start = PAGE.index('id="tab-elements"')
        end = PAGE.index('id="tab-gates"', start)
        panel = PAGE[start:end]
        self.assertIn('id="er-composer"', panel)
        self.assertIn('id="er-stage"', panel)
        self.assertIn('href="/assets/elemental-resonance.css"', PAGE)
        self.assertIn('src="/elemental-resonance.js"', PAGE)

    def test_composer_reads_the_nine_element_canon(self):
        self.assertEqual(CANON["count"], 9)
        self.assertEqual(len(CANON["elements"]), 9)
        self.assertEqual(sum(e["tier"] == "PHYSICAL" for e in CANON["elements"]), 5)
        self.assertEqual(sum(e["tier"] == "METAPHYSICAL" for e in CANON["elements"]), 3)
        self.assertEqual(sum(e["tier"] == "TRANSCENDENT" for e in CANON["elements"]), 1)
        self.assertIn("fetch('/omega-elements.json'", SCRIPT)
        self.assertIn("canon.elements", SCRIPT)
        self.assertIn("element.tier", SCRIPT)
        self.assertIn("element.domain", SCRIPT)

    def test_palette_and_color_inputs_are_validated(self):
        self.assertIn("window.OmegaRealm&&window.OmegaRealm.palette", SCRIPT)
        self.assertIn("entry.core", SCRIPT)
        self.assertIn("safeHex", SCRIPT)
        self.assertIn("paletteAttempts", SCRIPT) if "paletteAttempts" in SCRIPT else self.assertIn("waitForPalette", SCRIPT)

    def test_composition_is_limited_to_three_unique_elements(self):
        self.assertIn('id="er-element-1"', PAGE)
        self.assertIn('id="er-element-2"', PAGE)
        self.assertIn('id="er-element-3"', PAGE)
        self.assertIn("new Set(values)", SCRIPT)
        self.assertIn("unique.size!==values.length", SCRIPT)
        self.assertIn("SELECT ONE TO THREE DISTINCT ELEMENTS", SCRIPT)

    def test_user_created_composition_is_not_progression_or_persisted_state(self):
        self.assertIn("USER-CREATED", PAGE)
        self.assertIn("SESSION ONLY", PAGE)
        self.assertIn("NO PROGRESSION", PAGE)
        self.assertIn("No data is written to Supabase, member progression, or local storage", PAGE)
        self.assertNotIn("localStorage", SCRIPT)
        self.assertNotIn("supabase", SCRIPT.lower())
        self.assertNotIn(".from(", SCRIPT)

    def test_vector_export_is_real_and_escapes_canonical_text(self):
        self.assertIn("buildSvg", SCRIPT)
        self.assertIn("image/svg+xml;charset=utf-8", SCRIPT)
        self.assertIn("URL.createObjectURL", SCRIPT)
        self.assertIn("escapeXml", SCRIPT)
        self.assertIn("anchor.download", SCRIPT)

    def test_dom_rendering_avoids_html_string_injection(self):
        self.assertNotIn("innerHTML", SCRIPT)
        self.assertIn("document.createElement", SCRIPT)
        self.assertIn("textContent", SCRIPT)
        self.assertIn("replaceChildren", SCRIPT)

    def test_visuals_are_responsive_tokenized_and_reduced_motion_safe(self):
        self.assertIn("@media(max-width:760px)", STYLE)
        self.assertIn("@media(max-width:460px)", STYLE)
        self.assertIn("@media(prefers-reduced-motion:reduce)", STYLE)
        self.assertIn("animation:none", STYLE)
        self.assertIn('.er-stage[data-count="3"]', STYLE)
        self.assertNotRegex(STYLE, re.compile(r"#[0-9a-fA-F]{3,8}"))
        self.assertNotIn("!important", STYLE)


if __name__ == "__main__":
    unittest.main()
