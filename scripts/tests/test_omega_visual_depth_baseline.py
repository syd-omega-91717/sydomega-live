#!/usr/bin/env python3
"""Guard the global visual baseline against accidental flattening or motion regressions."""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]
CSS = ROOT / "css" / "omega-simple-ui.css"


class OmegaVisualDepthContract(unittest.TestCase):
    def test_clean_surface_retains_layered_depth(self):
        source = CSS.read_text(encoding="utf-8")
        self.assertIn("--omega-simple-shadow:", source)
        self.assertIn("--omega-simple-shadow-hover:", source)
        self.assertIn("translateY(-3px)", source)
        self.assertIn("border-color:rgba(201,168,76,.42)", source)

    def test_ambient_noise_remains_suppressed_by_default(self):
        source = CSS.read_text(encoding="utf-8")
        self.assertIn(".omega-particles", source)
        self.assertIn("display:none!important", source)

    def test_reduced_motion_remains_respected(self):
        source = CSS.read_text(encoding="utf-8")
        self.assertIn("@media(prefers-reduced-motion:reduce)", source)
        self.assertIn("transition:none", source)
        self.assertIn("transform:none", source)

    def test_simple_ui_does_not_globally_force_flat_cards(self):
        source = CSS.read_text(encoding="utf-8")
        self.assertNotIn("box-shadow:none!important", source)
        self.assertNotIn("transform:none!important", source)
        self.assertNotIn("backdrop-filter:none!important", source)


if __name__ == "__main__":
    unittest.main()
