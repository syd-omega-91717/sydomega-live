"""A page-emblem placeholder written after </main> inside .shell is a third flex column (CLAUDE.md 4: ".shell is a flex row").

It took 329-364 px from the content column on 12 pages (main rendered 820-855 px instead of 1184 at 1280 wide) and made the width depend on when
omega-page-emblem.js mounted the canvas: about 1 load in 30 measured the wide column before the emblem existed (measured 2026-11-25, 40 loads each).
"""
import glob, os, re, unittest

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SIBLING = re.compile(r'</main>\s*<div data-page-emblem=')
EMBLEM = re.compile(r'<div data-page-emblem="[^"]*"[^>]*>\s*</div>')


class EmblemStaysInMain(unittest.TestCase):
    def test_no_emblem_is_a_flex_sibling_of_main(self):
        bad = []
        for f in sorted(glob.glob(os.path.join(ROOT, "*.html"))):
            s = open(f, encoding="utf-8", errors="replace").read()
            if SIBLING.search(s) and re.search(r"<div class=.shell.", s):
                bad.append(os.path.basename(f))
        self.assertEqual(bad, [], "emblem placeholder directly after </main> (a third column in .shell): " + ", ".join(bad))

    def test_the_gate_sees_a_planted_violation(self):
        planted = '<div class="shell"><main>x</main>\n<div data-page-emblem="a" style="m"></div></div>'
        self.assertTrue(SIBLING.search(planted))


if __name__ == "__main__":
    unittest.main()
