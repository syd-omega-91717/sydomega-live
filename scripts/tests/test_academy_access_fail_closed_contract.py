#!/usr/bin/env python3
"""Regression contract for Academy access verification and failure handling."""

from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]
SOURCE = (ROOT / "academy.html").read_text(encoding="utf-8")


class AcademyAccessFailClosedContract(unittest.TestCase):
    def test_session_error_is_not_misclassified_as_signed_out(self):
        self.assertIn("var sessionResult=await sb.auth.getSession();", SOURCE)
        self.assertIn("if(sessionResult.error)throw sessionResult.error;", SOURCE)
        self.assertIn("var s=sessionResult.data&&sessionResult.data.session;", SOURCE)

    def test_profile_query_error_and_missing_profile_are_not_empty_profile(self):
        self.assertIn("var profileResult=await sb.from('profiles')", SOURCE)
        self.assertIn("if(profileResult.error)throw profileResult.error;", SOURCE)
        self.assertIn("if(!profileResult.data||typeof profileResult.data!=='object')", SOURCE)
        self.assertNotIn(".maybeSingle()).data||{}", SOURCE)

    def test_failed_exam_count_is_not_rendered_as_zero(self):
        self.assertIn("if(tc.error)throw tc.error;", SOURCE)
        self.assertIn("if(!Number.isFinite(tc.count))throw new Error('exam_count_unavailable');", SOURCE)
        self.assertIn("sid('ex-passed',tc.count);", SOURCE)
        self.assertNotIn("sid('ex-passed',tc.count||0)", SOURCE)

    def test_access_verification_failure_keeps_academy_hidden(self):
        self.assertIn("if(app)app.style.display='none';", SOURCE)
        self.assertIn("if(panel)panel.hidden=false;", SOURCE)
        self.assertIn("No academy content has been unlocked.", SOURCE)
        self.assertNotIn("document.getElementById('app').style.display='flex';console.warn(e);", SOURCE)

    def test_visible_error_has_retry_action(self):
        self.assertIn('id="academy-load-error" hidden role="alert"', SOURCE)
        self.assertIn('id="academy-load-retry"', SOURCE)
        self.assertIn('location.reload();', SOURCE)


if __name__ == "__main__":
    unittest.main()
