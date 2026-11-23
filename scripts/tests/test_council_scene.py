"""Council chamber 3-D scene (omega-sculpture.js SCENES.council): static contracts plus the browser suite (scripts/verify-council-scene.js).

The browser suite reads canvas pixels and the DOM: all twelve seats drawn, element colours differ, motion, reduced-motion stillness, twelve real
doors with omega-agents.json's destinations, click-through, 375 px, the no-WebGL fallback, and the roster page's COUNCIL tab. It is skipped when no
browser exists and fails instead when OMEGA_REQUIRE_BROWSER is set.
"""
import json
import os
import pathlib
import re
import shutil
import subprocess
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
SC = (ROOT / "omega-sculpture.js").read_text(encoding="utf-8")
COUNCIL = SC[SC.index("SCENES.council = function"):SC.index("/* ── SOLAR SYSTEM LEDGER")]
AGENTS = json.loads((ROOT / "omega-agents.json").read_text(encoding="utf-8"))["agents"]


class Static(unittest.TestCase):
    def test_twelve_executors_from_the_canon_file(self):
        self.assertEqual(len(AGENTS), 12)
        self.assertIn("fetch('/omega-agents.json')", COUNCIL)
        self.assertIn("var N = 12", COUNCIL)
        fallback = SC[SC.index("var COUNCIL_FALLBACK"):SC.index("var COUNCIL_ELEMENT_HEX")]
        names = re.findall(r"name: '([A-Za-z]+)'", fallback)
        self.assertEqual(names, [a["name"] for a in AGENTS], "the inline fallback must match omega-agents.json in order")
        signs = re.findall(r"sign: '([A-Za-z]+)'", fallback)
        self.assertEqual(signs, [a["sign"] for a in AGENTS])
        self.assertEqual(re.findall(r"element: '([A-Za-z ]+)'", fallback), [a["element"] for a in AGENTS])

    def test_every_zodiac_sign_has_a_text_presentation_glyph(self):  # brand rule: U+FE0E, or the sign renders as a colour sticker
        glyphs = SC[SC.index("var ZODIAC_GLYPH"):SC.index("var COUNCIL_FALLBACK")]
        self.assertEqual(len(re.findall(r"\\u26[45][0-9A-F]\\uFE0E", glyphs)), 12)
        for a in AGENTS:
            self.assertIn(a["sign"] + ":", glyphs)

    def test_element_colours_come_from_the_realm_palette(self):
        self.assertIn("elementColour(a.element,", COUNCIL)
        for el in {a["element"] for a in AGENTS}:
            self.assertIn(el + ":", SC[SC.index("var COUNCIL_ELEMENT_HEX"):SC.index("function councilCss")])

    def test_doors_open_only_after_the_roster_resolves(self):  # the host builds its real <a> list once; early links would be stale placeholders
        self.assertIn("links: links, ready: ready", COUNCIL)
        self.assertIn("var seats = [], links = [];", COUNCIL)
        self.assertNotIn("links.push({ object: coin", COUNCIL)
        self.assertIn("function openDoors()", COUNCIL)
        self.assertIn("setTimeout(finish, 4000);", COUNCIL)               # a hung fetch cannot leave the council without doors
        self.assertIn("/^\\/[a-z0-9._#\\/-]+$/i.test(ag.href)", COUNCIL)  # only a same-site path is ever used as a destination

    def test_reduced_motion_one_still_frame(self):
        self.assertIn("var tt = reduceMotion ? 0 : t;", COUNCIL)
        self.assertIn("var lx = reduceMotion ? 0 : px, ly = reduceMotion ? 0 : py;", COUNCIL)

    def test_the_fifth_axis_is_state_and_nothing_is_claimed(self):
        self.assertIn("OmegaSculptureDataViz.getActiveTaskCount", COUNCIL)
        self.assertNotRegex(COUNCIL, r"supabase|localStorage|\$\d|revenue|balance|token")

    def test_narrow_mounts_pull_the_camera_back(self):
        self.assertIn("var r = Math.max(8.6, 4.1 / (0.364 * asp));", COUNCIL)

    def test_a_flat_fallback_and_an_accessible_name_exist(self):
        self.assertIn("if (kind === 'council') {", SC)
        self.assertIn("    council: '", SC)
        self.assertIn("m.kind === 'agents' || m.kind === 'council' ? 'The twelve executors'", SC)

    def test_no_debug_residue(self):
        for needle in ("MUTATION", "TEMP-DEBUG", "console.log", "__lionDbg"):
            self.assertNotIn(needle, SC, needle)

    def test_mounted_where_it_belongs(self):
        agents = (ROOT / "agents.html").read_text(encoding="utf-8")
        tab = agents[agents.index('id="tab-council"'):agents.index('<!-- CHAT TAB -->')]
        self.assertEqual(len(re.findall(r'data-omega-sculpture="council"', tab)), 1)
        self.assertNotIn('data-omega-sculpture="agents"', tab)             # the chamber replaces the plain orbit ring inside the COUNCIL tab
        sculpt = (ROOT / "sculpture.html").read_text(encoding="utf-8")
        self.assertRegex(sculpt, r'data-omega-sculpture="council"[^>]*data-sculpt-label="[^"]+"')


class Browser(unittest.TestCase):
    def test_browser_validation(self):
        node = shutil.which("node")
        if not node:
            self.skipTest("node not available")
        r = subprocess.run([node, str(ROOT / "scripts" / "verify-council-scene.js")], capture_output=True, text=True, timeout=560)
        out = r.stdout + r.stderr
        if "SKIPPED" in out and not os.environ.get("OMEGA_REQUIRE_BROWSER"):
            self.skipTest("no browser available")
        self.assertEqual(r.returncode, 0, out)


if __name__ == "__main__":
    unittest.main()
