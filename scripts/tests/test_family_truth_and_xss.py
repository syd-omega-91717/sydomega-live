import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
FAMILY = (ROOT / "family.html").read_text(encoding="utf-8")
TREE = (ROOT / "family-tree.js").read_text(encoding="utf-8")


class FamilyTruthAndXssContract(unittest.TestCase):
    def test_family_finance_and_legal_claims_are_not_presented_as_active(self):
        forbidden = (
            "Sovereign family allocation",
            "Revenue Fortress treasury",
            "PROVISION ACTIVE",
            "All sovereign trusts established",
            "Inheritance protocol active",
            "Assets designated for family succession",
            "Children designated as heirs",
            "FAMILY-DESIGNATED",
            "FULL TRUST ACCESS",
            "AUTHORIZED ALLOWANCE ACCESS",
            "51% Master Stake",
            "25.5% derived",
            "8.5% each",
            "ETERNAL SUCCESSION",
            "immutably written to the Vault",
            "BIO-LOCKED SANCTUARY",
            "FAMILY SAFE MODE: ACTIVE",
            "Assets: PROTECTED",
            "FULLY OPERATIONAL",
        )
        for phrase in forbidden:
            with self.subTest(phrase=phrase):
                self.assertNotIn(phrase.lower(), FAMILY.lower())
        self.assertIn("no family allowance", FAMILY.lower())
        self.assertIn("not a legal instrument", FAMILY.lower())
        self.assertIn("not established", FAMILY.lower())

    def test_unfunded_allowance_and_maturity_demo_metrics_are_removed(self):
        self.assertNotIn("allowance-cv", FAMILY)
        self.assertNotIn("const data=[42,55,38,71,60,85,91]", FAMILY)
        self.assertNotIn("2034-01-01", FAMILY)
        self.assertNotIn("trust-timer", FAMILY)
        self.assertNotIn("PROGRESS STAGE", FAMILY)

    def test_bloodline_member_data_is_rendered_as_text(self):
        start = FAMILY.index("async function loadNodes()")
        end = FAMILY.index("function drawTree(nodes)", start)
        loader = FAMILY[start:end]
        self.assertIn(".select('id,name,rel,birth,notes,created_at')", loader)
        self.assertIn(".eq('user_id',bloodlineUserId)", loader)
        self.assertIn("textContent", loader)
        self.assertNotRegex(loader, r"innerHTML|insertAdjacentHTML")
        self.assertNotRegex(loader, r"\$\{\s*n\.(?:name|rel|notes|birth)")

    def test_family_node_fields_are_escaped_before_html_rendering(self):
        self.assertIn("esc(m.name)", FAMILY)
        self.assertIn("esc((m.relation||'FAMILY').toUpperCase())", FAMILY)
        self.assertIn("esc(m.sign||'SIGN NOT SET')", FAMILY)
        self.assertIn("textContent", TREE)

    def test_bloodline_session_is_bound_to_the_authenticated_user(self):
        self.assertIn("bloodlineUserId=sess.user.id", FAMILY)
        self.assertIn("insert({...node,user_id:bloodlineUserId})", FAMILY)

    def test_heritage_records_are_user_scoped_and_titles_are_escaped(self):
        start = FAMILY.index("async function buildTimeline()")
        end = FAMILY.index("function buildRoots()", start)
        timeline = FAMILY[start:end]
        self.assertIn(".eq('user_id',heritageUserId)", timeline)
        self.assertIn("esc(records[records.length-1].title)", timeline)
        self.assertIn("esc(records[records.length-1].body)", timeline)
        self.assertIn("esc(r.category)", timeline)
        self.assertIn("heritageUserId=sess.user.id", FAMILY)
        self.assertIn("insert({user_id:heritageUserId", FAMILY)

    def test_successor_designations_are_personal_labels_not_legal_heir_status(self):
        self.assertIn("PERSONAL / NON-LEGAL", FAMILY)
        self.assertIn("MARK SUCCESSOR LABEL", FAMILY)
        self.assertIn("REMOVE SUCCESSOR LABEL", FAMILY)
        self.assertIn("PERSONAL LABEL", TREE)
        self.assertIn("SUCCESSOR LABEL", TREE)
        self.assertNotIn("el('em', null, 'HEIR')", TREE)

    def test_succession_table_contains_only_a_non_legal_notice(self):
        start = FAMILY.index("const SUCCESSION=[")
        end = FAMILY.index("];", start)
        succession = FAMILY[start:end]
        self.assertIn("NOTICE", succession)
        self.assertIn("NOT ESTABLISHED", succession)
        self.assertNotRegex(succession, r"\d+(?:\.\d+)?%")
        self.assertNotIn("Master Stake", succession)


if __name__ == "__main__":
    unittest.main()
