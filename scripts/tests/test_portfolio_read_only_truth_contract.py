#!/usr/bin/env python3
"""Portfolio is read-only and private until server-side sharing exists."""

from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]
SOURCE = (ROOT / "portfolio.html").read_text(encoding="utf-8")


class PortfolioReadOnlyTruthContract(unittest.TestCase):
    def test_local_toggle_does_not_claim_server_side_publication(self):
        self.assertNotIn('id="pub-toggle"', SOURCE)
        self.assertNotIn("visible to other sovereigns", SOURCE)
        self.assertIn("SERVER-SIDE SHARING IS NOT AVAILABLE", SOURCE)
        self.assertIn("localStorage.removeItem('omega_portfolio_public')", SOURCE)

    def test_portfolio_reads_only_real_user_asset_fields(self):
        self.assertIn("from('user_assets').select('id,name,quantity,asset_type,track_name')", SOURCE)
        self.assertNotIn("order('created_at'", SOURCE)
        self.assertIn("if(result.error||!Array.isArray(result.data))", SOURCE)
        self.assertIn("ASSET RECORDS UNAVAILABLE", SOURCE)
        self.assertIn("NO USER-RECORDED HOLDINGS", SOURCE)

    def test_no_client_claims_of_trading_or_asset_creation(self):
        self.assertIn("does not create holdings, execute trades, issue tokens", SOURCE)
        self.assertIn("A record is not independent proof", SOURCE)


if __name__ == "__main__":
    unittest.main()
