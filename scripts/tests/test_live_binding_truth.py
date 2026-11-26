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
        for state in ("loading", "live", "calculated", "canonical", "unavailable", "error"):
            self.assertIn("'%s'" % state, self.source)
        self.assertIn("el.dataset.liveState=state", self.source)

    def test_missing_auth_and_missing_data_never_leave_a_stale_placeholder(self):
        self.assertIn("setLiveState(el,'unavailable','—')", self.fetch)
        self.assertIn("else if(state==='loading'&&previous!=='live'&&previous!=='calculated'&&previous!=='canonical')el.textContent='…';", self.source)
        self.assertIn("delete el.dataset.liveBound", self.source)
        self.assertIn("function initializeLiveShell()", self.source)
        self.assertIn("else initializeLiveShell();", self.source)

    def test_auth_score_is_calculated_from_profile_axes(self):
        self.assertIn("var auth=Math.sqrt(Math.pow(a,3)+Math.pow(b,3)+Math.pow(c,3))*phi/euler;", self.fetch)
        self.assertIn("setLiveState(el,'calculated')", self.fetch)
        self.assertIn("setLiveState(el,_profile.is_owner?'canonical':'live')", self.fetch)
        self.assertNotIn("_profile.is_owner?9", self.fetch)
        self.assertNotIn("27.8367", self.fetch)
        self.assertNotIn("||0.001", self.fetch)

    def test_signout_clears_member_scoped_values_and_timers(self):
        self.assertIn("function clearMemberLiveData()", self.source)
        self.assertIn("if(event==='SIGNED_OUT')", self.source)
        self.assertIn("stopLiveRefreshTimers()", self.source)
        self.assertIn("if(!window.__omegaSb||!_uid||el.dataset.liveBound!=='1')return;", self.source)
        self.assertIn("delete el.dataset.liveBound", self.source)

    def test_pulse_is_a_keyboard_operable_button_with_a_real_target(self):
        pulse = self.source[self.source.index("function createPulseIndicator"):self.source.index("function verifyPulse")]
        self.assertIn("document.createElement('button')", pulse)
        self.assertIn("control.type='button'", pulse)
        self.assertIn("control.setAttribute('aria-label'", pulse)
        self.assertIn("width:36px;height:36px", pulse)
        self.assertIn("indicator.setAttribute('aria-hidden','true')", pulse)

    def test_pulse_status_is_exposed_on_the_button_not_the_decorative_dot(self):
        pulse = self.source[self.source.index("function verifyPulse"):self.source.index("/* ── C. LIVE MEMBER COUNT")]
        self.assertIn("control.setAttribute('aria-label','Live data status: unavailable')", pulse)
        self.assertIn("control.setAttribute('aria-label','Live data status: '+_pulseStatus)", pulse)
        self.assertIn("dot.style.background", pulse)

    def test_pulse_animation_respects_reduced_motion(self):
        pulse = self.source[self.source.index("function createPulseIndicator"):self.source.index("function verifyPulse")]
        self.assertIn("@media(prefers-reduced-motion:reduce)", pulse)

    def test_member_count_uses_privacy_safe_aggregate_rpc(self):
        start = self.source.index("function updateMemberCount()")
        end = self.source.index("/* ── D. ACTIVITY TICKER", start)
        member_count = self.source[start:end]
        self.assertIn("rpc('omega_dashboard_public_metrics')", member_count)
        self.assertIn("approved_members", member_count)
        self.assertNotIn(".from('profiles')", member_count)

    def test_public_count_and_ticker_report_empty_and_error_states(self):
        self.assertIn("function updateMemberCount()", self.source)
        self.assertIn("function startTicker()", self.source)
        pulse = self.source[self.source.index('function createPulseIndicator'):self.source.index('function verifyPulse')]
        self.assertIn("var control=document.getElementById('omega-pulse')", pulse)
        self.assertIn('verifyPulse(control,dot||control)', pulse)
        self.assertIn("setLiveState(el,'error','—')", self.source)
        self.assertIn("setLiveState(ticker,'unavailable','—')", self.source)


if __name__ == "__main__":
    unittest.main()
