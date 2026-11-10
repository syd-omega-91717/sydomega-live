"""Tests for the visible-content duplication audit."""
import ast
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

    def test_near_duplicate_prose_is_reported_across_pages(self):
        first = ("Members can review their saved records and update their preferences from this secure workspace. "
                 "They can inspect the latest progress summary and open the relevant controls when they need to make a change.")
        second = ("Members can review their saved records and update their preferences from this secure workspace. "
                  "They can inspect the latest progress summary and open the relevant controls when they need to make changes.")
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            self.write_page(root, "one.html", "<main><p>" + first + "</p></main>")
            self.write_page(root, "two.html", "<main><p>" + second + "</p></main>")
            report = MODULE.build_report(root, 8)
            self.assertEqual(len(report["near_duplicate_pairs"]), 1)
            pair = report["near_duplicate_pairs"][0]
            self.assertFalse(pair["same_page"])
            self.assertGreaterEqual(pair["similarity"], 0.78)
            self.assertEqual(pair["left"]["page"], "one.html")
            self.assertEqual(pair["right"]["page"], "two.html")

    def test_near_duplicate_prose_is_reported_within_one_page(self):
        first = ("The member workspace provides a secure place to review verified records, inspect current progress, "
                 "manage preferences and open the relevant account controls.")
        second = ("The member workspace provides a secure place to review verified records, inspect current progress, "
                  "manage preferences and open the relevant account settings.")
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            self.write_page(root, "one.html", "<main><p>" + first + "</p><p>" + second + "</p></main>")
            report = MODULE.build_report(root, 8)
            self.assertEqual(len(report["near_duplicate_pairs"]), 1)
            self.assertTrue(report["near_duplicate_pairs"][0]["same_page"])

    def test_shared_chrome_scripts_hidden_content_and_ctas_are_separated(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            chrome = "<nav><p>" + REPEATED + "</p></nav><header class=\"site-header\"><p>" + REPEATED + "</p></header>"
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

    def test_leaf_div_copy_is_audited_without_collecting_its_parent_container(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            self.write_page(root, "one.html", "<main><div><div>" + REPEATED + "</div></div></main>")
            self.write_page(root, "two.html", "<main><div><div>" + REPEATED + "</div></div></main>")
            report = MODULE.build_report(root, 8)
            self.assertEqual(report["block_count"], 2)
            self.assertEqual(len(report["cross_page_duplicate_groups"]), 1)

    def test_page_specific_header_inside_main_is_not_discarded(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            self.write_page(root, "one.html", "<main><header><h1>" + REPEATED + "</h1></header></main>")
            report = MODULE.build_report(root, 8)
            self.assertEqual(report["block_count"], 1)
            self.assertEqual(report["cross_page_duplicate_groups"], [])

    def test_explicit_allowlist_justifies_required_truth_copy(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            config = root / "config"
            config.mkdir()
            repeated = "Prototype · not a released game · saved in this browser only"
            normalised = MODULE.normalise(repeated)
            (config / "page-copy-allowlist.json").write_text(
                __import__("json").dumps({"approved": [{"normalised_text": normalised, "reason": "Required route-level release and persistence notice.", "scope": ["one.html", "two.html"]}]}),
                encoding="utf-8",
            )
            self.write_page(root, "one.html", "<main><p>" + repeated + "</p></main>")
            self.write_page(root, "two.html", "<main><p>" + repeated + "</p></main>")
            report = MODULE.build_report(root, 8)
            self.assertEqual(report["cross_page_duplicate_groups"], [])
            self.assertEqual(len(report["approved_cross_page_duplicate_groups"]), 1)
            self.assertIn("Required route-level", report["approved_cross_page_duplicate_groups"][0]["approved_reason"])

    def test_allowlist_does_not_approve_copy_outside_its_declared_page_scope(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            config = root / "config"
            config.mkdir()
            normalised = MODULE.normalise(REPEATED)
            (config / "page-copy-allowlist.json").write_text(
                __import__("json").dumps({"approved": [{"normalised_text": normalised, "reason": "Scoped test approval.", "scope": ["one.html", "two.html", "three.html"]}]}),
                encoding="utf-8",
            )
            self.write_page(root, "one.html", "<main><p>" + REPEATED + "</p></main>")
            self.write_page(root, "two.html", "<main><p>" + REPEATED + "</p></main>")
            report = MODULE.build_report(root, 8)
            self.assertEqual(len(report["cross_page_duplicate_groups"]), 1)
            self.assertEqual(len(report["approved_cross_page_duplicate_groups"]), 0)
            self.assertEqual(len(report["allowlist_scope_mismatches"]), 1)

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

    def test_contract_suite_gate_ids_are_unique(self):
        source = (ROOT / "scripts" / "contract-suite.py").read_text(encoding="utf-8")
        tree = ast.parse(source)
        gates_node = next(node.value for node in tree.body if isinstance(node, ast.Assign) and any(isinstance(t, ast.Name) and t.id == "GATES" for t in node.targets))
        gates = ast.literal_eval(gates_node)
        ids = [gate[0] for gate in gates]
        self.assertEqual(len(ids), len(set(ids)), "contract-suite.py contains a repeated gate id")

    def test_readme_page_count_matches_canonical_page_contract_registry(self):
        import json
        readme = (ROOT / "README.md").read_text(encoding="utf-8")
        registry = json.loads((ROOT / "config" / "omega-page-contracts.json").read_text(encoding="utf-8"))
        count = registry["page_count"]
        self.assertIn(str(count) + "-page web estate", readme)
        self.assertIn("Web estate:** " + str(count) + " pages under page-contract governance", readme)

    def test_markdown_report_explains_that_repetition_is_a_review_signal(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            self.write_page(root, "one.html", "<main><p>" + REPEATED + "</p></main>")
            report = MODULE.build_report(root, 8)
            rendered = MODULE.markdown(report)
            self.assertIn("review signal", rendered)
            self.assertIn("Pages scanned", rendered)
            self.assertIn("Near-duplicate prose candidates", rendered)


if __name__ == "__main__":
    unittest.main()
