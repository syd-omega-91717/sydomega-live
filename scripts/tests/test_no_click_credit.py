"""Credit is earned by play, never by clicking a catalogue card.

Owner decision 2026-10-18 (FIXES_LOG.md): gaming.html's 132 and academy.html's
96 catalogue cards called complete_task on click -- mastery for games the
platform does not host, knowledge for exams never sat. Credit now reaches
complete_task only through a real result: the arcade's achieve() and the exam
engine's pass, both via OmegaProgress.record().
"""
import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]


def read(name):
    return (ROOT / name).read_text(encoding="utf-8")


class NoClickCredit(unittest.TestCase):
    def test_matrix_does_not_auto_wire_data_task(self):
        src = read("omega-matrix.js")
        self.assertNotIn("querySelectorAll('[data-task]')", src)

    def test_catalogue_pages_never_pay_on_click(self):
        for page in ("gaming.html", "academy.html"):
            src = read(page)
            self.assertNotIn("omegaCompleteTask(", src, page)
            self.assertNotIn("CLICK TO RECORD", src, page)

    def test_real_play_still_pays(self):
        arcade = read("omega-arcade.js")
        self.assertIn("task: 'arcade:' + game.id", arcade)
        self.assertGreaterEqual(len(re.findall(r"achieve\((ASCEND|SERPENT|ORACLE|ZODIAC|AEGIS|HADES)\)", arcade)), 6)
        self.assertIn("OmegaProgress", read("omega-exam-engine.js"))

    def test_arena_goals_match_the_six_games(self):
        core = read("omega-arena-core.js")
        for gid in ("ascend", "serpent", "oracle", "zodiac", "aegis", "hades"):
            self.assertIn(gid + ":", core)


if __name__ == "__main__":
    unittest.main()
