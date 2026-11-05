"""The dock, its tooltips and the phone drawer group the 15 nav sections into 8 doors.

Only the grouping changed (nav.js GROUPS). PS, SECTIONS, OmegaAxis, the full launcher, search and the owner deck
still use the 15 sections, so every page keeps its accent and URL. These tests keep the grouping honest:
every section lands in exactly one door, merged tooltips stay short, and the dock renders from GROUPS.
"""
import pathlib
import re
import unittest

SRC = (pathlib.Path(__file__).resolve().parents[2] / "nav.js").read_text(encoding="utf-8")
DOORS = {"command", "identity", "ascend", "cosmos", "order", "vault", "intel", "govern"}


def section_keys():
    return re.findall(r"\{key:'([a-z]+)'", SRC)


def group_of():
    body = re.search(r"var GROUP_OF=\{(.*?)\};", SRC, re.S).group(1)
    return dict(re.findall(r"([a-z]+):'([a-z]+)'", body))


class NavEightDoors(unittest.TestCase):
    def test_fifteen_sections_become_eight_doors(self):
        keys = section_keys()
        self.assertEqual(len(keys), 15)
        g = group_of()
        doors = {g.get(k, k) for k in keys}
        self.assertEqual(doors, DOORS)

    def test_every_merge_targets_a_real_door_and_a_real_section(self):
        keys = set(section_keys())
        for src, dst in group_of().items():
            self.assertIn(src, keys, src)
            self.assertIn(dst, DOORS, dst)
            self.assertIn(dst, keys, dst)

    def test_merged_tooltips_stay_short(self):
        body = re.search(r"var GROUP_COMPACT=\{(.*?)\n  \};", SRC, re.S).group(1)
        lists = re.findall(r"([a-z]+):\[(.*?)\]", body)
        self.assertEqual({k for k, _ in lists}, {"identity", "ascend", "cosmos", "vault"})
        for door, items in lists:
            self.assertLessEqual(len(re.findall(r"'[^']+'", items)), 8, door)

    def test_core_doors_are_seven_and_govern_stays_behind_more(self):
        core = re.search(r"var CORE_SECTIONS=\[(.*?)\];", SRC).group(1)
        core = set(re.findall(r"'([a-z]+)'", core))
        self.assertEqual(len(core), 7)
        self.assertTrue(core <= DOORS)
        self.assertNotIn("govern", core)

    def test_dock_and_drawer_render_from_groups_not_sections(self):
        self.assertIn("GROUPS.forEach(function(sec){\n    var isAct=sec.key===ACTIVE_GROUP;", SRC)
        self.assertIn("var DRAWER_SECTIONS=GROUPS.map(", SRC)
        # the full launcher, search and the owner deck must keep every section
        self.assertIn("for(var si=0;si<SECTIONS.length;si++){", SRC)


if __name__ == "__main__":
    unittest.main()
