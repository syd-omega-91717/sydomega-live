#!/usr/bin/env python3
"""Regression contract for Vault's financial truth boundary."""

from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]
SOURCE = (ROOT / "omega-vault-native.js").read_text(encoding="utf-8")


class VaultTaskProgressionTruthBoundaryContract(unittest.TestCase):
    def test_task_completion_records_are_not_labeled_earnings(self):
        self.assertIn("state('TASK PROGRESSION', model.progression, model.progressionKind)", SOURCE)
        self.assertNotIn("state('EARNINGS'", SOURCE)
        self.assertNotIn("earningsKind", SOURCE)
        self.assertNotIn("earningsText", SOURCE)
        self.assertIn("these are not financial earnings", SOURCE)
        self.assertIn("this is not a financial balance", SOURCE)

    def test_progression_state_uses_only_authenticated_task_records(self):
        self.assertIn(".from('task_completions')", SOURCE)
        self.assertIn(".eq('user_id', session.user.id)", SOURCE)
        self.assertIn("progressionKind = tasks.data && tasks.data.length ? 'LIVE' : 'EMPTY';", SOURCE)

    def test_session_errors_are_not_silently_treated_as_signed_out(self):
        self.assertIn("if (sessionResult && sessionResult.error) throw sessionResult.error;", SOURCE)
        self.assertIn("progression: 'Member task-progression state is unavailable.', progressionKind: 'UNAVAILABLE'", SOURCE)

    def test_vault_does_not_claim_live_token_or_reserve_balances(self):
        self.assertIn("No governed token ledger is active; no balance is claimed.", SOURCE)
        self.assertIn("Reserve figures remain design/planning data; no authoritative financial balance is exposed here.", SOURCE)

    def test_earning_ledger_never_invents_a_fallback_point_value(self):
        vault = (ROOT / "vault.html").read_text(encoding="utf-8")
        self.assertNotIn("points_earned||0.001", vault)
        self.assertIn("Number.isFinite(Number(t.points_earned))", vault)
        self.assertIn("tot===null?'—':tot.toFixed(3)+' PTS'", vault)
        self.assertIn("validPoints?((Number(rawPoints)>=0?'+':'')+Number(rawPoints).toFixed(3)):'—'", vault)

    def test_earning_ledger_fails_closed_and_uses_text_nodes_for_member_data(self):
        vault = (ROOT / "vault.html").read_text(encoding="utf-8")
        self.assertIn("if(tc.error)throw tc.error;", vault)
        self.assertIn("if(!Array.isArray(tc.data))throw new Error('Task progression response is invalid');", vault)
        self.assertIn("timestamp.textContent=fmt(t.completed_at);", vault)
        self.assertIn("task.textContent=String(t.task_name||'UNNAMED TASK').toUpperCase();", vault)
        self.assertIn("axis.textContent='AXIS '+String(t.axis_type||'UNKNOWN').toUpperCase();", vault)
        self.assertIn("el2.textContent='EARNING LEDGER UNAVAILABLE · SOURCE DATA COULD NOT BE VERIFIED';", vault)


if __name__ == "__main__":
    unittest.main()
