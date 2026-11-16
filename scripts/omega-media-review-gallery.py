#!/usr/bin/env python3
"""Generate a local media gallery and a durable, hash-bound review manifest.

The gallery is an inspection aid, not a rights decision or deployment claim.
The manifest preserves human-entered review fields only while both the
repository-relative path and exact SHA-256 remain unchanged.
"""
from __future__ import annotations

import argparse
import hashlib
import html
import json
import os
from pathlib import Path
from urllib.parse import quote

IMAGE_EXTENSIONS = {".avif", ".bmp", ".gif", ".jpeg", ".jpg", ".png", ".svg", ".tif", ".tiff", ".webp"}
VIDEO_EXTENSIONS = {".m4v", ".mkv", ".mov", ".mp4", ".ogv", ".webm"}
SKIP_DIRS = {".git", ".vercel", ".next", "node_modules", "__pycache__", ".pytest_cache"}


def digest(path: Path) -> str:
    hasher = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            hasher.update(chunk)
    return hasher.hexdigest()


def media_files(root: Path):
    """Yield in-repository media files; never follow file symlinks."""
    root = root.resolve()
    for path in root.rglob("*"):
        relative = path.relative_to(root)
        if any(part in SKIP_DIRS for part in relative.parts) or path.is_symlink():
            continue
        if not path.is_file():
            continue
        # Defence in depth against path escapes and filesystem races.
        try:
            if not path.resolve(strict=True).is_relative_to(root):
                continue
        except OSError:
            continue
        suffix = path.suffix.lower()
        if suffix in IMAGE_EXTENSIONS or suffix in VIDEO_EXTENSIONS:
            yield path, "image" if suffix in IMAGE_EXTENSIONS else "video"


def collect_assets(root: Path) -> list[dict]:
    root = root.resolve()
    assets = []
    for path, kind in sorted(media_files(root), key=lambda item: item[0].as_posix().casefold()):
        relative_path = path.relative_to(root).as_posix()
        sha256 = digest(path)
        record_id = hashlib.sha256(f"{relative_path}\0{sha256}".encode("utf-8")).hexdigest()
        assets.append({
            "record_id": record_id,
            "path": relative_path,
            "kind": kind,
            "size_bytes": path.stat().st_size,
            "sha256": sha256,
            "_path": path,
        })
    return assets


def _review_defaults() -> dict:
    return {
        "visual_review": {
            "status": "PENDING",
            "reviewer": None,
            "reviewed_at": None,
            "findings": [],
        },
        "rights_review": {
            "status": "UNVERIFIED",
            "creator": None,
            "source_url": None,
            "license": None,
            "evidence": [],
            "attribution": None,
            "territories": [],
            "expires_at": None,
            "publication_approved": False,
        },
    }


