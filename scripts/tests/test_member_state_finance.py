"""The member-state mirror must never upload the seven finance pages' localStorage keys.

Those pages are localStorage-only on purpose (CLAUDE.md 8.2; omega-local-backup.js header). The
mirror uploads every `omega*` key not excluded, so a finance key that is missing from NO_MIRROR is
silently copied to public.member_state (docs/legal/LEGAL_GAP_AUDIT.md finding 4). The key list is
DERIVED from the pages, not hand-copied, so a key added to a finance page later fails here.
"""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[2]
MIRROR = (ROOT / "omega-member-state.js").read_text(encoding="utf-8")
FINANCE_PAGES = ["wealth", "wallet", "treasury", "revenue", "investment", "expenses", "budget"]
# A storage key is an underscore name. Hyphenated names (omega-side, omega-vt) are element ids and
# file names, and `omega:populated` is an event.
KEY = re.compile(r"""['"](omega_[a-z0-9_]+)['"]""")


def block(name):
    m = re.search(r"var %s = \{(.*?)\n  \};" % name, MIRROR, re.S)
    assert m, "%s block not found in omega-member-state.js" % name
    return set(re.findall(r"(omega_[a-z0-9_]+)\s*:", m.group(1)))


def page_keys(page):
    text = (ROOT / ("%s.html" % page)).read_text(encoding="utf-8")
    return set(KEY.findall(text))


class FinanceNeverMirrored(unittest.TestCase):
    def test_every_finance_page_key_is_excluded(self):
        no_mirror = block("NO_MIRROR")
        for page in FINANCE_PAGES:
            with self.subTest(page=page):
                missing = page_keys(page) - no_mirror
                self.assertFalse(missing, "%s.html stores %s, which the member-state mirror would "
                                 "upload; add to NO_MIRROR in omega-member-state.js" % (page, sorted(missing)))

    def test_no_stale_entries(self):
        used = set().union(*(page_keys(p) for p in FINANCE_PAGES))
        stale = block("NO_MIRROR") - used
        self.assertFalse(stale, "NO_MIRROR lists keys no finance page uses: %s" % sorted(stale))

    def test_exclusion_is_applied_to_the_upload_path_only(self):
        # SKIP is shared with omega-local-backup.js (what "export everything" includes); finance
        # keys must stay OUT of SKIP so a member's own export file still carries their data.
        self.assertFalse(block("NO_MIRROR") & block("SKIP"))
        m = re.search(r"function mirrored\(k\) \{(.*?)\n  \}", MIRROR, re.S)
        self.assertIsNotNone(m)
        self.assertIn("!NO_MIRROR[k]", m.group(1))
        m2 = re.search(r"isMemberKey: function \(k\) \{(.*?)\}", MIRROR, re.S)
        self.assertIsNotNone(m2)
        self.assertNotIn("NO_MIRROR", m2.group(1))


if __name__ == "__main__":
    unittest.main()
