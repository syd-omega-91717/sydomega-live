#!/usr/bin/env python3
"""Extract representative local frames and technical metadata for repository videos.

This creates review material only. It does not determine copyright, authenticity,
publication permission, or production deployment state.
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import math
import os
import shutil
import subprocess
import tempfile
from datetime import datetime, timezone
from pathlib import Path


GALLERY_SCRIPT = Path(__file__).with_name("omega-media-review-gallery.py")
SPEC = importlib.util.spec_from_file_location("omega_media_review_gallery", GALLERY_SCRIPT)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError("could not load the canonical media inventory module")
GALLERY = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(GALLERY)


def sample_times(duration: float) -> list[float]:
    """Choose up to five unique, bounded timestamps across a video's duration."""
    if not math.isfinite(duration) or duration <= 0:
        raise ValueError("video duration must be a finite positive number")
    latest = max(0.0, duration - min(0.05, duration / 10))
    values = []
    for fraction in (0.05, 0.25, 0.50, 0.75, 0.95):
        timestamp = round(min(duration * fraction, latest), 6)
        if timestamp not in values:
            values.append(timestamp)
    return values


def _probe_video(path: Path, ffprobe: str) -> dict:
    command = [
        ffprobe, "-v", "error", "-protocol_whitelist", "file,pipe",
        "-show_entries",
        "format=duration,size,format_name:stream=codec_type,codec_name,width,height,duration,r_frame_rate",
        "-of", "json", str(path),
    ]
    result = subprocess.run(command, capture_output=True, text=True, check=True, timeout=30)
    payload = json.loads(result.stdout)
    streams = payload.get("streams", [])
    video = next((stream for stream in streams if stream.get("codec_type") == "video"), None)
    if not isinstance(video, dict):
        raise ValueError("no video stream found")
    format_data = payload.get("format") or {}
    raw_duration = format_data.get("duration") or video.get("duration")
    duration = float(raw_duration)
    if not math.isfinite(duration) or duration <= 0:
        raise ValueError("video duration is not finite and positive")
    return {
        "duration_seconds": round(duration, 3),
        "format_name": str(format_data.get("format_name") or "UNKNOWN"),
        "container_size_bytes": int(format_data.get("size") or path.stat().st_size),
        "video_codec": str(video.get("codec_name") or "UNKNOWN"),
        "width": int(video.get("width") or 0),
        "height": int(video.get("height") or 0),
        "frame_rate": str(video.get("r_frame_rate") or "UNKNOWN"),
    }


def _extract_frame(path: Path, destination: Path, timestamp: float, ffmpeg: str) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    descriptor, temporary_name = tempfile.mkstemp(prefix=".omega-frame-", suffix=".jpg", dir=destination.parent)
    os.close(descriptor)
    temporary = Path(temporary_name)
    try:
        command = [
            ffmpeg, "-nostdin", "-hide_banner", "-loglevel", "error", "-y",
            "-ss", f"{timestamp:.6f}", "-protocol_whitelist", "file,pipe",
            "-i", str(path), "-map", "0:v:0", "-frames:v", "1",
            "-vf", "scale=640:-2", "-an", "-sn", "-dn", "-f", "image2",
            str(temporary),
        ]
        subprocess.run(command, capture_output=True, text=True, check=True, timeout=90)
        if not temporary.is_file() or temporary.stat().st_size <= 0:
            raise ValueError("frame extractor produced no image")
        # os.replace replaces a destination symlink itself instead of following it.
        os.replace(temporary, destination)
    finally:
        temporary.unlink(missing_ok=True)


def build_video_samples(
    root: Path,
    output_dir: Path,
    *,
    assets: list[dict] | None = None,
    ffprobe: str | None = None,
    ffmpeg: str | None = None,
) -> dict:
    """Create a hash-bound frame/metadata manifest; failures remain explicit."""
    root = root.resolve()
    output_dir = output_dir.resolve()
    if output_dir == root or not output_dir.is_relative_to(root):
        raise ValueError("video sample output must be inside the repository root")

    ffprobe = ffprobe or shutil.which("ffprobe")
    ffmpeg = ffmpeg or shutil.which("ffmpeg")
    if not ffprobe or not ffmpeg:
        raise RuntimeError("ffprobe and ffmpeg are required; install FFmpeg and retry")

    if assets is None:
        assets = [item for item in GALLERY.collect_assets(root) if item["kind"] == "video"]

    records = []
    for asset in assets:
        if asset.get("kind") != "video":
            continue
        path = asset["_path"]
        relative = asset["path"]
        record = {
            "record_id": asset["record_id"],
            "path": relative,
            "sha256": asset["sha256"],
            "status": "UNAVAILABLE",
            "metadata": None,
            "frames": [],
            "error_code": None,
        }
        try:
            if not path.resolve(strict=True).is_relative_to(root) or path.is_symlink():
                raise ValueError("video path is not a safe in-repository regular file")
            metadata = _probe_video(path, ffprobe)
            frame_dir = output_dir / asset["record_id"][:20]
            frame_dir.mkdir(parents=True, exist_ok=True)
            if frame_dir.is_symlink() or not frame_dir.resolve(strict=True).is_relative_to(output_dir):
                raise ValueError("frame output directory is not safely contained")
            for index, timestamp in enumerate(sample_times(metadata["duration_seconds"]), start=1):
                micros = int(round(timestamp * 1_000_000))
                frame_path = frame_dir / f"frame-{index:02d}-{micros:09d}us.jpg"
                _extract_frame(path, frame_path, timestamp, ffmpeg)
                record["frames"].append({
                    "timestamp_seconds": timestamp,
                    "path": frame_path.relative_to(root).as_posix(),
                })
            record["metadata"] = metadata
            record["status"] = "SAMPLED"
        except (OSError, ValueError, TypeError, KeyError, json.JSONDecodeError, subprocess.SubprocessError) as error:
            record["error_code"] = type(error).__name__
        records.append(record)

    output_dir.mkdir(parents=True, exist_ok=True)
    manifest = {
        "schema_version": 1,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "purpose": "Local technical/video-frame review only; not rights clearance.",
        "policy": {
            "hash_proves_bytes_only": True,
            "sampled_frames_are_not_full_video_review": True,
            "errors_remain_unavailable": True,
            "network_access": False,
        },
        "summary": {
            "video_count": len(records),
            "sampled": sum(1 for item in records if item["status"] == "SAMPLED"),
            "unavailable": sum(1 for item in records if item["status"] != "SAMPLED"),
            "frames": sum(len(item["frames"]) for item in records),
        },
        "videos": records,
    }
    manifest_path = output_dir.parent / "video-samples.json"
    descriptor, temporary_name = tempfile.mkstemp(prefix=".omega-video-samples-", suffix=".json", dir=manifest_path.parent)
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8") as stream:
            stream.write(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
        # os.replace replaces a destination symlink itself instead of following it.
        os.replace(temporary_name, manifest_path)
    finally:
        Path(temporary_name).unlink(missing_ok=True)
    return manifest


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--output-dir", type=Path, default=Path("artifacts/media-visual-review/video-frames"))
    args = parser.parse_args()
    root = args.root.resolve()
    output = args.output_dir if args.output_dir.is_absolute() else root / args.output_dir
    try:
        manifest = build_video_samples(root, output)
    except (OSError, ValueError, RuntimeError) as error:
        parser.error(str(error))
    print(json.dumps(manifest["summary"], sort_keys=True))
    return 1 if manifest["summary"]["unavailable"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
