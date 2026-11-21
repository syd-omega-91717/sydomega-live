#!/usr/bin/env python3
"""Empty local finance planners must not display synthetic zero balances."""

from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]


class LocalFinanceEmptyStateContract(unittest.TestCase):
    def test_wallet_shows_no_balance_before_an_account_exists(self):
        source = (ROOT / "wallet.html").read_text(encoding="utf-8")
        self.assertIn("if(!accounts.length)", source)
        self.assertIn("nwEl.textContent='—'", source)
        self.assertIn("NO ACCOUNTS RECORDED", source)
        self.assertNotIn('id="nw-value">$0', source)

    def test_investment_shows_no_portfolio_value_before_holdings_exist(self):
        source = (ROOT / "investment.html").read_text(encoding="utf-8")
        self.assertIn("if(!holdings.length)", source)
        self.assertIn("port-val').textContent='—'", source)
        self.assertIn("port-cost').textContent='—'", source)
        self.assertIn("port-pnl').textContent='—'", source)
        self.assertNotIn('id="port-val">$0', source)

    def test_vault_summary_explains_usd_equivalent_wallet_balances(self):
        source = (ROOT / "omega-vault-core.js").read_text(encoding="utf-8")
        self.assertIn("account currencies:", source)
        self.assertIn("balances entered as USD equivalent", source)


if __name__ == "__main__":
    unittest.main()
