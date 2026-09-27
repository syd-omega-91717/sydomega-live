#!/usr/bin/env python3
"""
omega-srs.js + omega-review.js -- one SM-2 scheduler and one review queue
(FEATURE_IDEAS.md S5).

flashcard.html and vocabulary.html each carried their own SM-2 and had
drifted (CLAUDE.md 8.1 class 8). These tests hold the unification:

  - neither page carries its own SM-2 arithmetic any more; both call
    OmegaSRS, and so does the queue;
  - HARD is a pass (quality 3). flashcard.html mapped it to 2, which reset the
    card like AGAIN -- measured on the pinned previous version: a card at
    reps 2 / interval 6 went to reps 0 / interval 1 on HARD;
  - a mastered word still comes due (the old due drill excluded it forever);
  - the queue writes one item by id, re-reading the store each time, and
    renders member text with textContent only.

Measured in a render (2026-09-27): 3 due cards + 2 due words interleaved
card/word/card/word/card; GOOD on a new card -> 1d, ef 2.50; HARD on a word at
reps 2 / interval 6 -> 15d, ease 2.36; AGAIN -> 1d, reps 0; EASY on a mastered
word at 30d / 2.6 -> 78d / 2.70; omega_vocab_log +2; an injected <img
onerror> front rendered as text with 0 img; no overflow at 375px.

Run: python3 -m unittest scripts/tests/test_review_queue.py -v
"""
import os
import re
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def read(name):
    with open(os.path.join(ROOT, name), encoding="utf-8") as f:
        return f.read()


SRS = read("omega-srs.js")
RQ = read("omega-review.js")
FC = read("flashcard.html")
VO = read("vocabulary.html")


class OneScheduler(unittest.TestCase):
    def test_pages_delegate_to_omega_srs(self):
        self.assertIn("OmegaSRS.review(card, q, 'card')", FC)
        self.assertIn("OmegaSRS.review(word,q,'word')", VO)
        self.assertIn("window.OmegaSRS.review(list[i], q, entry.kind)", RQ)

    def test_no_second_copy_of_the_ease_formula(self):
        formula = re.compile(r"0\.1\s*-\s*\(5\s*-")
        self.assertEqual(len(formula.findall(SRS)), 1)
        for name, src in (("flashcard.html", FC), ("vocabulary.html", VO), ("omega-review.js", RQ)):
            self.assertEqual(formula.findall(src), [], name + " carries its own SM-2 ease formula")

    def test_pages_load_it_before_use(self):
        self.assertLess(FC.index('src="/omega-srs.js"'), FC.index('<script type="module">'))
        self.assertLess(VO.index('src="/omega-srs.js"'), VO.index("\n<script>\n"))
        c = read("command.html")
        self.assertLess(c.index('src="/omega-srs.js"'), c.index('src="/omega-review.js"'))


class Grades(unittest.TestCase):
    def test_hard_is_a_pass(self):
        m = re.search(r"label: 'HARD', q: (\d)", SRS)
        self.assertIsNotNone(m)
        self.assertGreaterEqual(int(m.group(1)), 3)
        self.assertIn("label: 'AGAIN', q: 1", SRS)

    def test_flashcard_buttons_come_from_the_module(self):
        self.assertIn("OmegaSRS.BUTTONS.map(", FC)
        self.assertNotIn("'PERFECT'", FC)

    def test_interval_uses_current_ease_then_updates_it(self):
        body = SRS[SRS.index("function review("):SRS.index("function hint(")]
        self.assertLess(body.index("item.interval = nextInterval("), body.index("item[f.ef] = Math.max(1.3"))


class Due(unittest.TestCase):
    def test_mastered_words_still_come_due(self):
        self.assertNotIn("w.nextReview<=today&&w.status!=='mastered'", VO)
        self.assertIn("OmegaSRS.isDue(w,'word',today)", VO)

    def test_new_cards_are_not_due(self):
        self.assertIn("return !!d && d <=", SRS)


class Queue(unittest.TestCase):
    def test_read_modify_write_by_id(self):
        body = RQ[RQ.index("function commit("):RQ.index("function css(")]
        self.assertIn("var list = read(key)", body)
        self.assertIn("String(list[j].id) === String(entry.id)", body)

    def test_no_html_sinks(self):
        self.assertNotRegex(RQ, r"\.innerHTML\s*=")
        self.assertNotIn("insertAdjacentHTML", RQ)

    def test_vocab_log_kept(self):
        self.assertIn("VLOG = 'omega_vocab_log'", RQ)

    def test_entry_points(self):
        self.assertIn("data-omega-review-open", read("omega-today.js"))
        self.assertIn('href="/command.html#review"', FC)
        self.assertIn('href="/command.html#review"', VO)


class FoundAndFixed(unittest.TestCase):
    def test_vocabulary_escapes_member_text(self):
        for field in ("w.term", "w.def", "w.example", "w.etym"):
            self.assertNotIn("${" + field + "}", VO)
            self.assertIn("${esc(" + field + ")}", VO)


if __name__ == "__main__":
    unittest.main()
