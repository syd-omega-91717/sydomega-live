"""Notification polling must remain single-flight and keyboard operable."""
import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
SOURCE = (ROOT / "omega-notify.js").read_text(encoding="utf-8")


class NotificationRuntimeTests(unittest.TestCase):
    def test_single_visibility_aware_poll_scheduler(self):
        self.assertIn("var _pollTimer=null", SOURCE)
        self.assertIn("var _pollInFlight=false", SOURCE)
        self.assertIn("var _pollStarted=false", SOURCE)
        self.assertIn("if(_pollInFlight || document.hidden || !window.__omegaSb)", SOURCE)
        self.assertIn("document.addEventListener('visibilitychange'", SOURCE)
        self.assertNotIn("setInterval(poll,30000)", SOURCE)

    def test_repeated_population_events_do_not_create_more_schedulers(self):
        self.assertIn("if(_pollStarted)return", SOURCE)
        self.assertIn("document.addEventListener('omega:populated',startPolling)", SOURCE)
        self.assertIn("clearTimeout(_pollTimer)", SOURCE)

    def test_notification_badge_is_a_keyboard_native_control(self):
        self.assertIn("badge=document.createElement('button')", SOURCE)
        self.assertIn("badge.type='button'", SOURCE)
        self.assertIn("aria-haspopup','dialog", SOURCE)
        self.assertIn("Open notification centre", SOURCE)

    def test_panel_supports_escape_and_focus_return(self):
        self.assertIn("if(ev.key==='Escape')", SOURCE)
        self.assertGreaterEqual(SOURCE.count("badge.focus()"), 2)
        self.assertIn("if(close)close.focus()", SOURCE)


if __name__ == "__main__":
    unittest.main()
