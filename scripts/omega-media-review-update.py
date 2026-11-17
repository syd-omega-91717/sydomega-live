#!/usr/bin/env python3
"""Apply a validated, hash-bound human review patch to one media asset.

This command never discovers or approves rights automatically. The patch must
identify one current asset by record_id; its path and SHA-256 are rechecked
against the repository before any review fields are changed.
"""
from __future__ import annotations

import argparse
import json
import os
import tempfile
from pathlib import Path

from omega_media_review_gallery import collect_assets, validate_review_manifest


ALLOWED_SECTIONS = {"visual_review", "rights_review"}


def apply_review_patch(root: Path, manifest_path: Path, record_id: str, patch: dict) -> dict:
    root = root.resolve()
    if manifest_path.is_symlink():
        raise ValueError("review manifest must not be a symbolic link")
    manifest_path = manifest_path.resolve()
    if not manifest_path.is_relative_to(root):
        raise ValueError("review manifest must be inside the repository root")
    if not manifest_path.is_file():
        raise ValueError("review manifest must be a regular, non-symlink file")
    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise ValueError(f"review manifest cannot be read safely: {error}") from error
    validate_review_manifest(manifest)

    if not isinstance(patch, dict) or not patch or set(patch) - ALLOWED_SECTIONS:
        raise ValueError("patch must contain visual_review and/or rights_review only")
    for section, changes in patch.items():
        if not isinstance(changes, dict) or not changes:
            raise ValueError(f"{section} patch must be a non-empty object")

    matches = [item for item in manifest["assets"] if item["record_id"] == record_id]
    if len(matches) != 1:
        raise ValueError("record_id must match exactly one manifest asset")
    asset = matches[0]

    current = {item["path"]: item for item in collect_assets(root)}
    observed = current.get(asset["path"])
    if observed is None or observed["sha256"] != asset["sha256"] or observed["record_id"] != record_id:
        raise ValueError("asset bytes or path changed since the manifest was generated; regenerate and review again")

    for section, changes in patch.items():
        allowed = set(asset[section])
        unknown = set(changes) - allowed
        if unknown:
            raise ValueError(f"{section} contains unsupported fields: {', '.join(sorted(unknown))}")
        asset[section].update(changes)

    validate_review_manifest(manifest)
    manifest["summary"] = {
        "asset_count": len(manifest["assets"]),
        "image_count": sum(1 for item in manifest["assets"] if item["kind"] == "image"),
        "video_count": sum(1 for item in manifest["assets"] if item["kind"] == "video"),
        "visual_review_pending": sum(1 for item in manifest["assets"] if item["visual_review"]["status"] == "PENDING"),
        "rights_unverified": sum(1 for item in manifest["assets"] if item["rights_review"]["status"] == "UNVERIFIED"),
    }

    fd, temporary = tempfile.mkstemp(prefix=f".{manifest_path.name}.", suffix=".tmp", dir=manifest_path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as stream:
            json.dump(manifest, stream, ensure_ascii=False, indent=2)
            stream.write("\n")
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, manifest_path)
    except Exception:
        try:
            os.unlink(temporary)
        except OSError:
            pass
        raise
    return manifest


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--manifest", type=Path, default=Path("artifacts/media-visual-review/review-manifest.json"))
    parser.add_argument("--record-id", required=True)
    parser.add_argument("--patch", type=Path, required=True, help="JSON file containing one validated review section patch")
    args = parser.parse_args()
    root = args.root.resolve()
    manifest_path = args.manifest if args.manifest.is_absolute() else root / args.manifest
    try:
        patch = json.loads(args.patch.read_text(encoding="utf-8"))
        result = apply_review_patch(root, manifest_path, args.record_id, patch)
    except (OSError, json.JSONDecodeError, ValueError) as error:
        parser.error(str(error))
    print(json.dumps(result["summary"], ensure_ascii=False, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
