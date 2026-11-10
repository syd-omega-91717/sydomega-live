"""Regression contract for the Observatory's repository-evidence console."""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[2]
PAGE = (ROOT / "observatory.html").read_text(encoding="utf-8")
SCRIPT = (ROOT / "omega-observatory-evidence.js").read_text(encoding="utf-8")
GATE = ROOT / "config" / "omega-production-10-10-evidence-gate.json"


class ObservatoryEvidenceConsoleTests(unittest.TestCase):
    def test_existing_observatory_is_extended_not_replaced(self):
        self.assertIn('id="omega-evidence-console"', PAGE)
        self.assertIn('/omega-observatory-evidence.js', PAGE)
        self.assertIn('id="tab-status"', PAGE)
        self.assertTrue(GATE.exists())

    def test_source_is_explicitly_repository_declaration_not_live_health(self):
        self.assertIn("SOURCE DECLARATION", SCRIPT)
        self.assertIn("Not a live Supabase, Cloudflare, Stripe or monitoring check", SCRIPT)
        self.assertIn("snapshot timestamp is not encoded", SCRIPT.lower())

    def test_cloudflare_replaces_stale_vercel_gate_as_review_required(self):
        self.assertIn("id === 'vercel_production'", SCRIPT)
        self.assertIn("status: 'REVIEW_REQUIRED'", SCRIPT)
        self.assertIn("current repository declares Cloudflare Pages as production", SCRIPT)

    def test_unknown_status_fails_closed(self):
        self.assertIn("if (!STATUS[status]) status = 'UNVERIFIED';", SCRIPT)
        self.assertIn("STATUS[item.status] || STATUS.UNVERIFIED", SCRIPT)

    def test_console_does_not_infer_uptime_or_write_provider_data(self):
        self.assertNotIn("k-uptime", SCRIPT)
        self.assertNotIn("insert(", SCRIPT)
        self.assertNotIn("update(", SCRIPT)
        self.assertNotIn("upsert(", SCRIPT)
        self.assertIn("No database writes, provider calls, or inferred health states", SCRIPT)

    def test_rendering_uses_dom_text_not_untrusted_html(self):
        self.assertIn("document.createElement(", SCRIPT)
        self.assertIn("textContent", SCRIPT)
        self.assertNotIn("innerHTML", SCRIPT)

    def test_accessibility_and_mobile_reduced_motion_are_present(self):
        self.assertIn("aria-labelledby", SCRIPT)
        self.assertIn("role: 'img'", SCRIPT)
        self.assertRegex(SCRIPT, re.compile(r"@media\(max-width:720px\)"))
        self.assertIn("prefers-reduced-motion:reduce", SCRIPT)

    def test_live_telemetry_coverage_is_explicit(self):
        for element_id in (
            'coverage-uptime-state',
            'coverage-cwv-state',
            'coverage-budget-state',
            'coverage-incidents-state',
        ):
            self.assertIn('id="' + element_id + '"', PAGE)

    def test_empty_incident_register_is_not_rendered_as_zero_open_incidents(self):
        self.assertIn("NO INCIDENT RECORDS", PAGE)
        self.assertIn("absence of records is not uptime evidence", PAGE)
        self.assertIn("sid('k-incidents','—')", PAGE)
        self.assertNotIn("sid('k-incidents',0)", PAGE)

    def test_error_budget_seed_rows_are_not_promoted_to_green(self):
        self.assertIn("NO PLATFORM AGGREGATE", PAGE)
        self.assertIn("NULL budget values are not green health", PAGE)
        self.assertEqual(PAGE.count("from('error_budget_policy')"), 1)

    def test_cwv_data_availability_is_not_confused_with_cwv_measurement(self):
        self.assertIn("NO CWV MEASUREMENTS", PAGE)
        self.assertIn("hasCwv=d.lcp_ms!=null||d.inp_ms!=null||d.cls!=null", PAGE)

    def test_service_budget_is_not_misrepresented_as_platform_aggregate(self):
        self.assertIn("surface==='platform'||sv.surface==='platform_service'", PAGE)
        self.assertIn("NO PLATFORM AGGREGATE", PAGE)
        self.assertIn("computed.length?'unknown':(rows.length?'warn':'unknown')", PAGE)

    def test_existing_uptime_truth_contract_remains_untouched(self):
        uptime_test = (ROOT / "scripts" / "tests" / "test_uptime_truth_contract.py").read_text(encoding="utf-8")
        self.assertIn("test_uptime_is_not_derived_from_an_incident_log", uptime_test)
        self.assertIn("sid('k-uptime'", uptime_test)


if __name__ == "__main__":
    unittest.main()
