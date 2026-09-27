#!/usr/bin/env python3
"""
omega-today.js -- the TODAY panel on the Daily Command Brief (command.html).

It turns nine modules' own saved stores into one tile each. These tests hold
the three things that would make it harmful rather than useful:

  - it must never fabricate (CLAUDE.md 8.1 class 9): no Math.random, and a
    module the member never used renders START, not a number;
  - it must read each module's REAL store key (a renamed key would silently
    show START forever, the §8.1 class 2 shape in localStorage form);
  - every tile must link to a page that exists (the tile is the entry point).

Measured in a render (2026-09-27, seeded stores): habits 2/3, cards due 2
(future and new cards excluded), water 1.3/2.5 L (an old entry excluded),
sleep 7.3 H, mood logged, training 1 in 7 days -- 3 of 6 done; empty stores
render 9 START tiles; 0 page errors; no overflow at 375px.

Run: python3 -m unittest scripts/tests/test_today.py -v
"""
import os
import re
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def read(name):
    with open(os.path.join(ROOT, name), encoding="utf-8") as f:
        return f.read()


class Today(unittest.TestCase):
    def setUp(self):
        self.src = read("omega-today.js")

    def test_no_fabrication(self):
        code = re.sub(r"/\*.*?\*/", "", self.src, flags=re.S)
        self.assertNotIn("Math.random", code)
        self.assertIn("if (!r) {", code)            # never-used module -> START tile
        self.assertIn("'START'", code)

    def test_reads_each_owning_pages_real_key(self):
        owners = {
            "omega_habits_v2": "habits.html", "omega_habit_logs_v2": "habits.html",
            "omega_fc_cards": "flashcard.html", "omega_vocab": "vocabulary.html",
            "omega_water_log": "water.html", "omega_water_goal": "water.html",
            "omega_sleep_log": "sleep.html", "omega_mood_log": "mood.html",
            "omega_gratitude_log": "gratitude.html", "omega_meditate_log": "meditate.html",
            "omega_workout_log": "workout.html",
        }
        for key, page in owners.items():
            self.assertIn("'%s'" % key, self.src, key)
            self.assertIn(key, read(page), "%s no longer uses %s" % (page, key))

    def test_habit_rules_mirror_habits_page(self):
        habits = read("habits.html")
        self.assertIn("if(habit.freq==='weekly') return dow===0;", habits)
        self.assertIn("if (h.freq === 'weekly') return dow === 0;", self.src)
        self.assertIn("'week-'", habits)
        self.assertIn("'week-'", self.src)

    def test_every_tile_links_to_a_real_page(self):
        for href in re.findall(r"href: '/([a-z-]+\.html)'", self.src):
            self.assertTrue(os.path.exists(os.path.join(ROOT, href)), href)

    def test_mounted_on_the_command_brief(self):
        html = read("command.html")
        self.assertIn("<div data-omega-today></div>", html)
        self.assertIn('<script src="/omega-today.js" defer></script>', html)


if __name__ == "__main__":
    unittest.main()
