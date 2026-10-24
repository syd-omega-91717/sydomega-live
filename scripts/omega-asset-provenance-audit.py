#!/usr/bin/env python3
"""Inventory repository media assets with reproducible hashes and explicit trust states.

This is a local-source audit, not a copyright oracle, storage uploader, or live
deployment check. Rights and ownership remain UNVERIFIED unless separately
documented by authoritative evidence.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import mimetypes
import re
import sys
from pathlib import Path
from urllib.parse import urlparse

ASSET_TYPES = {
    ".avif": "image", ".gif": "image", ".jpeg": "image", ".jpg": "image",
    ".png": "image", ".svg": "image", ".webp": "image", ".bmp": "image",
    ".tif": "image", ".tiff": "image",
    ".mp4": "video", ".m4v": "video", ".mov": "video", ".webm": "video",
    ".mkv": "video", ".ogv": "video",
    ".mp3": "audio", ".m4a": "audio", ".ogg": "audio", ".wav": "audio",
    ".flac": "audio", ".aac": "audio",
    ".glb": "3d_model", ".gltf": "3d_model", ".obj": "3d_model",
    ".fbx": "3d_model", ".stl": "3d_model", ".usdz": "3d_model",
    ".dae": "3d_model", ".blend": "3d_project", ".mtl": "3d_material",
    ".hdr": "environment_map", ".exr": "environment_map",
    ".ktx2": "texture", ".basis": "texture",
}
SKIP_DIRS = {".git", ".vercel", ".next", "node_modules", "__pycache__", ".pytest_cache"}
REFERENCE_SUFFIXES = {".html", ".htm", ".css", ".js", ".mjs", ".json", ".md", ".xml"}
URL_RE = re.compile(r"https?://[^\s\"'<>\\)]+", re.IGNORECASE)


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def repository_files(root: Path):
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        try:
            rel = path.relative_to(root)
        except ValueError:
            continue
        if any(part in SKIP_DIRS for part in rel.parts):
            continue
        yield path, rel.as_posix()


def inventory(root: Path) -> dict:
    files = list(repository_files(root))
    source_files = [(path, rel) for path, rel in files if path.suffix.lower() in REFERENCE_SUFFIXES]
    source_text = []
    remote_urls = set()
    for path, rel in source_files:
        try:
            text = path.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        source_text.append((rel, text))
        remote_urls.update(URL_RE.findall(text))

    assets = []
    for path, rel in files:
        suffix = path.suffix.lower()
        if suffix not in ASSET_TYPES:
            continue
        try:
            digest = sha256_file(path)
            size = path.stat().st_size
        except OSError as error:
            print(f"warning: cannot inspect {rel}: {error}", file=sys.stderr)
            continue
        refs = [source for source, text in source_text if rel in text or path.name in text]
        assets.append({
            "asset_id": "omega-asset-" + digest[:16],
            "path": rel,
            "asset_type": ASSET_TYPES[suffix],
            "extension": suffix,
            "mime_type": mimetypes.guess_type(path.name)[0] or "application/octet-stream",
            "size_bytes": size,
            "sha256": digest,
            "reference_count": len(refs),
            "referenced_by": refs[:100],
            "reference_list_truncated": len(refs) > 100,
            "source_state": "REPOSITORY_PRESENT",
            "rights_state": "UNVERIFIED",
            "ownership_state": "UNVERIFIED",
            "publication_state": "UNVERIFIED",
            "truth_rule": "FILE_HASH_PROVES_BYTES_ONLY",
        })
    assets.sort(key=lambda row: row["path"].casefold())
    remote = []
    seen = set()
    for raw in sorted(remote_urls):
        clean = raw.rstrip(".,;:")
        if clean in seen:
            continue
        seen.add(clean)
        parsed = urlparse(clean)
        remote.append({
            "url": clean,
            "host": parsed.hostname or "",
            "source_state": "REMOTE_REFERENCE_ONLY",
            "availability_state": "UNVERIFIED",
            "rights_state": "UNVERIFIED",
            "truth_rule": "URL_REFERENCE_DOES_NOT_PROVE_REACHABILITY_OR_LICENSE",
        })
    return {
        "schema_version": 1,
        "generator": "scripts/omega-asset-provenance-audit.py",
        "root": str(root.resolve()),
        "summary": {
            "local_asset_count": len(assets),
            "image_count": sum(a["asset_type"] == "image" for a in assets),
            "video_count": sum(a["asset_type"] == "video" for a in assets),
            "audio_count": sum(a["asset_type"] == "audio" for a in assets),
            "3d_asset_count": sum(a["asset_type"].startswith("3d_") for a in assets),
            "environment_map_count": sum(a["asset_type"] == "environment_map" for a in assets),
            "texture_count": sum(a["asset_type"] == "texture" for a in assets),
            "unreferenced_asset_count": sum(a["reference_count"] == 0 for a in assets),
            "remote_url_reference_count": len(remote),
            "rights_unverified_count": sum(a["rights_state"] == "UNVERIFIED" for a in assets),
        },
        "assets": assets,
        "remote_references": remote,
        "limitations": [
            "A repository file is not proof that it is deployed, loaded, or visible to users.",
            "A hash identifies bytes; it does not prove authorship, ownership, license, or authenticity.",
            "Remote URL references are not fetched; availability, content, safety, and rights remain unverified.",
            "Supabase Storage objects and database-only media rows are outside this repository scan.",
            "The report does not upload files, change permissions, or alter production state.",
        ],
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1],
                        help="repository root to scan (defaults to this checkout)")
    parser.add_argument("--output", type=Path, help="write the report to this path instead of stdout")
    args = parser.parse_args()
    root = args.root.resolve()
    if not root.is_dir():
        parser.error(f"root is not a directory: {root}")
    report = inventory(root)
    payload = json.dumps(report, indent=2, ensure_ascii=False) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(payload, encoding="utf-8")
    else:
        sys.stdout.write(payload)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
