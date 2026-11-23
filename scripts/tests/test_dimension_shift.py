"""Per-task dimension shift: omega-dimension-shift.js, bg.js's recorder detail, omega-backdrop.js's published element, the council's answer.

Static contracts plus the browser suite (scripts/verify-dimension-shift.js), which drives the real chain on real pages. The browser suite is skipped
when no browser exists and fails instead when OMEGA_REQUIRE_BROWSER is set.
"""
import os
import pathlib
import re
import shutil
import subprocess
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
MOD = (ROOT / "omega-dimension-shift.js").read_text(encoding="utf-8")
CODE = re.sub(r"/\*.*?\*/", "", MOD, flags=re.S)   # the header explains things in prose (it says "token" and "profiles query"); the checks below read the code
BG = (ROOT / "bg.js").read_text(encoding="utf-8")
BACKDROP = (ROOT / "omega-backdrop.js").read_text(encoding="utf-8")
SC = (ROOT / "omega-sculpture.js").read_text(encoding="utf-8")


class Module(unittest.TestCase):
    def test_pure_ascii_and_no_network(self):
        MOD.encode("ascii")
        for bad in ("fetch(", "XMLHttpRequest", "import(", "http://", "https://", "localStorage", "sessionStorage", "document.cookie", "innerHTML"):
            self.assertNotIn(bad, CODE, bad)

    def test_triggers_only_on_a_successful_post_to_task_completions(self):
        self.assertIn("d.ok && d.m === 'POST' && /\\/rest\\/v1\\/task_completions$/.test(d.p || '')", MOD)

    def test_throttled_so_a_burst_is_one_shift(self):
        self.assertIn("var MIN_GAP_MS = 2500;", MOD)
        self.assertIn("if (now - last < MIN_GAP_MS) return false;", MOD)

    def test_never_intercepts_the_pointer_and_is_not_anchored_to_the_bottom(self):
        self.assertEqual(CODE.count("pointer-events:none"), 2)   # the wash and the label; the visually hidden live region is 1 px and clipped
        self.assertNotIn("bottom:", CODE)                         # CLAUDE.md 4: never add a bottom-anchored constant
        self.assertIn("top:calc(env(safe-area-inset-top,0px) + 72px)", MOD)
        self.assertIn("left:50%", MOD)                           # centred: clear of #om-open at the top-left

    def test_wash_sits_below_every_dialog(self):
        z = [int(x) for x in re.findall(r"z-index:(\d+)", MOD)]
        self.assertTrue(z and max(z) < 9000, z)                  # #om-open is z 9000; the genesis overlay and the veil are far above

    def test_reduced_motion_has_no_wash_and_no_animation(self):
        self.assertIn("if (!still) {\n      var wash", MOD)
        self.assertIn("if (!still) { try { label.animate(", MOD)
        self.assertIn("fill: 'none'", MOD)                       # CLAUDE.md: motion never holds a persistent state

    def test_one_polite_announcement(self):
        self.assertIn("setAttribute('aria-live', 'polite')", MOD)
        self.assertIn("setAttribute('role', 'status')", MOD)

    def test_element_is_the_members_and_comes_from_the_backdrop(self):
        self.assertIn("window.OmegaMemberElement", MOD)
        self.assertNotIn("profiles", CODE)                       # no second profiles query
        self.assertIn("window.OmegaMemberElement = el;", BACKDROP)
        self.assertIn("omega:member-element", BACKDROP)

    def test_claims_nothing(self):
        self.assertNotRegex(CODE, r"\$\d|revenue|balance|token|points|reward")


class Wiring(unittest.TestCase):
    def test_recorder_reports_method_and_pathname_only(self):
        self.assertIn("o.p=new URL(String(u),location.href).pathname;", BG)
        self.assertEqual(len(re.findall(r"m:w\.m,p:w\.p", BG)), 3)   # the 5xx, the ok/4xx and the network-error emit
        self.assertNotRegex(BG, r"emit\(\{[^}]*\bu:w\.|o\.u=")        # the full URL is never copied into the event

    def test_injected_once_with_its_own_guard(self):
        self.assertEqual(BG.count("/omega-dimension-shift.js"), 1)
        self.assertIn("script[data-omega-dimension-shift]", BG)
        for f in ROOT.glob("omega-*.js"):
            if f.name != "omega-dimension-shift.js":
                self.assertNotIn("data-omega-dimension-shift", f.read_text(encoding="utf-8", errors="ignore"), f.name)

    def test_the_eleven_module_idle_batch_is_untouched(self):
        self.assertNotIn("__omegaIdleAppend(_ds", BG)
        self.assertNotRegex(BG, r"dimension-shift[^\n]*__omegaIdleAppend")


class CouncilAnswer(unittest.TestCase):
    def test_the_council_listens_and_answers_only_matching_elements(self):
        self.assertIn("window.addEventListener('omega:dimension-shift'", SC)
        self.assertIn("String(ag2.element || '').toLowerCase() === pulse.el", SC)
        self.assertIn("var answer = (!reduceMotion && left > 0 &&", SC)

    def test_the_pulse_is_bounded(self):
        self.assertIn("var PULSE_MS = 1900", SC)


class Browser(unittest.TestCase):
    def test_browser_validation(self):
        node = shutil.which("node")
        if not node:
            self.skipTest("node not available")
        r = subprocess.run([node, str(ROOT / "scripts" / "verify-dimension-shift.js")], capture_output=True, text=True, timeout=560)
        out = r.stdout + r.stderr
        if "SKIPPED" in out and not os.environ.get("OMEGA_REQUIRE_BROWSER"):
            self.skipTest("no browser available")
        self.assertEqual(r.returncode, 0, out)


if __name__ == "__main__":
    unittest.main()
