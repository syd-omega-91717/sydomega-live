import importlib.util
import unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location("omega_page_action_audit", ROOT/"scripts"/"omega-page-action-audit.py")
module=importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(module)
ActionParser=module.ActionParser
class PageActionNavigationTests(unittest.TestCase):
    def parse(self, html):
        parser=ActionParser(); parser.feed(html); self.assertEqual(len(parser.actions),1); return parser.actions[0]
    def test_local_location_navigation_is_non_mutating(self):
        action=self.parse("<button onclick=\"location.href='world.html'\">World</button>")
        self.assertEqual(action["state"],"AVAILABLE_WITHOUT_MUTATION"); self.assertEqual(action["evidence"]["navigation_target"],"world.html")
    def test_window_open_local_html_is_non_mutating(self):
        action=self.parse("<button onclick=\"window.open('wallet.html')\">Wallet</button>")
        self.assertEqual(action["state"],"AVAILABLE_WITHOUT_MUTATION"); self.assertEqual(action["evidence"]["navigation_target"],"wallet.html")
    def test_mutating_handler_remains_unmapped(self):
        action=self.parse("<button onclick=\"saveRecord(); location.href='done.html'\">Save</button>")
        self.assertEqual(action["state"],"UNMAPPED"); self.assertIsNone(action["evidence"]["navigation_target"])
    def test_registered_capability_marker_governs(self):
        action=self.parse("<input type=\"file\" data-omega-capability-id=\"import-export\">")
        self.assertEqual(action["state"],"GOVERNED"); self.assertTrue(action["evidence"]["capability_registered"])
    def test_unknown_capability_marker_does_not_govern(self):
        action=self.parse("<input type=\"file\" data-omega-capability-id=\"made-up-capability\">")
        self.assertEqual(action["state"],"UNMAPPED"); self.assertFalse(action["evidence"]["capability_registered"])
    def test_estate_is_within_the_unmapped_ceiling(self):
        data=module.audit_estate()
        self.assertLessEqual(data["counts"].get("UNMAPPED",0), module.UNMAPPED_CEILING)
if __name__=="__main__": unittest.main()
