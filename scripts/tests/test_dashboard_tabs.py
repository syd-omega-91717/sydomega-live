"""Tab behavior contract: Genesis is the canonical landing; Today remains the member's daily surface (2026-11-22).

Two separate failures sat under every `data-tab-action` button:

  1. `omega-tab-handler.js` wrapped its click listener in `document.addEventListener('DOMContentLoaded', ...)`, but bg.js
     injects it as a dynamic script that runs AFTER that event, so the listener was never installed. Measured in a
     browser: readyState 'complete', click does nothing; re-fire DOMContentLoaded and the same click works. Four pages
     were affected: dashboard, achievements, automation, leaderboard.
  2. achievements.html wraps its whole script in an IIFE, so its `switchTab` was private and the handler
     (which calls window.switchTab) could not reach it even once the listener existed.

The dashboard now opens on GENESIS / COMMAND. TODAY remains a separate, explicit tab and its ecosystem surface, daily loop,
and concierge remain intact. Existing tab hashes continue to select their original panels. These are source contracts; the
tab interaction contract is additionally exercised by the dashboard keyboard-navigation implementation.
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


class DashboardOpensOnGenesis(unittest.TestCase):
    HTML = read("dashboard.html")

    def test_genesis_is_the_first_tab_and_the_active_one(self):
        tabs = re.findall(r'<button\b[^>]*class="ltab( active)?"[^>]*data-tab-action="([a-z]+)"', self.HTML)
        self.assertEqual([t[1] for t in tabs][:2], ["genesis", "today"])
        self.assertEqual([t[1] for t in tabs if t[0]], ["genesis"], "exactly one tab starts active, and it is GENESIS")

    def test_the_panels_start_in_the_same_state(self):
        self.assertIn('<div id="l-genesis" class="layer-panel active"', self.HTML)
        self.assertIn('<div id="l-today" class="layer-panel">', self.HTML)
        self.assertIn('<div id="l-overview" class="layer-panel">', self.HTML)

    def test_genesis_tab_has_an_accessible_tabpanel_relationship(self):
        self.assertIn('id="tab-genesis"', self.HTML)
        self.assertIn('aria-controls="l-genesis"', self.HTML)
        self.assertIn('aria-labelledby="tab-genesis"', self.HTML)
        for key in ("ArrowLeft", "ArrowRight", "Home", "End"):
            self.assertIn(key, self.HTML)

    def test_setTab_maps_tabs_in_dom_order(self):
        order = re.findall(r'<button\b[^>]*class="ltab[^"]*"[^>]*data-tab-action="([a-z]+)"', self.HTML)
        m = re.search(r"var tabs=\[([^\]]*)\];", self.HTML)
        self.assertEqual(re.findall(r"'([a-z]+)'", m.group(1)), order, "setTab() indexes .ltab by position")

    def test_legacy_tab_deep_links_still_win_and_default_is_genesis(self):
        self.assertIn("var m={genesis:'genesis',overview:'overview',today:'today',personal:'personal',platform:'platform',science:'science'}", self.HTML)
        self.assertIn("setTab(m[h]||'genesis')", self.HTML)

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


class TodayTabRetainsTheEcosystemSurface(unittest.TestCase):
    """The composed ecosystem surface remains in TODAY even though GENESIS is now the canonical landing tab.
    Until 2026-11-16 the Daily Three sat ABOVE the tabs and a 220px signet hero pushed the member's loop to y=509;
    the hero was moved to OVERVIEW. The owner's reference design (agents, cinematic hero, franchises, member standing,
    profile, wallet, news and ascension) remains one composed TODAY surface. The daily loop and concierge remain directly
    beneath it, with the existing one-click link. GENESIS adds a governed command directory without deleting that daily
    workflow. The OVERVIEW backdrop remains the only plain signet and the TODAY surface retains the glowing signet."""
    HTML = read("dashboard.html")

    def today(self):
        return self.HTML[self.HTML.index('<div id="l-today"'):self.HTML.index('<div id="l-platform"')] if '<div id="l-platform"' in self.HTML else self.HTML[self.HTML.index('<div id="l-today"'):]

    def test_the_overview_backdrop_is_still_the_only_plain_signet(self):
        plain = [m for m in re.finditer(r'data-omega-sculpture="signet"(?![^>]*data-sculpt-glow)', self.HTML)]
        self.assertEqual(len(plain), 1)
        self.assertGreater(plain[0].start(), self.HTML.index('<div id="l-overview"'))
        self.assertLess(plain[0].start(), self.HTML.index('<div id="l-today"'))

    def test_the_glowing_signet_is_the_surfaces_hero_and_nothing_else_is(self):
        glowing = [m.start() for m in re.finditer(r'data-omega-sculpture="signet"[^>]*data-sculpt-glow="radiant"', self.HTML)]
        self.assertEqual(len(glowing), 1)
        t = self.HTML.index('<div id="l-today"')
        self.assertGreater(glowing[0], t)
        self.assertLess(glowing[0], self.HTML.index("data-omega-daily"))

    def test_today_opens_on_the_surface_then_the_loop_then_the_concierge(self):
        t = self.HTML.index('<div id="l-today"')
        order = [self.HTML.index(k, t) for k in ("data-omega-ecosystem-home", "data-omega-daily", "data-omega-command-dock")]
        self.assertEqual(order, sorted(order))

    def test_the_loop_is_one_click_from_the_hero(self):
        self.assertIn('href="#oeh-today-loop"', self.HTML)
        self.assertIn('id="oeh-today-loop"', self.HTML)
        self.assertLess(self.HTML.index('href="#oeh-today-loop"'), self.HTML.index('id="oeh-today-loop"'))

    def test_the_loop_and_the_concierge_are_no_longer_above_the_tabs(self):
        tabs = self.HTML.index('class="layer-tabs"')
        self.assertGreater(self.HTML.index("data-omega-daily"), tabs)
        self.assertGreater(self.HTML.index("data-omega-command-dock"), tabs)


if __name__ == "__main__":
    unittest.main()
