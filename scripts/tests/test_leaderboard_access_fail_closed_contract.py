#!/usr/bin/env python3
"""Regression contract for leaderboard access verification failure handling."""

from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]
JS = (ROOT / "leaderboard.js").read_text(encoding="utf-8")
HTML = (ROOT / "leaderboard.html").read_text(encoding="utf-8")


class LeaderboardAccessFailClosedContract(unittest.TestCase):
    def test_session_error_is_not_misclassified_as_signed_out(self):
        self.assertIn("var sessionResult=await sb.auth.getSession();", JS)
        self.assertIn("if(sessionResult.error)throw sessionResult.error;", JS)
        self.assertIn("var s=sessionResult.data&&sessionResult.data.session;", JS)

    def test_profile_error_and_missing_row_are_not_empty_profile(self):
        self.assertIn("var profileResult=await sb.from('profiles')", JS)
        self.assertIn("if(profileResult.error)throw profileResult.error;", JS)
        self.assertIn("if(!profileResult.data||typeof profileResult.data!=='object')", JS)
        self.assertNotIn(".maybeSingle()).data||{}", JS)

    def test_access_failure_does_not_reveal_leaderboard(self):
        self.assertIn("if(app)app.style.display='none';", JS)
        self.assertIn("if(panel)panel.hidden=false;", JS)
        self.assertNotIn("document.getElementById('app').style.display='flex';console.warn(e);", JS)

    def test_visible_error_has_retry_navigation_outside_hidden_app(self):
        self.assertIn('id="leaderboard-load-error" hidden role="alert"', HTML)
        self.assertIn('id="leaderboard-load-retry" href="/leaderboard.html"', HTML)
        self.assertLess(HTML.index('id="leaderboard-load-error"'), HTML.index('<script>\nfunction setTab(name)'))


if __name__ == "__main__":
    unittest.main()
