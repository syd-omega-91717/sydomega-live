"""The three live content pages flagged by the visual survey expose real level-one headings."""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[2]


class SemanticHeadingContract(unittest.TestCase):
    def test_not_found_page_uses_existing_visual_title_as_h1(self):
        page = (ROOT / "404.html").read_text(encoding="utf-8")
        self.assertRegex(page, r"<h1\\b[^>]*class=\"code\"")

    def test_owner_approvals_title_is_a_level_one_heading(self):
        page = (ROOT / "approvals.html").read_text(encoding="utf-8")
        self.assertRegex(page, r"<h1\\b[^>]*data-i18n=\"approvals_title\"")

    def test_access_pending_title_is_a_level_one_heading(self):
        page = (ROOT / "pending.html").read_text(encoding="utf-8")
        self.assertRegex(page, r"<h1\\b[^>]*id=\"gate-title\"")


if __name__ == "__main__":
    unittest.main()
