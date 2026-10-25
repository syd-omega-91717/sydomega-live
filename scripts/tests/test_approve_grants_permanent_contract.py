"""Contract: APPROVE grants permanent access; the 9-minute trial is its own action."""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[2]
JS = (ROOT / "approvals.js").read_text(encoding="utf-8")
UI = (ROOT / "approvals-ui.js").read_text(encoding="utf-8")


def fn(name):
    start = JS.index(f"async function {name}(")
    return JS[start:JS.index("\n", start)]


class ApproveGrantsPermanentContract(unittest.TestCase):
    def test_approve_delegates_to_grant_permanent(self):
        self.assertIn("return grantPermanent(uid);", fn("approve"))
        self.assertNotIn("approve_member", fn("approve"))

    def test_trial_is_a_separate_labelled_action(self):
        self.assertIn("'approve_member'", fn("grantTrial"))
        self.assertIn("window.grantTrial=grantTrial;", JS)
        self.assertRegex(UI, r"grantTrial:function\(el\)\{if\(window\.grantTrial\)window\.grantTrial\(el\.dataset\.uid\);\}")
        self.assertIn('data-action="grantTrial"', JS)

    def test_no_action_demotes_a_permanent_member_to_a_trial(self):
        self.assertNotIn("btn_renew_trial", JS)

    def test_trial_toast_does_not_depend_on_a_global_t(self):
        self.assertNotRegex(fn("grantTrial"), r"(?<![\w.])t\('toast_trial_granted'\)")


if __name__ == "__main__":
    unittest.main()
