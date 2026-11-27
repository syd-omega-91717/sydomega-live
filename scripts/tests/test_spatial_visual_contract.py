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

    def test_world_has_registry_driven_genesis_planet_navigation_and_2d_fallback(self):
        world = (ROOT / "world.html").read_text()
        engine = (ROOT / "omega-world-engine.js").read_text()
        sculpture = (ROOT / "omega-sculpture.js").read_text()
        css = (ROOT / "omega-world-engine.css").read_text()
        bg = (ROOT / "bg.js").read_text()
        self.assertIn('data-omega-sculpture="genesis"', world)
        self.assertIn('data-sculpt-label="Rotating Genesis planet with 18 realm waypoints coloured by verified route reachability"', world)
        self.assertIn('id="omega-world-nodes" class="ow-nodes"', world)
        self.assertIn('<h3>MODULE DIRECTORY</h3>', world)
        self.assertEqual(world.count('/omega-world-engine.js'), 1)
        self.assertLess(world.index('/omega-world-engine.js'), world.index('/bg.js'))
        self.assertIn("window.OmegaWorldEngine={modules:modules", engine)
        self.assertIn("mod.routeState=state", engine)
        self.assertIn("SCENES.genesis = function (T, opt)", sculpture)
        self.assertIn("SCENES.world = function (T, opt)", sculpture)
        self.assertIn("window.OmegaWorldEngine.modules", sculpture)
        self.assertIn("links.push({ object: group, href: mod.href, label: mod.name || mod.id })", sculpture)
        self.assertIn("entry.mod.routeState || 'CHECKING'", sculpture)
        self.assertIn("world: 'The eighteen governed platform modules", sculpture)
        self.assertIn("genesis: 'A rotating symbolic planet", sculpture)
        self.assertIn("The eighteen platform modules", sculpture)
        self.assertIn("ow-spatial-world", css)
        self.assertIn("ow-module-directory", css)
        self.assertIn("document.querySelector('[data-omega-sculpture]')", bg)
        self.assertIn("_osc.src='/omega-sculpture.js'", bg)

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
