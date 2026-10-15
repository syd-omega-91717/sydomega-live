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


if __name__ == "__main__":
    unittest.main()
