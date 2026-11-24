"""Hi-DPI charts on the money cluster (omega-canvas-hidpi.js): static contracts plus the browser suite.

A canvas whose backing store equals its CSS size is a 1x bitmap stretched on a 2x/3x screen: soft text and edges. OmegaCanvas.fit
sizes the store to css x devicePixelRatio (capped at 3), applies setTransform so drawing code keeps CSS units, and pins the CSS size
only when the canvas has none of its own. The browser suites (scripts/verify-hidpi-charts.js, scripts/verify-hidpi-pointer.js) measure the stores at 1x/2x/3x, the painted
coverage and the pointer hit-testing; they are slow and layout-timing sensitive, so they run only with OMEGA_HIDPI_BROWSER=1.
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
         "mindmap": 1, "queue": 2,
         "ascension": 1, "body": 2, "beacon": 1, "breath": 1, "clarity": 1, "houses": 1, "lab": 1, "nutrition": 2, "skills": 1,
         "sleep": 4, "stoic": 2, "sigil": 1, "vision": 1, "focus": 3, "wallet": 1}


class Static(unittest.TestCase):
    def test_helper_caps_the_ratio_and_applies_the_transform(self):
        code = re.sub(r"\s+", "", re.sub(r"/\*.*?\*/", "", HELPER, flags=re.S))
        self.assertIn("Math.min(d,3)", code)
        self.assertIn("setTransform(cssW>0?canvas.width/cssW:d,0,0,cssH>0?canvas.height/cssH:d,0,0)", code)   # the real store/css ratio, d only when a side is 0
        self.assertIn("window.OmegaCanvas", HELPER)

    def test_each_page_loads_the_helper_once_before_its_inline_scripts(self):
        for page, n in PAGES.items():
            src = (ROOT / (page + ".html")).read_text(encoding="utf-8")
            self.assertEqual(src.count(TAG), 1, page)
            at = src.index(TAG)
            # a non-deferred tag runs in document order, so every call must sit after it
            for m in re.finditer(r"OmegaCanvas\.fit(?:Width|Attr)?\b", src):
                self.assertGreater(m.start(), at, page + ": OmegaCanvas.fit used before the helper loads")
            self.assertEqual(len(re.findall(r"OmegaCanvas\.fit(?:Width|Attr)?\(", src)), n, page)

    def test_no_money_page_assigns_canvas_size_by_hand_any_more(self):
        for page in PAGES:
            src = (ROOT / (page + ".html")).read_text(encoding="utf-8")
            code = re.sub(r"/\*.*?\*/", "", src, flags=re.S)   # a comment may describe the old pattern
            m = re.search(r"\b(?:cv|c|canvas)\.width\s*=\s*(?!OmegaCanvas|\d)   # a numeric literal is the declarative attribute (sigil makes its gallery canvases 120 and draws through fitAttr); a computed size is hand-sizing", code)
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


    def test_the_helper_never_pins_a_height_unless_asked(self):
        """Height is never detected or pinned: a percentage height in a container with no definite height is laid out from the canvas itself
        (agent-network grows its own canvas that way), so 'the box height changed' says nothing about intrinsic size, and a pinned height
        froze that page at 481 px against 1,339 at 1x.  The browser suites freeze that page's height to work around its pre-existing
        growth, so they cannot see this; this contract does."""
        code = re.sub(r"/\*.*?\*/", "", HELPER, flags=re.S)
        sites = [m for m in re.finditer(r"style\.height\s*=", code)]
        self.assertEqual(len(sites), 1, "style.height may be assigned in exactly one place")
        line = code[max(0, sites[0].start() - 80):sites[0].end() + 40]
        self.assertIn("opts.size", line, "...and only when the caller passes {size:true}")
        self.assertNotIn("offsetHeight", code, "the helper must not read or compare the box height")

    def test_a_zero_size_stays_zero(self):
        """Clamping to 1 stored a 1 x H canvas whose aspect ratio laid dashboard's galaxy out 295,920 px tall."""
        code = re.sub(r"\s+", "", re.sub(r"/\*.*?\*/", "", HELPER, flags=re.S))
        self.assertNotIn("Math.max(1,Math.round", code)
        self.assertIn("cssW>0?cssW:0", code)


