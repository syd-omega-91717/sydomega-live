#!/usr/bin/env python3
"""Tests for validated, hash-bound media review editing."""
from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path
from importlib.util import module_from_spec, spec_from_file_location

ROOT = Path(__file__).resolve().parents[2]
for name, path in (
    ("omega_media_review_gallery", ROOT / "scripts/omega-media-review-gallery.py"),
    ("omega_media_review_update", ROOT / "scripts/omega-media-review-update.py"),
):
    spec = spec_from_file_location(name, path)
    module = module_from_spec(spec)
    import sys
    sys.modules[name] = module
    spec.loader.exec_module(module)
    globals()["GALLERY" if name.endswith("gallery") else "UPDATE"] = module


class MediaReviewUpdateTests(unittest.TestCase):
    def fixture(self):
        temp = tempfile.TemporaryDirectory()
        root = Path(temp.name)
        (root / "media").mkdir()
        (root / "media" / "asset.png").write_bytes(b"asset-bytes")
        manifest_path = root / "review.json"
        manifest = GALLERY.build_review_manifest(root, manifest_path)
        return temp, root, manifest_path, manifest["assets"][0]["record_id"]

    def test_updates_visual_review_and_recalculates_summary(self):
        temp, root, manifest_path, record_id = self.fixture()
        with temp:
            result = UPDATE.apply_review_patch(root, manifest_path, record_id, {
                "visual_review": {
                    "status": "REVIEWED",
                    "reviewer": "human-reviewer",
                    "reviewed_at": "2026-11-17T12:00:00Z",
                    "findings": ["composition and legibility checked"],
                }
            })
            self.assertEqual(result["summary"]["visual_review_pending"], 0)
            self.assertEqual(result["assets"][0]["visual_review"]["status"], "REVIEWED")

    def test_rejects_unknown_fields_without_mutating_manifest(self):
        temp, root, manifest_path, record_id = self.fixture()
        with temp:
            before = manifest_path.read_bytes()
            with self.assertRaisesRegex(ValueError, "unsupported fields"):
                UPDATE.apply_review_patch(root, manifest_path, record_id, {
                    "rights_review": {"magic_approved": True}
                })
            self.assertEqual(manifest_path.read_bytes(), before)

    def test_rejects_publication_approval_without_rights_evidence(self):
        temp, root, manifest_path, record_id = self.fixture()
        with temp:
            before = manifest_path.read_bytes()
            with self.assertRaisesRegex(ValueError, "verified rights"):
                UPDATE.apply_review_patch(root, manifest_path, record_id, {
                    "rights_review": {"publication_approved": True}
                })
            self.assertEqual(manifest_path.read_bytes(), before)

    def test_rejects_changed_asset_bytes(self):
        temp, root, manifest_path, record_id = self.fixture()
        with temp:
            (root / "media" / "asset.png").write_bytes(b"new bytes")
            with self.assertRaisesRegex(ValueError, "asset bytes or path changed"):
                UPDATE.apply_review_patch(root, manifest_path, record_id, {
                    "visual_review": {
                        "status": "REVIEWED",
                        "reviewer": "reviewer",
                        "reviewed_at": "2026-11-17T12:00:00Z",
                    }
                })

    def test_rejects_symlinked_manifest(self):
        temp, root, manifest_path, record_id = self.fixture()
        with temp:
            target = root / "real-review.json"
            target.write_bytes(manifest_path.read_bytes())
            manifest_path.unlink()
            manifest_path.symlink_to(target)
            with self.assertRaisesRegex(ValueError, "symbolic link"):
                UPDATE.apply_review_patch(root, manifest_path, record_id, {
                    "visual_review": {"status": "PENDING"}
                })

    def test_rejects_record_id_not_present(self):
        temp, root, manifest_path, _record_id = self.fixture()
        with temp:
            with self.assertRaisesRegex(ValueError, "exactly one"):
                UPDATE.apply_review_patch(root, manifest_path, "0" * 64, {
                    "visual_review": {"status": "PENDING"}
                })

    def test_rejects_unknown_review_section(self):
        temp, root, manifest_path, record_id = self.fixture()
        with temp:
            with self.assertRaisesRegex(ValueError, "visual_review and/or rights_review"):
                UPDATE.apply_review_patch(root, manifest_path, record_id, {"publication": {"approved": True}})


if __name__ == "__main__":
    unittest.main()
