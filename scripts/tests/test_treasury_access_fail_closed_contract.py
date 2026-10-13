#!/usr/bin/env python3
"""Regression contract for Treasury access verification failure handling."""

from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]
SOURCE = (ROOT / "treasury.html").read_text(encoding="utf-8")


class TreasuryAccessFailClosedContract(unittest.TestCase):
    def test_session_errors_are_not_misclassified_as_signed_out(self):
        self.assertIn("var sessionResult=await sb.auth.getSession();", SOURCE)
        self.assertIn("if(sessionResult.error)throw sessionResult.error;", SOURCE)
        self.assertIn("var s=sessionResult.data&&sessionResult.data.session;", SOURCE)

    def test_profile_error_or_missing_row_does_not_become_empty_profile(self):
        self.assertIn("var profileResult=await sb.from('profiles')", SOURCE)
        self.assertIn("if(profileResult.error)throw profileResult.error;", SOURCE)
        self.assertIn("if(!profileResult.data||typeof profileResult.data!=='object')", SOURCE)
        self.assertNotIn(".maybeSingle()).data||{}", SOURCE)

    def test_failure_does_not_reveal_treasury_app(self):
        self.assertIn("if(app)app.style.display='none';", SOURCE)
        self.assertIn("if(panel)panel.hidden=false;", SOURCE)
        self.assertIn("Treasury remains locked.", SOURCE)
        self.assertNotIn("document.getElementById('app').style.display='flex';console.warn(e);", SOURCE)

    def test_error_state_has_a_real_retry_navigation(self):
        self.assertIn('id="treasury-load-error" hidden role="alert"', SOURCE)
        self.assertIn('id="treasury-load-retry" href="/treasury.html"', SOURCE)


if __name__ == "__main__":
    unittest.main()