class FitAttr(unittest.TestCase):
    def test_a_page_that_uses_fit_attr_never_reads_the_store_back_as_its_size(self):
        """After the first fitAttr the width/height attributes hold the larger store, so a later read of canvas.width as a logical size is wrong
        (the second draw would use 3x the size).  Logical size comes from OmegaCanvas.size()."""
        for page in ("ascension", "body", "beacon", "breath", "clarity", "houses", "nutrition", "sleep", "stoic", "sigil", "focus"):
            src = (ROOT / (page + ".html")).read_text(encoding="utf-8")
            code = re.sub(r"/\*.*?\*/", "", src, flags=re.S)
            self.assertIn("OmegaCanvas.fitAttr(", code, page)
            m = re.search(r"\b(?:cv|canvas|c)\.(?:width|height)\b(?!\s*=[^=])", code)
            self.assertIsNone(m, page + ": reads the store size back at ..." + (code[max(0, m.start() - 50):m.end() + 30] if m else ""))


class Modules(unittest.TestCase):
    """emblem.js, omega-element-motif.js and omega-lattice-3d.js are injected by bg.js on every page, so they cannot depend on a page having
    loaded omega-canvas-hidpi.js: each carries its own ratio maths, capped at 3, and applies it through the context transform."""

    def _code(self, name):
        return re.sub(r"\s+", "", re.sub(r"/\*.*?\*/", "", (ROOT / name).read_text(encoding="utf-8"), flags=re.S))

    def test_each_module_is_self_contained_and_capped(self):
        for name in ("emblem.js", "omega-element-motif.js", "omega-lattice-3d.js"):
            code = self._code(name)
            self.assertIn("devicePixelRatio", code, name)
            self.assertIn("Math.min(3,", code, name + ": the ratio must be capped at 3")
            self.assertIn("setTransform(", code, name + ": the context must carry the scale")
            self.assertNotIn("OmegaCanvas", code, name + ": must not depend on the page-level helper")

    def test_fit_attr_remembers_the_attributes_and_does_not_reallocate_when_unchanged(self):
        code = self._code("omega-canvas-hidpi.js")
        self.assertIn("canvas.__ocAW==null", code)
        self.assertIn("canvas.__ocS===s&&canvas.width===tw&&canvas.height===th", code)   # a per-frame caller must not reassign width
        self.assertIn("if(d>1&&box>0&&w>0)", code)                                        # 1x is untouched


class Browser(unittest.TestCase):
    def test_browser_validation(self):
        if not os.environ.get("OMEGA_HIDPI_BROWSER"):
            self.skipTest("slow (about 12 minutes, layout-timing sensitive): run with OMEGA_HIDPI_BROWSER=1; the static contracts above always run")
        node = shutil.which("node")
        if not node:
            self.skipTest("node not available")
        r = subprocess.run([node, str(ROOT / "scripts" / "verify-hidpi-charts.js")], capture_output=True, text=True, timeout=1500)
        out = r.stdout + r.stderr
        if "SKIPPED" in out and not os.environ.get("OMEGA_REQUIRE_BROWSER"):
            self.skipTest("no browser available")
        self.assertEqual(r.returncode, 0, out)

    def test_shared_modules_draw_at_the_pixel_ratio(self):
        if not os.environ.get("OMEGA_HIDPI_BROWSER"):
            self.skipTest("run with OMEGA_HIDPI_BROWSER=1; the static contracts above always run")
        node = shutil.which("node")
        if not node:
            self.skipTest("node not available")
        r = subprocess.run([node, str(ROOT / "scripts" / "verify-hidpi-modules.js")], capture_output=True, text=True, timeout=900)
        out = r.stdout + r.stderr
        if "SKIPPED" in out and not os.environ.get("OMEGA_REQUIRE_BROWSER"):
            self.skipTest("no browser available")
        self.assertEqual(r.returncode, 0, out)

    def test_pointer_hit_testing_survives_a_larger_backing_store(self):
        if not os.environ.get("OMEGA_HIDPI_BROWSER"):
            self.skipTest("slow (about 8 minutes): run with OMEGA_HIDPI_BROWSER=1; the static contracts above always run")
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
