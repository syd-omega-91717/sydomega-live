#!/usr/bin/env python3
"""Tests for the local media visual-review gallery and durable manifest."""
from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from importlib.util import module_from_spec, spec_from_file_location

SCRIPT = Path(__file__).resolve().parents[1] / "omega-media-review-gallery.py"
SPEC = spec_from_file_location("omega_media_review_gallery", SCRIPT)
MODULE = module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class MediaReviewGalleryTests(unittest.TestCase):
    def test_generates_image_and_video_previews_with_hashes(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / "media").mkdir()
            (root / "media" / "cover.webp").write_bytes(b"image-bytes")
            (root / "media" / "trailer.mp4").write_bytes(b"video-bytes")
            output = root / "artifacts" / "review" / "index.html"
            manifest = root / "artifacts" / "review" / "review-manifest.json"
            counts = MODULE.build_gallery(root, output, manifest)
            page = output.read_text(encoding="utf-8")
            data = json.loads(manifest.read_text(encoding="utf-8"))
            self.assertEqual(counts, {"asset_count": 2, "image_count": 1, "video_count": 1})
            self.assertIn("<img loading=\"lazy\"", page)
            self.assertIn("<video controls", page)
            self.assertIn("SHA-256", page)
            self.assertIn("UNVERIFIED", page)
            self.assertIn("../../media/cover.webp", page)
            self.assertIn("../../media/trailer.mp4", page)
            self.assertEqual(data["summary"]["visual_review_pending"], 2)
            self.assertEqual(data["summary"]["rights_unverified"], 2)
            self.assertTrue(all(item["rights_review"]["publication_approved"] is False for item in data["assets"]))

    def test_manifest_preserves_review_only_for_same_path_and_hash(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            media = root / "media"
            media.mkdir()
            asset = media / "cover.png"
            asset.write_bytes(b"original")
            manifest_path = root / "review.json"
            first = MODULE.build_review_manifest(root, manifest_path)
            first["assets"][0]["visual_review"] = {
                "status": "REVIEWED", "reviewer": "reviewer-1",
                "reviewed_at": "2026-11-16T12:00:00Z", "findings": ["visual identity checked"],
            }
            first["assets"][0]["rights_review"]["evidence"] = ["https://example.invalid/license"]
            manifest_path.write_text(json.dumps(first), encoding="utf-8")

            second = MODULE.build_review_manifest(root, manifest_path)
            self.assertEqual(second["assets"][0]["visual_review"]["status"], "REVIEWED")
            self.assertEqual(second["assets"][0]["rights_review"]["evidence"], ["https://example.invalid/license"])

            asset.write_bytes(b"changed bytes")
            third = MODULE.build_review_manifest(root, manifest_path)
            self.assertEqual(third["assets"][0]["visual_review"]["status"], "PENDING")
            self.assertEqual(third["assets"][0]["rights_review"]["status"], "UNVERIFIED")
            self.assertFalse(third["assets"][0]["rights_review"]["publication_approved"])

    def test_escapes_asset_names_rejects_external_outputs_and_skips_symlinks(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            media = root / "media"
            media.mkdir()
            (media / "<unsafe>.svg").write_text("<svg/>", encoding="utf-8")
            outside = root.parent / (root.name + "-outside.png")
            outside.write_bytes(b"outside")
            link = media / "external.png"
            try:
                link.symlink_to(outside)
            except (OSError, NotImplementedError):
                link = None

            page = root / "review.html"
            MODULE.build_gallery(root, page)
            content = page.read_text(encoding="utf-8")
            self.assertIn("&lt;unsafe&gt;.svg", content)
            self.assertNotIn("<unsafe>.svg", content)
            if link is not None:
                self.assertNotIn("external.png", content)
            with self.assertRaises(ValueError):
                MODULE.build_gallery(root, root.parent / "outside.html")
            with self.assertRaises(ValueError):
                MODULE.build_review_manifest(root, root.parent / "outside.json")
            outside.unlink(missing_ok=True)

    def test_symlink_loops_directories_and_broken_links_are_skipped(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            media = root / "media"
            media.mkdir()
            (media / "real.png").write_bytes(b"real")
            outside = root / "outside"
            outside.mkdir()
            (outside / "outside.png").write_bytes(b"outside")
            links = [
                (media / "external-dir", outside, True),
                (media / "broken.png", root / "missing.png", False),
                (media / "loop.png", media / "loop.png", False),
            ]
            created = []
            for link, target, is_dir in links:
                try:
                    link.symlink_to(target, target_is_directory=is_dir)
                    created.append(link)
                except (OSError, NotImplementedError):
                    continue
            found = {path.relative_to(root).as_posix() for path, _kind in MODULE.media_files(root)}
            self.assertEqual(found, {"media/real.png"})
            self.assertFalse(any("outside.png" in path for path in found))

    def test_path_replaced_with_symlink_after_discovery_is_rejected(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            media = root / "media"
            media.mkdir()
            candidate = media / "asset.png"
            candidate.write_bytes(b"inside")
            outside = root.parent / (root.name + "-outside.png")
            outside.write_bytes(b"outside")

            def raced_candidates(_root):
                yield candidate, "image"
                candidate.unlink()
                candidate.symlink_to(outside)

            try:
                with patch.object(MODULE, "media_files", side_effect=raced_candidates):
                    with self.assertRaises((OSError, ValueError)):
                        MODULE.collect_assets(root)
            finally:
                candidate.unlink(missing_ok=True)
                outside.unlink(missing_ok=True)

    def test_invalid_review_status_is_rejected_without_overwriting_manifest(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            media = root / "media"
            media.mkdir()
            (media / "asset.png").write_bytes(b"asset")
            manifest_path = root / "review.json"
            manifest = MODULE.build_review_manifest(root, manifest_path)
            manifest["assets"][0]["visual_review"]["status"] = "AUTO_APPROVED"
            invalid = json.dumps(manifest, indent=2)
            manifest_path.write_text(invalid, encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "visual_review.status"):
                MODULE.build_review_manifest(root, manifest_path)
            self.assertEqual(manifest_path.read_text(encoding="utf-8"), invalid)

    def test_publication_approval_requires_verified_rights_evidence(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            media = root / "media"
            media.mkdir()
            (media / "asset.png").write_bytes(b"asset")
            manifest_path = root / "review.json"
            manifest = MODULE.build_review_manifest(root, manifest_path)
            manifest["assets"][0]["rights_review"]["publication_approved"] = True
            invalid = json.dumps(manifest, indent=2)
            manifest_path.write_text(invalid, encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "verified rights"):
                MODULE.build_review_manifest(root, manifest_path)
            self.assertEqual(manifest_path.read_text(encoding="utf-8"), invalid)

    def test_evidence_backed_rights_review_can_be_validated_without_auto_approval(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            media = root / "media"
            media.mkdir()
            (media / "asset.png").write_bytes(b"asset")
            manifest_path = root / "review.json"
            manifest = MODULE.build_review_manifest(root, manifest_path)
            rights = manifest["assets"][0]["rights_review"]
            rights.update({
                "status": "VERIFIED",
                "reviewer": "rights-reviewer",
                "reviewed_at": "2026-11-17T00:00:00Z",
                "creator": "Verified creator",
                "source_url": "https://example.invalid/source",
                "license": "CC-BY-4.0",
                "evidence": ["https://example.invalid/license"],
                "territories": ["worldwide"],
                "publication_approved": False,
            })
            MODULE.validate_review_manifest(manifest)
            self.assertFalse(rights["publication_approved"])

    def test_invalid_existing_manifest_is_not_overwritten(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / "media").mkdir()
            manifest = root / "review.json"
            manifest.write_text("{broken", encoding="utf-8")
            with self.assertRaises(ValueError):
                MODULE.build_review_manifest(root, manifest)
            self.assertEqual(manifest.read_text(encoding="utf-8"), "{broken")


if __name__ == "__main__":
    unittest.main()
