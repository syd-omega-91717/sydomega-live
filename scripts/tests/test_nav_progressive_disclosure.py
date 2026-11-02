"""The nav leads with a short core set of sections and folds the rest behind MORE (measured 2026-11-02: 15 sections and
107 sidebar links on every page). These are source contracts for the decisions that would silently regress:

  - the core set stays small, every key is a real section, and Home (command) and the profile (identity) are always in it;
  - the section you are IN is never folded away, and nothing is removed (folded sections stay in SECTIONS, so search, the
    full menu and the reachability gate still see them);
  - MORE sits OUTSIDE the scrolling section list (inside it, a 700px window pushed it behind a hidden scrollbar);
  - the dock and the phone drawer share one remembered setting;
  - the four new strings exist in T_EN and every language pack.
The layout itself (all core sections fit at 600-900px tall, MORE visible) was measured in a real browser, see the fix entry.
"""
import json
import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
NAV = (ROOT / "nav.js").read_text(encoding="utf-8")
KEYS = ("nav_more", "nav_less", "nav_more_sections", "nav_fewer_sections")


def section_keys():
    i = NAV.index("var SECTIONS=[")
    return re.findall(r"\{key:'([a-z]+)'", NAV[i:i + 200000])


class CoreSet(unittest.TestCase):
    def core(self):
        m = re.search(r"var CORE_SECTIONS=\[([^\]]*)\]", NAV)
        self.assertIsNotNone(m, "nav.js lost CORE_SECTIONS")
        return re.findall(r"'([a-z]+)'", m.group(1))

    def test_small_and_made_of_real_sections(self):
        core, real = self.core(), section_keys()
        self.assertGreaterEqual(len(core), 5)
        self.assertLessEqual(len(core), 8, "the point is fewer doors; more than 8 core sections defeats it")
        self.assertEqual(len(core), len(set(core)))
        for k in core:
            self.assertIn(k, real, k + " is not a section")

    def test_home_and_profile_are_always_reachable(self):
        self.assertIn("command", self.core())
        self.assertIn("identity", self.core())

    def test_nothing_is_removed_only_folded(self):
        # every non-core section is still defined (search, the full menu and the reachability gate read SECTIONS)
        self.assertGreaterEqual(len(section_keys()), 15)

    def test_the_active_section_is_never_folded(self):
        self.assertIn("CORE_SECTIONS.indexOf(sec.key)<0&&!isAct?' on-more-item'", NAV)
        self.assertIn("CORE_SECTIONS.indexOf(sec.key)<0&&sec.key!==activeSection?' ds-more'", NAV)


class Controls(unittest.TestCase):
    def test_more_is_pinned_outside_the_scrolling_list(self):
        i_list = NAV.index("h+='<div class=\"on-sections\">';")
        close = "  h+='</div>';\n  /* MORE is pinned OUTSIDE"
        self.assertIn(close, NAV, "the .on-sections div must close BEFORE the MORE control is built")
        i_close = NAV.index(close)
        i_more = NAV.index("h+='<div class=\"on-item on-more-wrap\">")
        self.assertLess(i_list, i_close)
        self.assertLess(i_close, i_more)

    def test_both_surfaces_share_one_remembered_setting(self):
        self.assertGreaterEqual(NAV.count("omega_nav_all"), 4)      # read once, written by the dock and by the drawer
        self.assertIn("#omega-side:not(.on-all) .on-item.on-more-item{display:none!important}", NAV)
        self.assertIn("#omega-drawer:not(.ds-all) .ds-section.ds-more{display:none}", NAV)

    def test_a_blocked_store_costs_only_the_memory(self):
        for m in re.finditer(r"localStorage\.(?:get|set)Item\('omega_nav_all'", NAV):
            before = NAV[max(0, m.start() - 80):m.start()]
            self.assertIn("try{", before, "a blocked localStorage must not break the nav")

    def test_short_windows_keep_all_core_sections_in_reach(self):
        self.assertIn("@media (max-height:760px)", NAV)
        self.assertIn("#omega-side .on-brand{display:none!important}", NAV)


class Strings(unittest.TestCase):
    def test_every_language_has_the_four_keys(self):
        t_en = (ROOT / "i18n.js").read_text(encoding="utf-8")
        for k in KEYS:
            self.assertRegex(t_en, r'"%s":"[^"]+"' % k, "T_EN lacks " + k)
        for pack in sorted((ROOT / "i18n").glob("*.json")):
            data = json.loads(pack.read_text(encoding="utf-8"))
            for k in KEYS:
                self.assertTrue(str(data.get(k, "")).strip(), pack.name + " lacks " + k)
                self.assertNotIn("&", data[k], "an HTML entity in a value renders literally")


if __name__ == "__main__":
    unittest.main()
