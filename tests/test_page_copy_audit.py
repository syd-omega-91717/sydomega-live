"""Tests for the visible-content duplication audit."""
import importlib.util
import pathlib
import tempfile
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("page_copy_audit", ROOT / "scripts" / "page-copy-audit.py")
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)

REPEATED = "Members can review their saved records and update their preferences from this secure workspace."


class PageCopyAuditTests(unittest.TestCase):
    def write_page(self, root, name, body):
        path = root / name
        path.write_text("<!doctype html><html><head><title>" + name + "</title></head><body>" + body + "</body></html>", encoding="utf-8")
        return path

    def test_cross_page_copy_is_found_inside_main_content(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            self.write_page(root, "one.html", "<main><h1>First page</h1><p>" + REPEATED + "</p></main>")
            self.write_page(root, "two.html", "<main><h1>Second page</h1><p>" + REPEATED + "</p></main>")
            report = MODULE.build_report(root, 8)
            groups = report["cross_page_duplicate_groups"]
            self.assertEqual(len(groups), 1)
            self.assertEqual(groups[0]["pages"], ["one.html", "two.html"])
            self.assertEqual(groups[0]["occurrences"], 2)

    def test_shared_chrome_scripts_hidden_content_and_ctas_are_separated(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            chrome = "<nav><p>" + REPEATED + "</p></nav><header><p>" + REPEATED + "</p></header>"
            code = "<script>var copy = '" + REPEATED + "';</script>"
            hidden = '<div hidden><p>' + REPEATED + "</p></div>"
            cta = "<button>" + REPEATED + "</button>"
            self.write_page(root, "one.html", chrome + code + hidden + "<main><p>Unique main content for the first page.</p>" + cta + "</main>")
            self.write_page(root, "two.html", chrome + code + hidden + "<main><p>Different main content for another page.</p>" + cta + "</main>")
            report = MODULE.build_report(root, 8)
            self.assertEqual(report["cross_page_duplicate_groups"], [])
            self.assertEqual(len(report["reused_cta_groups"]), 1)

    def test_repetition_inside_one_page_is_reported_separately(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            self.write_page(root, "one.html", "<main><p>" + REPEATED + "</p><p>" + REPEATED + "</p></main>")
            report = MODULE.build_report(root, 8)
            self.assertEqual(len(report["within_page_duplicate_groups"]), 1)
            self.assertEqual(report["within_page_duplicate_groups"][0]["pages"], ["one.html"])

    def test_pages_without_main_use_body_content_as_fallback(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            self.write_page(root, "one.html", "<section><p>" + REPEATED + "</p></section>")
            report = MODULE.build_report(root, 8)
            self.assertEqual(report["block_count"], 1)

    def test_short_repeated_labels_do_not_become_prose_duplicates(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            self.write_page(root, "one.html", "<main><h2>OVERVIEW</h2><p>Short note.</p></main>")
            self.write_page(root, "two.html", "<main><h2>OVERVIEW</h2><p>Another short note.</p></main>")
            report = MODULE.build_report(root, 8)
            self.assertEqual(report["cross_page_duplicate_groups"], [])

    def test_markdown_report_explains_that_repetition_is_a_review_signal(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            self.write_page(root, "one.html", "<main><p>" + REPEATED + "</p></main>")
            report = MODULE.build_report(root, 8)
            rendered = MODULE.markdown(report)
            self.assertIn("review signal", rendered)
            self.assertIn("Pages scanned", rendered)


if __name__ == "__main__":
    unittest.main()
