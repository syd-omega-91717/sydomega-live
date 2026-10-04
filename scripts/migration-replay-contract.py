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
VERSION_RE = re.compile(r"^(?P<version>[^_]+)_.+\.sql$")

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
    files = sorted(p.name for p in MIGRATIONS.glob("*.sql"))
    actual: list[str] = []
    invalid: list[str] = []
    for name in files:
        match = VERSION_RE.match(name)
        if not match:
            invalid.append(name)
            continue
        actual.append(match.group("version"))
    if invalid:
        return fail(f"migration filenames without a version prefix: {invalid}")
    duplicates = sorted({v for v in actual if actual.count(v) > 1})
    if duplicates:
        return fail(f"duplicate migration versions: {duplicates}")
    if actual != expected:
        missing = [v for v in expected if v not in actual]
        extra = [v for v in actual if v not in expected]
        return fail(f"local/remote inventory mismatch; missing={missing[:20]} extra={extra[:20]} local_count={len(actual)} remote_count={len(expected)}")
    if manifest.get("remoteMigrationCount") != len(expected):
        return fail("manifest count does not equal manifest version list")
    if manifest.get("latestRemoteMigration") != expected[-1]:
        return fail("manifest latestRemoteMigration is not the final version")
    print(f"MIGRATION_REPLAY_CONTRACT=PASS count={len(actual)} latest={actual[-1]}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())