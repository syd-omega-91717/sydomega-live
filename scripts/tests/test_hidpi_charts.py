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
PAGES = {"expenses": 5, "investment": 1, "revenue": 1, "treasury": 1, "wealth": 1,
         "journal": 2, "mood": 2, "reading": 1, "time": 1, "water": 1, "weekly": 1, "workout": 1,
         "ops": 2, "physiology": 2, "fasting": 1, "contacts": 1, "cipher": 1}


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
            for m in re.finditer(r"OmegaCanvas\.fit(?:Width)?\b", src):
                self.assertGreater(m.start(), at, page + ": OmegaCanvas.fit used before the helper loads")
            self.assertEqual(len(re.findall(r"OmegaCanvas\.fit(?:Width)?\(", src)), n, page)

    def test_no_money_page_assigns_canvas_size_by_hand_any_more(self):
        for page in PAGES:
            src = (ROOT / (page + ".html")).read_text(encoding="utf-8")
            self.assertNotRegex(src, r"\b(?:cv|c|canvas)\.width\s*=\s*(?!OmegaCanvas)", page)


    def test_the_helper_pins_a_canvas_whose_box_follows_its_store(self):
        """A canvas with no CSS width is laid out at its backing-store size: without the pin a 2x store is a 2x box (mood.html's
        freq-canvas went 300, 600, 824 across 1x/2x/3x before fit() detected it)."""
        code = re.sub(r"\s+", "", re.sub(r"/\*.*?\*/", "", HELPER, flags=re.S))
        self.assertIn("canvas.offsetWidth!==before", code)
        self.assertIn("getComputedStyle(canvas).width==='auto'", code)

    def test_fit_width_remembers_the_logical_height(self):
        """After fit() the height attribute holds the larger store height; a second call that read it back would grow the chart."""
        code = re.sub(r"\s+", "", re.sub(r"/\*.*?\*/", "", HELPER, flags=re.S))
        self.assertIn("canvas.__ocH==null", code)
        self.assertIn("canvas.__ocH=canvas.height", code)

    def test_wave2_drawing_code_reads_css_size_not_the_backing_store(self):
        """Every chart that sized itself from canvas.width and read it back as W must now read OmegaCanvas.size()."""
        for page in ("journal", "mood", "reading", "time", "water", "weekly", "workout", "ops"):
            src = (ROOT / (page + ".html")).read_text(encoding="utf-8")
            for m in re.finditer(r"OmegaCanvas\.fitWidth\(", src):
                tail = src[m.end():m.end() + 260]
                self.assertIn("OmegaCanvas.size(", tail, page + ": fitWidth without reading OmegaCanvas.size() for W/H")


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
