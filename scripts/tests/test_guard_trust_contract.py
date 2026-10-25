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
        self.assertIn("SB_REF='ydqhzvvoyufiiqvzcjns'", BG)
        self.assertIn("var key = 'sb-' + SB_REF + '-auth-token';", GUARD)
        self.assertIn("u.id === f.uid", GUARD)
        self.assertIn("Date.parse(f.exp) > Date.now()", GUARD)

    def test_only_the_real_check_records_trust(self):
        self.assertIn("window.__omegaApprove(true,{uid:s.user.id,", CHECK)
        self.assertIn("if (trusted) window.__omegaApprove(true);", GUARD)

    def test_every_failed_or_incomplete_check_revokes(self):
        self.assertIn("if(!s){revoke();return;}", CHECK)
        self.assertIn("if(!pr||!pr.data){revoke();return;}", CHECK)
        for target in ("safeRedirect('/pending.html')", "safeRedirect('/terms.html')"):
            with self.subTest(target=target):
                self.assertIn("revoke();" + target, CHECK)
        self.assertIn("sessionStorage.removeItem(TRUST_KEY)", GUARD)

    def test_the_check_fails_closed_when_it_cannot_run(self):
        # Review of #1095: an import/getSession/profile rejection revoked nothing,
        # so a trusted page stayed revealed with no completed check.
        self.assertIn("},revoke);\n    },revoke);\n  }).catch(revoke);", BG)
        self.assertNotIn("}).catch(function(){});\n  function startTimeSovereignPing", BG)

    def test_a_queued_reveal_is_cancelled_by_a_revoke(self):
        self.assertIn("if (revoked) return;", GUARD)
        self.assertIn("document.removeEventListener('DOMContentLoaded', pendingAdd)", GUARD)

    def test_expired_trial_is_decided_before_approving(self):
        expiry = CHECK.index("if(trialEnds!==null&&trialEnds<=Date.now()){revoke();")
        approve = CHECK.index("window.__omegaApprove(true,{uid:s.user.id,")
        self.assertLess(expiry, approve)

    def test_trust_age_has_a_lower_bound(self):
        self.assertIn("!(age >= 0 && age < TRUST_MS)", GUARD)

    def test_completed_check_has_its_own_marker_and_its_readers_use_it(self):
        self.assertIn("document.body.classList.add('omega-approval-confirmed')", GUARD)
        for f in ("omega-reminders.js", "omega-review.js"):
            with self.subTest(module=f):
                src = (ROOT / f).read_text(encoding="utf-8")
                self.assertIn("contains('omega-approval-confirmed')", src)
                self.assertNotIn("contains('omega-approved')", src)

    def test_public_pages_unchanged(self):
        self.assertIn("var PUBLIC = ['/account','/enter','/reset','/terms','/pending','/index','/','/charter','/guide'];", BG)


if __name__ == "__main__":
    unittest.main()
