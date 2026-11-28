"""The owner certificate console: static contracts always run; the browser check runs with OMEGA_CERT_BROWSER=1."""
import os, re, shutil, subprocess, unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
JS = (ROOT / "omega-certificate-console.js").read_text(encoding="utf-8")
HTML = (ROOT / "approvals.html").read_text(encoding="utf-8")


class Static(unittest.TestCase):
    def test_it_calls_only_the_owner_guarded_rpc_and_no_table_write(self):
        self.assertIn("sb.rpc('omega_issue_certificate'", JS)
        self.assertNotRegex(JS, r"\.(insert|update|upsert|delete)\(", "no direct write: the RPC is the only write path")
        self.assertNotIn("omega_private", JS)

    def test_success_is_the_returned_row_not_a_missing_error(self):
        self.assertIn("!row.certificate_number", JS)
        self.assertIn("Not issued: ", JS)

    def test_no_markup_sinks_and_no_inline_handlers(self):
        self.assertNotRegex(JS, r"\.innerHTML\s*=|insertAdjacentHTML|document\.write|\beval\(")
        self.assertNotRegex(JS, r"\bon(click|change|submit)\s*=")

    def test_aal2_is_stepped_up_once_then_retried_once(self):
        self.assertIn("/aal2/i.test(first.error)", JS)
        self.assertEqual(JS.count("stepUp()"), 1)

    def test_page_mounts_it_once_and_it_is_not_the_achieve_hub(self):
        self.assertEqual(HTML.count('id="cert-console"'), 1)
        self.assertEqual(HTML.count("/omega-certificate-console.js"), 1)
        achieve = (ROOT / "achieve.html").read_text(encoding="utf-8")
        self.assertNotIn("omega_issue_certificate", achieve, "achieve.html is a navigation hub that does not mint awards")

    def test_the_decision_record_exists_and_is_honest_about_the_review(self):
        plan = (ROOT / "docs" / "decisions" / "stage-certificates" / "PLAN.md").read_text(encoding="utf-8")
        review = (ROOT / "docs" / "decisions" / "stage-certificates" / "CODEX_REVIEW.md").read_text(encoding="utf-8")
        self.assertTrue(plan.startswith("# Status: AWAITING-HUMAN-REVIEW"))
        self.assertIn("No Codex review ran", review)


class Browser(unittest.TestCase):
    def test_console_in_a_real_render(self):
        if not os.environ.get("OMEGA_CERT_BROWSER"):
            self.skipTest("run with OMEGA_CERT_BROWSER=1; the static contracts above always run")
        node = shutil.which("node")
        if not node:
            self.skipTest("node not available")
        r = subprocess.run([node, str(ROOT / "scripts" / "verify-certificate-console.js")], capture_output=True, text=True, timeout=600)
        out = r.stdout + r.stderr
        if "SKIPPED" in out and not os.environ.get("OMEGA_REQUIRE_BROWSER"):
            self.skipTest("no browser available")
        self.assertEqual(r.returncode, 0, out)


if __name__ == "__main__":
    unittest.main()
