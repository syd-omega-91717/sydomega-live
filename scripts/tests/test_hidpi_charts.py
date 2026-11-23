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
         "ops": 2, "physiology": 2, "fasting": 1, "contacts": 1, "cipher": 1,
         "agent-network": 1, "architect": 1, "atlas": 1, "dashboard": 2, "ecosystem": 1, "knowledge": 1, "network": 1, "nexus": 2,
         "mindmap": 1, "queue": 2}


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
            code = re.sub(r"/\*.*?\*/", "", src, flags=re.S)   # a comment may describe the old pattern
            m = re.search(r"\b(?:cv|c|canvas)\.width\s*=\s*(?!OmegaCanvas)", code)
            self.assertIsNone(m, page + ": hand-assigned canvas.width at ..." + (code[max(0, m.start() - 60):m.end() + 40] if m else ""))


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
        for page in ("journal", "mood", "reading", "time", "water", "weekly", "workout", "ops", "architect"):
            src = (ROOT / (page + ".html")).read_text(encoding="utf-8")
            for m in re.finditer(r"OmegaCanvas\.fitWidth\(", src):
                tail = src[m.end():m.end() + 260]
                self.assertIn("OmegaCanvas.size(", tail, page + ": fitWidth without reading OmegaCanvas.size() for W/H")


class Pointer(unittest.TestCase):
    """A canvas drawn larger than its CSS box breaks pointer maths that was written against canvas.width, silently."""

    def test_no_page_scales_a_pointer_position_by_the_backing_store(self):
        bad = []
        for f in sorted(ROOT.glob("*.html")):
            src = f.read_text(encoding="utf-8", errors="ignore")
            for m in re.finditer(r"[A-Za-z_.]*(?:width|height)\s*/\s*rect\.(?:width|height)", src):
                if "OmegaCanvas.size(" not in m.group(0):
                    bad.append(f.name + ": " + m.group(0))
        self.assertEqual(bad, [], "pointer scaling must use OmegaCanvas.size(canvas), not canvas.width")

    def test_no_page_detects_a_resize_by_comparing_a_css_width_to_the_backing_store(self):
        """offsetWidth !== cv.width is always true once the store is larger than the box, so the handler would re-allocate on every callback."""
        bad = []
        for f in sorted(ROOT.glob("*.html")):
            src = f.read_text(encoding="utf-8", errors="ignore")
            for m in re.finditer(r"(?:offset|client)(?:Width|Height)\s*!==\s*(?:cv|canvas|c)\.(?:width|height)\b|\b(?:cv|canvas|c)\.(?:width|height)\s*!==\s*[a-z.]*(?:offset|client)(?:Width|Height)", src):
                bad.append(f.name + ": " + m.group(0))
        self.assertEqual(bad, [])

    def test_a_pinned_canvas_stays_pinned(self):
        """After the first pin a later fit() with a new size sees an unchanged box; without the flag it would leave the old CSS size (mindmap on window resize)."""
        code = re.sub(r"\s+", "", re.sub(r"/\*.*?\*/", "", HELPER, flags=re.S))
        self.assertIn("canvas.__ocPin===true", code)
        self.assertIn("canvas.__ocPin=true", code)


class Browser(unittest.TestCase):
    def test_browser_validation(self):
        node = shutil.which("node")
        if not node:
            self.skipTest("node not available")
        r = subprocess.run([node, str(ROOT / "scripts" / "verify-hidpi-charts.js")], capture_output=True, text=True, timeout=1500)
        out = r.stdout + r.stderr
        if "SKIPPED" in out and not os.environ.get("OMEGA_REQUIRE_BROWSER"):
            self.skipTest("no browser available")
        self.assertEqual(r.returncode, 0, out)

    def test_pointer_hit_testing_survives_a_larger_backing_store(self):
        node = shutil.which("node")
        if not node:
            self.skipTest("node not available")
        r = subprocess.run([node, str(ROOT / "scripts" / "verify-hidpi-pointer.js")], capture_output=True, text=True, timeout=3000)
        out = r.stdout + r.stderr
        if "SKIPPED" in out and not os.environ.get("OMEGA_REQUIRE_BROWSER"):
            self.skipTest("no browser available")
        self.assertEqual(r.returncode, 0, out)


if __name__ == "__main__":
    unittest.main()
