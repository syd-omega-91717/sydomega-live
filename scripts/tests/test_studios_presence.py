"""Every Studios item is present exactly once where it belongs and nothing registered is missing (scripts/studios-presence.py).

A checker that cannot fail proves nothing, so most of these tests plant a fault (a duplicate, an orphan, a missing file) and require the
checker to name it. The report that says what remains is generated and must agree with the registry and the files on disk."""
import copy
import importlib.util
import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("studios_presence", ROOT / "scripts" / "studios-presence.py")
sp = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sp)
REG = sp.load_registry()


class StudiosPresence(unittest.TestCase):
    def test_the_real_registry_has_no_duplicate_and_nothing_missing_and_the_report_is_current(self):
        self.assertEqual(sp.check(REG), [])
        self.assertEqual(sp.REPORT.read_text(encoding="utf-8"), sp.report(REG), "docs/studios/COMPLETENESS.md is stale: run scripts/studios-presence.py --write")

    def test_a_duplicate_film_character_conflict_script_or_build_is_named(self):
        bad = copy.deepcopy(REG)
        bad["franchises"][1]["films"].append(copy.deepcopy(bad["franchises"][0]["films"][0]))
        bad["characters"].append(copy.deepcopy(bad["characters"][0]))
        bad["conflicts"].append(copy.deepcopy(bad["conflicts"][0]))
        bad["franchises"][3]["series"]["scripts"] = bad["franchises"][3]["series"]["scripts"] * 2
        errs = " | ".join(sp.check(bad))
        for needle in ("film id listed more than once", "film title listed more than once", "character id listed more than once", "character name listed more than once",
                       "conflict id listed more than once", "episode script listed more than once"):
            self.assertIn(needle, errs)
        dupbuild = copy.deepcopy(REG)
        dupbuild["franchises"][0]["game"]["companions"].append(copy.deepcopy(dupbuild["franchises"][0]["game"]["companions"][0]))
        self.assertIn("build page listed more than once", " | ".join(sp.check(dupbuild)))

    def test_a_build_page_that_is_not_in_the_menu_help_or_status_exactly_once_is_named(self):
        bad = copy.deepcopy(REG)
        bad["franchises"][0]["game"]["companions"].append({"title": "Ghost", "genre": "x", "status": "PROTOTYPE", "build": "game-ghost.html", "tests": "scripts/tests/test_ghost.py"})
        errs = " | ".join(sp.check(bad))
        self.assertIn("game-ghost.html does not exist", errs)
        ghost = copy.deepcopy(REG)
        ghost["franchises"][0]["game"]["companions"].append({"title": "Twin", "genre": "x", "status": "PROTOTYPE", "build": "game-origins-bridge.html", "tests": "scripts/tests/test_bridge_logic.py"})
        self.assertIn("build page listed more than once", " | ".join(sp.check(ghost)))
        notests = copy.deepcopy(REG)
        notests["franchises"][0]["game"]["companions"][0]["tests"] = "scripts/tests/nope.py"
        self.assertIn("its tests file", " | ".join(sp.check(notests)))
        norow = copy.deepcopy(REG)
        norow["franchises"][2]["game"]["build"] = "game-origins-bridge.html"        # two games claim one page: it is then listed twice
        self.assertTrue(any("more than once" in e for e in sp.check(norow)))

    def test_an_orphan_script_or_season_bible_is_named_in_both_directions(self):
        bad = copy.deepcopy(REG)
        removed = bad["franchises"][0]["series"]["scripts"].pop()
        errs = " | ".join(sp.check(bad))
        self.assertIn("episode script on disk but claimed by no series: " + removed, errs)
        ghost = copy.deepcopy(REG)
        ghost["franchises"][1]["series"]["scripts"].append("docs/studios/franchises/zodiac-wars/series/bloodlines/season-1/episodes/E99_NOPE.fountain")
        self.assertIn("claimed but not on disk", " | ".join(sp.check(ghost)))
        nobible = copy.deepcopy(REG)
        nobible["franchises"][2]["series"].pop("bible")
        self.assertIn("season bible on disk but claimed by no series", " | ".join(sp.check(nobible)))

    def test_the_universe_bible_lists_every_conflict_once_and_a_missing_or_extra_one_is_named(self):
        bad = copy.deepcopy(REG)
        bad["conflicts"].append({"id": "C-999", "kind": "lore", "subjects": [], "resolution": "x", "status": "PROPOSED_RESOLUTION"})
        self.assertIn("conflict C-999 is in the registry but not in the universe bible", " | ".join(sp.check(bad)))
        fewer = copy.deepcopy(REG)
        fewer["conflicts"].pop()
        self.assertIn("is in the universe bible but not in the registry", " | ".join(sp.check(fewer)))

    def test_the_report_arithmetic_matches_the_registry_and_the_disk(self):
        t = sp.totals(REG)
        n_files = len(list((ROOT / "docs/studios/franchises").glob("*/series/*/season-*/episodes/*.fountain")))
        self.assertEqual(t["episodes_written"], n_files)
        self.assertEqual(t["films"], sum(len(f["films"]) for f in REG["franchises"]))
        text = sp.report(REG)
        self.assertIn("%d of %d declared episodes are not written" % (t["episodes_declared"] - t["episodes_written"], t["episodes_declared"]), text)
        self.assertIn("%d of %d have no script at all" % (t["films"] - t["films_scripted"], t["films"]), text)
        self.assertEqual(len(t["builds"]) + len(t["games_without_build"]), len(REG["franchises"]) + sum(len(f["game"].get("companions", [])) for f in REG["franchises"]))
        for title, st in t["games_without_build"]:
            self.assertNotEqual(st, "PROTOTYPE", "a game with no build cannot be a prototype")
            self.assertIn(title, text)
        self.assertIn("proposal", text)

    def test_a_page_listed_in_two_menu_sections_renders_once_because_exactly_one_entry_is_not_folded(self):
        nav = (ROOT / "nav.js").read_text(encoding="utf-8")
        entries = re.findall(r"\[\s*'([a-z0-9\-]+)'\s*,\s*'[^']+'\s*,\s*'(/[a-z0-9\-/.]*)'\s*(?:,\s*'(folded)')?\s*\]", nav)
        self.assertGreater(len(entries), 200)
        by_href = {}
        for slug, href, folded in entries:
            by_href.setdefault(href, []).append(bool(folded))
        multi = {h: v for h, v in by_href.items() if len(v) > 1}
        self.assertGreaterEqual(len(multi), 5, "the five known double-listed pages are still double-listed")
        for href, flags in multi.items():
            self.assertEqual(flags.count(False), 1, "%s is listed %d times and %d of them are not folded, so it would show %d times" % (href, len(flags), flags.count(False), flags.count(False)))


if __name__ == "__main__":
    unittest.main()
