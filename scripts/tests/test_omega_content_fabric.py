#!/usr/bin/env python3
"""Static contract tests for the read-only Ω Content Asset Fabric."""
import json
import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]


class ContentFabricTest(unittest.TestCase):
    def test_source_map_matches_live_sources(self):
        config = json.loads((ROOT / "config/omega-content-fabric.json").read_text())
        self.assertEqual(set(config["sources"]), {"media_items", "storage_files", "user_assets"})
        self.assertEqual(config["status"], "IMPLEMENTED_READ_ONLY")

    def test_non_inference_rules_exist(self):
        config = json.loads((ROOT / "config/omega-content-fabric.json").read_text())
        self.assertGreaterEqual(len(config["non_inference_rules"]), 6)

    def test_runtime_is_read_only_and_truth_aware(self):
        source = (ROOT / "omega-content-fabric.js").read_text()
        self.assertIn("root.OmegaContentFabric", source)
        self.assertIn("truth_state:'UNAVAILABLE'", source)
        self.assertNotIn(".insert(", source)
        self.assertNotIn(".update(", source)
        self.assertNotIn(".delete(", source)

    def test_media_projection_consumes_fabric(self):
        source = (ROOT / "omega-media-native.js").read_text()
        self.assertIn("OmegaContentFabric", source)
        self.assertIn("sources:['media_items']", source)

    def test_media_catalog_read_is_backed_by_authenticated_grant_snapshot(self):
        grants = json.loads((ROOT / "supabase/live-grants.json").read_text())
        media = grants["relations"]["media_items"]["table"]
        self.assertEqual(media[0], "S", "authenticated media catalog reads require SELECT")
        self.assertEqual(media[1:], "---", "media catalog must remain read-only for authenticated clients")


if __name__ == "__main__":
    unittest.main()
