#!/usr/bin/env python3
"""Regression tests for the Omega asset provenance inventory."""
from __future__ import annotations

import hashlib
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "omega-asset-provenance-audit.py"


class AssetProvenanceAuditTests(unittest.TestCase):
    def test_hashes_local_media_and_marks_rights_unverified(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / "assets").mkdir()
            payload = b"example image bytes"
            (root / "assets" / "planet.webp").write_bytes(payload)
            (root / "world.html").write_text(
                '<img src="/assets/planet.webp" alt="Planet">', encoding="utf-8"
            )
            result = subprocess.run(
                [sys.executable, str(SCRIPT), "--root", str(root)],
                check=True, capture_output=True, text=True,
            )
            report = json.loads(result.stdout)
            self.assertEqual(report["summary"]["local_asset_count"], 1)
            asset = report["assets"][0]
            self.assertEqual(asset["path"], "assets/planet.webp")
            self.assertEqual(asset["sha256"], hashlib.sha256(payload).hexdigest())
            self.assertEqual(asset["asset_type"], "image")
            self.assertEqual(asset["reference_count"], 1)
            self.assertEqual(asset["rights_state"], "UNVERIFIED")
            self.assertEqual(asset["ownership_state"], "UNVERIFIED")

    def test_classifies_video_and_remote_references_without_claiming_live(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / "media").mkdir()
            (root / "media" / "intro.mp4").write_bytes(b"video")
            (root / "media.html").write_text(
                '<video src="/media/intro.mp4"></video>'
                '<source src="https://cdn.example.test/clip.mp4">', encoding="utf-8"
            )
            result = subprocess.run(
                [sys.executable, str(SCRIPT), "--root", str(root)],
                check=True, capture_output=True, text=True,
            )
            report = json.loads(result.stdout)
            self.assertEqual(report["summary"]["video_count"], 1)
            self.assertEqual(report["remote_references"][0]["source_state"], "REMOTE_REFERENCE_ONLY")
            self.assertEqual(report["remote_references"][0]["availability_state"], "UNVERIFIED")
            self.assertIn("does_not_prove", report["remote_references"][0]["truth_rule"].lower())

    def test_output_file_is_valid_json(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            out = root / "reports" / "assets.json"
            subprocess.run(
                [sys.executable, str(SCRIPT), "--root", str(root), "--output", str(out)],
                check=True, capture_output=True, text=True,
            )
            self.assertEqual(json.loads(out.read_text(encoding="utf-8"))["schema_version"], 1)


if __name__ == "__main__":
    unittest.main()
