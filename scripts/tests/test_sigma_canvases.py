"""sigma.html charts in hidden tabs: measure the real box, draw at the screen's density, wait while hidden, repaint on resize.
Static contracts always run; the browser check runs with OMEGA_SIGMA_BROWSER=1."""
import os
import re
import shutil
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
HTML = (ROOT / "sigma.html").read_text(encoding="utf-8")
FOUR = ("sigma-axes", "sigma-auth-curve", "sigma-elem-matrix", "sigma-scatter")


class Static(unittest.TestCase):
    def test_the_four_charts_no_longer_draw_at_a_made_up_width(self):
        for cid in FOUR:
            start = HTML.index("getElementById('%s')" % cid)
            body = HTML[start:start + 400]
            self.assertIn("fitBox(cv,", body, cid + " must be fitted through fitBox")
            self.assertNotRegex(body, r"offsetWidth\s*\|\|", cid + " must not fall back to a fixed width while hidden")
            self.assertNotIn("cv.width=W;", body, cid + " must not store at 1x")

    def test_fitbox_waits_while_hidden_draws_at_the_pixel_ratio_and_observes_resizes(self):
        fit = HTML[HTML.index("function fitBox("):][:900]
        self.assertIn("new ResizeObserver", fit)
        self.assertIn("if(!W)return null;", fit)
        self.assertIn("window.devicePixelRatio", fit)
        self.assertIn("setTransform(d,0,0,d,0,0)", fit)

    def test_the_curve_redraws_with_the_latest_inputs_not_the_first_calls(self):
        curve = HTML[HTML.index("function drawAuthCurve("):][:600]
        self.assertIn("cv.__args=[a,b,c]", curve)
        self.assertIn("drawAuthCurve.apply(null,cv.__args)", curve)

    def test_the_radar_radius_leaves_room_for_its_labels(self):
        radar = HTML[HTML.index("function drawAxesRadar("):][:1400]
        self.assertIn("r=Math.min(W,H)*0.32", radar)
        self.assertNotIn("*0.4;", radar.split("var axes=")[0], "0.4 clips the top label once the chart is drawn at its real width")


class Browser(unittest.TestCase):
    def test_sigma_charts_in_a_real_render(self):
        if not os.environ.get("OMEGA_SIGMA_BROWSER"):
            self.skipTest("run with OMEGA_SIGMA_BROWSER=1; the static contracts above always run")
        node = shutil.which("node")
        if not node:
            self.skipTest("node not available")
        r = subprocess.run([node, str(ROOT / "scripts" / "verify-sigma-canvases.js")], capture_output=True, text=True, timeout=600)
        out = r.stdout + r.stderr
        if "SKIPPED" in out and not os.environ.get("OMEGA_REQUIRE_BROWSER"):
            self.skipTest("no browser available")
        self.assertEqual(r.returncode, 0, out)


if __name__ == "__main__":
    unittest.main()
