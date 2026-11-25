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
        (agent-network did exactly that until 2026-11-24), so 'the box height changed' says nothing about intrinsic size, and a pinned height
        froze that page at 481 px against 1,339 at 1x.  No browser test can see this rule broken any more, because agent-network no longer has
        that layout, so this contract is the guard."""
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


class Settles(unittest.TestCase):
    """These canvases used to size themselves once, before the layout settled, and re-measure only on a window resize: architect drew 958x520
    into an 820x445 box, knowledge 979x478 into 902x440, mindmap 944x900 into 442x422 (so its offsetX hit-testing was off by that scale),
    queue's topology 600x200 into 782x200, wallet's chart 914 into 778, atlas stayed 0x0.  Each now observes its container."""

    def test_each_page_observes_its_container_width(self):
        for page in ("architect", "knowledge", "mindmap", "queue", "atlas", "wallet"):
            code = re.sub(r"\s+", "", re.sub(r"/\*.*?\*/", "", (ROOT / (page + ".html")).read_text(encoding="utf-8"), flags=re.S))
            self.assertIn("newResizeObserver(function(){if(el.clientWidth===last)return;", code, page)
            self.assertIn("requestAnimationFrame(", code, page)


class AtlasFit(unittest.TestCase):
    """atlas.html called fitAll() at init while the canvas was 0x0, so scale became 0 and all 8 nodes mapped to the centre of the canvas (measured on
    origin/main).  fitAll must not compute a scale from a zero-size canvas, and the seed must sit where the simulation's gravity pulls."""

    def test_fit_waits_for_a_canvas_size_and_the_seed_is_at_the_origin(self):
        code = re.sub(r"\s+", "", re.sub(r"/\*.*?\*/", "", (ROOT / "atlas.html").read_text(encoding="utf-8"), flags=re.S))
        self.assertIn("if(!(cw()>0&&ch()>0)){pendingFit=true;return;}", code)
        self.assertIn("if(pendingFit)fitAll();", code)
        self.assertIn("constcx=0,cy=0;", code)
        self.assertNotIn("constcx=400,cy=300;", code)


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


class Wave5(unittest.TestCase):
    """Header and widget canvases authored at 2x their box (sharp at 2x, soft on a 3x phone) now grow above 2x."""
    PAGES = ("analytics", "automation", "family", "identity", "interface-omni", "points", "profile", "social", "subscriptions", "triads", "approvals", "enter", "pending")

    def test_nav_and_page_emblem_carry_their_own_capped_ratio(self):
        for name in ("nav.js", "omega-page-emblem.js"):
            code = re.sub(r"\s+", "", re.sub(r"/\*.*?\*/", "", (ROOT / name).read_text(encoding="utf-8"), flags=re.S))
            self.assertIn("Math.min(window.devicePixelRatio||1,3)/2", code, name + ": above 2x the store grows by dpr/2, capped at 3")
            self.assertIn("setTransform(K,0,0,K,0,0)", code, name + ": the context must carry the scale so no coordinate changes")

    def test_each_page_loads_the_helper_before_the_scripts_that_use_it(self):
        for page in self.PAGES:
            src = (ROOT / (page + ".html")).read_text(encoding="utf-8")
            self.assertEqual(src.count("omega-canvas-hidpi.js"), 1, page)
            self.assertLess(src.index("omega-canvas-hidpi.js"), src.index("</head>"), page + ": load it in <head>")

    def test_the_helper_measures_a_hidden_canvas_from_its_inline_width(self):
        """The approval guard hides the page, so clientWidth is 0 when a widget first draws (8.1 class 3); falling back to full ratio gave a 6x store at 3x."""
        code = re.sub(r"\s+", "", (ROOT / "omega-canvas-hidpi.js").read_text(encoding="utf-8"))
        self.assertIn("canvas.clientWidth||parseFloat(canvas.style&&canvas.style.width)", code)

    def test_the_three_unreached_canvases_were_left_alone(self):
        """cosmos hero-wheel, honors auth-gauge and profile char-canvas draw in a space larger than their attributes and live in module scope, so no
        harness reaches them; they were not converted, and must not be until one does."""
        for page, marker in (("cosmos", "const S=160, ctx=cv.getContext('2d')"), ("honors", "const S=100, ctx=cv.getContext('2d')"), ("profile", "const S=160; const ctx=cv.getContext('2d')")):
            self.assertIn(marker, (ROOT / (page + ".html")).read_text(encoding="utf-8"), page)


