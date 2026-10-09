import unittest
from scripts.omega_page_action_audit import ActionParser


class PageActionNavigationTests(unittest.TestCase):
    def parse(self, html):
        parser = ActionParser()
        parser.feed(html)
        self.assertEqual(len(parser.actions), 1)
        return parser.actions[0]

    def test_local_location_navigation_is_non_mutating(self):
        action = self.parse("<button onclick=\"location.href='world.html'\">World</button>")
        self.assertEqual(action["state"], "AVAILABLE_WITHOUT_MUTATION")
        self.assertEqual(action["evidence"]["navigation_target"], "world.html")

    def test_window_open_local_html_is_non_mutating(self):
        action = self.parse("<button onclick=\"window.open('wallet.html')\">Wallet</button>")
        self.assertEqual(action["state"], "AVAILABLE_WITHOUT_MUTATION")
        self.assertEqual(action["evidence"]["navigation_target"], "wallet.html")

    def test_mutating_handler_remains_unmapped(self):
        action = self.parse("<button onclick=\"saveRecord(); location.href='done.html'\">Save</button>")
        self.assertEqual(action["state"], "UNMAPPED")
        self.assertIsNone(action["evidence"]["navigation_target"])


if __name__ == "__main__":
    unittest.main()
