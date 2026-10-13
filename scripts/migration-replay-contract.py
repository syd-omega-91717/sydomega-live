#!/usr/bin/env python3
"""Validate the local Supabase migration chain before a fresh-database replay.

This gate is intentionally independent of production migration history.
Fresh replay must be able to test a pending local migration before it is applied
to production. Production parity is enforced separately by scripts/migration-drift.py.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MIGRATIONS = ROOT / "supabase" / "migrations"
VERSION_RE = re.compile(r"^(?P<version>\d+)_.+[.]sql$")


def inspect_inventory(migrations_dir: Path) -> tuple[list[str], list[str]]:
    """Return the ordered local version list and any inventory violations."""
    if not migrations_dir.is_dir():
        return [], ["supabase/migrations is missing"]
    files = sorted(path.name for path in migrations_dir.glob("*.sql"))
    if not files:
        return [], ["no SQL migration files found"]

    versions: list[str] = []
    invalid: list[str] = []
    for name in files:
        match = VERSION_RE.fullmatch(name)
        if not match:
            invalid.append(name)
            continue
        versions.append(match.group("version"))

    errors: list[str] = []
    if invalid:
        errors.append(f"migration filenames without a numeric version prefix: {invalid}")
    duplicates = sorted({version for version in versions if versions.count(version) > 1})
    if duplicates:
        errors.append(f"duplicate migration versions: {duplicates}")
    if errors:
        return versions, errors
    return versions, []


def main() -> int:
    if any(arg in {"-h", "--help"} for arg in sys.argv[1:]):
        print(__doc__ or "")
        return 0

    versions, errors = inspect_inventory(MIGRATIONS)
    if errors:
        for error in errors:
            print(f"MIGRATION_REPLAY_CONTRACT=FAILED: {error}")
        return 1

    print(
        "MIGRATION_REPLAY_CONTRACT=PASS "
        f"local_count={len(versions)} latest={versions[-1]} "
        "(production parity is enforced separately)"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
