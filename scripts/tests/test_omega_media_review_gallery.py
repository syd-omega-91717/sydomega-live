#!/usr/bin/env python3
"""Tests for the local media visual-review gallery."""
from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

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
            counts = MODULE.build_gallery(root, output)
            page = output.read_text(encoding="utf-8")
            self.assertEqual(counts, {"asset_count": 2, "image_count": 1, "video_count": 1})
            self.assertIn("<img loading=\"lazy\"", page)
            self.assertIn("<video controls", page)
            self.assertIn("SHA-256", page)
            self.assertIn("UNVERIFIED", page)
            self.assertIn("../../media/cover.webp", page)
            self.assertIn("../../media/trailer.mp4", page)

    def test_escapes_asset_names_and_rejects_output_outside_root(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / "media").mkdir()
            (root / "media" / '<unsafe>.svg').write_text("<svg/>", encoding="utf-8")
            page = root / "review.html"
            MODULE.build_gallery(root, page)
            content = page.read_text(encoding="utf-8")
            self.assertIn("&lt;unsafe&gt;.svg", content)
            self.assertNotIn("<unsafe>.svg", content)
            with self.assertRaises(ValueError):
                MODULE.build_gallery(root, root.parent / "outside.html")


if __name__ == "__main__":
    unittest.main()
