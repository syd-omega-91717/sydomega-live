#!/usr/bin/env python3
"""
omega-alive.js makes every emblem turn and every single-glyph mark breathe, on
every page (bg.js injects it). These tests hold the three things that would
make it harmful rather than alive:

  - it must animate `rotate`/`scale`, never `transform`: an animation beats a
    declaration, so a transform keyframe would silently erase every hover lift
    and tilt the platform already puts on these marks (CLAUDE.md 4.1);
  - it must stop under prefers-reduced-motion;
  - it must stay out of the nav's hidden hover menus (~258 emblems).

Also held here, from the same owner screenshot (2026-09-26): the dashboard's
owner Action Centre reads live state instead of three hardcoded tasks that had
outlived the work, the ticker never claims a load that cannot finish, and the
emblem integration no longer doubles the rail's own glyphs.

Run: python3 -m unittest scripts/tests/test_alive.py -v
"""
import os
import re
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def read(name):
    with open(os.path.join(ROOT, name), encoding="utf-8") as f:
        return f.read()


class AliveLayer(unittest.TestCase):
    def setUp(self):
        self.src = read("omega-alive.js")
        code = re.sub(r"/\*.*?\*/", "", self.src, flags=re.S)
        self.code = code

    def test_loaded_on_every_page_by_bg(self):
        bg = read("bg.js")
        self.assertIn("script[data-omega-alive]", bg)
        self.assertIn("'/omega-alive.js'", bg)

    def test_keyframes_never_animate_transform(self):
        # Each keyframe runs from its @keyframes to the next rule string; the
        # breathe one is split across a JS string join, so slice, not regex.
        flat = self.code.replace("' +\n", "").replace("'+\n", "")
        starts = [m.start() for m in re.finditer(r"@keyframes\s+omega-alive-", flat)]
        self.assertEqual(len(starts), 3, "expected the turn, breathe and glow keyframes")
        frames = [flat[s:flat.index("'", s)] for s in starts]
        for body in frames:
            self.assertNotIn("transform", body)
        self.assertIn("rotate:360deg", self.code)

    def test_reduced_motion_stops_everything(self):
        m = re.search(r"prefers-reduced-motion:reduce\)\{(.*?)\}'", self.code)
        self.assertIsNotNone(m)
        self.assertIn(".omega-alive-turn", m.group(1))
        self.assertIn(".omega-alive-breathe", m.group(1))
        self.assertIn("animation:none", m.group(1))

    def test_still_pictures_are_measured_and_never_turned_if_canvas(self):
        # A canvas draws its own numbers; turning it makes a chart unreadable.
        block = self.code[self.code.index("function stillPass()"):self.code.index("var pending = 0;")]
        self.assertIn("thumb(x.el) === x.a", block)
        canvas_part = block[:block.index("document.querySelectorAll('svg')")]
        self.assertNotIn("omega-alive-turn", canvas_part)
        self.assertIn("glow(x.el", canvas_part)
        self.assertIn("querySelector('text')", block)

    def test_hidden_nav_menus_and_busy_marks_are_skipped(self):
        self.assertIn(".on-tip", self.code)
        self.assertIn("function busy(", self.code)
        self.assertIn("IntersectionObserver", self.code)


class DashboardOwnerItems(unittest.TestCase):
    def test_no_hardcoded_owner_backlog(self):
        # Comments may record the history; only live markup and code count.
        html = re.sub(r"<!--.*?-->", "", read("dashboard.html"), flags=re.S)
        for stale in ("Apply pending schema", "Set ANTHROPIC_API_KEY", "Enable the pgvector extension"):
            self.assertNotIn(stale, html)

    def test_owner_items_come_from_live_state(self):
        html = read("dashboard.html")
        block = html[html.index("function ownerItems()"):html.index("function paintActionCentre(")]
        self.assertIn("owner_security_status", block)
        self.assertIn("r.error", block)
        self.assertIn("is_rejected", block)

    def test_item_text_is_escaped(self):
        html = read("dashboard.html")
        self.assertIn("esc(x.t)", html)


class TickerAndRail(unittest.TestCase):
    def test_ticker_has_an_honest_empty_state(self):
        src = read("omega-realtime.js")
        self.assertIn("NO PUBLIC ACTIVITY YET", src)
        self.assertIn("LIVE FEED UNAVAILABLE", src)

    def test_emblem_integration_leaves_nav_glyphs_alone(self):
        src = read("omega-emblem-integration.js")
        self.assertIn("item.querySelector('.on-glyph')", src)

    def test_capability_badge_is_diagnostics_only(self):
        src = read("omega-capability.js")
        self.assertIn("omega_diag", src)


if __name__ == "__main__":
    unittest.main()
