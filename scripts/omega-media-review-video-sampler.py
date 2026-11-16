#!/usr/bin/env python3
"""Extract representative local frames and technical metadata for repository videos.

This creates review material only. It does not determine copyright, authenticity,
publication permission, or production deployment state.
"""
from __future__ import annotations

import argparse
import html
import importlib.util
import json
import math
import os
import shutil
import subprocess
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote


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


def render_video_review_html(root: Path, page_dir: Path, manifest: dict) -> str:
    """Render a local-only frame contact sheet with clear non-approval states."""
    cards = []
    for video in manifest["videos"]:
        source_path = root / video["path"]
        source_relative = Path(__import__("os").path.relpath(source_path, page_dir)).as_posix()
        source_url = quote(source_relative, safe="/._-")
        metadata = video.get("metadata") or {}
        details = [
            ("Duration", f'{metadata.get("duration_seconds", "—")} s' if metadata else "Unavailable"),
            ("Container", metadata.get("format_name", "Unavailable")),
            ("Codec", metadata.get("video_codec", "Unavailable")),
            ("Dimensions", f'{metadata.get("width", "—")} × {metadata.get("height", "—")}' if metadata else "Unavailable"),
            ("Frame rate", metadata.get("frame_rate", "Unavailable")),
            ("SHA-256", video["sha256"]),
        ]
        detail_html = "".join(
            f"<dt>{html.escape(label)}</dt><dd>{html.escape(str(value))}</dd>"
            for label, value in details
        )
        frames = []
        for frame in video["frames"]:
            frame_relative = (root / frame["path"]).relative_to(page_dir).as_posix()
            frame_url = quote(frame_relative, safe="/._-")
            frames.append(
                f'<figure><img loading="lazy" src="{html.escape(frame_url, quote=True)}" '
                f'alt="Representative frame at {frame["timestamp_seconds"]:.6f} seconds">'
                f'<figcaption>{frame["timestamp_seconds"]:.3f}s</figcaption></figure>'
            )
        frame_html = "".join(frames) or '<p class="empty">No representative frames available.</p>'
        error_html = (
            f'<p class="error">Sampling unavailable: {html.escape(str(video["error_code"]))}</p>'
            if video["error_code"] else ""
        )
        cards.append(
            '<article class="video-card">'
            f'<header><h2>{html.escape(video["path"])}</h2>'
            f'<span class="status">{html.escape(video["sampling_status"])}</span></header>'
            f'<video controls preload="metadata"><source src="{html.escape(source_url, quote=True)}"></video>'
            f'<dl>{detail_html}</dl>'
            f'<p class="trust">Visual review: {html.escape(video["visual_review_status"])} · Rights: {html.escape(video["rights_review_status"])}</p>'
            f'{error_html}<div class="frames">{frame_html}</div>'
            f'<p class="hash">Record: {html.escape(video["record_id"])}</p>'
            '</article>'
        )
    summary = manifest["summary"]
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self'; media-src 'self'; style-src 'unsafe-inline'">
<title>Local video technical review</title>
<style>
:root{{color-scheme:dark;background:#08080c;color:#eee;font:15px/1.5 system-ui,sans-serif}}
body{{margin:0;padding:24px;max-width:1500px;margin-inline:auto}}
h1{{color:#d8b75b}} .summary{{color:#bbb}} .video-card{{border:1px solid #39343a;border-radius:12px;padding:18px;margin:22px 0;background:#111116}}
header{{display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap}}
h2{{font-size:1.05rem;overflow-wrap:anywhere}} .status{{padding:4px 9px;border:1px solid #8c7440;border-radius:20px;color:#e7cb81}}
video{{width:100%;max-height:420px;background:#000;margin:10px 0}}
dl{{display:grid;grid-template-columns:150px 1fr;gap:4px 12px}} dt{{color:#aaa}} dd{{margin:0;overflow-wrap:anywhere}}
.frames{{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-top:16px}}
figure{{margin:0;background:#08080c;border:1px solid #34343a;border-radius:8px;overflow:hidden}}
img{{display:block;width:100%;aspect-ratio:16/9;object-fit:contain;background:#000}}
figcaption{{padding:6px 9px;color:#ccc}} .trust{{color:#e5c978;font-weight:600}}
.hash{{font:11px ui-monospace,monospace;color:#777;overflow-wrap:anywhere}}
.error{{color:#ff9b9b}} .empty{{color:#aaa}}
</style>
</head>
<body>
<h1>Local video technical review</h1>
<p class="summary">{summary["video_count"]} videos · {summary["sampled"]} sampled · {summary["unavailable"]} unavailable · {summary["frames"]} frames</p>
<p>Technical sampling only. Sampling is not human visual review, authenticity verification, copyright clearance, or publication approval. Every item remains Visual PENDING / Rights UNVERIFIED until a separate evidence-backed review is recorded.</p>
{"".join(cards)}
</body>
</html>
"""


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

    review_manifest_path = output_dir.parent / "review-manifest.json"
    review_by_id = {}
    if review_manifest_path.exists():
        try:
            review_manifest = json.loads(review_manifest_path.read_text(encoding="utf-8"))
            GALLERY.validate_review_manifest(review_manifest)
        except (OSError, json.JSONDecodeError, ValueError) as error:
            raise ValueError(f"canonical review manifest is invalid; refusing to infer review state: {type(error).__name__}") from error
        review_by_id = {item["record_id"]: item for item in review_manifest["assets"]}

    if assets is None:
        assets = [item for item in GALLERY.collect_assets(root) if item["kind"] == "video"]

    records = []
    for asset in assets:
        if asset.get("kind") != "video":
            continue
        path = asset["_path"]
        relative = asset["path"]
        review = review_by_id.get(asset["record_id"], {})
        record = {
            "record_id": asset["record_id"],
            "path": relative,
            "sha256": asset["sha256"],
            "sampling_status": "UNAVAILABLE",
            "visual_review_status": review.get("visual_review", {}).get("status", "PENDING"),
            "rights_review_status": review.get("rights_review", {}).get("status", "UNVERIFIED"),
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
            record["sampling_status"] = "SAMPLED"
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
            "sampled": sum(1 for item in records if item["sampling_status"] == "SAMPLED"),
            "unavailable": sum(1 for item in records if item["sampling_status"] != "SAMPLED"),
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

    html_path = output_dir.parent / "video-samples.html"
    html_descriptor, html_temporary_name = tempfile.mkstemp(prefix=".omega-video-review-", suffix=".html", dir=html_path.parent)
    try:
        with os.fdopen(html_descriptor, "w", encoding="utf-8") as stream:
            stream.write(render_video_review_html(root, html_path.parent, manifest))
        os.replace(html_temporary_name, html_path)
    finally:
        Path(html_temporary_name).unlink(missing_ok=True)
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
