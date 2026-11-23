"""Hi-DPI charts on the money cluster (omega-canvas-hidpi.js): static contracts plus the browser suite.

A canvas whose backing store equals its CSS size is a 1x bitmap stretched on a 2x/3x screen: soft text and edges. OmegaCanvas.fit
sizes the store to css x devicePixelRatio (capped at 3), applies setTransform so drawing code keeps CSS units, and pins the CSS size
only when the canvas has none of its own. The browser suite (scripts/verify-hidpi-charts.js) measures the stores at 1x/2x/3x and
the painted coverage; it is skipped when no browser exists and fails instead under OMEGA_REQUIRE_BROWSER.
"""
import os
import pathlib
import re
import shutil
import subprocess
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
HELPER = (ROOT / "omega-canvas-hidpi.js").read_text(encoding="utf-8")
TAG = '<script src="/omega-canvas-hidpi.js"></script>'
# page -> number of canvases sized through the helper
PAGES = {"expenses": 5, "investment": 1, "revenue": 1, "treasury": 1, "wealth": 1}


class Static(unittest.TestCase):
    def test_helper_caps_the_ratio_and_applies_the_transform(self):
        code = re.sub(r"\s+", "", re.sub(r"/\*.*?\*/", "", HELPER, flags=re.S))
        self.assertIn("Math.min(d,3)", code)
        self.assertIn("setTransform(d,0,0,d,0,0)", code)
        self.assertIn("window.OmegaCanvas", HELPER)

    def test_each_page_loads_the_helper_once_before_its_inline_scripts(self):
        for page, n in PAGES.items():
            src = (ROOT / (page + ".html")).read_text(encoding="utf-8")
            self.assertEqual(src.count(TAG), 1, page)
            at = src.index(TAG)
            # a non-deferred tag runs in document order, so every call must sit after it
            for m in re.finditer(r"OmegaCanvas\.fit", src):
                self.assertGreater(m.start(), at, page + ": OmegaCanvas.fit used before the helper loads")
            self.assertEqual(len(re.findall(r"OmegaCanvas\.fit\(", src)), n, page)

    def test_no_money_page_assigns_canvas_size_by_hand_any_more(self):
        for page in PAGES:
            src = (ROOT / (page + ".html")).read_text(encoding="utf-8")
            self.assertNotRegex(src, r"\b(?:cv|c|canvas)\.width\s*=\s*(?!OmegaCanvas)", page)


class Browser(unittest.TestCase):
    def test_browser_validation(self):
        node = shutil.which("node")
        if not node:
            self.skipTest("node not available")
        r = subprocess.run([node, str(ROOT / "scripts" / "verify-hidpi-charts.js")], capture_output=True, text=True, timeout=540)
        out = r.stdout + r.stderr
        if "SKIPPED" in out and not os.environ.get("OMEGA_REQUIRE_BROWSER"):
            self.skipTest("no browser available")
        self.assertEqual(r.returncode, 0, out)


if __name__ == "__main__":
    unittest.main()
