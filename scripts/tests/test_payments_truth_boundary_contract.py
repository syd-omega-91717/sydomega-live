#!/usr/bin/env python3
"""Regression contract preventing fabricated financial history on Payments."""

from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]
SOURCE = (ROOT / "payments.html").read_text(encoding="utf-8")


class PaymentsTruthBoundaryContract(unittest.TestCase):
    def test_task_completions_are_not_converted_into_payments(self):
        self.assertNotIn("async function buildTxLog", SOURCE)
        self.assertNotIn("from('task_completions').select('kind,completed_at,created_at')", SOURCE)
        self.assertNotIn("Contribution axis event reward", SOURCE)
        self.assertNotIn("Academy module completion bonus", SOURCE)
        self.assertNotIn("Gaming arena stage reward", SOURCE)
        self.assertNotIn("((i+1)*91.717)", SOURCE)

    def test_ui_does_not_invent_completed_subscription_or_trial_rows(self):
        self.assertNotIn("Monthly subscription — current tier", SOURCE)
        self.assertNotIn("Platform access — trial period", SOURCE)
        self.assertNotIn("READY TO ACTIVATE',dir:'pending'", SOURCE)
        self.assertNotIn("status:'completed',amount:'0.00'", SOURCE)

    def test_unknown_financial_metrics_are_not_presented_as_zero_or_one(self):
        self.assertIn('id="kpi-inflow">—</div>', SOURCE)
        self.assertIn('class="kpi-val">—</div><div class="kpi-label">ACTIVE TIER · UNAVAILABLE', SOURCE)
        self.assertIn('class="kpi-val">—</div><div class="kpi-label">CONSULTANCY · UNAVAILABLE', SOURCE)
        self.assertIn('class="kpi-val">—</div><div class="kpi-label">MARKETPLACE · UNAVAILABLE', SOURCE)
        self.assertIn('NEXT BILLING · UNAVAILABLE', SOURCE)

    def test_empty_history_explains_missing_authoritative_ledger(self):
        self.assertIn("TRANSACTION LEDGER UNAVAILABLE", SOURCE)
        self.assertIn("authoritative payment records are not connected", SOURCE)
        self.assertIn("This page will not infer payments from task activity.", SOURCE)

    def test_boot_keeps_ledger_unavailable_without_synthetic_calculation(self):
        self.assertIn("window.__txRows=[];", SOURCE)
        self.assertIn("renderTx([],'all');", SOURCE)
        self.assertNotIn("(inflow*91.717).toFixed(0)", SOURCE)


if __name__ == "__main__":
    unittest.main()
