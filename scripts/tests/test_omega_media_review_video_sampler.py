#!/usr/bin/env python3
"""Tests for local video metadata and representative-frame sampling."""
from __future__ import annotations

import importlib.util
import json
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

SCRIPT = Path(__file__).resolve().parents[1] / "omega-media-review-video-sampler.py"
SPEC = importlib.util.spec_from_file_location("omega_media_review_video_sampler", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class MediaVideoSamplerTests(unittest.TestCase):
    def _asset(self, root: Path) -> dict:
        path = root / "media" / "clip.mp4"
        path.parent.mkdir(parents=True)
        path.write_bytes(b"video-bytes")
        return {
            "record_id": "a" * 64,
            "path": "media/clip.mp4",
            "sha256": "b" * 64,
            "kind": "video",
            "_path": path,
        }

    def test_extracts_five_hash_bound_frames_and_metadata(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            asset = self._asset(root)

            def fake_run(command, **kwargs):
                if command[0] == "ffprobe":
                    payload = {
                        "format": {"duration": "10.0", "size": "11", "format_name": "mov,mp4"},
                        "streams": [{
                            "codec_type": "video", "codec_name": "h264",
                            "width": 1920, "height": 1080, "r_frame_rate": "30/1",
                        }],
                    }
                    return subprocess.CompletedProcess(command, 0, json.dumps(payload), "")
                output = Path(command[-1])
                output.parent.mkdir(parents=True, exist_ok=True)
                output.write_bytes(b"jpeg-frame")
                return subprocess.CompletedProcess(command, 0, "", "")

            with patch.object(MODULE.shutil, "which", side_effect=lambda name: name):
                with patch.object(MODULE.subprocess, "run", side_effect=fake_run):
                    manifest = MODULE.build_video_samples(
                        root, root / "artifacts" / "video-frames", assets=[asset]
                    )

            self.assertEqual(manifest["summary"], {
                "video_count": 1, "sampled": 1, "unavailable": 0, "frames": 5,
            })
            video = manifest["videos"][0]
            self.assertEqual(video["sampling_status"], "SAMPLED")
            self.assertEqual(video["metadata"]["video_codec"], "h264")
            self.assertEqual(video["visual_review_status"], "PENDING")
            self.assertEqual(video["rights_review_status"], "UNVERIFIED")
            self.assertEqual(len(video["frames"]), 5)
            self.assertTrue(all((root / frame["path"]).is_file() for frame in video["frames"]))
            review_dir = root / "artifacts"
            self.assertTrue((review_dir / "video-samples.json").is_file())
            review_html = (review_dir / "video-samples.html").read_text(encoding="utf-8")
            self.assertIn("Visual review: PENDING", review_html)
            self.assertIn("Rights: UNVERIFIED", review_html)
            self.assertIn("Local video technical review", review_html)
            self.assertNotIn(str(root), json.dumps(manifest))
            self.assertNotIn(str(root), review_html)

    def test_probe_failure_is_recorded_as_unavailable_not_silently_omitted(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            asset = self._asset(root)
            failed = subprocess.CompletedProcess(["ffprobe"], 0, "not-json", "")
            with patch.object(MODULE.shutil, "which", side_effect=lambda name: name):
                with patch.object(MODULE.subprocess, "run", return_value=failed):
                    manifest = MODULE.build_video_samples(
                        root, root / "artifacts" / "video-frames", assets=[asset]
                    )
            self.assertEqual(manifest["summary"]["unavailable"], 1)
            self.assertEqual(manifest["videos"][0]["sampling_status"], "UNAVAILABLE")
            self.assertEqual(manifest["videos"][0]["error_code"], "JSONDecodeError")
            self.assertEqual(manifest["videos"][0]["frames"], [])

    def test_missing_ffmpeg_tools_fail_closed(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            with patch.object(MODULE.shutil, "which", return_value=None):
                with self.assertRaisesRegex(RuntimeError, "ffprobe and ffmpeg are required"):
                    MODULE.build_video_samples(root, root / "artifacts" / "video-frames", assets=[])

    def test_output_must_remain_inside_repository(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            with patch.object(MODULE.shutil, "which", side_effect=lambda name: name):
                with self.assertRaisesRegex(ValueError, "inside the repository root"):
                    MODULE.build_video_samples(root, root.parent / "outside", assets=[])

    def test_short_video_uses_unique_bounded_timestamps(self):
        values = MODULE.sample_times(0.02)
        self.assertEqual(len(values), 5)
        self.assertEqual(len(values), len(set(values)))
        self.assertTrue(all(0 <= value < 0.02 for value in values))


if __name__ == "__main__":
    unittest.main()
