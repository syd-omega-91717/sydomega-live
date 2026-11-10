"""Owner-only access and content-boundary contracts for the Sovereign Covenant."""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]
COVENANT = (ROOT / "sovereign-covenant.html").read_text(encoding="utf-8")
VAULT = (ROOT / "vault.html").read_text(encoding="utf-8")
NAV = (ROOT / "nav.js").read_text(encoding="utf-8")
PROFILE = (ROOT / "profile.html").read_text(encoding="utf-8")
APPROVALS = (ROOT / "approvals.html").read_text(encoding="utf-8")
APPROVALS_JS = (ROOT / "approvals.js").read_text(encoding="utf-8")


class CovenantOwnerAccessTests(unittest.TestCase):
    def test_covenant_shell_stays_hidden_until_owner_is_verified(self):
        self.assertIn('id="app" style="display:none"', COVENANT)
        self.assertIn('select("is_owner")', COVENANT)
        self.assertIn('if(!profileResult.data.is_owner){location.replace("/pending.html");return;}', COVENANT)
        self.assertIn('document.getElementById("app").style.display="flex";', COVENANT)

    def test_covenant_fails_closed_when_session_or_owner_lookup_fails(self):
        self.assertIn('if(sessionResult.error)throw sessionResult.error;', COVENANT)
        self.assertIn('if(profileResult.error||!profileResult.data)throw new Error("Owner profile could not be verified");', COVENANT)
        self.assertIn('location.replace("/account.html?error=covenant_unavailable");', COVENANT)
        self.assertNotIn('catch(e){document.getElementById("app").style.display="flex";}', COVENANT)
        self.assertNotIn('!pr.is_owner&&!pr.access_approved', COVENANT)

    def test_covenant_navigation_entry_is_owner_only(self):
        self.assertIn("['sovereign-covenant','COVENANT','/sovereign-covenant.html','owner']", NAV)

    def test_member_vault_contains_no_founder_identity_or_duplicate_article_renderer(self):
        self.assertNotIn("S.Y.D", VAULT)
        self.assertNotIn("SOVEREIGN FOUNDER:", VAULT)
        self.assertNotIn("var ARTS=[", VAULT)
        self.assertNotIn("renderArts", VAULT)
        self.assertNotIn("articles-grid", VAULT)
        self.assertIn("Owner identity and reserved-control documents are restricted to the owner governance workspace.", VAULT)

    def test_covenant_is_a_design_reference_not_a_claim_of_live_immutability(self):
        self.assertIn("GOVERNANCE STATUS: DESIGN REFERENCE", COVENANT)
        self.assertIn("No Genesis Block hash or on-chain title transfer is claimed as live.", COVENANT)
        self.assertNotIn("HASHED INTO THE GENESIS BLOCK", COVENANT)
        self.assertNotIn("BEYOND REVISION OR APPEAL", COVENANT)
        self.assertNotIn("AUTH FORMULA", COVENANT)
        self.assertNotIn("GATE THRESHOLDS", COVENANT)
        self.assertIn("NON-TOKEN DESIGN ARTICLES:</b> III, IV, VI, VII, X and XI", COVENANT)
        self.assertIn("Articles II, VIII and IX below", COVENANT)
        self.assertNotIn("DESIGN &middot; NOT OPERATIONAL", COVENANT)

    def test_covenant_has_exactly_eleven_canonical_articles(self):
        import re
        article_rows = re.findall(r'\{n:"[IVX]+",title:"[^"]+",text:"', COVENANT)
        self.assertEqual(len(article_rows), 11)

    def test_founder_identity_is_confined_to_owner_surfaces(self):
        self.assertNotIn("S.Y.D", VAULT)
        self.assertNotIn("LEBANESE ORDER OF ENGINEERS NO. 30875", VAULT)
        self.assertIn("SLEIMAN YOUSSEF DAGHER", COVENANT)
        self.assertIn("profileResult.data.is_owner", COVENANT)
        self.assertIn("if(!profileResult.data.is_owner)", COVENANT)
        self.assertNotIn("Sleiman Youssef Dagher", PROFILE)
        self.assertNotIn("linkedin.com/search/results/people/?keywords=Sleiman", PROFILE)
        self.assertNotIn("S.Y.D", PROFILE)
        self.assertIn("d.display_name||ch.name", PROFILE)
        self.assertIn("Sleiman Youssef Dagher", APPROVALS)
        self.assertIn("OWNER-ONLY ADMINISTRATION", APPROVALS)
        self.assertNotIn("S.Y.D &mdash; EXCLUSIVELY", APPROVALS)
        self.assertIn("if(!pr||!pr.is_owner)", APPROVALS_JS)

    def test_vault_exposes_covenant_link_only_to_verified_owner(self):
        self.assertIn('id="vault-covenant-link"', VAULT)
        self.assertIn("if(covenantLink&&pr.is_owner)covenantLink.style.display='inline-flex';", VAULT)
        self.assertIn('href="/sovereign-covenant.html"', VAULT)


if __name__ == "__main__":
    unittest.main()
