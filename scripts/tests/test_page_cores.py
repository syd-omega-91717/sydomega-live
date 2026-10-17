#!/usr/bin/env python3
"""
Contract for config/page-cores.json -- the target shape of the estate.

The estate grew to 240 pages while 70 were ever opened (platform_events,
2026-10-17). page-cores.json assigns every root page to exactly one core (one
page that absorbs the others as lenses, tabs or panels) or to the short
`system` list. These tests keep that true as pages come and go:

  - a new page must be placed in a core before it can ship, so sprawl has to
    be a decision, not a side effect;
  - no page may sit in two cores;
  - a nav.js entry marked 'folded' must belong to a BUILT core, so nothing is
    hidden from the sidebar before the page that replaces it exists.

Run: python3 -m unittest scripts/tests/test_page_cores.py -v
"""
import glob
import json
import os
import re
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def load():
    with open(os.path.join(ROOT, "config", "page-cores.json"), encoding="utf-8") as fh:
        return json.load(fh)


class PageCoresContract(unittest.TestCase):
    def setUp(self):
        self.doc = load()
        self.owner = {}
        for core in self.doc["cores"]:
            for page in core["pages"]:
                self.assertNotIn(page, self.owner, "%s is in two cores" % page)
                self.owner[page] = core
        for page in self.doc["system"]["pages"]:
            self.assertNotIn(page, self.owner, "%s is both a core page and a system page" % page)
            self.owner[page] = None

    def test_every_page_belongs_somewhere(self):
        pages = sorted(os.path.basename(p)[:-5] for p in glob.glob(os.path.join(ROOT, "*.html")))
        missing = [p for p in pages if p not in self.owner]
        self.assertEqual(missing, [], "add each new page to a core in config/page-cores.json")

    def test_no_entry_names_a_page_that_does_not_exist(self):
        for page in self.owner:
            self.assertTrue(os.path.isfile(os.path.join(ROOT, page + ".html")), page)

    def test_each_core_hosts_itself(self):
        for core in self.doc["cores"]:
            self.assertIn(core["host"], core["pages"], core["core"])
            self.assertIn(core["state"], ("BUILT", "PLANNED"), core["core"])

    def test_folded_nav_entries_belong_to_a_built_core(self):
        with open(os.path.join(ROOT, "nav.js"), encoding="utf-8") as fh:
            nav = fh.read()
        folded = re.findall(r"\['[a-z0-9-]+','[^']*','/([a-z0-9-]+)\.html[^']*','folded'\]", nav)
        self.assertTrue(folded, "expected at least one folded entry")
        for page in folded:
            core = self.owner.get(page)
            self.assertIsNotNone(core, "%s is folded but belongs to no core" % page)
            self.assertEqual(core["state"], "BUILT",
                             "%s is folded into %s, which is not built yet" % (page, core["core"]))


if __name__ == "__main__":
    unittest.main()
