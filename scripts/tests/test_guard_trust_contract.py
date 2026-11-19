"""Contract: the approval guard may trust this tab's recent approval, never more."""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[2]
PRIVACY = (ROOT / "privacy.html").read_text(encoding="utf-8")
TERMS = (ROOT / "terms.html").read_text(encoding="utf-8")
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

    def test_public_pages_are_exempt_from_both_guards(self):
        self.assertIn("var PUBLIC = ['/account','/enter','/reset','/terms','/pending','/index','/','/charter','/guide','/privacy'];", BG)
        self.assertIn("var EX={'':1,'index':1,'account':1,'terms':1,'charter':1,'reset':1,'enter':1,'pending':1,'guide':1,'privacy':1};", CHECK)

    def test_privacy_page_receives_the_public_consent_banner(self):
        legal = (ROOT / "omega-legal.js").read_text(encoding="utf-8")
        self.assertIn("var publicPages = ['/account','/enter','/reset','/terms','/pending','/index','/','/privacy',''];", legal)

    def test_privacy_centre_is_readable_without_an_account(self):
        self.assertIn('<div class="page-shell" id="app" style="display:flex">', PRIVACY)
        self.assertNotIn("if(!s){location.replace('/account.html');return;}", PRIVACY)
        self.assertIn("if(!_uid){", PRIVACY)
        self.assertIn("setPrivacyControls(true);", PRIVACY)

    def test_terms_are_readable_without_an_account_and_acceptance_stays_authenticated(self):
        self.assertNotIn("if(!sess){ window.location.href='/account.html'; return; }", TERMS)
        self.assertIn("Sign in or create an account to accept these terms.", TERMS)

    def test_privacy_surface_is_marked_partial_until_erasure_is_real(self):
        import json
        value_layer = json.loads((ROOT / "config" / "omega-value-layer.json").read_text(encoding="utf-8"))
        privacy_surface = value_layer["pages"]["privacy"]
        self.assertTrue(privacy_surface["proof"].startswith("PARTIAL —"))
        self.assertIn("complete erasure automation remains dormant", privacy_surface["proof"])
        self.assertNotIn("erase your data", privacy_surface["purpose"] + " " + privacy_surface["value"])

    def test_privacy_notice_does_not_promise_unimplemented_erasure_or_retention(self):
        self.assertIn("does not currently run a complete automated purge", PRIVACY)
        self.assertIn("retention schedule is not yet fully enforced", PRIVACY)
        self.assertNotIn("DATA WILL BE DELETED WITHIN 30 DAYS", PRIVACY)
        self.assertNotIn("queues a 30-day deletion job", PRIVACY)
        self.assertIn("not a certification claim by SYD OMEGA", PRIVACY)
        self.assertIn("Withdrawal initiates deletion", PRIVACY)
        self.assertIn("LEGAL REVIEW REQUIRED", TERMS)
        self.assertIn("not a versioned document or hash", TERMS)
        self.assertIn('class="article-description"', TERMS)
        self.assertNotIn('class="ad"', TERMS)
        self.assertIn("The current browser export packages profile fields", PRIVACY)
        self.assertNotIn("journey logs, consent records, and all sovereign metadata", PRIVACY)
        self.assertIn("A design objective, not a certification", PRIVACY)
        self.assertNotIn("Every table in the Supabase database has RLS", PRIVACY)


if __name__ == "__main__":
    unittest.main()
