"""Tab behavior contract: Today remains the default daily surface; Genesis is the command directory tab (2026-11-22).

Two separate failures sat under every `data-tab-action` button:

  1. `omega-tab-handler.js` wrapped its click listener in `document.addEventListener('DOMContentLoaded', ...)`, but bg.js
     injects it as a dynamic script that runs AFTER that event, so the listener was never installed. Measured in a
     browser: readyState 'complete', click does nothing; re-fire DOMContentLoaded and the same click works. Four pages
     were affected: dashboard, achievements, automation, leaderboard.
  2. achievements.html wraps its whole script in an IIFE, so its `switchTab` was private and the handler
     (which calls window.switchTab) could not reach it even once the listener existed.

The dashboard retains its established TODAY-first member loop. GENESIS / COMMAND is a first-class workspace tab immediately after TODAY. Existing tab hashes continue to select their original panels. These are source contracts; the tab interaction contract is additionally exercised by the dashboard keyboard-navigation implementation.
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
        tabs = re.findall(r'<button\b[^>]*class="ltab( active)?"[^>]*data-tab-action="([a-z]+)"', self.HTML)
        self.assertEqual([t[1] for t in tabs][:2], ["today", "genesis"])
        self.assertEqual([t[1] for t in tabs if t[0]], ["today"], "exactly one tab starts active, and it is TODAY")

    def test_the_panels_start_in_the_same_state(self):
        self.assertIn('<div id="l-today" class="layer-panel active"', self.HTML)
        self.assertIn('<div id="l-genesis" class="layer-panel"', self.HTML)
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

    def test_legacy_tab_deep_links_still_win_and_default_is_today(self):
        self.assertIn("var m={genesis:'genesis',overview:'overview',today:'today',personal:'personal',platform:'platform',science:'science'}", self.HTML)
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

    def test_the_winged_lion_is_the_surfaces_hero_and_nothing_else_is(self):
        # 2026-11-23: the owner directed the winged lion into the member's home hero, replacing the radiant signet that the owner had directed
        # there on 2026-11-16. The lion carries the same Omega signet beneath it. Still exactly one hero, still inside TODAY above the daily loop.
        lions = [m.start() for m in re.finditer(r'data-omega-sculpture="lion"', self.HTML)]
        self.assertEqual(len(lions), 1)
        t = self.HTML.index('<div id="l-today"')
        self.assertGreater(lions[0], t)
        self.assertLess(lions[0], self.HTML.index("data-omega-daily"))
        self.assertNotIn('data-sculpt-glow="radiant"', self.HTML, "the radiant signet is no longer on the dashboard (index.html keeps it)")

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



class DashboardMetricTruth(unittest.TestCase):
    HTML = read("dashboard.html")

    def test_platform_totals_use_the_aggregate_rpc_not_member_rls_counts(self):
        self.assertIn("sb.rpc('omega_dashboard_public_metrics')", self.HTML)
        for key, field in (("k-members", "approved_members"), ("k-online", "online_members"),
                           ("k-tasks", "tasks_today"), ("ops-tasks", "tasks_7d"),
                           ("k-events", "events_today")):
            self.assertIn("setCountValue('%s',metrics.%s)" % (key, field), self.HTML)
        for table in ("profiles", "member_presence", "platform_events"):
            self.assertNotRegex(self.HTML, r"from\\(['\\"]%s['\\"]\\)\\.select\\('id',\\{count:'exact'" % table)
        self.assertNotIn("from('task_completions').select('id',{count:'exact'", self.HTML)

    def test_count_query_failures_are_not_rendered_as_zero(self):
        self.assertNotRegex(self.HTML, r"sid\\(['\\"][^'\\"]+['\\"]\\],\\s*\\w+\\.count\\s*\\|\\|\\s*0\\)")
        self.assertIn("function setCountFromQuery(id,result)", self.HTML)
        self.assertIn("result.error||result.count==null", self.HTML.replace(" ", ""))
        self.assertIn("sid(id,null)", self.HTML)
        self.assertIn("sid(id,result.count)", self.HTML)

    def test_owner_only_live_count_tiles_use_error_aware_rendering(self):
        for key in ("k-risks", "adm-pending", "adm-accounts", "adm-threats",
                    "ai-queries", "ai-memories", "ai-workflows"):
            self.assertIn("setCountFromQuery('%s'," % key, self.HTML)

    def test_failed_contribution_read_does_not_render_an_empty_zero_heatmap(self):
        self.assertIn("renderContributionHeatmap(hm.data||[],!!hm.error)", self.HTML)
        self.assertIn("if(tsEl&&!hm.error)", self.HTML)
        self.assertIn("el.dataset.liveState='unavailable'", self.HTML)
        self.assertIn("renderContributionHeatmap([],true)", self.HTML)
        self.assertIn("if(failedSpark)failedSpark.hidden=true", self.HTML)


if __name__ == "__main__":
    unittest.main()
