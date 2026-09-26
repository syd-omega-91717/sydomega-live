#!/usr/bin/env python3
"""
The owner deck (omega-owner-deck.js on control-plane.html) promises "every page
in one place". It holds no copy of the page list: pages come from nav.js's
SECTIONS, then the control-plane REGISTRY, then the deck's own EXTRA list for
the pages neither knows. This test fails the moment a page file exists that
none of the three reaches, so adding a page without wiring it cannot silently
drop it from the deck.

Run: python3 -m unittest scripts/tests/test_owner_deck.py -v
"""

import glob
import os
import re
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def read(name):
    with open(os.path.join(ROOT, name), encoding="utf-8") as f:
        return f.read()


def nav_slugs():
    # sub entries look like ['key','LABEL','/page.html'] (optionally a 4th field)
    return {m.group(1) for m in re.finditer(r"'/([a-z0-9-]+)\.html(?:#[^']*)?'", read("nav.js"))}


def registry_slugs():
    src = read("omega-control-plane.js")
    start = src.index("const REGISTRY")
    return set(re.findall(r"'([a-z0-9-]+)':\{purpose:", src[start:]))


def extra_slugs():
    src = read("omega-owner-deck.js")
    block = src[src.index("var EXTRA = ["):src.index("];", src.index("var EXTRA = ["))]
    return set(re.findall(r"\['([a-z0-9-]+)',", block))


class OwnerDeckCoverage(unittest.TestCase):
    def test_every_page_file_reaches_the_deck(self):
        pages = {os.path.basename(p)[:-5] for p in glob.glob(os.path.join(ROOT, "*.html"))}
        covered = nav_slugs() | registry_slugs() | extra_slugs()
        missing = sorted(pages - covered)
        self.assertEqual(missing, [], "pages the owner deck cannot reach: %s" % missing)

    def test_extra_lists_only_real_pages(self):
        pages = {os.path.basename(p)[:-5] for p in glob.glob(os.path.join(ROOT, "*.html"))}
        ghosts = sorted(extra_slugs() - pages)
        self.assertEqual(ghosts, [], "EXTRA names pages that do not exist: %s" % ghosts)

    def test_registry_names_only_real_pages(self):
        # security/upload once sat here with no page behind them: 404 tiles.
        pages = {os.path.basename(p)[:-5] for p in glob.glob(os.path.join(ROOT, "*.html"))}
        ghosts = sorted(registry_slugs() - pages)
        self.assertEqual(ghosts, [], "registry names pages that do not exist: %s" % ghosts)

    def test_parsers_see_real_data(self):
        # A regex damaged in transit reads 0 and would make the first test vacuous.
        self.assertGreater(len(nav_slugs()), 150)
        self.assertGreater(len(registry_slugs()), 100)
        self.assertGreater(len(extra_slugs()), 5)

    def test_control_plane_mounts_the_deck(self):
        html = read("control-plane.html")
        self.assertIn("/omega-owner-deck.js", html)
        self.assertIn("data-omega-owner-deck", html)


if __name__ == "__main__":
    unittest.main()
