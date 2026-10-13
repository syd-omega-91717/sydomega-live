#!/usr/bin/env python3
"""Regression contracts for fail-closed access handling on progression pages."""

from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]
PAGES = ("grid.html", "levels.html", "gates.html", "points.html", "realm.html")


class ProgressionPageAccessFailClosedContract(unittest.TestCase):
    def test_every_page_checks_auth_and_profile_errors(self):
        for name in PAGES:
            with self.subTest(page=name):
                source = (ROOT / name).read_text(encoding="utf-8")
                self.assertIn("var sessionResult=await sb.auth.getSession();", source)
                self.assertIn("if(sessionResult.error)throw sessionResult.error;", source)
                self.assertIn("var profileResult=await sb.from('profiles').select(", source)
                self.assertIn("if(profileResult.error)throw profileResult.error;", source)
                self.assertIn("if(!profileResult.data||typeof profileResult.data!=='object')", source)
                self.assertNotIn(".maybeSingle()).data||{}", source)

    def test_every_page_stays_hidden_when_access_verification_fails(self):
        for name in PAGES:
            with self.subTest(page=name):
                source = (ROOT / name).read_text(encoding="utf-8")
                self.assertIn("if(app)app.style.display='none';", source)
                self.assertIn("if(panel)panel.hidden=false;", source)
                self.assertNotIn("document.getElementById('app').style.display='flex';console.warn(e);", source)

    def test_visible_retry_panel_is_outside_the_application_shell(self):
        for name in PAGES:
            with self.subTest(page=name):
                source = (ROOT / name).read_text(encoding="utf-8")
                self.assertIn('id="access-load-error" hidden role="alert"', source)
                self.assertIn(f'href="/{name}"', source)
                self.assertLess(source.index('id="access-load-error"'), source.index("</body>"))


if __name__ == "__main__":
    unittest.main()
