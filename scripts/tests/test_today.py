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


class Readiness(unittest.TestCase):
    """S3: an Oura-style score from seven NAMED contributors. Render-verified
    2026-09-27: sleep 7.25h q4, mood 8/energy 6/stress 3, 1 workout, 2/21
    habits -> contributors 100,80,80,60,80,100,10 -> 73 READY; a member with
    only a sleep entry (2 contributors) gets no score."""

    def setUp(self):
        self.src = read("omega-today.js")

    def test_score_withheld_below_three_contributors(self):
        self.assertIn("var MIN_CONTRIB = 3;", self.src)
        self.assertIn("if (cs.length < MIN_CONTRIB) {", self.src)

    def test_seven_named_contributors(self):
        block = self.src[self.src.index("function contributors()"):self.src.index("function band(")]
        for cid in ("sleep", "quality", "mood", "energy", "stress", "training", "habits"):
            self.assertIn("id: '%s'" % cid, block)

    def test_oura_bands(self):
        self.assertIn("score >= 85 ? 'PRIMED' : (score >= 70 ? 'READY' : 'RECOVER')", self.src)

    def test_rows_survive_the_global_anchor_rule(self):
        # a[href]{display:inline-flex} collapsed each bar to 0px until this.
        self.assertIn(".ord a.ord-row{display:grid!important", self.src)


class Week(unittest.TestCase):
    """S2: the weekly review's measured half, on weekly.html."""

    def setUp(self):
        self.src = read("omega-today.js")

    def test_direction_needs_logged_entries_in_both_weeks(self):
        self.assertIn("if (p && c.e && p.e && p.v !== c.v) {", self.src)

    def test_monday_start_matches_weekly_page(self):
        self.assertIn("monday.setDate(d.getDate()-(day===0?6:day-1))", read("weekly.html"))
        self.assertIn("(dow === 0 ? 6 : dow - 1)", self.src)

    def test_member_text_never_parsed_as_html(self):
        # Carry-over renders the member's own priorities: textContent only.
        self.assertNotIn("innerHTML", self.src)
        self.assertIn("li.textContent = txt", self.src)

    def test_mounted_on_weekly_and_command(self):
        self.assertIn("<div data-omega-week></div>", read("weekly.html"))
        self.assertIn('<script src="/omega-today.js" defer></script>', read("weekly.html"))
        self.assertIn("<div data-omega-readiness></div>", read("command.html"))


class StreakFreeze(unittest.TestCase):
    """habitStreak() honours omega-streak-freeze.js as habits.html does.
    Measured 2026-09-27: logs on days 1, 3, 4 with day 2 frozen gave 1 on the
    previous version and 4 now; the save nudge says 'protected' when every
    open habit still has a freeze in hand."""

    def test_frozen_day_counts(self):
        src = read("omega-today.js")
        self.assertIn("F.isFrozen(h.id, k)", src)
        self.assertIn("covered: covered", src)

    def test_save_nudge_is_honest_when_covered(self):
        rem = read("omega-reminders.js")
        self.assertIn("if (ev.streak.covered)", rem)
        self.assertIn("is protected tonight", rem)
