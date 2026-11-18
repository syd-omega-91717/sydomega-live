"""Accessible guide discovery: search every answer, expose result state and FAQ controls."""
import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
SCRIPT = (ROOT / "omega-guide.js").read_text(encoding="utf-8")


class GuideDiscoveryTests(unittest.TestCase):
    def test_search_indexes_generated_answer_content(self):
        self.assertIn("typeof f[2] === 'string' ? f[2]", SCRIPT)
        self.assertIn("n.textContent", SCRIPT)
        self.assertIn("MATCH YOUR SEARCH", SCRIPT)

    def test_search_and_result_state_are_accessible(self):
        self.assertIn("Search questions and answers", SCRIPT)
        self.assertIn("aria-live', 'polite", SCRIPT)
        self.assertIn("aria-atomic', 'true", SCRIPT)
        self.assertIn("aria-label', 'Clear guide search", SCRIPT)

    def test_bulk_controls_are_real_buttons_and_preserve_native_details(self):
        self.assertIn("EXPAND ALL", SCRIPT)
        self.assertIn("COLLAPSE ALL", SCRIPT)
        self.assertIn("querySelectorAll('details')", SCRIPT)
        self.assertIn("det.appendChild(mk('summary'", SCRIPT)

    def test_guide_never_injects_untrusted_html(self):
        self.assertNotIn("innerHTML", SCRIPT)
        self.assertIn("textContent", SCRIPT)


if __name__ == "__main__":
    unittest.main()
