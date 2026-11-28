"""elements.html motif canvases: authored 2:1, displayed in a 100% x 160px box, so they must not be stretched.
Static contract always runs; the browser check runs with OMEGA_ELEMENTS_BROWSER=1."""
import os
import re
import shutil
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
HTML = (ROOT / "elements.html").read_text(encoding="utf-8")


class Static(unittest.TestCase):
    def test_the_motif_canvas_keeps_its_aspect_in_the_fixed_height_box(self):
        rule = re.search(r"\.el-canvas-wrap canvas\{([^}]*)\}", HTML)
        self.assertIsNotNone(rule, "the canvas rule exists")
        self.assertRegex(rule.group(1), r"object-fit:\s*contain", "a 2:1 store in a 100% x 160px box must be contained, not filled")

    def test_the_box_is_still_fixed_height_so_the_rule_is_needed(self):
        self.assertIn(".el-canvas-wrap{width:100%;height:160px", HTML)
        self.assertIn("cv.width=640;cv.height=320;", HTML, "the motif is authored 2:1; change this and the rule together")


class Browser(unittest.TestCase):
    def test_elements_canvases_are_not_stretched(self):
        if not os.environ.get("OMEGA_ELEMENTS_BROWSER"):
            self.skipTest("run with OMEGA_ELEMENTS_BROWSER=1; the static contracts above always run")
        node = shutil.which("node")
        if not node:
            self.skipTest("node not available")
        r = subprocess.run([node, str(ROOT / "scripts" / "verify-elements-canvas-aspect.js")], capture_output=True, text=True, timeout=600)
        out = r.stdout + r.stderr
        if "SKIPPED" in out and not os.environ.get("OMEGA_REQUIRE_BROWSER"):
            self.skipTest("no browser available")
        self.assertEqual(r.returncode, 0, out)


if __name__ == "__main__":
    unittest.main()
