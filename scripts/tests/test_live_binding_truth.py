#!/usr/bin/env python3
"""Truth and privacy contract for the shared live-data binding engine."""

from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]


class LiveBindingTruthContract(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.source = (ROOT / "omega-live.js").read_text(encoding="utf-8")
        cls.fetch = cls.source[cls.source.index("function fetchLive"):cls.source.index("function renderValue")]

    def test_live_bindings_expose_explicit_truth_states(self):
        for state in ("loading", "live", "calculated", "unavailable", "error"):
            self.assertIn("'%s'" % state, self.source)
        self.assertIn("el.dataset.liveState=state", self.source)

    def test_missing_auth_and_missing_data_never_leave_a_stale_placeholder(self):
        self.assertIn("setLiveState(el,'unavailable','—')", self.fetch)
        self.assertIn("setLiveState(el,'loading','…')", self.source)
        self.assertIn("delete el.dataset.liveBound", self.source)

    def test_auth_score_is_calculated_from_persisted_axes(self):
        self.assertIn("var auth=Math.sqrt(Math.pow(a,3)+Math.pow(b,3)+Math.pow(c,3))*phi/euler;", self.fetch)
        self.assertIn("setLiveState(el,'calculated')", self.fetch)
        self.assertNotIn("_profile.is_owner?9", self.fetch)
        self.assertNotIn("27.8367", self.fetch)
        self.assertNotIn("||0.001", self.fetch)

    def test_signout_clears_member_scoped_values_and_timers(self):
        self.assertIn("function clearMemberLiveData()", self.source)
        self.assertIn("if(event==='SIGNED_OUT')", self.source)
        self.assertIn("stopLiveRefreshTimers()", self.source)
        self.assertIn("delete el.dataset.liveBound", self.source)

    def test_public_count_and_ticker_report_empty_and_error_states(self):
        self.assertIn("function updateMemberCount()", self.source)
        self.assertIn("function startTicker()", self.source)
        self.assertIn("setLiveState(el,'error','—')", self.source)
        self.assertIn("setLiveState(ticker,'unavailable','—')", self.source)


if __name__ == "__main__":
    unittest.main()
