#!/usr/bin/env python3
"""
A control under the pointer must receive the click.

Measured 2026-10-04 with a real-mouse probe (hover a control nested in a
`[class*="card"]`, then hit-test where it now sits): on the tree before this
fix, 9 of 30 such controls across 14 pages were unclickable while hovered --
social.html 9 of 10 -- and the new Daily Three quiz on dashboard.html could not
be answered by mouse at all. After it, 0 of 32.

The cause was three layers each turning ordinary page content into one shared
3-D rendering context. Inside a preserve-3d context the browser depth-sorts
for hit-testing as well as paint, so a tile lifted with translateZ() -- by a
hover tilt or the scroll parallax -- sits "in front of" a neighbour or a child
and takes its click:

  - omega-spatial-system.css put `transform-style:preserve-3d` on the content
    column (main/.main/.page-shell) and on every card;
  - bg.js's cinematic-motion pass set it inline on every button, link, input
    and `[class*="card"]`, tilted controls inside an already-tilting card,
    and left a resting perspective() transform after mouseleave;
  - bg.js's ofx-tilt layer set it on every `[class*="-card"]` it tilts.

`perspective` on the column is what gives a tilted card its depth; it does not
need preserve-3d. These tests hold that line.

Run: python3 -m unittest scripts/tests/test_click_depth_contract.py -v
"""
import os
import re
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def read(name):
    with open(os.path.join(ROOT, name), encoding="utf-8") as f:
        return f.read()


def rule_body(css, selector_start):
    """The declaration block of the first rule whose selector starts as given."""
    i = css.find(selector_start)
    if i < 0:
        return None
    j = css.find("{", i)
    k = css.find("}", j)
    return css[j + 1:k]


class SpatialSystemStaysFlat(unittest.TestCase):
    def setUp(self):
        self.css = read("omega-spatial-system.css")

    def test_content_column_is_not_a_3d_context(self):
        body = rule_body(self.css, ".omega-cinematic .main,.omega-cinematic .page-shell")
        self.assertIsNotNone(body, "content-column rule not found")
        self.assertIn("perspective:", body, "the column keeps its perspective (the depth look)")
        self.assertNotIn("preserve-3d", body)

    def test_cards_are_not_3d_contexts(self):
        body = rule_body(self.css, ".omega-cinematic :where(.card,.kpi,.kpi-card")
        self.assertIsNotNone(body, "card depth rule not found")
        self.assertNotIn("preserve-3d", body)


class BgMotionLayersStayFlat(unittest.TestCase):
    def setUp(self):
        self.js = read("bg.js")

    def test_cinematic_pass_sets_no_preserve_3d(self):
        self.assertNotRegex(self.js, r"style\.transformStyle\s*=\s*['\"]preserve-3d")

    def test_controls_inside_cards_do_not_tilt(self):
        self.assertIn("parentElement.closest('[class*=\"card\"],.kpi')", self.js)
        self.assertIn("classList.add('omg-no-tilt')", self.js)

    def test_mouseleave_clears_the_transform(self):
        self.assertNotIn("translateZ(0) rotateX(0) rotateY(0)", self.js,
                         "a resting perspective() transform keeps the element a 3-D context")

    def test_ofx_tilt_css_is_flat(self):
        m = re.search(r"'\.ofx-tilt\{([^}]*)\}'", self.js)
        self.assertIsNotNone(m, ".ofx-tilt rule not found")
        self.assertNotIn("preserve-3d", m.group(1))


class DailyThreeWiring(unittest.TestCase):
    """omega-daily.js: its own guard/identity, and the arcade's daily signal."""

    def test_distinct_identity_from_omega_today(self):
        daily = read("omega-daily.js")
        self.assertIn("window.OmegaDaily", daily)
        self.assertIn("data-omega-daily", daily)
        self.assertNotIn("window.OmegaToday =", daily)

    def test_dashboard_mounts_and_loads_it(self):
        dash = read("dashboard.html")
        self.assertIn('<script src="/omega-daily.js" defer></script>', dash)
        self.assertIn("data-omega-daily", dash)

    def test_dashboard_status_strip_has_no_developer_counts(self):
        dash = read("dashboard.html")
        strip = dash[dash.find('<div class="status-strip"'):]
        strip = strip[:strip.find("</div>\n\n")]
        for key in ("js_engines", "sql_files", "lattice_nodes"):
            self.assertNotIn('data-i18n="%s"' % key, strip)

    def test_arcade_emits_daily_result(self):
        arcade = read("omega-arcade.js")
        self.assertIn("'omega-arcade:daily'", arcade)

    def test_progress_tasks_are_day_scoped(self):
        daily = read("omega-daily.js")
        self.assertIn("'daily:' + today + ':' + ritual", daily)
        # every write checks its result through OmegaProgress.record, never sb.from().insert
        self.assertNotRegex(daily, r"\.insert\(|\.upsert\(|\.update\(")


if __name__ == "__main__":
    unittest.main()
