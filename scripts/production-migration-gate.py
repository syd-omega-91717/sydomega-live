#!/usr/bin/env python3
"""Fail closed before a production build when migration source/provider state diverges.

Cloudflare Pages Git integration builds every main push and does not wait for
GitHub release-readiness checks. This stdlib-only gate compares the checked-in
source inventory, authenticated provider snapshot, and pending registry without
requiring Supabase credentials in the build environment.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

VERSION_PATTERN = re.compile(r"^(?P<version>\d{14}|\d{4})_")


def fail(message: str) -> int:
    print(f"PRODUCTION_MIGRATION_GATE=BLOCKED {message}", file=sys.stderr)
    return 1


def read_json(path: Path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        raise ValueError(f"required manifest missing: {path.relative_to(path.parents[1])}")
    except (OSError, json.JSONDecodeError) as exc:
        raise ValueError(f"cannot read valid JSON from {path}: {exc}") from exc


def evaluate(root: Path) -> int:
    migrations_dir = root / "supabase" / "migrations"
    pending_path = root / "supabase" / "pending-migrations.json"
    remote_path = root / "supabase" / "remote-migrations.json"

    if not migrations_dir.is_dir():
        return fail("source migration directory is missing")
    try:
        pending_doc = read_json(pending_path)
        remote_doc = read_json(remote_path)
    except ValueError as exc:
        return fail(str(exc))

    pending_entries = pending_doc.get("pending") if isinstance(pending_doc, dict) else None
    remote_versions_raw = remote_doc.get("versions") if isinstance(remote_doc, dict) else None
    if not isinstance(pending_entries, list):
        return fail("pending registry must contain a pending array")
    if not isinstance(remote_versions_raw, list) or not remote_versions_raw:
        return fail("provider snapshot must contain a non-empty versions array")

    source_versions: dict[str, str] = {}
    for path in sorted(migrations_dir.glob("*.sql")):
        match = VERSION_PATTERN.match(path.name)
        if not match:
            return fail(f"unversioned migration file: {path.name}")
        version = match.group("version")
        if version in source_versions:
            return fail(f"duplicate source migration version: {version}")
        source_versions[version] = path.name
    if not source_versions:
        return fail("no source migration files found")

    remote_versions: set[str] = set()
    for raw_version in remote_versions_raw:
        version = str(raw_version)
        if not re.fullmatch(r"(?:\d{14}|\d{4})", version):
            return fail(f"invalid provider migration version: {version!r}")
        if version in remote_versions:
            return fail(f"duplicate provider migration version: {version}")
        remote_versions.add(version)

    if remote_doc.get("remoteMigrationCount") != len(remote_versions):
        return fail("provider snapshot count does not match its versions array")
    if remote_doc.get("latestRemoteMigration") != max(remote_versions, key=lambda value: (len(value), value)):
        return fail("provider snapshot latest version does not match its versions array")

    pending_versions: set[str] = set()
    for entry in pending_entries:
        if not isinstance(entry, dict):
            return fail("pending registry entries must be objects")
        version = str(entry.get("version", ""))
        filename = entry.get("file")
        if not re.fullmatch(r"(?:\d{14}|\d{4})", version):
            return fail(f"invalid pending migration version: {version!r}")
        if version in pending_versions:
            return fail(f"duplicate pending migration version: {version}")
        if entry.get("status") != "PENDING_REVIEW" or entry.get("liveStatus") != "NOT_APPLIED":
            return fail(f"pending migration {version} has an invalid lifecycle state")
        if entry.get("blocksProduction") is not True:
            return fail(f"pending migration {version} does not fail closed")
        if not isinstance(filename, str) or Path(filename).name != filename:
            return fail(f"pending migration {version} has an unsafe filename")
        if source_versions.get(version) != filename:
            return fail(f"pending migration {version} does not match its source filename")
        pending_versions.add(version)

    source_only = set(source_versions) - remote_versions
    provider_only = remote_versions - set(source_versions)
    if provider_only:
        return fail("provider-only versions exist: " + ", ".join(sorted(provider_only)))
    if source_only != pending_versions:
        missing_registration = source_only - pending_versions
        stale_pending = pending_versions - source_only
        details = []
        if missing_registration:
            details.append("unregistered source versions=" + ",".join(sorted(missing_registration)))
        if stale_pending:
            details.append("pending versions already absent from source/provider gap=" + ",".join(sorted(stale_pending)))
        return fail("; ".join(details) or "source/provider/pending inventories do not reconcile")

    if pending_versions:
        detail = ", ".join(f"{version}:{source_versions[version]}" for version in sorted(pending_versions))
        return fail("unapplied migrations block production: " + detail)

    print(
        "PRODUCTION_MIGRATION_GATE=PASS "
        f"source={len(source_versions)} provider={len(remote_versions)} pending=0"
    )
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--root",
        type=Path,
        default=Path(__file__).resolve().parents[1],
        help="repository root (defaults to the parent of scripts/)",
    )
    args = parser.parse_args()
    return evaluate(args.root.resolve())


if __name__ == "__main__":
    raise SystemExit(main())
