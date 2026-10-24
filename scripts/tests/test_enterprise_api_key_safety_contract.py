"""Regression contracts for the enterprise API-key view and truthful service claims."""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[2]
PAGE = (ROOT / "enterprise.html").read_text(encoding="utf-8")


class EnterpriseApiKeySafetyContract(unittest.TestCase):
    def test_api_key_query_is_allowlisted_and_never_fetches_secret_values(self):
        match = re.search(r"sb\.from\('api_keys'\)\.select\('([^']+)'\)", PAGE)
        self.assertIsNotNone(match, "API-key inventory must use an explicit column allowlist")
        columns = {column.strip() for column in match.group(1).split(",")}
        self.assertEqual(
            columns,
            {"id", "name", "scopes", "last_used_at", "expires_at", "active", "created_at"},
        )
        self.assertNotIn("api_key", columns)
        self.assertNotIn("api_secret", columns)
        self.assertNotIn("sb.from('api_keys').select('*')", PAGE)

    def test_view_uses_live_schema_names_not_stale_api_key_fields(self):
        for field in ("k.key_name", "k.key_prefix", "k.key_type", "k.requests_total"):
            self.assertNotIn(field, PAGE)
        for field in ("k.name", "k.scopes", "k.last_used_at", "k.expires_at", "k.active"):
            self.assertIn(field, PAGE)

    def test_unverified_sla_and_capacity_claims_are_not_presented_as_guarantees(self):
        for unsupported_sla in ("99.9%", "99.95%", "99.99%", "99.999%"):
            self.assertNotIn(unsupported_sla, PAGE)
        self.assertIn("INDICATIVE PRICING ONLY", PAGE)
        self.assertIn("NOT CONTRACTED", PAGE)
        self.assertIn("NOT YET VERIFIED", PAGE)
        self.assertIn("API quota subject to validated limits", PAGE)
        self.assertIn("Air-gapped operation requires a separately tested deployment", PAGE)


    def test_tier_ctas_open_a_prefilled_consultancy_request(self):
        consultancy = (ROOT / "consultancy.html").read_text(encoding="utf-8")
        for tier in ("starter", "professional", "enterprise", "government"):
            self.assertIn('data-tier-request="' + tier + '"', PAGE)
        self.assertIn("function requestTier(tier)", PAGE)
        self.assertIn("button.addEventListener('click'", PAGE)
        self.assertIn("'/consultancy.html?tab=book&domain=enterprise&brief='+encodeURIComponent(brief)", PAGE)
        self.assertIn("key:'enterprise'", consultancy)
        self.assertIn("new URLSearchParams(window.location.search)", consultancy)
        self.assertIn("document.getElementById('bk-brief').value=requestedBrief.slice(0,1000)", consultancy)
        self.assertIn("setTab('book')", consultancy)


if __name__ == "__main__":
    unittest.main()
