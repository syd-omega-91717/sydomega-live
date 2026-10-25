"""Contract for Ω MORPH: native cross-document view transitions with a shared element."""
from pathlib import Path
import subprocess
import sys
import unittest

ROOT = Path(__file__).resolve().parents[2]
BG = (ROOT / "bg.js").read_text(encoding="utf-8")
CIN = (ROOT / "omega-cinematic.js").read_text(encoding="utf-8")
NINE = (ROOT / "omega-9d.js").read_text(encoding="utf-8")


class OmegaMorphContract(unittest.TestCase):
    def test_every_page_carries_the_identical_block(self):
        proc = subprocess.run([sys.executable, str(ROOT / "scripts/omega-morph-sync.py"), "--check"],
                              capture_output=True, text=True)
        self.assertEqual(proc.returncode, 0, proc.stdout + proc.stderr)

    def test_block_sits_in_head_before_any_script(self):
        for page in sorted(ROOT.glob("*.html")):
            text = page.read_text(encoding="utf-8")
            with self.subTest(page=page.name):
                start = text.index("<!-- omega-morph:start -->")
                self.assertLess(start, text.lower().index("</head>"))
                first_src = text.find("<script src=")
                self.assertTrue(first_src == -1 or start < first_src)

    def test_every_click_veil_stands_aside_for_the_native_transition(self):
        # Three layers each held the click 340-480ms and blacked out the frame
        # the native snapshot takes; all three defer where it runs.
        self.assertIn("var NATIVE_VT=('onpagereveal' in window)&&!!document.getElementById('omega-vt');", BG)
        self.assertIn("if(!REDUCE&&!NATIVE_VT){", BG)
        for name, src in (("omega-cinematic.js", CIN), ("omega-9d.js", NINE)):
            with self.subTest(module=name):
                self.assertIn("window.__omegaNativeVT", src)

    def test_first_paint_is_dark(self):
        page = (ROOT / "dashboard.html").read_text(encoding="utf-8")
        self.assertIn(":where(html){background-color:#0A0A0F;color-scheme:dark}", page)


if __name__ == "__main__":
    unittest.main()
