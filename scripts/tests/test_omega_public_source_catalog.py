#!/usr/bin/env python3
"""Contract tests for the public engineering source catalog."""
from __future__ import annotations

import json
import unittest
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[2]
CATALOG = ROOT / "docs/research/omega-public-source-catalog-20261022.json"


class PublicSourceCatalogContract(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
        cls.sources = cls.catalog["sources"]

    def test_catalog_declares_safe_ingestion_policy(self):
        policy = self.catalog["policy"]
        self.assertIs(policy["public_sources_only"], True)
        self.assertIs(policy["copy_proprietary_code"], False)
        self.assertIs(policy["license_review_required"], True)
        self.assertIs(policy["source_content_is_untrusted"], True)
        self.assertIs(policy["automatic_execution_authority"], False)
        self.assertIs(policy["personal_data_collection_from_public_sources"], False)

    def test_source_records_are_complete_and_unique(self):
        self.assertGreaterEqual(len(self.sources), 10)
        ids = [item["source_id"] for item in self.sources]
        urls = [item["canonical_url"] for item in self.sources]
        self.assertEqual(len(ids), len(set(ids)), "source_id values must be unique")
        self.assertEqual(len(urls), len(set(urls)), "canonical URLs must be unique")
        required = {
            "source_id", "title", "publisher", "canonical_url", "source_type",
            "tier", "retrieved_at", "license_status", "confidence", "summary",
            "applies_to", "status", "limitations",
        }
        for item in self.sources:
            self.assertTrue(required.issubset(item), f"missing fields: {item.get('source_id')}")
            parsed = urlparse(item["canonical_url"])
            self.assertEqual(parsed.scheme, "https", item["source_id"])
            self.assertTrue(parsed.netloc, item["source_id"])
            self.assertIn(item["tier"], {"A", "B", "C"})
            self.assertIn(item["status"], {"discovered", "reviewed", "approved", "implemented", "verified", "stale", "rejected"})
            self.assertTrue(item["license_status"].strip())
            self.assertTrue(item["limitations"].strip())
            self.assertTrue(item["summary"].strip())
            self.assertIsInstance(item["applies_to"], list)
            self.assertTrue(item["applies_to"])

    def test_source_records_do_not_claim_implementation_or_verification(self):
        for item in self.sources:
            self.assertEqual(item["status"], "reviewed", item["source_id"])
            self.assertNotIn("implemented", item["summary"].lower())
            self.assertNotIn("certified", item["summary"].lower())


if __name__ == "__main__":
    unittest.main()
