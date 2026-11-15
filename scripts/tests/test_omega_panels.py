"""omega-panels.js shows an existing page's content inside a host page, as a tab.

It must never frame a page (production sends X-Frame-Options: DENY), never pour a fetched string into
innerHTML, and must be mounted only from markup that names real pages. Behaviour (twelve trackers, same
controls / same storage keys / zero errors as standalone) was measured in headless Chromium; see
docs/fixes/2026-11-14-panels-life-tools.md.
"""
import json
import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
JS = (ROOT / "omega-panels.js").read_text(encoding="utf-8")
LIFE = (ROOT / "life.html").read_text(encoding="utf-8")


def code(s):
    s = re.sub(r"/\*.*?\*/", "", s, flags=re.S)
    return re.sub(r"(?m)^\s*//.*$", "", s)


WS = (ROOT / "omega-single-page-workspaces.js").read_text(encoding="utf-8")


def hub_lists():
    return {m.group(1): re.findall(r"'([^']+)'", m.group(2))
            for m in re.finditer(r"'(/[a-z-]+\.html)':\[([^\]]*)\]", WS)}


def panel_map():
    block = WS[WS.index("var PANELS={"):WS.index("};", WS.index("var PANELS={"))]
    return {h: v.split(" ") for h, v in re.findall(r"'(/[a-z-]+\.html)':'([^']*)'", block)}


# Pages a UI mistake could cost money or privacy on, or that redirect a member who lacks a role, are never
# tabs: they stay plain links until someone decides otherwise on purpose.
NEVER_A_TAB = {
    "payments", "wallet", "subscriptions", "ledger", "blockchain", "advertising", "ad-network", "sovereign-covenant",
    "investment", "portfolio", "treasury", "revenue", "income", "budget", "expenses", "wealth", "contracts",
    "kyc", "privacy", "membership", "credentials", "identity", "passport", "health", "graph-admin",
    "observatory", "enterprise", "map",
}
NO_TABS_HERE = {"/vault.html", "/invest.html", "/profile.html", "/archive.html", "/arena.html", "/media.html", "/dashboard.html"}


class OmegaPanels(unittest.TestCase):
    def test_no_framing_and_no_string_into_innerhtml(self):
        c = code(JS)
        for bad in ("iframe", "srcdoc", ".innerHTML", "document.write", "eval(", "new Function"):
            self.assertNotIn(bad, c, bad)
        self.assertIn("DOMParser", c)

    def test_life_loads_the_module_and_mounts_it_with_real_pages(self):
        self.assertIn('<script src="/omega-panels.js" defer></script>', LIFE)
        m = re.search(r"data-omega-panels='(\[.*?\])'", LIFE)
        self.assertTrue(m)
        tabs = json.loads(m.group(1))
        self.assertGreaterEqual(len(tabs), 12)
        keys = [t[0] for t in tabs]
        self.assertEqual(len(keys), len(set(keys)), "tab keys must be unique")
        for key, label, src in tabs:
            self.assertEqual(src, "/%s.html" % key)
            self.assertTrue((ROOT / src.lstrip("/")).exists(), src)
            self.assertTrue(label.isupper(), label)

    def test_the_loader_never_runs_the_hosts_own_scripts_twice(self):
        for name in ("bg", "nav", "omega-morph", "omega-analytics-init", "omega-speed-insights-init", "omega-sparkline"):
            self.assertIn(name, JS)
        self.assertIn("SKIP_SCRIPT", JS)

    def test_teardown_ties_timers_frames_and_listeners_to_the_panel(self):
        for needle in ("p.dead = true", "clearInterval", "cancelAnimationFrame", "removeEventListener", "tie(cur"):
            self.assertIn(needle, JS, needle)

    def test_the_pages_wrapper_and_authored_elements_outside_it_are_carried_over(self):
        # scripts look up getElementById('app') and modals/toasts that sit outside <main>
        self.assertIn("doc.querySelector('#app')", JS)
        self.assertIn("doc.body.children", JS)
        for page in ("rituals", "habits"):
            self.assertIn("-modal", (ROOT / (page + ".html")).read_text(encoding="utf-8"))

    def test_page_scripts_share_one_scope_and_expose_their_globals_without_recursing(self):
        self.assertIn("function runClassic", JS)
        self.assertIn("function declaredNames", JS)
        # a getter that reads its own name recursed forever when a host global or window.n of that name existed
        self.assertIn("free(n) && !(n in window)", JS)

    def test_external_module_scripts_are_loaded_as_modules_and_run_again_on_reopen(self):
        self.assertIn("s.type = 'module'", JS)
        self.assertIn("'op=' + (++extSeq)", JS)

    def test_events_inside_the_stage_run_with_the_panel_current(self):
        self.assertIn("'pointerdown'", JS)
        self.assertIn("cur = panel;", JS)

    def test_a_failed_tab_links_to_its_own_page(self):
        self.assertIn("could not load here", JS)
        self.assertIn("ON ITS OWN PAGE", JS)

    def test_hub_tabs_are_real_pages_listed_in_that_hub(self):
        lists, panels = hub_lists(), panel_map()
        self.assertGreaterEqual(sum(len(v) for v in panels.values()), 80)
        for hub, keys in panels.items():
            self.assertIn(hub, lists, hub)
            self.assertEqual(len(keys), len(set(keys)), hub)
            for k in keys:
                self.assertIn(k, lists[hub], "%s is not listed in %s" % (k, hub))
                self.assertTrue((ROOT / (k + ".html")).exists(), k)

    def test_no_money_consent_identity_or_role_gated_page_is_a_tab(self):
        panels = panel_map()
        for hub, keys in panels.items():
            self.assertNotIn(hub, NO_TABS_HERE, hub)
            self.assertEqual(NEVER_A_TAB & set(keys), set(), hub)

    def test_a_hub_with_no_main_cannot_host_tabs(self):
        # the picker (and so the tabs) needs <main>; media.html has none, so it must not claim tabs
        self.assertNotIn("<main", (ROOT / "media.html").read_text(encoding="utf-8"))
        self.assertNotIn("/media.html", panel_map())

    def test_the_picker_loads_the_module_only_when_a_hub_has_tabs(self):
        self.assertIn("script[src=\"/omega-panels.js\"]", WS)
        self.assertIn("AS_TABS.length", WS)


if __name__ == "__main__":
    unittest.main()
