"""series.html zodiac emblems: the module swaps each .by-sign glyph for a 34x34 canvas, so the .by-sign box must be as wide as the canvas.
Static contract always runs; the browser check runs with OMEGA_SERIES_BROWSER=1."""
import os
import re
import shutil
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
HTML = (ROOT / "series.html").read_text(encoding="utf-8")


class Static(unittest.TestCase):
    def test_the_glyph_box_is_as_wide_as_the_emblem_canvas(self):
        rule = re.search(r"\.by-sign\{([^}]*)\}", HTML)
        self.assertIsNotNone(rule)
        width = re.search(r"width:\s*(\d+)px", rule.group(1))
        self.assertIsNotNone(width)
        self.assertGreaterEqual(int(width.group(1)), 34, "bg.js canvas{max-width:100%} caps the 34px emblem to this box; below 34 it is squeezed")

    def test_the_box_does_not_shrink_in_the_row(self):
        rule = re.search(r"\.by-sign\{([^}]*)\}", HTML).group(1)
        self.assertIn("flex-shrink:0", rule)


class Browser(unittest.TestCase):
    def test_emblems_are_not_squeezed_in_a_real_render(self):
        if not os.environ.get("OMEGA_SERIES_BROWSER"):
            self.skipTest("run with OMEGA_SERIES_BROWSER=1; the static contracts above always run")
        node = shutil.which("node")
        if not node:
            self.skipTest("node not available")
        r = subprocess.run([node, str(ROOT / "scripts" / "verify-series-emblems.js")], capture_output=True, text=True, timeout=600)
        out = r.stdout + r.stderr
        if "SKIPPED" in out and not os.environ.get("OMEGA_REQUIRE_BROWSER"):
            self.skipTest("no browser available")
        self.assertEqual(r.returncode, 0, out)


if __name__ == "__main__":
    unittest.main()
