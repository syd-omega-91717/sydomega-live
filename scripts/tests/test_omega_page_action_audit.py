import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
SPEC=importlib.util.spec_from_file_location("page_action_audit",ROOT/"scripts"/"omega-page-action-audit.py")
MOD=importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MOD)

class PageActionAuditTests(unittest.TestCase):
    def test_explicit_task_is_governed(self):
        html='<button data-omega-task-id="PAGE::x::ACTION::1">Run</button>'
        rows=MOD.audit_html("x","x.html",html)
        self.assertEqual(rows[0]["state"],"GOVERNED")

    def test_explicit_unavailable_requires_reason(self):
        html='<button disabled data-omega-unavailable-reason="Provider unavailable">Run</button>'
        rows=MOD.audit_html("x","x.html",html)
        self.assertEqual(rows[0]["state"],"UNAVAILABLE")

    def test_disabled_without_reason_is_not_falsely_unavailable(self):
        html='<button disabled>Run</button>'
        rows=MOD.audit_html("x","x.html",html)
        self.assertEqual(rows[0]["state"],"UNMAPPED")

    def test_javascript_handler_is_unmapped_without_contract_marker(self):
        html='<button onclick="doThing()">Run</button>'
        rows=MOD.audit_html("x","x.html",html)
        self.assertEqual(rows[0]["state"],"UNMAPPED")

    def test_read_only_get_form_is_not_mutation_claim(self):
        html='<form method="get" action="/search.html"><input name="q"></form>'
        rows=MOD.audit_html("x","x.html",html)
        self.assertEqual(rows[0]["state"],"AVAILABLE_WITHOUT_MUTATION")

    def test_estate_shape(self):
        data=MOD.audit_estate(ROOT)
        MOD.validate(data)
        self.assertEqual(data["page_count"],len(list(ROOT.glob("*.html"))))
        self.assertEqual(data["action_count"],len(data["actions"]))
        self.assertEqual(sum(data["counts"].values()),data["action_count"])

if __name__=="__main__":
    unittest.main()
