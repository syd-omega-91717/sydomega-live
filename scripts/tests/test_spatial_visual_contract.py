import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]


class SpatialVisualContractTests(unittest.TestCase):
    def test_spatial_layer_is_integrated_without_architecture_replacement(self):
        spatial = ROOT / "omega-spatial-system.css"
        cinematic = ROOT / "omega-cinematic-system.css"
        self.assertTrue(spatial.is_file())
        self.assertIn("@import url('/omega-spatial-system.css');", cinematic.read_text())
        css = spatial.read_text()
        self.assertIn("transform-style:preserve-3d", css)
        self.assertIn("prefers-reduced-motion:reduce", css)
        self.assertNotIn("display:none", css)

    def test_opening_is_not_driven_by_legacy_canvas_rotation(self):
        runtime = (ROOT / "omega-visual-runtime.js").read_text()
        self.assertIn("omega-genesis", runtime)
        self.assertIn("perspective:1100px", runtime)
        self.assertIn("opacity:.07", runtime)
        self.assertNotIn("animation:omegaGenesisOrbit", runtime)
        self.assertNotIn("rotateY(360deg)", runtime)

    def test_opening_keeps_existing_sculpture_mount(self):
        index = (ROOT / "index.html").read_text()
        runtime = (ROOT / "omega-visual-runtime.js").read_text()
        self.assertIn('data-omega-sculpture="signet"', index)
        self.assertIn(".ohz-hero-art[data-omega-sculpture=\"signet\"]", runtime)


if __name__ == "__main__":
    unittest.main()
