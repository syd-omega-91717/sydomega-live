"""omega-daily-brief.js builds HTML from localStorage, which also holds data restored from a backup file or the
cloud. Every value it interpolates into innerHTML must go through esc() (CodeQL js/xss-through-dom on #1127,
FIXES_LOG 204). A source contract, so a new interpolation that skips esc() fails here."""
from pathlib import Path
import re
import unittest

SRC = (Path(__file__).resolve().parents[2] / "omega-daily-brief.js").read_text(encoding="utf-8")


class Escaping(unittest.TestCase):
    def test_helper_escapes_the_five_characters(self):
        m = re.search(r"function esc\(s\)\{.*?\n", SRC)
        self.assertIsNotNone(m)
        for ch in ("&amp;", "&lt;", "&gt;", "&quot;", "&#39;"):
            self.assertIn(ch, m.group(0))

    def test_stored_values_are_escaped_where_they_reach_html(self):
        for expr in ("esc(b.date)", "esc(b.dayScore)", "esc(b.intent||'No intent set')",
                     "esc(b.time)", "esc(b.task)", "esc(b.id)"):
            self.assertIn(expr, SRC, expr + " must be escaped before it reaches innerHTML")

    def test_no_raw_stored_value_is_concatenated_into_html(self):
        # a raw `'+b.<field>+'` inside the HTML builders means a value skipped esc()
        for field in ("intent", "task", "date", "time", "dayScore", "id"):
            self.assertNotRegex(SRC, r"'\+b\." + field + r"\+'", "raw b." + field + " concatenated into HTML")

    def test_no_inline_handlers_are_generated(self):
        self.assertNotRegex(SRC, r"on(click|change)=\\?[\"']")


if __name__ == "__main__":
    unittest.main()
