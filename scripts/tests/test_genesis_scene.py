"""The Genesis Planet is a deterministic, navigable scene in the single shared WebGL renderer."""
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
JS = (ROOT / "omega-sculpture.js").read_text(encoding="utf-8")
PAGE = (ROOT / "sculpture.html").read_text(encoding="utf-8")
WORLD = (ROOT / "world.html").read_text(encoding="utf-8")
ENGINE = (ROOT / "omega-world-engine.js").read_text(encoding="utf-8")


def scene_body():
    start = JS.index("SCENES.genesis = function")
    end = JS.index("SCENES.world = function", start)
    return JS[start:end]


class GenesisPlanetScene(unittest.TestCase):
    def test_scene_is_registered_and_mounted(self):
        self.assertIn("SCENES.genesis = function", JS)
        self.assertIn('data-omega-sculpture="genesis"', PAGE)
        self.assertIn('data-omega-sculpture="genesis"', WORLD)

    def test_symbolic_planet_has_canonical_visual_structure(self):
        body = scene_body()
        self.assertIn("for (var lat = -4; lat <= 4; lat++)", body)
        self.assertIn("for (var mer = 0; mer < 12; mer++)", body)
        self.assertIn("slice(0, 18)", body)
        self.assertIn("new T.SphereGeometry", body)

    def test_every_realm_node_is_a_real_route_link(self):
        body = scene_body()
        self.assertIn("window.OmegaWorldEngine.modules", body)
        self.assertIn("links.push({ object: group, href: mod.href", body)

    def test_no_external_art_or_random_member_state(self):
        body = scene_body()
        for banned in ("TextureLoader", "ImageLoader", "Math.random", "fetch("):
            self.assertNotIn(banned, body)

    def test_reduced_motion_is_respected(self):
        self.assertIn("prefers-reduced-motion: reduce", scene_body())

    def test_world_engine_publishes_route_evidence_to_module_registry(self):
        self.assertIn("mod.routeState=state", ENGINE)
        self.assertIn("mod.httpStatus=r.status", ENGINE)

    def test_planet_waypoints_reflect_verified_route_state(self):
        body = scene_body()
        self.assertIn("entry.mod.routeState || 'CHECKING'", body)
        self.assertIn("routeState === 'LIVE' ? 0x00FF88", body)
        self.assertIn("routeState === 'UNAVAILABLE' ? 0xCF6760", body)


if __name__ == "__main__":
    unittest.main()