def build_review_manifest(root: Path, output: Path, assets: list[dict] | None = None) -> dict:
    """Write a deterministic inventory while preserving matching human reviews."""
    root = root.resolve()
    output = output.resolve()
    if not output.is_relative_to(root):
        raise ValueError("manifest output must be inside the repository root")

    if output.exists():
        try:
            previous = json.loads(output.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as error:
            raise ValueError(f"existing review manifest cannot be read safely: {error}") from error
        if not isinstance(previous, dict) or not isinstance(previous.get("assets"), list):
            raise ValueError("existing review manifest has an invalid schema; refusing to overwrite it")
    else:
        previous = {}

    previous_by_id = {
        item.get("record_id"): item
        for item in previous.get("assets", [])
        if isinstance(item, dict) and isinstance(item.get("record_id"), str)
    }
    assets = collect_assets(root) if assets is None else assets
    records = []
    for asset in assets:
        record = {key: value for key, value in asset.items() if key != "_path"}
        record.update(_review_defaults())
        prior = previous_by_id.get(asset["record_id"])
        if prior and prior.get("path") == asset["path"] and prior.get("sha256") == asset["sha256"]:
            for section in ("visual_review", "rights_review"):
                old_section = prior.get(section)
                if isinstance(old_section, dict):
                    record[section].update(old_section)
        records.append(record)

    manifest = {
        "schema_version": 1,
        "purpose": "Hash-bound human review inventory; not a rights certification.",
        "policy": {
            "new_or_changed_bytes_reset_review": True,
            "hash_proves_bytes_not_ownership": True,
            "unverified_is_not_approved": True,
            "generated_by": "scripts/omega-media-review-gallery.py",
        },
        "assets": records,
        "summary": {
            "asset_count": len(records),
            "image_count": sum(1 for item in records if item["kind"] == "image"),
            "video_count": sum(1 for item in records if item["kind"] == "video"),
            "visual_review_pending": sum(1 for item in records if item["visual_review"]["status"] == "PENDING"),
            "rights_unverified": sum(1 for item in records if item["rights_review"]["status"] == "UNVERIFIED"),
        },
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return manifest


def build_gallery(root: Path, output: Path, manifest_output: Path | None = None) -> dict:
    root = root.resolve()
    output = output.resolve()
    if not output.is_relative_to(root):
        raise ValueError("gallery output must be inside the repository root so previews remain local and relative")

    assets = collect_assets(root)
    entries = []
    for asset in assets:
        path = asset["_path"]
        rel = asset["path"]
        kind = asset["kind"]
        href = quote(Path(os.path.relpath(path, output.parent)).as_posix(), safe="/")
        name = html.escape(rel)
        media = (
            f'<img loading="lazy" decoding="async" src="{href}" alt="Preview of {name}">'
            if kind == "image" else
            f'<video controls preload="none" playsinline src="{href}">Video preview unavailable</video>'
        )
        entries.append(
            f'<article class="asset" data-kind="{kind}">'
            f'<div class="preview">{media}</div>'
            f'<div class="meta"><strong>{name}</strong>'
            f'<span>{kind.upper()} · {asset["size_bytes"]:,} bytes</span>'
            f'<code>SHA-256 {asset["sha256"]}</code>'
            f'<label><input type="checkbox"> Visually reviewed (temporary)</label>'
            f'<label>Notes <input class="notes" type="text" placeholder="Record observations"></label>'
            f'<p class="warning">Rights, ownership and publication remain UNVERIFIED.</p>'
            f'</div></article>'
        )

    counts = {
        "asset_count": len(assets),
        "image_count": sum(1 for item in assets if item["kind"] == "image"),
        "video_count": sum(1 for item in assets if item["kind"] == "video"),
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    document = """<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>SYD OMEGA — Media Visual Review</title>
<style>
:root{color-scheme:dark;background:#020206;color:#e8e4d8;font:15px/1.5 system-ui,sans-serif}
body{margin:0;padding:24px;max-width:1600px;margin-inline:auto}
h1{color:#e8c97a} .summary{position:sticky;top:0;background:#0a0a0f;padding:12px;border:1px solid #51472b;z-index:2}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;margin-top:20px}
.asset{min-width:0;background:#0a0a0f;border:1px solid #29252a;border-radius:10px;overflow:hidden}
.preview{height:220px;background:#000;display:grid;place-items:center}
.preview img,.preview video{width:100%;height:100%;object-fit:contain}
.meta{padding:12px;display:grid;gap:7px;overflow-wrap:anywhere}
.meta span,.meta code{color:#aaa;font-size:12px}.warning{color:#e8c97a;font-size:12px;margin:0}
label{font-size:13px}.notes{width:100%;box-sizing:border-box;background:#020206;color:#fff;border:1px solid #555;padding:7px}
</style></head><body>
<h1>Ω SYD OMEGA 91717 — Media Visual Review</h1>
<div class="summary"><strong>LOCAL REVIEW ONLY</strong> — browser checkboxes and notes are temporary; use the JSON manifest for durable review records.
<div id="count"></div><p>All assets remain rights/ownership UNVERIFIED until evidence-backed human review.</p></div>
<div class="grid">""" + "".join(entries) + """</div>
<script>const cards=[...document.querySelectorAll('.asset')];document.querySelector('#count').textContent=cards.length+' assets · '+cards.filter(x=>x.dataset.kind==='image').length+' images · '+cards.filter(x=>x.dataset.kind==='video').length+' videos';</script>
</body></html>
"""
    output.write_text(document, encoding="utf-8")
    if manifest_output is not None:
        build_review_manifest(root, manifest_output, assets)
    return counts


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--output", type=Path, default=Path("artifacts/media-visual-review/index.html"))
    parser.add_argument("--manifest", type=Path, default=Path("artifacts/media-visual-review/review-manifest.json"))
    args = parser.parse_args()
    root = args.root.resolve()
    output = args.output if args.output.is_absolute() else root / args.output
    manifest = args.manifest if args.manifest.is_absolute() else root / args.manifest
    try:
        print(build_gallery(root, output, manifest))
    except (OSError, ValueError) as error:
        parser.error(str(error))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
