"""A tooltip is drawn once, by one module (CLAUDE.md 8.1 class 5: two modules doing one job).

Measured on unmodified main (headless render of dashboard.html, desktop hover on one [data-tooltip] element):
THREE identical boxes. omega-tooltip.js and omega-oss.js each mounted tippy on every [data-tooltip], and
omega-oss re-ran on every populate event and stacked another instance each time. After this fix: ONE box on
desktop hover and ONE on mobile tap (same script, same page). This file is the static half of that proof; the
render half is in docs/fixes/2026-11-15-tooltip-single-owner.md.
"""
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TIP = (ROOT / "omega-tooltip.js").read_text(encoding="utf-8")
OSS = (ROOT / "omega-oss.js").read_text(encoding="utf-8")
DASH = (ROOT / "dashboard.html").read_text(encoding="utf-8")


def code(src):
    return re.sub(r"/\*.*?\*/", "", src, flags=re.S)


class TooltipSingleOwner(unittest.TestCase):
    def test_oss_never_mounts_on_an_element_that_is_already_claimed(self):
        c = code(OSS)
        self.assertNotRegex(c, r"""tippy\(\s*['"]\[data-tooltip\]['"]""",
                            "omega-oss.js mounts on every [data-tooltip] again")
        self.assertIn("_tippy", c)
        self.assertIn("data-tippy-content", c)

    def test_tooltip_module_replaces_rather_than_stacks(self):
        self.assertRegex(code(TIP), r"if \(el\._tippy\) el\._tippy\.destroy\(\)")

    def test_tap_opens_it_on_touch(self):
        c = code(TIP)
        self.assertRegex(c, r"touch:\s*true")
        self.assertNotIn("'hold'", c)

    def test_dashboard_jargon_chips_explain_themselves_without_inventing(self):
        for label in ("AUTH <span", 'data-i18n="my_gate"', 'data-i18n="my_element"'):
            i = DASH.index(label)
            # the chip is the enclosing mb-item / ss-item wrapper, not the label span inside it
            start = max(DASH.rfind('<div class="mb-item"', 0, i), DASH.rfind('<div class="ss-item"', 0, i))
            tag = DASH[start:i]
            self.assertIn("data-tooltip=", tag, label)
            self.assertIn('tabindex="0"', tag, label)  # reachable by keyboard
        for term in ("PMI", "Meaning Index"):  # the hand-typed score is not explained as if real (GAP_ANALYSIS S)
            for m in re.finditer(r'class="(?:mb-item|ss-item)"[^>]*data-tooltip="([^"]*)"', DASH):
                self.assertNotIn(term, m.group(1))

    def test_the_check_can_fail(self):
        """Zero findings only means something if the old shape is caught."""
        old = "tippy('[data-tooltip]',{ content: function(el){ return 1; } });"
        self.assertRegex(old, r"""tippy\(\s*['"]\[data-tooltip\]['"]""")


if __name__ == "__main__":
    unittest.main()
