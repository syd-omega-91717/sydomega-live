"""Agent Network's 3D constellation is a roster view, not operational telemetry."""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]
PAGE = (ROOT / "agent-network.html").read_text(encoding="utf-8")
SCULPTURE = (ROOT / "omega-sculpture.js").read_text(encoding="utf-8")
BG = (ROOT / "bg.js").read_text(encoding="utf-8")


class AgentNetwork3DContract(unittest.TestCase):
    def test_one_canonical_3d_mount_is_present(self):
        self.assertEqual(PAGE.count('data-omega-sculpture="agents"'), 1)
        self.assertIn('data-sculpt-height="clamp(340px,48vw,560px)"', PAGE)

    def test_two_dimensional_roster_fallback_is_preserved(self):
        self.assertIn('id="network-canvas"', PAGE)
        self.assertIn("drawNetwork();", PAGE)
        self.assertIn("CANONICAL ROSTER VERIFIED", PAGE)

    def test_3d_stage_states_its_reality_boundary(self):
        self.assertIn("ROSTER VISUAL · NOT EXECUTION TELEMETRY", PAGE)
        self.assertIn("do not represent live execution, permissions, or agent-to-agent dependencies", PAGE)
        self.assertIn("illustrative roster geometry, not live execution telemetry", SCULPTURE)

    def test_sculpture_loader_remains_the_only_webgl_owner(self):
        self.assertIn("if(document.querySelector('[data-omega-sculpture]')", BG)
        self.assertIn("_osc.src='/omega-sculpture.js'", BG)
        self.assertIn("SCENES.agents = function", SCULPTURE)

    def test_no_second_webgl_renderer_is_introduced(self):
        self.assertNotIn("new THREE.WebGLRenderer", PAGE)
        self.assertNotIn("getContext('webgl", PAGE)
        self.assertNotIn("getContext('webgl2", PAGE)


if __name__ == "__main__":
    unittest.main()
