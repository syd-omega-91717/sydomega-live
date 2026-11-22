#!/usr/bin/env python3
"""The asset ledger must read real member-scoped records, never static asset claims."""

from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]
PAGE = (ROOT / "ledger.html").read_text(encoding="utf-8")
RUNTIME = (ROOT / "omega-ledger-native.js").read_text(encoding="utf-8")


class LedgerTruthBoundaryContract(unittest.TestCase):
    def test_fabricated_asset_registry_is_removed(self):
        for name in ("Swiss Vault Gold Bars", "Singapore High-Rise Property", "51% Absolute Master Stake"):
            self.assertNotIn(name, PAGE)
        self.assertNotIn("var ASSETS=[", PAGE)
        self.assertNotIn("VERIFIED (cryptographically confirmed active assets)", PAGE)

    def test_asset_rows_are_loaded_from_authenticated_user_assets(self):
        self.assertIn('/omega-ledger-native.js', PAGE)
        self.assertIn("from('user_assets')", RUNTIME)
        self.assertIn("select('id,name,quantity,asset_type,track_name')", RUNTIME)
        self.assertIn(".eq('user_id', userId)", RUNTIME)
        self.assertIn("if (result.error || !Array.isArray(result.data))", RUNTIME)

    def test_records_are_not_misrepresented_as_verified_ownership(self):
        self.assertIn("USER-RECORDED · NOT VERIFIED", RUNTIME)
        self.assertIn("not independently verify ownership", PAGE.lower())
        self.assertIn("not a financial valuation", PAGE.lower())
        self.assertNotIn("All ledger valuations are anchored to AUTH", PAGE)

    def test_profile_axes_and_node_are_calculated_without_javascript_fallbacks(self):
        self.assertIn("CALCULATED AUTH SCORE", PAGE)
        self.assertIn("CALCULATED NODE INDEX", PAGE)
        self.assertIn("const axes = raw.map(Number);", RUNTIME)
        self.assertNotIn("profile.axis_a || 0.001", RUNTIME)
        self.assertNotIn("profile.matrix_track || 1", RUNTIME)
        self.assertIn("authValue.dataset.truth = 'CALCULATED'", RUNTIME)
        self.assertIn("nodeValue.dataset.truth = 'CALCULATED'", RUNTIME)


if __name__ == "__main__":
    unittest.main()
