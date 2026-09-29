#!/usr/bin/env python3
"""Verify the source-DNA manifest stays aligned with the production legacy atlas."""
import json
import os
import subprocess
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MANIFEST = os.path.join(ROOT, "config", "omega-source-dna.json")
COMPONENT_ROOT = os.path.join(ROOT, "BlockChain_Market_Analysis_syd_omega_91717", "components")
LEGACY = os.path.join(ROOT, "omega-legacy-constellation.js")

PROBE = r"""
global.window = {};
global.document = { readyState:'loading', addEventListener(){}, getElementById(){return null;} };
require(process.argv[1]);
const L = window.OmegaLegacyConstellation;
const familyCounts = {};
L.phases.forEach(p => familyCounts[p[0]] = (familyCounts[p[0]] || 0) + 1);
console.log(JSON.stringify({phase:L.phases.length,trophy:L.trophies.length,zodiac:L.zodiac.length,familyCounts}));
"""

class SourceDNA(unittest.TestCase):
    def test_reference_component_inventory(self):
        with open(MANIFEST, encoding="utf-8") as fh:
            manifest = json.load(fh)
        inv = manifest.get("source_component_inventory") or {}
        self.assertEqual(inv.get("file_count"), 16)
        self.assertEqual(inv.get("family_count"), 8)
        self.assertFalse(inv.get("production_imports_allowed", True))
        families = inv.get("families") or []
        self.assertEqual(len(families), 8)
        files = [name for name in os.listdir(COMPONENT_ROOT) if name.endswith((".jsx", ".tsx"))]
        self.assertEqual(len(files), 16)
        for family in families:
            self.assertTrue(os.path.exists(os.path.join(COMPONENT_ROOT, family + ".jsx")))
            self.assertTrue(os.path.exists(os.path.join(COMPONENT_ROOT, family + ".tsx")))
    def test_manifest_matches_runtime_source(self):
        with open(MANIFEST, encoding="utf-8") as fh:
            m = json.load(fh)
        out = subprocess.run(
            ["node", "-e", PROBE, LEGACY],
            capture_output=True, text=True, check=True
        )
        live = json.loads(out.stdout)
        self.assertEqual(m["source_count"], live["phase"] + live["trophy"] + live["zodiac"])
        self.assertEqual(m["artifact_types"]["phase_art"], live["phase"])
        self.assertEqual(m["artifact_types"]["trophy_source"], live["trophy"])
        self.assertEqual(m["artifact_types"]["zodiac_identity"], live["zodiac"])
        expected = {x["id"]: x["asset_count"] for x in m["families"]}
        self.assertEqual(expected, live["familyCounts"])

if __name__ == "__main__":
    unittest.main()
