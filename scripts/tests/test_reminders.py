#!/usr/bin/env python3
"""
omega-reminders.js -- ritual reminders (FEATURE_IDEAS.md S4) -- plus the
calendar (.ics, S7 step 1) and export (S6) additions that ship with it.

Reminders are the one feature here that can annoy a member daily, so these
tests hold the rules that keep them from doing so:

  - opt-in: nothing runs until the member turns them on;
  - two slots, at most one of each a day, both claimed before showing (two
    tabs must not double-send), never inside quiet hours;
  - a nudge needs a state trigger: an open ritual, or a real streak at risk;
  - the learned window never pretends: below 3 observed check-ins it says so
    and uses the member's own time (CLAUDE.md 8.1 class 9);
  - member text never reaches HTML; the .ics escapes it per RFC 5545;
  - the service worker opens only same-origin pages from a notification.

Measured in a render (2026-09-27, fixed clock): routine card at 18:05 with a
18:00 window and none at 17:55; one card per day across a reload; streak-save
card at 21:10 only with save on; nothing at 23:00 or with reminders off;
3 observed check-ins moved the window to the median minus 30 minutes; 0 page
errors; the card's buttons are uncovered at 1280px and 375px.

Run: python3 -m unittest scripts/tests/test_reminders.py -v
"""
import os
import re
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def read(name):
    with open(os.path.join(ROOT, name), encoding="utf-8") as f:
        return f.read()


SRC = read("omega-reminders.js")


class Rules(unittest.TestCase):
    def test_opt_in(self):
        self.assertIn("on: p.on === true", SRC)
        self.assertRegex(SRC, r"if \(!p\.on \|\| !approved\(\)\) return;")

    def test_two_slots_claimed_before_showing(self):
        self.assertIn("claim('save')", SRC)
        self.assertIn("claim('routine')", SRC)
        body = SRC[SRC.index("function claim("):SRC.index("function approved(")]
        self.assertLess(body.index("write(SK, s)"), body.index("return true"))

    def test_quiet_hours(self):
        self.assertIn("QUIET_START = 22 * 60 + 30", SRC)
        self.assertIn("QUIET_END = 7 * 60 + 30", SRC)
        self.assertIn("if (m < QUIET_END || m >= QUIET_START || !canDeliver()) return;", SRC)

    def test_state_triggers(self):
        self.assertIn("ev.open.length && claim('routine')", SRC)
        self.assertIn("ev.streak.days >= 1 && ev.streak.today === false", SRC)

    def test_learned_window_needs_samples(self):
        self.assertIn("MIN_SAMPLES = 3", SRC)
        self.assertIn("t.length >= MIN_SAMPLES", SRC)
        self.assertIn("Learning your rhythm: ", SRC)
        self.assertNotIn("Math.random", SRC)

    def test_observed_transitions_only(self):
        # A store restored already-done must not record the restore time.
        self.assertIn("if (seenOpen[it.id] !== day) return;", SRC)

    def test_no_html_sinks(self):
        self.assertNotRegex(SRC, r"\.innerHTML\s*=")
        self.assertNotIn("insertAdjacentHTML", SRC)

    def test_loaded_everywhere_and_mounted(self):
        self.assertIn("script[data-omega-reminders-mod]", read("bg.js"))
        self.assertIn("data-omega-reminders></div>", read("notifications.html"))
        self.assertIn("/notifications.html#reminders", read("omega-today.js"))


class ServiceWorker(unittest.TestCase):
    def test_notificationclick_same_origin(self):
        sw = read("sw.js")
        self.assertIn("addEventListener('notificationclick'", sw)
        self.assertIn("target.origin !== self.location.origin", sw)


class Calendar(unittest.TestCase):
    def test_blocks_ics_escapes_and_folds(self):
        c = read("command.html")
        self.assertIn(".replace(/;/g,'\\\\;')", c)
        self.assertIn(".replace(/,/g,'\\\\,')", c)
        self.assertIn("join('\\r\\n ')", c)

    def test_rituals_ics_has_alarm(self):
        self.assertIn("'RRULE:FREQ=DAILY'", SRC)
        self.assertIn("'BEGIN:VALARM'", SRC)


class Export(unittest.TestCase):
    def test_tracker_stores_use_member_state_definition(self):
        e = read("omega-export.js")
        self.assertIn("fetched.tracker_stores", e)
        self.assertIn("MS.isMemberKey(k)", e)


class FoundAndFixed(unittest.TestCase):
    def test_notifications_escapes_member_text(self):
        n = read("notifications.html")
        for field in ("r.text", "r.cat", "n.title", "n.body"):
            self.assertIn("esc(" + field + ")", n)

    def test_done_by_id_not_sorted_index(self):
        n = read("notifications.html")
        self.assertNotIn("doneReminder('+i+')", n)
        self.assertIn("doneReminder('+(+r.id||0)+')", n)

    def test_time_asks_permission_on_gesture_only(self):
        t = read("time.html")
        start = t.index("function startTimer(){")
        self.assertEqual(t.count("Notification.requestPermission()"), 1)
        self.assertGreater(t.index("Notification.requestPermission()"), start)


if __name__ == "__main__":
    unittest.main()
