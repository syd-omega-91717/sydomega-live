#!/usr/bin/env python3
"""Static contracts for the Ω Living Intelligence workspace."""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]


class LivingIntelligenceContract(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.page = (ROOT / "personal-intelligence.html").read_text()
        cls.script = (ROOT / "omega-living-intelligence.js").read_text()
        cls.context = (ROOT / "omega-personal-context.js").read_text()
        cls.navigation = (ROOT / "nav.js").read_text()
        cls.doc = (ROOT / "docs/OMEGA_LIVING_INTELLIGENCE_CORE_20261022.md").read_text()

    def test_four_pillars_are_present(self):
        for phrase in ("Ω Personal Intelligence Core", "Ω Life Knowledge Graph", "Ω Action", "Ω Trust &amp; Privacy Fabric"):
            self.assertIn(phrase, self.page)

    def test_existing_canonical_surfaces_are_reused(self):
        self.assertIn('src="/omega-personal-context.js"', self.page)
        for route in ("/life.html#personal-context", "/missions.html", "/projects.html", "/privacy.html", "/agent-operations.html"):
            self.assertIn(route, self.page)
        self.assertIn("listLinkMetadata:function()", self.context)

    def test_no_fake_ai_or_automatic_side_effects(self):
        for phrase in ("NOT CONNECTED", "does not call an AI provider", "no model is called"):
            self.assertIn(phrase.lower(), (self.page + self.script + self.doc).lower())
        self.assertNotIn("fetch(", self.script)
        self.assertNotIn("localStorage", self.script)
        self.assertNotIn("innerHTML", self.script)

    def test_graph_gap_is_explicit(self):
        self.assertIn("last-verification timestamps are also not yet persisted", self.page)
        self.assertIn("does not yet contain a first-class confidence score", self.doc)

    def test_provenance_and_consent_metadata_are_exposed(self):
        for key in ("source_kind", "source_label", "review_status", "ai_processing_allowed", "sensitivity", "expires_at"):
            self.assertIn(key, self.context)
        self.assertIn("CONSENT READ FROM PRIVATE SOURCE", self.script)

    def test_visual_asset_claim_is_truthful(self):
        self.assertIn("assets/omega-banner.svg", self.page)
        self.assertIn("assets/legacy/sign-aries.webp", self.page)
        self.assertIn("404 raster files", self.doc)
        self.assertIn("313 unique by content hash", self.doc)

    def test_navigation_route_is_registered(self):
        self.assertIn("'personal-intelligence':'intel'", self.navigation)
        self.assertIn("'/personal-intelligence.html'", self.navigation)


if __name__ == "__main__":
    unittest.main()
