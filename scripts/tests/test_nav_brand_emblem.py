"""nav.js brand emblem: the 44px brand link must not inherit the a11y sheet's touch-target padding, and its canvas must be square.
Static contract always runs; the browser check runs with OMEGA_NAVBRAND_BROWSER=1."""
import os
import re
import shutil
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
NAV = (ROOT / "nav.js").read_text(encoding="utf-8")


class Static(unittest.TestCase):
    def test_brand_link_drops_the_touch_target_padding(self):
        self.assertRegex(NAV, r"#omega-side \.on-brand\{[^}]*padding:0")

    def test_brand_canvas_is_square_inside_the_ring(self):
        rule = re.search(r"#omega-side \.on-brand canvas\{([^}]*)\}", NAV)
        self.assertIsNotNone(rule)
        w = re.search(r"width:\s*(\d+)px", rule.group(1))
        h = re.search(r"height:\s*(\d+)px", rule.group(1))
        self.assertTrue(w and h and w.group(1) == h.group(1), "the emblem must be drawn square")
        self.assertLessEqual(int(w.group(1)), 42, "44px link minus a 1px ring each side is a 42px content box")


class Browser(unittest.TestCase):
    def test_emblem_is_square_in_a_real_render(self):
        if not os.environ.get("OMEGA_NAVBRAND_BROWSER"):
            self.skipTest("run with OMEGA_NAVBRAND_BROWSER=1; the static contracts above always run")
        node = shutil.which("node")
        if not node:
            self.skipTest("node not available")
        r = subprocess.run([node, str(ROOT / "scripts" / "verify-nav-brand-emblem.js")], capture_output=True, text=True, timeout=600)
        out = r.stdout + r.stderr
        if "SKIPPED" in out and not os.environ.get("OMEGA_REQUIRE_BROWSER"):
            self.skipTest("no browser available")
        self.assertEqual(r.returncode, 0, out)
