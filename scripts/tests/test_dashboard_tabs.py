"""Tab buttons that did nothing, and a front door that opened on a wall of platform metrics (2026-11-02).

Two separate failures sat under every `data-tab-action` button:

  1. `omega-tab-handler.js` wrapped its click listener in `document.addEventListener('DOMContentLoaded', ...)`, but bg.js
     injects it as a dynamic script that runs AFTER that event, so the listener was never installed. Measured in a
     browser: readyState 'complete', click does nothing; re-fire DOMContentLoaded and the same click works. Four pages
     were affected: dashboard, achievements, automation, leaderboard.
  2. achievements.html wraps its whole script in an IIFE, so its `switchTab` was private and the handler
     (which calls window.switchTab) could not reach it even once the listener existed.

The dashboard also now opens on TODAY (the member's loop) and not on OVERVIEW (platform metrics). These are source
contracts; the behaviour was verified by clicking every tab on all four pages in a real browser.
"""
import json
import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]


def read(name):
    return (ROOT / name).read_text(encoding="utf-8")


class TabHandler(unittest.TestCase):
    SRC = read("omega-tab-handler.js")

    def test_the_click_listener_is_installed_immediately(self):
        # a listener on `document` never needs to wait; waiting on an event that has already fired installs nothing
        code = "\n".join(l for l in self.SRC.splitlines() if not l.strip().startswith("//"))
        self.assertNotIn("addEventListener('DOMContentLoaded'", code, "the click listener must not sit behind DOMContentLoaded")
        self.assertRegex(code, r"(?m)^  document\.addEventListener\('click', function\(e\)")

    def test_a_second_load_cannot_double_fire(self):
        self.assertIn("__omegaTabHandlerInstalled", self.SRC)
        # the guard comes first, so a second load cannot replace registerTabHandler with a different closure
        self.assertLess(self.SRC.index("__omegaTabHandlerInstalled"), self.SRC.index("window.registerTabHandler"))


class EveryTabPageReachesItsHandler(unittest.TestCase):
    """The handler calls window.switchTab / window.setTab. A page whose function is private to an IIFE is dead."""

    def pages(self):
        return [p for p in sorted(ROOT.glob("*.html")) if "data-tab-action" in p.read_text(encoding="utf-8", errors="ignore")]

    def test_there_are_pages_to_check(self):
        self.assertGreaterEqual(len(self.pages()), 4)

    def test_each_page_exposes_a_global_tab_function(self):
        for p in self.pages():
            s = p.read_text(encoding="utf-8")
            exported = re.search(r"window\.(?:setTab|switchTab)\s*=|registerTabHandler\(", s)
            top_level = re.search(r"(?m)^function (?:setTab|switchTab)\(", s)
            self.assertTrue(exported or top_level, p.name + ": data-tab-action buttons but no global setTab/switchTab")

    def test_achievements_exports_switchtab_from_inside_its_iife(self):
        s = read("achievements.html")
        self.assertIn("window.switchTab=switchTab;", s)
        self.assertLess(s.index("function switchTab(id,btn)"), s.index("window.switchTab=switchTab;"))


class DashboardOpensOnToday(unittest.TestCase):
    HTML = read("dashboard.html")

    def test_today_is_the_first_tab_and_the_active_one(self):
        tabs = re.findall(r'<button class="ltab( active)?"[^>]*data-tab-action="([a-z]+)"', self.HTML)
        self.assertEqual([t[1] for t in tabs][:2], ["today", "overview"])
        self.assertEqual([t[1] for t in tabs if t[0]], ["today"], "exactly one tab starts active, and it is TODAY")

    def test_the_panels_start_in_the_same_state(self):
        self.assertIn('<div id="l-today" class="layer-panel active">', self.HTML)
        self.assertIn('<div id="l-overview" class="layer-panel">', self.HTML)

    def test_setTab_maps_tabs_in_dom_order(self):
        order = re.findall(r'<button class="ltab[^"]*"[^>]*data-tab-action="([a-z]+)"', self.HTML)
        m = re.search(r"var tabs=\[([^\]]*)\];", self.HTML)
        self.assertEqual(re.findall(r"'([a-z]+)'", m.group(1)), order, "setTab() indexes .ltab by position")

    def test_a_deep_link_still_wins_and_the_default_is_today(self):
        self.assertIn("setTab(m[h]||'today')", self.HTML)

    def test_the_health_bar_placeholder_asserts_no_number(self):
        # omega-realtime.js replaces it with the real success ratio or an empty track; the markup must not flash 87%
        self.assertNotIn('id="omega-health-bar" style="width:87%', self.HTML)
        self.assertIn('id="omega-health-bar" style="width:100%;background:var(--line', self.HTML)


class NoCountsInHeadings(unittest.TestCase):
    """AGENTS.md 4.7: never assert a number in copy. 'PLATFORM COMMAND INDEX . 14 SECTIONS' was already wrong (15)."""

    def test_headings_and_every_translation_carry_no_count(self):
        html = read("dashboard.html")
        self.assertNotIn("14 SECTIONS", html)
        self.assertNotIn("ALL 8 MODULES", html)
        t_en = read("i18n.js")
        for key in ("dash_personal_tools", "dash_platform_index"):
            m = re.search(r'"%s":"([^"]*)"' % key, t_en)
            self.assertIsNotNone(m, key)
            self.assertFalse(re.search(r"\d", m.group(1)), "T_EN %s carries a number: %s" % (key, m.group(1)))
            for pack in sorted((ROOT / "i18n").glob("*.json")):
                v = json.loads(pack.read_text(encoding="utf-8"))[key]
                self.assertFalse(re.search(r"\d", v), "%s %s carries a number: %s" % (pack.name, key, v))

    def test_the_today_tab_is_translatable(self):
        self.assertRegex(read("i18n.js"), r'"tab_today":"[^"]+"')
        for pack in sorted((ROOT / "i18n").glob("*.json")):
            self.assertTrue(json.loads(pack.read_text(encoding="utf-8")).get("tab_today"), pack.name)


class DailyThreeIsNotPushedDown(unittest.TestCase):
    """The 220px signet hero sat above the Daily Three, so on a 900px desktop the member's own loop started at y=509
    (measured). It is decoration and lives on OVERVIEW; it only paints when scrolled into view (IntersectionObserver)."""
    HTML = read("dashboard.html")

    def test_the_signet_hero_is_inside_the_overview_panel_only(self):
        self.assertEqual(self.HTML.count('data-omega-sculpture="signet"'), 1)
        i_hero = self.HTML.index('data-omega-sculpture="signet"')
        self.assertGreater(i_hero, self.HTML.index('<div id="l-overview"'))
        self.assertLess(i_hero, self.HTML.index('<div id="l-today"'))

    def test_nothing_tall_precedes_the_daily_three(self):
        head = self.HTML[:self.HTML.index("data-omega-daily")]
        self.assertNotIn("osc-stage", head.split("</style>", 1)[1])


if __name__ == "__main__":
    unittest.main()
