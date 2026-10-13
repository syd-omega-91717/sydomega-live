#!/usr/bin/env python3
"""Fail-closed inventory contract for the complete Supabase migration chain."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MIGRATIONS = ROOT / "supabase" / "migrations"
REMOTE = ROOT / "supabase" / "remote-migrations.json"
PENDING = ROOT / "supabase" / "pending-migrations.json"
VERSION_RE = re.compile(r"^(?P<version>[^_]+)_.+[.]sql$")

def fail(message: str) -> int:
    print(f"MIGRATION_REPLAY_CONTRACT=FAILED: {message}")
    return 1

def main() -> int:
    if any(arg in {"-h", "--help"} for arg in sys.argv[1:]):
        print(__doc__ or "")
        return 0

    if not MIGRATIONS.is_dir():
        return fail("supabase/migrations is missing")
    if not REMOTE.is_file():
        return fail("supabase/remote-migrations.json is missing")
    manifest = json.loads(REMOTE.read_text(encoding="utf-8"))
    expected = [str(v) for v in manifest.get("versions", [])]
    if not expected:
        return fail("remote migration manifest has no versions")
    pending_doc = json.loads(PENDING.read_text(encoding="utf-8")) if PENDING.is_file() else {"pending": []}
    pending_entries = pending_doc.get("pending", [])
    if not isinstance(pending_entries, list):
        return fail("pending migration manifest 'pending' must be a list")

    pending_versions: list[str] = []
    pending_errors: list[str] = []
    for entry in pending_entries:
        if not isinstance(entry, dict):
            pending_errors.append("pending entry is not an object")
            continue
        version = str(entry.get("version", ""))
        filename = str(entry.get("file", ""))
        match = VERSION_RE.fullmatch(filename)
        if not version or not match or match.group("version") != version:
            pending_errors.append(f"invalid pending migration identity: version={version!r} file={filename!r}")
            continue
        if not (MIGRATIONS / filename).is_file():
            pending_errors.append(f"pending migration file is missing: {filename}")
        if entry.get("status") != "PENDING_REVIEW" or entry.get("liveStatus") != "NOT_APPLIED":
            pending_errors.append(f"{version} must remain explicitly PENDING_REVIEW / NOT_APPLIED")
        if entry.get("blocksProduction") is not True:
            pending_errors.append(f"{version} must block production")
        pending_versions.append(version)
    if pending_errors:
        return fail("invalid pending migration registry: " + "; ".join(pending_errors))
    if len(pending_versions) != len(set(pending_versions)):
        return fail("duplicate versions in pending migration registry")
    remote_set = set(expected)
    pending_set = set(pending_versions)
    overlap = sorted(remote_set & pending_set)
    if overlap:
        return fail(f"pending versions are also claimed as live-applied: {overlap}")

    files = sorted(p.name for p in MIGRATIONS.glob("*.sql"))
    actual: list[str] = []
    invalid: list[str] = []
    for name in files:
        match = VERSION_RE.fullmatch(name)
        if not match:
            invalid.append(name)
            continue
        actual.append(match.group("version"))
    if invalid:
        return fail(f"migration filenames without a version prefix: {invalid}")
    duplicates = sorted({v for v in actual if actual.count(v) > 1})
    if duplicates:
        return fail(f"duplicate migration versions: {duplicates}")
    expected_source = sorted(remote_set | pending_set)
    if actual != expected_source:
        missing = [v for v in expected_source if v not in actual]
        extra = [v for v in actual if v not in expected_source]
        return fail(f"source/remote+pending inventory mismatch; missing={missing[:20]} extra={extra[:20]} source_count={len(actual)} remote_count={len(expected)} pending_count={len(pending_versions)}")
    if manifest.get("remoteMigrationCount") != len(expected):
        return fail("manifest count does not equal manifest version list")
    if manifest.get("latestRemoteMigration") != expected[-1]:
        return fail("manifest latestRemoteMigration is not the final live version")
    pending_text = ",".join(sorted(pending_set)) if pending_set else "none"
    print(f"MIGRATION_REPLAY_CONTRACT=PASS source_count={len(actual)} remote_count={len(expected)} pending_count={len(pending_versions)} latest_remote={expected[-1]} pending={pending_text} (pending versions are not asserted applied)")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())