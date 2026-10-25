"""Contract for omega-flow.js: scroll beam and Speculation Rules prefetch."""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]
JS = (ROOT / "omega-flow.js").read_text(encoding="utf-8")
BG = (ROOT / "bg.js").read_text(encoding="utf-8")


class OmegaFlowContract(unittest.TestCase):
    def test_injected_by_bg_under_its_own_guard(self):
        self.assertIn("script[data-omega-flow]", BG)
        self.assertIn("_oflw.src='/omega-flow.js'", BG)

    def test_prefetch_never_prerender(self):
        # A prerendered page runs its scripts, and pages here write on load.
        self.assertIn("prefetch: [{", JS)
        self.assertNotIn("prerender", JS.split("*/", 1)[1])

    def test_rule_excludes_query_strings_with_the_structured_pattern(self):
        # The string pattern '/*\\?*' matched every link, so its negation prefetched nothing.
        self.assertIn("href_matches: { pathname: '/*.html', search: '' }", JS)
        self.assertNotIn("href_matches: '/*\\\\?*'", JS)

    def test_beam_rests_invisible_without_a_scroll_timeline(self):
        self.assertIn("transform:scaleX(0)", JS)
        self.assertIn("@supports (animation-timeline:scroll())", JS)
        self.assertIn("pointer-events:none", JS)

    def test_css_constant_does_not_shadow_window_css(self):
        self.assertNotIn("var CSS =", JS)


if __name__ == "__main__":
    unittest.main()