class Wave6Profile(unittest.TestCase):
    """profile.html: the hero banner and the achievement badges. The portfolio chart and the genealogy tree were left alone on purpose."""
    SRC = (ROOT / "profile.html").read_text(encoding="utf-8")

    def test_the_hero_banner_is_drawn_through_fit_and_remeasured_when_its_box_changes(self):
        i = self.SRC.index("const cv=document.getElementById('ph-canvas');")
        block = self.SRC[i:i + 1800]
        self.assertIn("OmegaCanvas.fit(cv,W,H)", block)
        self.assertIn("new ResizeObserver", block)
        self.assertIn("cv.clientWidth+'x'+cv.clientHeight", block, "both dimensions: a height read before layout settled once stretched it 14%")
        self.assertNotRegex(block.split("function f()")[1].split("requestAnimationFrame(f)")[0], r"cv\.(width|height)", "draw in W/H, not the store size")

    def test_the_achievement_badges_use_fit_attr(self):
        i = self.SRC.index("function drawAchBadge(cv,sym,col){")
        self.assertIn("OmegaCanvas.fitAttr(cv)", self.SRC[i:i + 400])

    def test_the_portfolio_chart_draws_real_history_not_a_fabricated_series(self):
        """CLAUDE.md 8.1 class 9: the curve was a hard-coded array under 'LIVE CURVE'. It now reads leaderboard_snapshots and draws nothing below two readings."""
        self.assertNotIn("const pts=[2.1,2.8", self.SRC)
        self.assertNotIn("9.9.9 APEX", self.SRC)
        self.assertNotIn("canvas.width=canvas.offsetWidth*2", self.SRC)
        self.assertIn("from('leaderboard_snapshots').select('snapshot_date,authority')", self.SRC)
        self.assertIn("if(sn.error)", self.SRC, "a failed read must not render as data")
        self.assertIn("series.length>=2", self.SRC)
        self.assertIn("OmegaCanvas.fit(canvas,cssW,cssH)", self.SRC)
        self.assertIn("new ResizeObserver(draw).observe(canvas)", self.SRC, "hidden pane: measure when shown")

    def test_the_genealogy_tree_was_left_alone_until_a_harness_reaches_it(self):
        self.assertIn("const W=cv.offsetWidth||800, H=240; cv.width=W*2; cv.height=H*2;", self.SRC)


class Wave7(unittest.TestCase):
    """vault, city, media franchise glyphs and the cosmos agent wheel. Canvases the harness cannot reach were left alone and are pinned as such."""
    def _src(self, name):
        return (ROOT / (name + ".html")).read_text(encoding="utf-8")

    def test_vault_reads_its_authored_size_before_fit_attr_grows_the_store(self):
        src = self._src("vault")
        for fn in ("function drawVaultCube(canvas){", "function drawDistRing(canvas){"):
            body = src[src.index(fn):src.index(fn) + 400]
            self.assertLess(body.index("canvas.width"), body.index("OmegaCanvas.fitAttr(canvas)"), fn + ": W/H must be read first")

    def test_the_pages_load_the_helper_before_their_scripts(self):
        for page in ("vault", "city", "media"):
            src = self._src(page)
            self.assertEqual(src.count("omega-canvas-hidpi.js"), 1, page)
            self.assertLess(src.index("omega-canvas-hidpi.js"), src.index("</head>"), page)

    def test_city_keeps_its_2x_floor_and_grows_above_it(self):
        src = self._src("city")
        self.assertIn("OmegaCanvas.fit(cv,W,H,{scale:Math.max(2,OmegaCanvas.ratio())})", src)

    def test_city_refits_when_its_box_is_first_measured(self):
        """The first measure happens while the approval guard hides the page (fallback 600), then the box grows: a 1.45x stretch at 868 px."""
        src = self._src("city")
        self.assertIn("new ResizeObserver(function(){", src)
        self.assertIn("bx=b.xf*W", src, "building positions are fractions so a refit keeps them in the box")

    def test_the_cosmos_agent_wheel_carries_the_dpr_over_2_factor(self):
        src = self._src("cosmos")
        body = src[src.index("function buildAgentWheel"):][:1400]
        self.assertIn("Math.min(window.devicePixelRatio||1,3)/2", body)
        self.assertIn("ctx.setTransform(K,0,0,K,0,0)", body)

    def test_unreachable_canvases_were_left_alone(self):
        """No harness reaches these under the member stub (they need loaded data), so a change to them could not be seen drawing."""
        self.assertIn("cv.width=W*2;cv.height=H*2;cv.style.width=W+'px';cv.style.height=H+'px';", self._src("family"))   # constellation
        self.assertIn("cv.width=w*2; cv.height=h*2;", self._src("media"))                                                  # poster canvases
        cos = self._src("cosmos")
        self.assertIn("cv.width=size*2;cv.height=size*2;cv.style.width=size+'px';cv.style.height=size+'px';", cos)         # sign canvases
        self.assertIn("canvas.width=size*2; canvas.height=size*2;", cos)                                                   # mandala
        self.assertIn("cv.width=80; cv.height=80; cv.style.width='40px'; cv.style.height='40px';\n  const ctx=cv.getContext('2d');", cos)  # planet node


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
