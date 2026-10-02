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

DEEP_COLLECTIONS = {
    "Brand_Identity_Style_S.Y.D_Omega_91717": 17,
    "Certificate_of_Appreciation_S.Y.D_Omega_91717": 9,
    "Certificates_S.Y.D_Omega_91717": 14,
    "Cinematic_game_syd_omega_91717": 11,
    "Horoscope_Sign_S.Y.D_Omega_91717": 12,
    "Logo_Main_Page_S.Y.D_Omega_91717": 4,
    "Logo_Medal_Stage_1_to_9_S.Y.D_Omega_91717": 10,
    "Logo_Phases_Levels_Grades_S.Y.D_Omega_91717": 28,
    "Medals_S.Y.D_Omega_91717": 37,
    "Mobile_app_Design_Passport_Credit-Cards_S.Y.D_Omega_91717": 11,
    "NFT_HOMOGENIC_OMEGA_91717": 2,
    "NFT_syd_omega_91717": 2,
    "Omega_Crypto_Coin_token_HOMOGENIC_OMEGA_91717": 1,
    "Omega_Crypto_Coin_token_syd_omega_91717": 1,
    "Phases_HOMOGENIC_OMEGA_91717": 30,
    "Phases_syd_omega_91717": 40,
}

class SourceDNA(unittest.TestCase):
    def test_deep_visual_collection_inventory(self):
        root = os.path.join(ROOT, "BlockChain_Market_Analysis_syd_omega_91717")
        with open(MANIFEST, encoding="utf-8") as fh:
            manifest = json.load(fh)
        inv = manifest.get("deep_visual_source_inventory") or {}
        self.assertEqual(inv.get("additional_visual_count"), 229)
        for name, expected in DEEP_COLLECTIONS.items():
            directory = os.path.join(root, name)
            files = [p for p in os.listdir(directory) if os.path.isfile(os.path.join(directory, p))]
            self.assertEqual(len(files), expected, name)

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
