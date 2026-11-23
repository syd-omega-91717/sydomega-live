"""Zero-Point Awakening intro (omega-zero-point.js + two bg.js hooks): static contracts, plus the browser suite.

The browser suite (scripts/verify-zero-point-intro.js) is skipped when no browser exists and fails instead when
OMEGA_REQUIRE_BROWSER is set, the same rule as verify-runtime.js.
"""
import os
import pathlib
import re
import shutil
import subprocess
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
BG = (ROOT / "bg.js").read_text(encoding="utf-8")
ZP = (ROOT / "omega-zero-point.js").read_text(encoding="utf-8")


class Hooks(unittest.TestCase):
    def test_injected_once_with_its_own_guard_and_only_when_the_intro_will_show(self):
        self.assertEqual(BG.count("/omega-zero-point.js"), 1)
        m = re.search(r"if\(([^\n]*?)\)\{\s*var _zp=document\.createElement\('script'\)", BG)
        self.assertIsNotNone(m)
        cond = m.group(1)
        self.assertIn("!REDUCE", cond)
        self.assertIn("omega_genesis_seen", cond)
        self.assertIn("script[data-omega-zero-point]", cond)
        self.assertIn("data-omega-zero-point", BG)

    def test_guard_attribute_is_unique_to_this_module(self):  # CLAUDE.md 8.1 class 5b
        self.assertEqual(len(re.findall(r"data-omega-zero-point'?\]?", BG)), 2)  # selector + setAttribute, nothing shared
        for f in ROOT.glob("omega-*.js"):
            if f.name != "omega-zero-point.js":
                self.assertNotIn("data-omega-zero-point", f.read_text(encoding="utf-8", errors="ignore"), f.name)

    def test_legacy_intro_still_ends_itself_unless_the_module_holds_it(self):
        self.assertIn("g._omegaDone=done;", BG)
        self.assertIn("setTimeout(function(){if(!g.__omegaHold)done();},3100)", BG)
        self.assertIn("g.addEventListener('click',done)", BG)
        self.assertIn("if(!REDUCE && !localStorage.getItem('omega_genesis_seen')){", BG)  # intro gating untouched


class Module(unittest.TestCase):
    def test_pure_ascii_glyphs_by_escape(self):  # brand-glyph rule: escapes only
        ZP.encode("ascii")
        self.assertIn("\\u03A9", ZP)

    def test_no_external_assets_or_network(self):
        for bad in ("fetch(", "XMLHttpRequest", "import(", "http://", "https://", ".mp3", ".mp4", ".wav", "new Audio("):
            self.assertNotIn(bad, ZP, bad)

    def test_sound_is_opt_in_at_528hz_and_never_autoplays(self):
        self.assertIn("osc.frequency.value = 528", ZP)
        self.assertEqual(ZP.count("new AC()"), 1)
        self.assertLess(ZP.index("function toggleSound"), ZP.index("new AC()") + 1)
        self.assertNotRegex(ZP[ZP.index("function start()"):], r"toggleSound\((?!btn\))")
        self.assertIn("e.stopPropagation(); toggleSound(btn)", ZP)

    def test_cannot_leave_the_overlay_stuck(self):
        self.assertIn("capTimer = setTimeout(finish, CAP)", ZP)
        for key in ("Escape", "Enter", "' '"):
            self.assertIn(key, ZP)
        self.assertIn("removeEventListener('keydown', onKey, true)", ZP)

    def test_sized_from_the_window_not_from_a_measured_hidden_element(self):  # CLAUDE.md 8.1 class 3
        self.assertIn("W = window.innerWidth; H = window.innerHeight;", ZP)
        self.assertNotIn("offsetWidth", ZP)
        self.assertNotIn("getBoundingClientRect", ZP)

    def test_caption_is_fitted_not_fixed(self):
        self.assertIn("wdt <= W - 32", ZP)


class Browser(unittest.TestCase):
    def test_browser_validation(self):
        node = shutil.which("node")
        if not node:
            self.skipTest("node not available")
        r = subprocess.run([node, str(ROOT / "scripts" / "verify-zero-point-intro.js")], capture_output=True, text=True, timeout=240)
        out = r.stdout + r.stderr
        if "SKIPPED" in out and not os.environ.get("OMEGA_REQUIRE_BROWSER"):
            self.skipTest("no browser available")
        self.assertEqual(r.returncode, 0, out)


if __name__ == "__main__":
    unittest.main()
