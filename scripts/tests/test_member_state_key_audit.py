import importlib.util
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "member-state-key-audit.py"
SPEC = importlib.util.spec_from_file_location("member_state_key_audit", SCRIPT)
AUDIT = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(AUDIT)


class MemberStateKeyAuditTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        (self.root / "omega-member-state.js").write_text(
            "var SKIP = {omega_lang: 1, 'omega:ad:impressions': 1};\n"
            "var NO_MIRROR = {omega_expenses: 1};\n"
            "function mirrored(k) { return k.indexOf('omega') === 0; }\n",
            encoding="utf-8",
        )

    def tearDown(self):
        self.temp.cleanup()

    def test_exact_keys_constants_and_policy_categories(self):
        (self.root / "focus.html").write_text(
            "<script>\\n"
            "const STORE_KEY = 'omega_focus_sessions';\\n"
            "localStorage.setItem(STORE_KEY, JSON.stringify([]));\\n"
            "localStorage.getItem('omega:ad:impressions');\\n"
            "localStorage.removeItem('omega_expenses');\\n"
            "localStorage.setItem('custom_notes', 'x');\\n"
            "</script>",
            encoding="utf-8",
        )
        rows = AUDIT.build_inventory(self.root)["records"]
        self.assertEqual(rows["omega_focus_sessions"]["category"], "MEMBER_STATE_MIRROR_ELIGIBLE")
        self.assertEqual(rows["omega:ad:impressions"]["category"], "EPHEMERAL_OR_BROWSER_LOCAL_SKIP")
        self.assertEqual(rows["omega_expenses"]["category"], "FINANCE_LOCAL_NO_MIRROR")
        self.assertEqual(rows["custom_notes"]["category"], "OUTSIDE_MEMBER_STATE_PREFIX")
        self.assertIn("setItem", rows["omega_focus_sessions"]["operations"])
        self.assertIn(("focus.html", 3), rows["omega_focus_sessions"]["refs"])

    def test_comma_separated_literal_declarations_are_resolved(self):
        (self.root / "heritage.html").write_text(
            "<script>\n"
            "var HK='omega_heritage_profile',AK='omega_ancestors',"
            "SK='omega_heritage_stories',CK='omega_culture';\n"
            "const FIRST_KEY='omega_first',\n SECOND_KEY='omega_second';\n"
            "var COMPUTED_KEY=makeKey(), EXACT_KEY='omega_exact';\n"
            "localStorage.getItem(AK); localStorage.getItem(SK); "
            "localStorage.getItem(CK); localStorage.getItem(SECOND_KEY); "
            "localStorage.getItem(COMPUTED_KEY);\n"
            "</script>",
            encoding="utf-8",
        )
        rows = AUDIT.build_inventory(self.root)["records"]
        for key in ("omega_ancestors", "omega_heritage_stories", "omega_culture", "omega_second"):
            self.assertEqual(rows[key]["category"], "MEMBER_STATE_MIRROR_ELIGIBLE")
        self.assertIn("{unresolved: COMPUTED_KEY}", rows)

    def test_dynamic_templates_and_concatenated_prefixes_are_not_called_exact(self):
        tick = chr(96)
        (self.root / "weekly.js").write_text(
            "const PREFIX = 'omega_wr_draft_';\n"
            + "localStorage.setItem(" + tick + "omega_wr_draft_" + chr(36) + "{week}" + tick + ", value);\n"
            + "localStorage.getItem(PREFIX + week);\n"
            + "localStorage.setItem(makeKey(user), value);\n",
            encoding="utf-8",
        )
        rows = AUDIT.build_inventory(self.root)["records"]
        self.assertIn("omega_wr_draft_{dynamic}", rows)
        self.assertEqual(rows["omega_wr_draft_{dynamic}"]["category"], "DYNAMIC_MEMBER_STATE_CANDIDATE")
        self.assertIn("{unresolved: makeKey(user)}", rows)

    def test_html_prose_apostrophes_do_not_hide_script_constants(self):
        (self.root / "apostrophe.html").write_text(
            "<p>Today's member's private notes stay private.</p>\\n"
            "<script type='module'>\\n"
            "const STORE_KEY = 'omega_from_script';\\n"
            "localStorage.getItem(STORE_KEY);\\n"
            "</script>",
            encoding="utf-8",
        )
        rows = AUDIT.build_inventory(self.root)["records"]
        self.assertEqual(rows["omega_from_script"]["category"], "MEMBER_STATE_MIRROR_ELIGIBLE")
        self.assertIn(("apostrophe.html", 4), rows["omega_from_script"]["refs"])

    def test_inline_event_handlers_are_scanned_but_json_payloads_are_not(self):
        (self.root / "inline.html").write_text(
            "<button onclick=\"localStorage.setItem('omega_inline_action', '1')\">Save</button>\\n"
            "<script type='application/json'>"
            "{\\\"example\\\":\\\"localStorage.setItem('omega_not_executable', '1')\\\"}"
            "</script>",
            encoding="utf-8",
        )
        rows = AUDIT.build_inventory(self.root)["records"]
        self.assertIn("omega_inline_action", rows)
        self.assertNotIn("omega_not_executable", rows)

    def test_module_constants_do_not_leak_across_script_blocks(self):
        (self.root / "scope.html").write_text(
            "<script type='module'>const MODULE_KEY='omega_module_only';</script>\\n"
            "<script>localStorage.getItem(MODULE_KEY);</script>",
            encoding="utf-8",
        )
        rows = AUDIT.build_inventory(self.root)["records"]
        self.assertIn("{unresolved: MODULE_KEY}", rows)

    def test_comments_and_strings_do_not_create_false_calls(self):
        (self.root / "false-positive.js").write_text(
            "// localStorage.setItem('omega_comment', x);\n"
            "var text = \"localStorage.setItem('omega_string', x)\";\n"
            "/* localStorage.removeItem('omega_block', x); */\n"
            "localStorage.setItem('omega_real', x);\n",
            encoding="utf-8",
        )
        rows = AUDIT.build_inventory(self.root)["records"]
        self.assertEqual(set(rows), {"omega_real"})

    def test_report_states_static_evidence_limits(self):
        (self.root / "page.html").write_text(
            "localStorage.setItem('omega_notes', 'x');", encoding="utf-8"
        )
        report = AUDIT.render_markdown(AUDIT.build_inventory(self.root))
        self.assertIn("does not prove a key is present", report)
        self.assertIn("Do not infer deletion from a missing local key", report)
        self.assertIn("omega:ad:impressions", report)


if __name__ == "__main__":
    unittest.main()
