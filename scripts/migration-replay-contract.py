#!/usr/bin/env python3
"""Validate the local Supabase migration chain and its release-truth inventory.

Fresh-database replay validates source migrations, including explicitly pending
migrations. The remote snapshot remains the sole record of live-applied versions;
pending entries are never counted as provider-applied. Production parity is
enforced separately by scripts/migration-drift.py.
"""
from __future__ import annotations

import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MIGRATIONS = ROOT / "supabase" / "migrations"
REMOTE = ROOT / "supabase" / "remote-migrations.json"
PENDING = ROOT / "supabase" / "pending-migrations.json"
VERSION_RE = re.compile(r"^(?P<version>\d+)_.+[.]sql$")


def inspect_inventory(migrations_dir: Path) -> tuple[list[str], list[str]]:
    """Return ordered local migration versions and filename/duplicate errors."""
    if not migrations_dir.is_dir():
        return [], ["supabase/migrations is missing"]

    files = sorted(path.name for path in migrations_dir.glob("*.sql"))
    if not files:
        return [], ["no SQL migration files found"]

    versions: list[str] = []
    invalid: list[str] = []
    for name in files:
        match = VERSION_RE.fullmatch(name)
        if match is None:
            invalid.append(name)
            continue
        versions.append(match.group("version"))

    errors: list[str] = []
    if invalid:
        errors.append(f"migration filenames without a numeric version prefix: {invalid}")
    duplicates = sorted(version for version, count in Counter(versions).items() if count > 1)
    if duplicates:
        errors.append(f"duplicate migration versions: {duplicates}")
    if errors:
        return versions, errors
    return versions, []


def inspect_release_inventory(
    migrations_dir: Path,
    versions: list[str],
    remote_path: Path = REMOTE,
    pending_path: Path = PENDING,
) -> tuple[str | None, list[str]]:
    """Verify local source equals live-applied versions plus explicit pending entries."""
    errors: list[str] = []
    try:
        if not remote_path.is_file():
            return None, ["supabase/remote-migrations.json is missing"]
        manifest = json.loads(remote_path.read_text(encoding="utf-8"))
        if not isinstance(manifest, dict):
            return None, ["remote migration manifest must be a JSON object"]
        remote_versions_raw = manifest.get("versions")
        if not isinstance(remote_versions_raw, list) or not remote_versions_raw:
            return None, ["remote migration manifest has no versions"]
        remote_versions = [str(version) for version in remote_versions_raw]
        if len(remote_versions) != len(set(remote_versions)):
            errors.append("remote migration manifest contains duplicate versions")
        if manifest.get("remoteMigrationCount") != len(remote_versions):
            errors.append("manifest count does not equal manifest version list")
        if manifest.get("latestRemoteMigration") != remote_versions[-1]:
            errors.append("manifest latestRemoteMigration is not the final live version")

        if pending_path.is_file():
            pending_doc = json.loads(pending_path.read_text(encoding="utf-8"))
        else:
            pending_doc = {"pending": []}
        if not isinstance(pending_doc, dict):
            return None, ["pending migration manifest must be a JSON object"]
        pending_entries = pending_doc.get("pending", [])
        if not isinstance(pending_entries, list):
            return None, ["pending migration manifest 'pending' must be a list"]

        local_files: dict[str, str] = {}
        for path in migrations_dir.glob("*.sql"):
            match = VERSION_RE.fullmatch(path.name)
            if match:
                local_files[match.group("version")] = path.name

        pending_versions: list[str] = []
        for entry in pending_entries:
            if not isinstance(entry, dict):
                errors.append("pending migration entries must be JSON objects")
                continue
            version = str(entry.get("version", ""))
            filename = str(entry.get("file", ""))
            match = VERSION_RE.fullmatch(filename)
            if not version or match is None or match.group("version") != version:
                errors.append(f"invalid pending migration identity: version={version!r} file={filename!r}")
                continue
            if local_files.get(version) != filename:
                errors.append(f"pending migration {version} does not match a local migration file")
            if entry.get("status") != "PENDING_REVIEW" or entry.get("liveStatus") != "NOT_APPLIED":
                errors.append(f"{version} must remain explicitly PENDING_REVIEW / NOT_APPLIED")
            if entry.get("blocksProduction") is not True:
                errors.append(f"{version} must explicitly block production")
            pending_versions.append(version)

        duplicates = sorted(version for version, count in Counter(pending_versions).items() if count > 1)
        if duplicates:
            errors.append(f"duplicate pending migration versions: {duplicates}")

        remote_set = set(remote_versions)
        pending_set = set(pending_versions)
        overlap = sorted(remote_set & pending_set)
        if overlap:
            errors.append(f"versions cannot be both live-applied and pending: {overlap}")

        local_set = set(versions)
        expected_source = remote_set | pending_set
        missing = sorted(expected_source - local_set)
        extra = sorted(local_set - expected_source)
        if missing or extra:
            errors.append(
                "source/remote+pending inventory mismatch; "
                f"missing={missing[:20]} extra={extra[:20]} "
                f"source_count={len(local_set)} remote_count={len(remote_set)} "
                f"pending_count={len(pending_set)}"
            )
    except (OSError, json.JSONDecodeError, TypeError, ValueError) as exc:
        return None, [f"invalid migration truth inventory: {exc}"]

    if errors:
        return None, errors

    pending_label = ",".join(sorted(pending_set)) if pending_set else "none"
    summary = (
        f"MIGRATION_REPLAY_CONTRACT=PASS source_count={len(versions)} "
        f"remote_count={len(remote_versions)} pending_count={len(pending_set)} "
        f"latest_remote={remote_versions[-1]} pending={pending_label} "
        "(pending versions are not asserted applied)"
    )
    return summary, []


def main() -> int:
    if any(arg in {"-h", "--help"} for arg in sys.argv[1:]):
        print(__doc__ or "")
        return 0
    if len(sys.argv) > 1:
        print("Usage: migration-replay-contract.py [--help]")
        return 2

    versions, errors = inspect_inventory(MIGRATIONS)
    if errors:
        for error in errors:
            print(f"MIGRATION_REPLAY_CONTRACT=FAILED: {error}")
        return 1

    summary, release_errors = inspect_release_inventory(MIGRATIONS, versions)
    if release_errors:
        for error in release_errors:
            print(f"MIGRATION_REPLAY_CONTRACT=FAILED: {error}")
        return 1

    print(summary)
    print(
        "MIGRATION_REPLAY_CONTRACT=PASS "
        f"local_count={len(versions)} latest={versions[-1]} "
        "(fresh replay inventory validated; production application is separate)"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
