#!/usr/bin/env python3
"""
Text contrast held at the token and at the pages a 2026-09-27 sweep fixed.

verify-runtime.js --all --contrast-detail listed 48 text elements between 3:1
and 4.5:1 (legible, but under WCAG AA for the 12px type this platform uses).
The largest single cause was a token: --crim (#CA5850), the only text colour
in the palette under 4.5:1 on the card surfaces, on 6 pages. It is #CF6760
now, in BOTH owners (theme.js and css/omega-system.css -- CLAUDE.md 4: change
both or it does not ship). The rest were page-local accent colours used as
small text, each given a same-hue tint; and enter.html's four layer tabs had
no rule at all and rendered as the browser's grey system buttons.

Run: python3 -m unittest scripts/tests/test_text_contrast.py -v
"""
import os
import re
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CARD = (12, 11, 16)   # the darkest card surface the sweep measured against


def read(name):
    with open(os.path.join(ROOT, name), encoding="utf-8") as f:
        return f.read()


def lum(hexcol):
    c = [int(hexcol[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    c = [v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4 for v in c]
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]


def ratio(hexcol, bg=CARD):
    lb = 0.2126 * (bg[0] / 255 / 12.92) + 0.7152 * (bg[1] / 255 / 12.92) + 0.0722 * (bg[2] / 255 / 12.92)
    la = lum(hexcol)
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)


class Tokens(unittest.TestCase):
    TEXT_TOKENS = ("--gold", "--solar", "--cyan", "--crim", "--green", "--ink", "--muted")

    def token(self, src, name):
        m = re.search(re.escape(name) + r"\s*:\s*(#[0-9A-Fa-f]{6})\s*;", src)
        return m.group(1) if m else None

    def test_crim_matches_in_both_owners(self):
        a = self.token(read("theme.js"), "--crim")
        b = self.token(read("css/omega-system.css"), "--crim")
        self.assertEqual(a.upper(), b.upper(), "theme.js and omega-system.css disagree on --crim")

    def test_every_text_token_clears_aa_on_the_card_surface(self):
        src = read("theme.js")
        for t in self.TEXT_TOKENS:
            v = self.token(src, t)
            if v is None:
                continue
            self.assertGreaterEqual(ratio(v), 4.5, "%s %s is %.2f:1" % (t, v, ratio(v)))


class Pages(unittest.TestCase):
    def test_entry_tabs_are_styled(self):
        css = read("enter.html").split("</style>")[0]
        self.assertRegex(css, r"\.lt\{[^}]*background:none")
        self.assertIn(".lt.active", css)

    def test_accent_tints_used_for_small_text(self):
        self.assertIn("--crimson2-text:#D85D50", read("media.html"))
        m = re.search(r"\.ci-tag\{[^}]*\}", read("mirror.html"))
        self.assertIsNotNone(m)
        self.assertIn("color:#A86EBF", m.group(0))
        self.assertIn("textColor:'#936CFF'", read("houses.html"))
        self.assertIn("(el.txt||el.col)", read("elements.html"))
        self.assertIn("(el.text||el.color)", read("tribe.html"))


if __name__ == "__main__":
    unittest.main()
