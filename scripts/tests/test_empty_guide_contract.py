"""omega-empty-guide.js: a first-step card where a money page shows only zeros.

It must never write or invent a figure (CLAUDE.md 8.1 class 9), and every page
that opts in must load it and point at a control that exists on that page.
"""
import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
PAGES = ["investment", "treasury", "wallet", "revenue", "budget", "wealth"]


class EmptyGuideContractTests(unittest.TestCase):
    def setUp(self):
        self.js = (ROOT / "omega-empty-guide.js").read_text(encoding="utf-8")

    def test_reads_figures_and_never_writes_them(self):
        self.assertIn("textContent||''", self.js)
        self.assertNotRegex(self.js, r"\.(textContent|innerHTML)\s*=\s*[^=]*\$")
        self.assertIn("prefers-reduced-motion", self.js)

    def test_each_money_page_opts_in_and_loads_the_module(self):
        for page in PAGES:
            html = (ROOT / (page + ".html")).read_text(encoding="utf-8")
            self.assertIn('<script src="/omega-empty-guide.js" defer></script>', html, page)
            self.assertEqual(html.count("data-omega-empty-guide="), 1, page)

    def test_focus_targets_exist_on_their_page(self):
        for page in PAGES:
            html = (ROOT / (page + ".html")).read_text(encoding="utf-8")
            m = re.search(r'data-omega-empty-focus="#([a-z0-9-]+)"', html)
            self.assertIsNotNone(m, page)
            self.assertIn('id="%s"' % m.group(1), html, page)


if __name__ == "__main__":
    unittest.main()
