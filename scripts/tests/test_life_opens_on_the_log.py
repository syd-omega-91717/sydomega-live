"""life.html opens on the daily log, in plain words, without repeating its own links.

The log (omega-life-log.js) has a tile and a link for nine trackers; the hub chip strip listed the same nine
again. Six sections that explain how the page sources its data stood between the log and the rest of the page.
"""
import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
HTML = (ROOT / "life.html").read_text(encoding="utf-8")
PICKER = (ROOT / "omega-single-page-workspaces.js").read_text(encoding="utf-8")
LOG = (ROOT / "omega-life-log.js").read_text(encoding="utf-8")


class LifeOpensOnTheLog(unittest.TestCase):
    def test_the_heading_is_the_menu_word(self):
        self.assertIn('<p class="life-kicker">Ω ME · LIFE</p><h1>LIFE</h1>', HTML)
        self.assertNotIn("governed member surface", HTML)

    def test_the_chips_left_out_are_exactly_the_tabs_life_hosts(self):
        hidden = re.search(r"var IN_PAGE=location\.pathname==='/life\.html'\?'([a-z ]+)'\.split", PICKER)
        self.assertTrue(hidden)
        hidden = set(hidden.group(1).split(" "))
        tabs = re.search(r"data-omega-panels='(\[.*?\])'", HTML)
        self.assertTrue(tabs)
        import json
        hosted = {t[0] for t in json.loads(tabs.group(1))}
        self.assertEqual(hidden, hosted)
        linked = set(re.findall(r"href: '/([a-z]+)\.html'", LOG))
        self.assertTrue(linked <= hosted, "every tile arrow must have a tab to open in place")
        life = re.search(r"'/life\.html':\[([^\]]*)\],\n", PICKER)
        self.assertTrue(hosted <= set(re.findall(r"'([a-z]+)'", life.group(1))), "hidden chips must stay in WORKSPACES")

    def test_the_explanatory_sections_are_one_closed_disclosure_and_nothing_was_removed(self):
        m = re.search(r'<details class="life-more"><summary>([^<]+)</summary>(.*?)</details>', HTML, re.S)
        self.assertTrue(m)
        self.assertNotIn("<details open", HTML)
        inside = m.group(2)
        for sid in ("life-civilization-title", "life-systems-title", "life-learning-title", "life-surface-title",
                    "life-reality-title", "life-contract-title"):
            self.assertIn('id="%s"' % sid, inside, sid)
        self.assertEqual(inside.count('<section class="life-section"'), 6)

    def test_the_log_and_the_deep_linked_section_stay_outside_it(self):
        start, end = HTML.index('<details class="life-more">'), HTML.index("</details>")
        self.assertLess(HTML.index("data-omega-life-log"), start)
        self.assertGreater(HTML.index('<section id="personal-context"'), end)


if __name__ == "__main__":
    unittest.main()
