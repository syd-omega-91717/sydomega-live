"""No person's identity details may be typed into a static page (CLAUDE.md 8.1 class 9, and 8.2: a static file is served to anyone
who asks for it; the approval guard is a client-side reveal, not access control, and the repository is public).

Found 2026-11-15: the Identity tab of profile.html carried eight literal values (father's name, mother's name, date and place of birth,
nationality, blood type, civil registry, region), the same for every visitor and committed since 2026-06-22. They were removed; this test
keeps them out. It holds no personal value itself: it checks the shape (every identity-card value is a placeholder or is filled at runtime
by id), never the content.
"""
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PLACEHOLDERS = {"--", "—", ""}
ROW = re.compile(r'<div class="idf-label"[^>]*>(?P<label>[^<]*)</div><div class="idf-val"(?P<attrs>[^>]*)>(?P<val>[^<]*)</div>')


def literal_rows(html):
    """Identity-card rows that carry a typed value: no id (so nothing fills them) and not a placeholder."""
    out = []
    for m in ROW.finditer(html):
        if re.search(r"\bid=", m.group("attrs")):
            continue
        if m.group("val").strip() in PLACEHOLDERS:
            continue
        out.append(m.group("label").strip())
    return out


class NoPersonalLiterals(unittest.TestCase):
    def test_profile_identity_card_has_no_typed_values(self):
        html = (ROOT / "profile.html").read_text(encoding="utf-8")
        self.assertGreaterEqual(len(ROW.findall(html)), 10, "identity card not found: the check would pass on nothing")
        self.assertEqual(literal_rows(html), [])

    def test_no_other_static_page_carries_an_identity_card_row(self):
        for p in ROOT.glob("*.html"):
            if p.name == "profile.html":
                continue
            self.assertEqual(literal_rows(p.read_text(encoding="utf-8", errors="ignore")), [], p.name)

    def test_the_check_can_fail(self):
        """Zero findings only counts if a typed value is seen."""
        planted = '<div class="idf-label">MOTHER\'S NAME</div><div class="idf-val">SOMEONE</div>'
        self.assertEqual(literal_rows(planted), ["MOTHER'S NAME"])
        filled = '<div class="idf-label">MOTHER\'S NAME</div><div class="idf-val" id="idf-x">--</div>'
        self.assertEqual(literal_rows(filled), [])


if __name__ == "__main__":
    unittest.main()
