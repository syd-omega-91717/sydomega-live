"""The particle field is lighter on phone-class devices and unchanged on desktop (omega-particles.js).

Measured 2026-11-06 (docs/PLATFORM_COMPLEXITY_ANALYSIS.md section 6): the engine was 7-14% of script time at a 390 px /
4x CPU profile. A phone viewport (<= 700 px) or a device with <= 4 GB memory or <= 4 cores gets half the particles at
30 fps, and hover-repulse only where the device can hover. These pins keep the desktop path and the reduced-motion early
exit from being edited away by accident.
"""
import pathlib
import re
import unittest

SRC = (pathlib.Path(__file__).resolve().parents[2] / "omega-particles.js").read_text(encoding="utf-8")


class ParticlesLightProfile(unittest.TestCase):
    def test_light_profile_triggers(self):
        self.assertIn("(max-width:700px)", SRC)
        self.assertRegex(SRC, r"deviceMemory<=4")
        self.assertRegex(SRC, r"hardwareConcurrency<=4")

    def test_desktop_keeps_the_configured_count_and_40fps(self):
        self.assertIn("light?Math.max(8,Math.round(c.count*0.5)):c.count", SRC)
        self.assertIn("fpsLimit:light?30:40", SRC)

    def test_hover_only_where_the_device_can_hover(self):
        self.assertIn("onHover:{enable:canHover(),mode:'repulse'}", SRC)
        self.assertIn("(hover:hover)", SRC)

    def test_reduced_motion_still_skips_the_field(self):
        m = re.search(r"function injectCanvas\(.*?\n\}\n", SRC, re.S)
        self.assertIsNotNone(m)
        self.assertIn("prefers-reduced-motion:reduce", m.group(0))


if __name__ == "__main__":
    unittest.main()
