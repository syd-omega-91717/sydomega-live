#!/usr/bin/env python3
"""
One page, one title. The owner's screenshot of points.html (2026-09-27)
showed the page's name five times, each copy injected by a different module
above the page's own title bar:

  1. omega-content-sigil-system.js -- a "SIGIL ENTRY / POINTS / Open the
     experience / ENTER ->" door linking to the page you were already on;
  2. omega-identity.js -- a second hero title, because it did not count the
     page's own .topbar title as a title;
  3. nav.js -- the context rail's current-page crumb;
  4. emblem.js -- the page name printed beside the topbar emblem;
  5. (the page's own title bar -- the one that stays).

These tests keep each injected copy from coming back, and hold three bugs
found on the way: a card of text spinning because bg.js matched any class
containing "sigil", omega-ring.js drawing a ring into its own <script> tag,
and the dashboard galaxy orbiting too slowly to see.

Run: python3 -m unittest scripts/tests/test_one_title.py -v
"""
import os
import re
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def read(name):
    with open(os.path.join(ROOT, name), encoding="utf-8") as f:
        return f.read()


class OneTitle(unittest.TestCase):
    def test_page_door_and_next_card_are_opt_in(self):
        src = read("omega-content-sigil-system.js")
        door = src[src.index("function mountDoor(){"):]
        self.assertIn("hasAttribute('data-omega-page-door')", door[:300])
        rel = src[src.index("function related(){"):]
        self.assertIn("hasAttribute('data-omega-related')", rel[:300])

    def test_identity_hero_counts_the_pages_own_title(self):
        src = read("omega-identity.js")
        block = src[src.index("function hasHero("):src.index("var _done")]
        for sel in (".topbar-title", ".topbar .t", "h1"):
            self.assertIn(sel, block)

    def test_context_rail_does_not_print_the_current_page(self):
        src = read("nav.js")
        self.assertIn("here.className+=' omega-sr'", src)
        self.assertIn(".omega-sr{position:absolute!important", src)
        self.assertIn("var onHub=", src)
        # clean URLs (/points, not /points.html) must still match
        self.assertIn(r"replace(/\.html$/,'')", src)

    def test_emblem_has_no_visible_label(self):
        src = read("emblem.js")
        self.assertNotIn("wrap.appendChild(lbl)", src)
        self.assertIn("wrap.setAttribute('aria-label', label)", src)


class NothingStill(unittest.TestCase):
    def test_bg_spins_marks_not_text(self):
        src = read("bg.js")
        i = src.index("var omegaSigils = document.querySelectorAll(")
        self.assertIn("(el.textContent||'').trim().length > 2", src[i:i + 700])

    def test_no_stylesheet_stops_all_motion_outside_reduced_motion(self):
        # css/omega-simple-ui.css once held body.omega-simple *{animation-
        # duration:.01ms!important} -- bg.js adds .omega-simple to every body,
        # so every animation on the platform stopped after one frame. Measured
        # on dashboard.html: 3 long-running animations with it, 67 without.
        import glob
        files = glob.glob(os.path.join(ROOT, "*.css")) + glob.glob(os.path.join(ROOT, "css", "*.css"))
        offenders = []
        for f in files:
            css = open(f, encoding="utf-8").read()
            css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
            # drop every reduced-motion block, then look for a catch-all kill
            css = re.sub(r"@media\s*\(\s*prefers-reduced-motion[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}", "", css)
            for m in re.finditer(r"([^{}]*\*[^{}]*)\{([^{}]*animation-duration\s*:\s*\.?0*\.?0*1?m?s[^{}]*!important[^{}]*)\}", css):
                sel = m.group(1).strip()
                if re.search(r"(^|[\s,>])\*(\s*,|\s*$|::)", sel):
                    offenders.append("%s: %s" % (os.path.relpath(f, ROOT), sel[:80]))
        self.assertEqual(offenders, [])

    def test_simple_ui_keeps_emblems_visible(self):
        css = read("css/omega-simple-ui.css")
        css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
        for sel in ("[data-omega-sculpture]", ".osc-stage", ".emblem-orb"):
            self.assertNotIn(sel, css)

    def test_ring_never_mounts_into_its_loader_script(self):
        src = read("omega-ring.js")
        self.assertIn("[data-omega-ring]:not(script)", src)
        self.assertNotRegex(src, r"querySelectorAll\('\[data-omega-ring\]'\)")

    def test_galaxy_orbits_in_seconds_and_visibly(self):
        html = read("dashboard.html")
        block = html[html.index("SYSTEM GALAXY CANVAS"):html.index("cv.addEventListener('mousemove'")]
        self.assertIn("performance.now()", block)
        m = re.search(r"2\*Math\.PI/(\d+)\):\(2\*Math\.PI/(\d+)\)", block)
        self.assertIsNotNone(m, "orbit periods must be expressed in seconds")
        self.assertLessEqual(max(int(m.group(1)), int(m.group(2))), 120,
                             "an orbit slower than two minutes reads as a still picture")


if __name__ == "__main__":
    unittest.main()
