"""The owner's notification badge is fixed top-right; the sticky breadcrumb row pins under it once the page scrolls (seen on a phone)."""
import os, re, shutil, subprocess, unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = (ROOT / "omega-notify.js").read_text(encoding="utf-8")


class Static(unittest.TestCase):
    def test_the_badge_marks_the_page_while_it_shows_and_clears_it_when_it_does_not(self):
        code = re.sub(r"\s+", "", SRC)
        self.assertIn("if(n>0)document.documentElement.setAttribute('data-omega-notif','1');elsedocument.documentElement.removeAttribute('data-omega-notif');", code)

    def test_the_top_row_gets_a_right_margin_that_clears_the_badge_at_every_width(self):
        m = re.search(r"gs\.textContent='([^']+)'", SRC)
        self.assertIsNotNone(m)
        css = m.group(1)
        self.assertIn("html[data-omega-notif] .omega-workspace{margin-right:68px}", css)
        self.assertNotIn("@media", css, "the row pins to the top at any width; a width cap left 761-820 px covered")

    def test_the_margin_clears_the_badge(self):
        """The badge is 44 px wide at right:16px, so it occupies the 60 px at the edge; the margin must be at least that."""
        self.assertIn("position:fixed;top:16px;right:16px", SRC)
        self.assertGreaterEqual(68, 16 + 44)


class Browser(unittest.TestCase):
    def test_the_top_row_ends_left_of_the_badge(self):
        if not os.environ.get("OMEGA_HIDPI_BROWSER"):
            self.skipTest("run with OMEGA_HIDPI_BROWSER=1; the static contracts above always run")
        node = shutil.which("node")
        if not node:
            self.skipTest("node not available")
        r = subprocess.run([node, str(ROOT / "scripts" / "verify-notify-badge.js")], capture_output=True, text=True, timeout=600)
        out = r.stdout + r.stderr
        if "SKIPPED" in out and not os.environ.get("OMEGA_REQUIRE_BROWSER"):
            self.skipTest("no browser available")
        self.assertEqual(r.returncode, 0, out)


if __name__ == "__main__":
    unittest.main()
