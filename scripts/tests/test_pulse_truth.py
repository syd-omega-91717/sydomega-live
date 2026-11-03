"""pulse.html shows market data as live. Three ways it asserted what it had not earned (found 2026-11-03, each shown on the
unmodified page in a browser with the data sources blocked / one currency omitted):

  1. `refresh()` stamped "UPDATED hh:mm:ss" BEFORE fetching, so a total outage still read as fresh.
  2. `rates[code]||1` rendered any currency the API omitted as 1.0000 (a fabricated rate).
  3. `price_change_percentage_24h||0` rendered a missing change as a flat +0.00%.
Plus a static green LIVE badge that stayed on during an outage. Source contracts; the behaviour was verified in Chromium."""
import pathlib
import re
import unittest

HTML = (pathlib.Path(__file__).resolve().parents[2] / "pulse.html").read_text(encoding="utf-8")
REFRESH = HTML[HTML.index("async function refresh()"):HTML.index("/* Lazy-load weather/news")]


class Pulse(unittest.TestCase):
    def test_the_updated_time_is_stamped_only_after_a_source_answered(self):
        self.assertLess(REFRESH.index("await Promise.all"), REFRESH.index("refresh-ts"))
        self.assertRegex(REFRESH, r"if\(res\[0\]===true\|\|res\[1\]===true\)\{\s*var now=")

    def test_fetchers_report_success_and_failure(self):
        for fn in ("fetchCrypto", "fetchForex"):
            body = HTML[HTML.index("async function %s()" % fn):]
            body = body[:body.index("\n}\n")]
            self.assertIn("return true;", body, fn)
            self.assertIn("return false;", body, fn)

    def test_a_missing_currency_is_not_one(self):
        self.assertNotIn("rates[item.code]||1", HTML)
        self.assertIn("var have=typeof raw==='number'", HTML)

    def test_a_missing_24h_change_is_not_zero(self):
        self.assertNotIn("price_change_percentage_24h||0", HTML)

    def test_live_badge_follows_the_real_state(self):
        self.assertNotIn('color:var(--green);margin-left:4px">LIVE</span>', HTML)   # the old static top-bar badge
        self.assertIn('id="live-label"', HTML)
        self.assertIn("'LIVE':'STALE'", HTML)

    def test_the_failure_message_does_not_guess_a_cause(self):
        self.assertNotIn("CoinGecko rate limit", HTML)


if __name__ == "__main__":
    unittest.main()
