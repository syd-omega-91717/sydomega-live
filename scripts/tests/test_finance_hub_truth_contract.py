#!/usr/bin/env python3
"""Finance hub navigation and status labels must reflect verified platform state."""

from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]
HUB = (ROOT / "invest.html").read_text(encoding="utf-8")
PAYMENTS = (ROOT / "payments.html").read_text(encoding="utf-8")


class FinanceHubTruthContract(unittest.TestCase):
    def test_finance_hub_does_not_claim_live_payments(self):
        self.assertIn("PLATFORM STATE: MEMBERSHIP READ-ONLY · BILLING DISABLED", HUB)
        self.assertNotIn("PLATFORM-LIVE: SUBSCRIPTIONS / PAYMENTS", HUB)
        self.assertIn("NO VERIFIED SETTLEMENT", HUB)

    def test_all_existing_digital_exchange_destinations_are_linked(self):
        for path in ("blockchain.html", "marketplace.html", "advertising.html", "ad-network.html"):
            with self.subTest(path=path):
                self.assertIn('href="/' + path + '"', HUB)

    def test_payment_methods_and_rewards_are_not_claimed_as_active(self):
        self.assertNotIn("READY TO ACTIVATE", PAYMENTS)
        self.assertNotIn("fully wired and tested", PAYMENTS)
        self.assertNotIn("generate Omega Token", PAYMENTS)
        self.assertIn("Omega-token issuance and token balances are disabled", PAYMENTS)
        self.assertIn("Recurring billing is disabled", PAYMENTS)


if __name__ == "__main__":
    unittest.main()
