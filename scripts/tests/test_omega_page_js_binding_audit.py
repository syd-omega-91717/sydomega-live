import importlib.util
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location(
    "omega_page_js_binding_audit", ROOT / "scripts" / "omega-page-js-binding-audit.py"
)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(MODULE)


class PageJsBindingAuditTests(unittest.TestCase):
    def test_variable_listener_is_correlated_to_html_id(self):
        controls = [{"control_id": 1, "tag": "button", "id": "save", "classes": [], "attributes": {}}]
        bindings, delegated = MODULE.extract_bindings(
            "const save = document.getElementById('save'); save.addEventListener('click', saveRecord);",
            controls, "profile.js",
        )
        self.assertEqual(len(bindings), 1)
        self.assertEqual(bindings[0]["control_ids"], [1])
        self.assertEqual(bindings[0]["binding_kind"], "direct_variable")
        self.assertEqual(delegated, [])

    def test_data_attribute_selector_is_correlated(self):
        controls = [{"control_id": 2, "tag": "button", "id": None, "classes": [],
                     "attributes": {"data-action": "export"}}]
        bindings, _ = MODULE.extract_bindings(
            """const button = document.querySelector('[data-action="export"]'); button.addEventListener('click', exportData);""",
            controls, "settings.js",
        )
        self.assertEqual(bindings[0]["control_ids"], [2])

    def test_direct_listener_chain_is_correlated(self):
        controls = [{"control_id": 3, "tag": "form", "id": "profile-form", "classes": [], "attributes": {}}]
        bindings, _ = MODULE.extract_bindings(
            "document.getElementById('profile-form').addEventListener('submit', saveProfile);",
            controls, "profile.js",
        )
        self.assertEqual(bindings[0]["binding_kind"], "direct_chain")
        self.assertEqual(bindings[0]["control_ids"], [3])

    def test_delegated_listener_is_not_falsely_assigned_to_one_control(self):
        controls = [{"control_id": 4, "tag": "button", "id": "x", "classes": [], "attributes": {}}]
        bindings, delegated = MODULE.extract_bindings(
            "document.addEventListener('click', function (event) { /* delegated */ });",
            controls, "global.js",
        )
        self.assertEqual(bindings, [])
        self.assertEqual(delegated, [{"source": "global.js", "target": "document", "event": "click"}])

    def test_listener_shaped_text_inside_string_is_ignored(self):
        controls = [{"control_id": 1, "tag": "button", "id": "save", "classes": [], "attributes": {}}]
        source = (
            'const example = "document.getElementById(\\'fake\\').addEventListener(\\'click\\', nope)"; '
            "const save = document.getElementById('save'); save.addEventListener('click', saveRecord);"
        )
        bindings, delegated = MODULE.extract_bindings(source, controls, "example.js")
        self.assertEqual(len(bindings), 1)
        self.assertEqual(bindings[0]["selector"], "save")
        self.assertEqual(bindings[0]["control_ids"], [1])
        self.assertEqual(delegated, [])

    def test_listener_shaped_text_inside_comments_is_ignored(self):
        controls = [{"control_id": 1, "tag": "button", "id": "save", "classes": [], "attributes": {}}]
        source = (
            "// document.getElementById('fake').addEventListener('click', nope)\\n"
            "const save = document.getElementById('save'); save.addEventListener('click', saveRecord);"
        )
        bindings, delegated = MODULE.extract_bindings(source, controls, "example.js")
        self.assertEqual(len(bindings), 1)
        self.assertEqual(bindings[0]["selector"], "save")
        self.assertEqual(delegated, [])

    def test_inline_script_listener_is_correlated(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            page = root / "page.html"
            page.write_text(
                '<button id="inline-save">Save</button>'
                '<script>const save = document.getElementById("inline-save"); '
                'save.addEventListener("click", saveRecord);</script>',
                encoding="utf-8",
            )
            report = MODULE.audit_page(page, root)
            self.assertEqual(report["controls_with_static_direct_bindings"], 1)
            self.assertEqual(report["direct_bindings"][0]["source"], "<inline>")

    def test_external_scripts_are_not_treated_as_local_missing_files(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            page = root / "page.html"
            page.write_text('<button id="save">Save</button><script src="https://cdn.example/x.js"></script>', encoding="utf-8")
            report = MODULE.audit_page(page, root)
            self.assertEqual(report["external_scripts"], ["https://cdn.example/x.js"])
            self.assertEqual(report["missing_local_scripts"], [])

    def test_missing_local_script_is_reported(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            page = root / "page.html"
            page.write_text('<button id="save">Save</button><script src="/missing.js"></script>', encoding="utf-8")
            report = MODULE.audit_page(page, root)
            self.assertEqual(report["missing_local_scripts"][0]["reason"], "local script file not found")

    def test_page_audit_keeps_static_truth_boundary(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / "page.js").write_text(
                "const save = document.getElementById('save'); save.addEventListener('click', saveRecord);",
                encoding="utf-8",
            )
            page = root / "page.html"
            page.write_text('<button id="save">Save</button><script src="/page.js"></script>', encoding="utf-8")
            report = MODULE.audit_page(page, root)
            self.assertEqual(report["controls_with_static_direct_bindings"], 1)
            self.assertIn("does not prove", report["truth_boundary"])


if __name__ == "__main__":
    unittest.main()
