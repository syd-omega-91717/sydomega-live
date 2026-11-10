"""Regression tests for the page-purpose overlap audit."""
import importlib.util
import pathlib
import tempfile
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("page_consolidation", ROOT / "scripts" / "page-consolidation.py")
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class PagePurposeTests(unittest.TestCase):
    def write(self, root, name, body):
        path = root / name
        path.write_text("<html><head><title>Ω Platform</title></head><body>" + body + "</body></html>", encoding="utf-8")
        return path

    def test_same_job_visible_copy_and_capability_is_high_overlap(self):
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            copy = ("<main><h1>Member certificate records</h1><p>Review your issued certificates, inspect the current credential status, and open the record to verify its issuer and supporting evidence. Members can compare the issuing authority, expiry date, credential reference, and supporting documentation before sharing the record with another service.</p><button data-omega-capability-id='credentials'>Open credential record</button></main>")
            self.write(root, "credentials.html", copy)
            self.write(root, "certificates.html", copy)
            report = MODULE.build_report(root, min_words=20)
            self.assertEqual(report["candidate_count"], 1)
            self.assertEqual(report["candidates"][0]["classification"], "HIGH_PURPOSE_OVERLAP")

    def test_shared_chrome_hidden_copy_and_scripts_do_not_create_overlap(self):
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            chrome = ("<nav><p>Shared global navigation repeated across every route and workspace.</p></nav>"
                      "<script>const text='Shared global navigation repeated across every route and workspace';</script>"
                      "<div hidden>Shared hidden message repeated across all pages.</div>")
            self.write(root, "one.html", chrome + "<main><h1>Learning</h1><p>Study new concepts with guided lessons, reading material, and practice activities that improve knowledge retention.</p></main>")
            self.write(root, "two.html", chrome + "<main><h1>Finance</h1><p>Review account balances, transaction records, cash flow, and investment exposure from your financial workspace.</p></main>")
            report = MODULE.build_report(root, min_words=10)
            self.assertEqual(report["candidate_count"], 0)

    def test_ubiquitous_profiles_table_alone_is_not_a_merge_signal(self):
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            pages = [
                ("one.html", "Learning", "Study new concepts with guided lessons, reading material, and practice activities that improve knowledge retention."),
                ("two.html", "Finance", "Review account balances, transaction records, cash flow, and investment exposure from your financial workspace."),
                ("three.html", "Community", "Connect with other members, share updates, and follow conversations across the community."),
            ]
            for name, title, copy in pages:
                self.write(root, name, "<main><h1>{0}</h1><p>{1}</p><script>supabase.from('profiles').select('*')</script></main>".format(title, copy))
            report = MODULE.build_report(root, min_words=10)
            self.assertIn("profiles", report["ignored_common_tables"])
            self.assertEqual(report["candidate_count"], 0)

    def test_distinct_academy_and_gaming_jobs_are_not_merged_for_one_shared_link(self):
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            self.write(root, "academy.html", "<main><h1>Academy learning</h1><p>Study structured lessons and assessments to improve knowledge through guided review and practice.</p><a href='/evolution.html'>Progression model</a></main>")
            self.write(root, "gaming.html", "<main><h1>Gaming arena</h1><p>Play skill challenges and interactive games, complete missions, and improve mastery through competition.</p><a href='/evolution.html'>Progression model</a></main>")
            report = MODULE.build_report(root, min_words=10)
            self.assertEqual(report["candidate_count"], 0)

    def test_void_inputs_do_not_break_main_content_extraction(self):
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            body = "<main><h1>Account security</h1><input type='email'><p>Review your authentication methods, recovery settings, trusted devices, and recent security activity before changing account access.</p></main>"
            self.write(root, "security.html", body)
            row = MODULE.scan_page(root / "security.html", root)
            self.assertIn("input:email", row["controls"])
            self.assertGreaterEqual(row["visible_words"], 12)

    def test_markdown_report_states_advisory_and_preservation_rules(self):
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            self.write(root, "one.html", "<main><h1>Member records</h1><p>Review your saved member records and inspect current account status and evidence history.</p></main>")
            report = MODULE.build_report(root, min_words=10)
            output = MODULE.markdown(report)
            self.assertIn("No page is changed, hidden, redirected, or deleted", output)
            self.assertIn("Required human review", output)


if __name__ == "__main__":
    unittest.main()
