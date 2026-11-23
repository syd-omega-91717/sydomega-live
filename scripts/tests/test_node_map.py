"""The eighteen-node map illustration (omega-node-map.js on sculpture.html): static contracts, plus the browser suite.

The browser suite (scripts/verify-node-map.js) is skipped when no browser exists and fails instead when OMEGA_REQUIRE_BROWSER is set,
the same rule as verify-runtime.js.
"""
import os
import pathlib
import re
import shutil
import subprocess
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
SRC = (ROOT / "omega-node-map.js").read_text(encoding="utf-8")
CODE = re.sub(r"/\*.*?\*/", "", SRC, flags=re.S)           # comments stripped: a header may name what the code must not do
PAGE = (ROOT / "sculpture.html").read_text(encoding="utf-8")
ENGINE = (ROOT / "omega-world-engine.js").read_text(encoding="utf-8")


class Source(unittest.TestCase):
    def test_pure_ascii_and_the_omega_is_an_escape(self):  # brand-glyph rule
        SRC.encode("ascii")
        self.assertIn("\\u03A9", CODE)

    def test_the_list_is_read_from_the_registry_never_copied(self):  # CLAUDE.md 8.1 class 8
        self.assertIn("window.OmegaWorldEngine.modules", CODE)
        names = re.findall(r"\{id:'([a-z]+)',name:'([^']+)'", ENGINE)
        self.assertEqual(len(names), 18)
        for ident, name in names:
            self.assertNotIn("'" + name + "'", CODE, name)
            self.assertNotIn('"' + name + '"', CODE, name)

    def test_it_never_touches_the_network_or_builds_markup_from_strings(self):
        for bad in ("fetch(", "XMLHttpRequest", "import(", "http://", "https://", "innerHTML", "insertAdjacentHTML", "document.write", "eval("):
            self.assertNotIn(bad.replace("http://", "http:/" + "/") if False else bad, CODE.replace("http://www.w3.org/2000/svg", ""), bad)

    def test_it_draws_nothing_and_says_so_when_the_registry_is_missing(self):
        m = re.search(r"if \(!mods\.length\) \{(.*?)\n    \}", CODE, re.S)
        self.assertIsNotNone(m)
        self.assertIn("return 0;", m.group(1))
        self.assertIn("never substitutes a list of its own", m.group(1))

    def test_reduced_motion_guard_lives_in_the_module_itself(self):
        # the platform has a global reduced-motion rule too, which would mask a missing guard in a browser run; so pin it here.
        for m in re.finditer(r"animation:", CODE):
            before = CODE[:m.start()]
            self.assertLess(before.rfind("@media(prefers-reduced-motion:no-preference){"), m.start())
            seg = before[before.rfind("@media(prefers-reduced-motion:no-preference){"):]
            self.assertNotIn("}}", seg.replace("@keyframes", ""), "an animation sits outside the no-preference block")
        self.assertEqual(CODE.count("animation:"), 1)       # one looping thing, the signet halo; nothing travels a spoke

    def test_nothing_that_reads_as_traffic_or_status_is_drawn(self):
        for bad in ("stroke-dashoffset", "<animate", "animateMotion", "requestAnimationFrame", "setInterval"):
            self.assertNotIn(bad, CODE, bad)

    def test_no_bottom_anchored_constant(self):  # CLAUDE.md 4: bottom chrome has one owner
        self.assertNotRegex(CODE, r"bottom\s*:\s*\d")
        self.assertNotIn("position:fixed", CODE)

    def test_class_names_avoid_the_swept_substrings(self):  # omega-visual-evolution.css selects [class*="card"] / "panel"
        for cls in set(re.findall(r"\.(onm[a-z-]*)", CODE)):
            self.assertNotIn("card", cls)
            self.assertNotIn("panel", cls)


class Mount(unittest.TestCase):
    def test_sculpture_page_loads_the_registry_before_the_map_and_mounts_one(self):
        a, b = PAGE.index('src="/omega-world-engine.js"'), PAGE.index('src="/omega-node-map.js"')
        self.assertLess(a, b)
        self.assertEqual(PAGE.count("data-omega-node-map"), 1)
        self.assertEqual(PAGE.count('src="/omega-node-map.js"'), 1)

    def test_the_mount_is_labelled_an_illustration_where_a_reader_meets_it(self):
        self.assertRegex(PAGE, r"eighteen-node map \(an illustration\)")

    def test_bg_js_is_untouched_by_this_feature(self):  # bg.js is a single point of failure; a leaf page should not need it
        self.assertNotIn("omega-node-map", (ROOT / "bg.js").read_text(encoding="utf-8"))

    def test_the_guard_attribute_is_unique_to_this_module(self):  # CLAUDE.md 8.1 class 5b
        for f in ROOT.glob("*.js"):
            if f.name != "omega-node-map.js":
                self.assertNotIn("data-omega-node-map", f.read_text(encoding="utf-8", errors="ignore"), f.name)


class Browser(unittest.TestCase):
    def test_browser_validation(self):
        node = shutil.which("node")
        if not node:
            self.skipTest("node not available")
        r = subprocess.run([node, str(ROOT / "scripts" / "verify-node-map.js")], capture_output=True, text=True, timeout=240)
        out = r.stdout + r.stderr
        if "SKIPPED" in out and not os.environ.get("OMEGA_REQUIRE_BROWSER"):
            self.skipTest("no browser available")
        self.assertEqual(r.returncode, 0, out)


if __name__ == "__main__":
    unittest.main()
