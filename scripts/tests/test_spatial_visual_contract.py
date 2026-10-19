import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]


class SpatialVisualContractTests(unittest.TestCase):
    def test_spatial_layer_is_integrated_without_architecture_replacement(self):
        spatial = ROOT / "omega-spatial-system.css"
        cinematic = ROOT / "omega-cinematic-system.css"
        opening = ROOT / "omega-opening-system.css"
        elevation = ROOT / "omega-page-elevation.css"
        runtime = ROOT / "omega-visual-runtime.js"
        entertainment = ROOT / "omega-entertainment-3d.css"
        self.assertTrue(spatial.is_file())
        self.assertTrue(opening.is_file())
        self.assertTrue(elevation.is_file())
        self.assertTrue(entertainment.is_file())
        self.assertIn("@import url('/omega-spatial-system.css');", cinematic.read_text())
        css = spatial.read_text()
        opening_css = opening.read_text()
        elevation_css = elevation.read_text()
        runtime_js = runtime.read_text()
        entertainment_css = entertainment.read_text()
        self.assertIn("transform-style:preserve-3d", css)
        self.assertIn("prefers-reduced-motion:reduce", css)
        self.assertIn("transform-style:preserve-3d", opening_css)
        self.assertIn("prefers-reduced-motion:reduce", opening_css)
        self.assertIn("transform-style:preserve-3d", elevation_css)
        self.assertIn("omega-page-elevation.css", runtime_js)
        # Decorative elements may be hidden on narrow screens; the structural
        # gateway itself must remain present rather than being replaced by a
        # flat/mobile-only alternative.
        self.assertNotIn(".omega-gateway{display:none", opening_css)
        self.assertIn("omega-world-card", entertainment_css)
        self.assertIn("omega-world-game", entertainment_css)
        self.assertIn("omega-world-cinema", entertainment_css)

    def test_opening_genesis_stays_scoped_to_index(self):
        runtime = (ROOT / "omega-visual-runtime.js").read_text()
        genesis = (ROOT / "omega-genesis.js").read_text()
        self.assertIn("omega-opening-system.css", runtime)
        self.assertIn("IS_INDEX", genesis)
        self.assertIn("if (!IS_INDEX) atmosphere();", genesis)

    def test_opening_keeps_existing_sculpture_mount(self):
        index = (ROOT / "index.html").read_text()
        runtime = (ROOT / "omega-visual-runtime.js").read_text()
        opening = (ROOT / "omega-opening-system.css").read_text()
        self.assertIn('data-omega-sculpture="signet"', index)
        self.assertIn('.ohz-hero-art[data-omega-sculpture]', runtime)
        # The turning signet is the hero; nothing may dim its canvas (2026-10-19).
        self.assertNotIn('.ohz-hero-art canvas{opacity', opening)


if __name__ == "__main__":
    unittest.main()
