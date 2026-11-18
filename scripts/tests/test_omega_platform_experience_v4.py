#!/usr/bin/env python3
"""Contract tests for the site-wide Omega Platform Experience v4 layer."""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[2]
BG = ROOT / "bg.js"
CSS = ROOT / "omega-platform-experience-v4.css"


class OmegaPlatformExperienceV4Contract(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.bg = BG.read_text(encoding="utf-8")
        cls.css = CSS.read_text(encoding="utf-8")

    def test_versioned_stylesheet_is_loaded_by_the_global_runtime(self):
        self.assertIn("omega-platform-experience-v4-css", self.bg)
        self.assertIn("/omega-platform-experience-v4.css?v=20261118-v4", self.bg)
        self.assertGreater(
            self.bg.index("omega-platform-experience-v4.css?v=20261118-v4"),
            self.bg.index("omega-devtools.js"),
        )
        self.assertTrue(self.bg.rstrip().endswith("})();"))

    def test_shared_platform_primitives_receive_visual_treatment(self):
        for selector in (
            "body.omega-simple .topbar",
            "body.omega-simple .side",
            "body.omega-simple :where(.card,.kpi,.kpi-card,.panel",
            "body.omega-simple .sechead",
            "body.omega-simple :where(input,select,textarea",
            "body.omega-simple :where(.tbl-wrap,.table-wrap",
        ):
            self.assertIn(selector, self.css)

    def test_motion_is_reduced_for_accessibility_and_touch_is_not_tilted(self):
        self.assertIn("@media(prefers-reduced-motion:reduce)", self.css)
        self.assertIn("@media(max-width:760px)", self.css)
        self.assertIn("prefers-reduced-motion: reduce", self.bg)
        self.assertIn("pointer: coarse", self.bg)

    def test_global_layer_does_not_disable_interactions_or_hide_content(self):
        self.assertNotRegex(self.css, r"pointer-events\s*:\s*none")
        self.assertNotRegex(self.css, r"display\s*:\s*none")
        self.assertNotRegex(self.css, r"visibility\s*:\s*hidden")
        self.assertNotIn("!important", self.css)

    def test_stylesheet_has_responsive_glass_depth_and_animated_insignia(self):
        self.assertIn("backdrop-filter:blur(14px)", self.css)
        self.assertIn("var(--omega-v4-shadow-hover)", self.css)
        self.assertIn("@keyframes omega-v4-insignia-breathe", self.css)
        self.assertIn("prefers-reduced-motion:reduce", self.css)


if __name__ == "__main__":
    unittest.main()
