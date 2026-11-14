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

    def test_modals_outside_main_are_carried_over(self):
        self.assertIn('[id$="-modal"]', JS)
        for page in ("rituals", "habits"):
            src = (ROOT / (page + ".html")).read_text(encoding="utf-8")
            self.assertIn("-modal", src)

    def test_a_failed_tab_links_to_its_own_page(self):
        self.assertIn("could not load here", JS)
        self.assertIn("ON ITS OWN PAGE", JS)


if __name__ == "__main__":
    unittest.main()
