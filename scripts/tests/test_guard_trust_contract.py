"""Contract: the approval guard may trust this tab's recent approval, never more."""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[2]
BG = (ROOT / "bg.js").read_text(encoding="utf-8")
GUARD = BG[BG.index("s.id='omega-approval-guard';"):BG.index("/* ===== SHARED SUPABASE CLIENT")]
CHECK = BG[BG.index("/* ACCESS GUARD + TRIAL ENGINE */"):BG.index("function startTimeSovereignPing")]


class GuardTrustContract(unittest.TestCase):
    def test_trust_is_per_tab_short_lived_and_bound_to_the_signed_in_user(self):
        self.assertIn("sessionStorage.getItem(TRUST_KEY)", GUARD)
        self.assertNotIn("localStorage.setItem(TRUST_KEY", BG)
        self.assertIn("TRUST_MS=30*60*1000", BG)
        self.assertIn("localStorage.getItem('sb-ydqhzvvoyufiiqvzcjns-auth-token')", GUARD)
        self.assertIn("u.id === f.uid", GUARD)
        self.assertIn("Date.parse(f.exp) > Date.now()", GUARD)

    def test_only_the_real_check_records_trust(self):
        self.assertIn("window.__omegaApprove(true,{uid:s.user.id,", CHECK)
        self.assertIn("if (trusted) window.__omegaApprove(true);", GUARD)

    def test_every_failed_or_incomplete_check_revokes(self):
        self.assertIn("if(!s){revoke();return;}", CHECK)
        self.assertIn("if(!pr.data){revoke();return;}", CHECK)
        for target in ("safeRedirect('/pending.html')", "safeRedirect('/terms.html')"):
            with self.subTest(target=target):
                self.assertIn("revoke();" + target, CHECK)
        self.assertRegex(CHECK, r"if\(remaining<=0\)\{revoke\(\);")
        self.assertIn("sessionStorage.removeItem(TRUST_KEY)", GUARD)

    def test_public_pages_unchanged(self):
        self.assertIn("var PUBLIC = ['/account','/enter','/reset','/terms','/pending','/index','/','/charter','/guide'];", BG)


if __name__ == "__main__":
    unittest.main()
