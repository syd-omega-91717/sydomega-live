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
        self.assertTrue(spatial.is_file())
        self.assertTrue(opening.is_file())
        self.assertTrue(elevation.is_file())
        self.assertIn("@import url('/omega-spatial-system.css');", cinematic.read_text())
        css = spatial.read_text()
        opening_css = opening.read_text()
        elevation_css = elevation.read_text()
        runtime_js = runtime.read_text()
        self.assertIn("transform-style:preserve-3d", css)
        self.assertIn("prefers-reduced-motion:reduce", css)
        self.assertIn("transform-style:preserve-3d", opening_css)
        self.assertIn("prefers-reduced-motion:reduce", opening_css)
        self.assertIn("transform-style:preserve-3d", elevation_css)
        self.assertIn("omega-page-elevation.css", runtime_js)
        self.assertNotIn("display:none", css)
        self.assertNotIn("display:none", opening_css)

    def test_opening_is_a_dimensional_non_rotative_omega_nexus(self):
        runtime = (ROOT / "omega-visual-runtime.js").read_text()
        opening = (ROOT / "omega-opening-system.css").read_text()
        genesis = (ROOT / "omega-genesis.js").read_text()
        self.assertIn("omega-gateway", runtime)
        self.assertIn("omega-gateway-chamber", runtime)
        self.assertIn("omega-gateway-portal", runtime)
        self.assertIn("omega-gateway-monolith", runtime)
        self.assertIn("omega-opening-system.css", runtime)
        self.assertIn("omega-gateway-core", opening)
        self.assertIn("omega-gateway-mark", opening)
        self.assertIn("omega-gateway-floor", opening)
        self.assertIn("preserve-3d", opening)
        self.assertIn("IS_INDEX", genesis)
        self.assertIn("if (!IS_INDEX) atmosphere();", genesis)
        self.assertNotIn("rotateY(360deg)", runtime)
        self.assertNotIn("omegaGenesisOrbit", runtime)
        self.assertNotIn("animation:omega", opening)

    def test_opening_keeps_existing_sculpture_mount(self):
        index = (ROOT / "index.html").read_text()
        runtime = (ROOT / "omega-visual-runtime.js").read_text()
        self.assertIn('data-omega-sculpture="signet"', index)
        self.assertIn('.ohz-hero-art[data-omega-sculpture="signet"]', runtime)
        self.assertIn('.ohz-hero-art canvas{opacity:.12!important', (ROOT / "omega-opening-system.css").read_text())


if __name__ == "__main__":
    unittest.main()
