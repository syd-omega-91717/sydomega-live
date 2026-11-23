"""Legion of Wisdom seal (assets/omega-legion-of-wisdom-seal.svg): static contracts plus the browser animation suite.

The browser suite (scripts/verify-legion-seal.js) is skipped when no browser exists and fails instead when OMEGA_REQUIRE_BROWSER is set.
"""
import os
import pathlib
import re
import shutil
import subprocess
import unittest
import xml.dom.minidom

ROOT = pathlib.Path(__file__).resolve().parents[2]
PATH = ROOT / "assets" / "omega-legion-of-wisdom-seal.svg"
SVG = PATH.read_text(encoding="utf-8")


class Static(unittest.TestCase):
    def test_well_formed_and_small(self):
        xml.dom.minidom.parseString(SVG)
        self.assertLess(len(SVG.encode("utf-8")), 16 * 1024)

    def test_accessible(self):
        self.assertIn('role="img"', SVG)
        self.assertRegex(SVG, r"<title[^>]*>Legion of Wisdom seal</title>")
        self.assertIn("<desc", SVG)

    def test_no_script_no_external_reference(self):
        self.assertNotRegex(SVG, r"(?i)<script|href=\"https?:|url\(https?:|<image|data:image")

    def test_animation_hooks_exist(self):
        for hook in ('class="wing wing-r"', 'class="wing wing-l"', 'class="stars"', 'class="eye"'):
            self.assertIn(hook, SVG, hook)
        self.assertEqual(len(re.findall(r'<path class="s"', SVG)), 9)  # nine stars, each independently animated

    def test_every_animation_is_behind_the_reduced_motion_query(self):
        start = SVG.index("@media (prefers-reduced-motion:no-preference){")
        depth, end = 0, -1
        for i in range(SVG.index("{", start), len(SVG)):
            if SVG[i] == "{":
                depth += 1
            elif SVG[i] == "}":
                depth -= 1
                if depth == 0:
                    end = i
                    break
        self.assertGreater(end, start)
        self.assertNotRegex(SVG[:start] + SVG[end + 1:], r"animation\s*:")
        self.assertIn("animation:beatR", SVG[start:end])

    def test_text_is_never_animated(self):  # ring text must stay legible
        self.assertNotRegex(SVG, r"textPath[^>]*class=|<text[^>]*class=")

    def test_has_a_media_rights_record(self):
        import json
        recs = json.loads((ROOT / "docs" / "media-rights.json").read_text(encoding="utf-8"))["records"]
        self.assertTrue([r for r in recs if r["path"] == "assets/omega-legion-of-wisdom-seal.svg" and r["licence"] == "owner-generated"])


class Browser(unittest.TestCase):
    def test_browser_validation(self):
        node = shutil.which("node")
        if not node:
            self.skipTest("node not available")
        r = subprocess.run([node, str(ROOT / "scripts" / "verify-legion-seal.js")], capture_output=True, text=True, timeout=240)
        out = r.stdout + r.stderr
        if "SKIPPED" in out and not os.environ.get("OMEGA_REQUIRE_BROWSER"):
            self.skipTest("no browser available")
        self.assertEqual(r.returncode, 0, out)


if __name__ == "__main__":
    unittest.main()
