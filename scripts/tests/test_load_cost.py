#!/usr/bin/env python3
"""
Load cost: the first frame of the 3-D layer and scripts that ran twice.

Measured 2026-09-27 (3 runs each, headless, dashboard/profile/sculpture):
  - one 2.65s main-thread task inside omega-sculpture.js frame(): the first
    drawImage of the WebGL canvas flushed a 256px PMREM environment build.
    Built from a 128px cube instead, the longest task fell to ~0.3s, load
    ~3.1s -> ~1.7s, total blocking time ~1.9s -> ~0.7s, with every mount's
    luminance inside run-to-run noise (64px measurably dimmed one mount);
  - 4 scripts requested twice on dashboard (omega-controls under two bg.js
    guard markers, a page's own <script src> plus bg.js's injection, and
    popper/tippy loaded by both omega-oss.js and omega-tooltip.js).

These tests hold the mechanisms, so neither cost can quietly come back.

Run: python3 -m unittest scripts/tests/test_load_cost.py -v
"""
import os
import re
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def read(name):
    with open(os.path.join(ROOT, name), encoding="utf-8") as f:
        return f.read()


class SculptureFirstFrame(unittest.TestCase):
    def setUp(self):
        self.src = read("omega-sculpture.js")

    def test_environment_built_from_a_small_cube(self):
        block = self.src[self.src.index("function environment(T)"):self.src.index("function ensureRenderer(T)")]
        m = re.search(r"new T\.WebGLCubeRenderTarget\((\d+)", block)
        self.assertIsNotNone(m, "environment must capture into a cube render target")
        self.assertLessEqual(int(m.group(1)), 128, "a larger cube brings the first-frame stall back")
        self.assertIn("pm.fromCubemap(", block)
        self.assertIn("setRenderTarget(null)", block)

    def test_shaders_compiled_before_first_frame(self):
        self.assertIn("_renderer.compileAsync(", self.src)
        frame = self.src[self.src.index("function frame(ms)"):self.src.index("function startLoop()")]
        self.assertEqual(frame.count("!m.ready") + frame.count("!n.ready"), 2)


class OneFileOneExecution(unittest.TestCase):
    def test_bg_append_skips_a_script_already_on_the_page(self):
        bg = read("bg.js")
        block = bg[bg.index("function __omegaAppend(el){"):bg.index("/* Platform nervous system */")]
        self.assertIn("function dup()", block)
        self.assertIn(".pathname", block)
        self.assertEqual(block.count("!dup()"), 2, "both the immediate and the deferred path must check")

    def test_bg_append_callers_attach_no_load_handlers(self):
        # A skipped element never fires onload; that is only safe while no
        # caller hands __omegaAppend an element it is waiting on.
        bg = read("bg.js")
        for m in re.finditer(r"__omegaAppend\(([A-Za-z_$][\w$]*)\)", bg):
            v = re.escape(m.group(1))
            win = bg[max(0, m.start() - 900):m.start()]
            self.assertNotRegex(win, v + r"\.(onload|onerror)\s*=|" + v + r"\.addEventListener\(\s*['\"](load|error)")

    def test_library_loaders_adopt_an_existing_tag(self):
        oss = read("omega-oss.js")
        load = oss[oss.index("function load(name, url, global, cb){"):oss.index("LIBRARY REGISTRY")]
        self.assertIn("getAttribute('src')===url", load)
        self.assertIn("if(!prior) document.head.appendChild(s);", load)
        tip = read("omega-tooltip.js")
        self.assertIn("getAttribute('src') === src", tip)
        self.assertIn("if (window.tippy) { _drain(); return; }", tip)


if __name__ == "__main__":
    unittest.main()
