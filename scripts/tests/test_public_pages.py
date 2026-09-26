#!/usr/bin/env python3
"""
bg.js decides which pages a signed-out or unapproved visitor may see in FOUR
separate lists: the approval-guard CSS (PUBLIC), two ACCESS GUARD exemptions
(EX), and the not-approved redirect (pub). They drifted once already: charter
sat in EX but not PUBLIC, so the page got the hiding CSS while the code that
lifts it returned early -- charter.html rendered nothing, for anyone
(CLAUDE.md 8.1 class 8). The comment above PUBLIC says "changing either list
means changing both"; this test makes that a gate instead of a comment.

It also holds the two checkers that mirror the list (verify-runtime.js,
evidence-audit.py) to the same set, so a new public page cannot be added in
one place and forgotten in another.

Run: python3 -m unittest scripts/tests/test_public_pages.py -v
"""

import os
import re
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def read(name):
    with open(os.path.join(ROOT, name), encoding="utf-8") as f:
        return f.read()


def norm(entry):
    """'/guide', '/guide.html', 'guide' -> 'guide'; the site root -> 'index'."""
    s = entry.strip().strip("'\"")
    s = s[1:] if s.startswith("/") else s
    s = s[:-5] if s.endswith(".html") else s
    return s or "index"


def bg_lists():
    src = read("bg.js")
    out = {}
    m = re.search(r"var PUBLIC = \[([^\]]*)\];", src)
    out["PUBLIC"] = {norm(x) for x in re.findall(r"'([^']*)'", m.group(1))}
    for i, m in enumerate(re.finditer(r"var EX=\{([^}]*)\};", src)):
        out["EX%d" % (i + 1)] = {norm(k) for k in re.findall(r"'([^']*)':1", m.group(1))}
    m = re.search(r"var pub=\[([^\]]*)\];", src)
    out["pub"] = {norm(x) for x in re.findall(r"'([^']*)'", m.group(1))}
    return out


class PublicPagesAgree(unittest.TestCase):
    def test_all_four_bg_lists_hold_the_same_pages(self):
        lists = bg_lists()
        self.assertEqual(len(lists), 4, "expected PUBLIC, EX x2 and pub, found %s" % sorted(lists))
        base = lists["PUBLIC"]
        for name, pages in lists.items():
            self.assertEqual(pages, base, "%s differs from PUBLIC: only in %s %s, only in PUBLIC %s"
                             % (name, name, sorted(pages - base), sorted(base - pages)))

    def test_checkers_mirror_bg(self):
        base = bg_lists()["PUBLIC"] - {"index"}
        vr = re.search(r"const PUBLIC = /\(\^\|\\/\)\(([^)]*)\)", read("scripts/verify-runtime.js"))
        self.assertIsNotNone(vr, "verify-runtime.js PUBLIC regex not found")
        vr_set = set(vr.group(1).split("|")) - {"index"}
        # verify-runtime only needs pages that must render for a signed-out
        # visitor; charter predates it. Every other public page must be there.
        self.assertEqual(base - vr_set - {"charter"}, set(),
                         "public in bg.js but not verify-runtime.js: %s" % sorted(base - vr_set - {"charter"}))
        ea = re.search(r"PUBLIC_PAGES = \{(.*?)\}", read("scripts/evidence-audit.py"), re.S)
        ea_set = set(re.findall(r"'([a-z0-9-]+)'", ea.group(1)))
        self.assertEqual(base - ea_set, set(), "public in bg.js but not evidence-audit.py: %s" % sorted(base - ea_set))

    def test_public_pages_exist(self):
        for page in bg_lists()["PUBLIC"]:
            self.assertTrue(os.path.exists(os.path.join(ROOT, page + ".html")), "%s.html missing" % page)


if __name__ == "__main__":
    unittest.main()
