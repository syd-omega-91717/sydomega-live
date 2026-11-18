import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]


class OmegaGlobalVisualFinishTests(unittest.TestCase):
    def test_shared_shell_loads_global_visual_layer_once(self):
        shell = (ROOT / "bg.js").read_text(encoding="utf-8")
        self.assertIn("data-omega-global-visual-finish", shell)
        self.assertIn("/omega-global-visual-finish.css", shell)

    def test_visual_layer_preserves_accessibility_and_mobile_performance(self):
        css = (ROOT / "omega-global-visual-finish.css").read_text(encoding="utf-8")
        self.assertIn("@media(prefers-reduced-motion:reduce)", css)
        self.assertIn(":focus-visible", css)
        self.assertIn("@media(max-width:760px)", css)
        self.assertIn("backdrop-filter:blur(9px)", css)
        self.assertNotIn("cursor:", css)

    def test_visual_layer_does_not_hide_or_rewrite_page_content(self):
        css = (ROOT / "omega-global-visual-finish.css").read_text(encoding="utf-8")
        self.assertNotIn("display:none", css)
        self.assertNotIn("visibility:hidden", css)
        self.assertNotIn("pointer-events:none", css)


if __name__ == "__main__":
    unittest.main()
