"""Idea I17: text areas that grow with what the member writes, OPT-IN via <textarea data-autogrow>.

`field-sizing: content` alone is a regression: it ignores rows=, and a rows=6 area measured 40px (one line) in Chromium 153. The rule in css/omega-system.css restates the resting size from the
element's own rows plus its padding and border, caps growth at 60vh, and is wrapped so a browser lacking either feature keeps today's fixed box.

It is opt-in because the global form was measured and was wrong: across the 37 pages that have an unclassed or .inp textarea, 4 of 18 visible areas changed resting size (contracts 70 -> 66.4,
life 150 -> 116, sleep 60 -> 66.4), since those pages size their own area and a shared rule cannot both beat the platform's 48px floor and yield to a page's own min-height. So this file pins
that the rule is NOT global, and that every area that opts in is a real one.
"""
import glob
import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
CSS = (ROOT / "css" / "omega-system.css").read_text(encoding="utf-8")
START = CSS.index("TEXT AREAS THAT GROW WITH WHAT THE MEMBER WRITES")
RAW = CSS[START:CSS.index(".field{position:relative", START)]
BLOCK = re.sub(r"^.*?\*/", "", RAW, count=1, flags=re.S)   # the lead comment names the property too; test the rule, not the prose


class TextareaGrow(unittest.TestCase):
    def test_it_is_only_applied_where_both_features_exist(self):
        self.assertIn("@supports (field-sizing:content) and (min-height:calc(attr(rows type(<number>),2)*1lh))", BLOCK)

    def test_the_declaration_sits_inside_that_guard_and_nowhere_else(self):
        self.assertEqual(BLOCK.count("field-sizing:content"), 2, "once in the feature query, once as the declaration")
        self.assertLess(BLOCK.index("@supports"), BLOCK.index("field-sizing:content;"))

    def test_it_is_opt_in_and_never_global(self):
        self.assertIn("textarea[data-autogrow]{", BLOCK)
        self.assertNotRegex(BLOCK, r"textarea:not\(\[class\]\)|textarea\.inp|:where\(\.inp\)")
        self.assertNotRegex(BLOCK, r"(?m)^\s*textarea\s*\{")

    def test_the_resting_size_follows_rows_and_a_settable_chrome(self):
        self.assertIn("min-block-size:max(48px,calc(attr(rows type(<number>),2)*1lh + var(--oa-ta-chrome)))", BLOCK)

    def test_the_chrome_is_what_each_kind_of_area_really_carries(self):
        """Measured, not assumed: a classed area takes omega-accessibility-audit.css's padding + border, an unclassed one takes the skin's (it outranks that sheet)."""
        a11y = (ROOT / "omega-accessibility-audit.css").read_text(encoding="utf-8")
        rule = re.search(r"input,\s*textarea,\s*select\s*\{([^}]*)\}", a11y[a11y.index("min-height: 44px") - 200:]).group(1)
        classed = 2 * int(re.search(r"padding:\s*(\d+)px", rule).group(1)) + 2 * int(re.search(r"border:\s*(\d+)px solid", rule).group(1))
        skin = re.search(r":where\(\.inp\),input:not\(\[class\]\),textarea:not\(\[class\]\),select:not\(\[class\]\)\{([^}]*)\}", CSS).group(1)
        unclassed = 2 * int(re.search(r"padding:(\d+)px", skin).group(1)) + 2 * int(re.search(r"border:(\d+)px solid", skin).group(1))
        self.assertIn("--oa-ta-chrome:%dpx;" % classed, BLOCK)
        self.assertIn("textarea[data-autogrow]:not([class]){--oa-ta-chrome:%dpx}" % unclassed, BLOCK)

    def test_a_long_paste_stops_before_the_save_button_leaves_the_screen(self):
        self.assertIn("max-block-size:60vh", BLOCK)

    def test_every_opt_in_is_on_a_real_textarea(self):
        """The attribute on anything else would do nothing and look like a feature."""
        bad = []
        for f in sorted(glob.glob(str(ROOT / "*.html"))):
            text = pathlib.Path(f).read_text(encoding="utf-8", errors="ignore")
            for m in re.finditer(r"<(\w+)\b[^>]*\bdata-autogrow\b", text):
                if m.group(1).lower() != "textarea":
                    bad.append("%s <%s>" % (pathlib.Path(f).name, m.group(1)))
        self.assertEqual(bad, [])

    def test_the_measured_opt_ins_are_these_three_and_the_placeholder_caveat_is_recorded(self):
        """Opted in and measured identical at rest: heritage #h-notes, principles #p-body, creation-studio #project-description. creation-studio #asset-prompt was measured too and left out:
        field-sizing:content sizes an empty area to its placeholder, and its long one grew it 70.4 -> 93.6."""
        on = []
        for f in sorted(glob.glob(str(ROOT / "*.html"))):
            text = pathlib.Path(f).read_text(encoding="utf-8", errors="ignore")
            on += ["%s#%s" % (pathlib.Path(f).name, m.group(1)) for m in re.finditer(r"<textarea id=\"([^\"]+)\"[^>]*\bdata-autogrow\b", text)]
        self.assertEqual(sorted(on), ["creation-studio.html#project-description", "heritage.html#h-notes", "principles.html#p-body"])
        self.assertIn("also sizes an EMPTY area to fit its placeholder", RAW)


if __name__ == "__main__":
    unittest.main()
