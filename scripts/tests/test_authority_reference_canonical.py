"""Keep the mathematical authority explanation in one canonical visible page."""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]
EVOLUTION = (ROOT / "evolution.html").read_text(encoding="utf-8")
PROFILE = (ROOT / "profile.html").read_text(encoding="utf-8")
DASHBOARD = (ROOT / "dashboard.html").read_text(encoding="utf-8")
APPROVALS = (ROOT / "approvals.html").read_text(encoding="utf-8")
HONORS = (ROOT / "honors.html").read_text(encoding="utf-8")
ACADEMY = (ROOT / "academy.html").read_text(encoding="utf-8")
GAMING = (ROOT / "gaming.html").read_text(encoding="utf-8")
VAULT = (ROOT / "vault.html").read_text(encoding="utf-8")
COVENANT = (ROOT / "sovereign-covenant.html").read_text(encoding="utf-8")


class AuthorityReferenceCanonicalTests(unittest.TestCase):
    def test_full_formula_is_displayed_once_in_evolution(self):
        self.assertEqual(EVOLUTION.count("AUTH = &radic;"), 1)
        self.assertNotIn("Authority = √(A³+B³+C³)", EVOLUTION)
        self.assertIn("The score above is derived from the combined axis state", EVOLUTION)

    def test_member_pages_link_to_the_canonical_progression_model(self):
        for name, page in (("profile", PROFILE), ("dashboard", DASHBOARD), ("honors", HONORS)):
            with self.subTest(page=name):
                self.assertIn('href="/evolution.html"', page)

    def test_other_pages_do_not_repeat_the_full_visible_formula(self):
        for name, page in (
            ("profile", PROFILE),
            ("dashboard", DASHBOARD),
            ("approvals", APPROVALS),
            ("honors", HONORS),
            ("academy", ACADEMY),
            ("gaming", GAMING),
            ("vault", VAULT),
            ("covenant", COVENANT),
        ):
            with self.subTest(page=name):
                self.assertNotIn("AUTH = &radic;", page)
                self.assertNotIn("Authority = √(A³+B³+C³)", page)
                self.assertNotIn("AUTHORITY FORMULA", page)
                self.assertNotIn("AUTH FORMULA", page)
                self.assertNotIn("GATE THRESHOLDS", page)

    def test_access_approval_uses_policy_not_progression_score(self):
        self.assertIn("PRIVILEGE IS GOVERNED BY POLICY", APPROVALS)
        self.assertIn('href="/governance.html"', APPROVALS)


if __name__ == "__main__":
    unittest.main()
