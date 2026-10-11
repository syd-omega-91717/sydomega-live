#!/usr/bin/env python3
"""Static contract tests for the read-only Ω Content Asset Fabric."""
import json, pathlib, re, unittest
ROOT=pathlib.Path(__file__).resolve().parents[2]

class ContentFabricTest(unittest.TestCase):
    def test_source_map_matches_live_sources(self):
        c=json.loads((ROOT/'config/omega-content-fabric.json').read_text())
        self.assertEqual(set(c['sources']),{'media_items','storage_files','user_assets'})
        self.assertEqual(c['status'],'IMPLEMENTED_READ_ONLY')
    def test_non_inference_rules_exist(self):
        c=json.loads((ROOT/'config/omega-content-fabric.json').read_text())
        self.assertGreaterEqual(len(c['non_inference_rules']),6)
    def test_runtime_is_read_only_and_truth_aware(self):
        s=(ROOT/'omega-content-fabric.js').read_text()
        self.assertIn('root.OmegaContentFabric',s)
        self.assertIn("truth_state:'UNAVAILABLE'",s)
        self.assertNotIn('.insert(',s)
        self.assertNotIn('.update(',s)
        self.assertNotIn('.delete(',s)
    def test_media_projection_consumes_fabric(self):
        s=(ROOT/'omega-media-native.js').read_text()
        self.assertIn('OmegaContentFabric',s)

if __name__=='__main__': unittest.main()
