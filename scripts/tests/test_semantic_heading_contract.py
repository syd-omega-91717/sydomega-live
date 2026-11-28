"""The three live content pages flagged by the visual survey expose real level-one headings."""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[2]


class SemanticHeadingContract(unittest.TestCase):
    def test_not_found_page_uses_existing_visual_title_as_h1(self):
        page = (ROOT / "404.html").read_text(encoding="utf-8")
        self.assertRegex(page, r"<h1\b[^>]*class=\"code\"")

    def test_owner_approvals_title_is_a_level_one_heading(self):
        page = (ROOT / "approvals.html").read_text(encoding="utf-8")
        self.assertRegex(page, r"<h1\b[^>]*data-i18n=\"approvals_title\">APPROVALS")

    def test_retired_and_redirect_routes_keep_accessible_fallback_headings(self):
        routes = {
            "command-center.html": ("/dashboard.html#platform", "COMMAND CENTER MOVED"),
            "command.html": ("/dashboard.html#today", "DAILY COMMAND BRIEF MOVED"),
            "security.html": ("/profile.html#security", "SECURITY SETTINGS MOVED"),
            "settings.html": ("/profile.html#settings", "SETTINGS MOVED"),
            "standing-dashboard.html": ("/dashboard.html#overview", "STANDING & AUTHORITY MOVED"),
            "frontend/platform/platform.html": ("/dashboard.html", "PLATFORM ROUTE MOVED"),
            "root/audit-report.html": ("/dashboard.html", "AUDIT REPORT ROUTE MOVED"),
            "root/dashboard/dashboard.html": ("/dashboard.html", "LEGACY DASHBOARD ROUTE MOVED"),
            "root/portal.html": ("/dashboard.html", "LEGACY PORTAL ROUTE MOVED"),
            "web/templates/admin_console.html": ("/dashboard.html", "ADMIN CONSOLE ROUTE MOVED"),
            "web/templates/leaderboard.html": ("/dashboard.html", "LEADERBOARD ROUTE MOVED"),
            "web/templates/sovereign_health.html": ("/dashboard.html", "SOVEREIGN HEALTH ROUTE MOVED"),
            "web/templates/system_health.html": ("/dashboard.html", "SYSTEM HEALTH ROUTE MOVED"),
        }
        for path, (href, label) in routes.items():
            with self.subTest(path=path):
                page = (ROOT / path).read_text(encoding="utf-8")
                self.assertIn("<h1", page)
                self.assertIn(label, page)
                self.assertIn('href="' + href + '"', page)

    def test_access_pending_title_is_a_level_one_heading(self):
        page = (ROOT / "pending.html").read_text(encoding="utf-8")
        self.assertRegex(page, r"<h1\b[^>]*id=\"gate-title\"")


if __name__ == "__main__":
    unittest.main()
