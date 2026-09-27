#!/usr/bin/env python3
"""
Habit, journal and streak-freeze day keys are the member's LOCAL calendar day.

habits.html wrote a log under the UTC date and read it back by walking from
local midnight -- `d.setHours(0,0,0,0)` then `d.toISOString()`, which names the
previous UTC day in every UTC+ zone. Measured with the harness `timezoneId`
(2026-09-27, one daily habit, one check-in through the real toggle):

    zone              local time        stored   streak  today's dot
    Asia/Beirut       Sun 10:00         09-27    0d      dark        (before)
    America/New_York  Sat 21:00         09-28    0d      dark        (before)
    UTC               Sun 12:00         09-27    1d      lit
  after the fix, all four cases store the local day and show 1d / lit.

omega-streak-freeze.js and journal.html used the same pair, and so did the
habit half of omega-today.js. Weekly keys named the UTC date of local Sunday
midnight -- a Saturday east of Greenwich -- so habits.html re-keys any
Saturday 'week-' key to its Sunday once (verified: week-2026-09-26 ->
week-2026-09-27 in Beirut).

Run: python3 -m unittest scripts/tests/test_day_keys.py -v
"""
import os
import re
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def read(name):
    with open(os.path.join(ROOT, name), encoding="utf-8") as f:
        return f.read()


LOCAL = re.compile(r"getFullYear\(\)\s*\+\s*'-'")


class LocalDayKeys(unittest.TestCase):
    def test_habits_writes_and_reads_local(self):
        h = read("habits.html")
        self.assertRegex(h, LOCAL)
        self.assertIn("function todayKey(){ return dayKey(new Date()); }", h)
        self.assertIn("return 'week-'+dayKey(t);", h)
        self.assertNotIn("weekKey(d):d.toISOString().slice(0,10)", h)

    def test_habits_rekeys_old_weekly_keys_once(self):
        h = read("habits.html")
        self.assertIn("omega_habit_weekkeys_local", h)
        self.assertIn("d.getDay()!==6", h)

    def test_freeze_module_local(self):
        f = read("omega-streak-freeze.js")
        self.assertRegex(f, LOCAL)
        self.assertNotIn("function dateKey(d) { return d.toISOString()", f)

    def test_freeze_scope_tolerates_partial_state(self):
        self.assertIn("if (!sc.activeDays || typeof sc.activeDays !== 'object') sc.activeDays = {};",
                      read("omega-streak-freeze.js"))

    def test_journal_local(self):
        j = read("journal.html")
        self.assertIn("function today() { return dayKey(new Date()); }", j)
        self.assertNotIn("dates.has(d.toISOString().slice(0,10))", j)

    def test_today_panel_habits_local(self):
        t = read("omega-today.js")
        self.assertIn("function lday(d)", t)
        self.assertIn("weekKey(new Date()) : LTODAY", t)
        self.assertIn("return 'week-' + lday(t);", t)
        self.assertIn("complete(ldaysBack(i))", t)
        self.assertIn("habitRate(ldaysBack(6), LTODAY)", t)


if __name__ == "__main__":
    unittest.main()
