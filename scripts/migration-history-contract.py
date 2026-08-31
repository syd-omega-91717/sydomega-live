#!/usr/bin/env python3
"""Validate the local Supabase migration history and, when requested, the linked remote history.

This contract prevents the recurring `Remote migration versions not found in local
migrations directory` failure by making migration versions deterministic and by
refusing to continue when local/remote histories diverge.

Usage:
  python scripts/migration-history-contract.py --local
  python scripts/migration-history-contract.py --remote-output <file>

The remote mode expects the plain-text output of `supabase migration list`.
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MIGRATIONS = ROOT / "supabase" / "migrations"
VERSION_RE = re.compile(r"^(\d+)_")
ROW_RE = re.compile(r"^\s*(\d+)\s*[│|]\s*(\d+)?\s*[│|]")


def local_versions() -> tuple[dict[str, list[str]], list[str]]:
    versions: dict[str, list[str]] = {}
    duplicates: list[str] = []
    for path in sorted(MIGRATIONS.glob("*.sql")):
        match = VERSION_RE.match(path.name)
        if not match:
            # README and non-migration SQL files must not silently become part
            # of the migration history.
            continue
        version = match.group(1)
        versions.setdefault(version, []).append(path.name)
    for version, files in versions.items():
        if len(files) > 1:
            duplicates.append(f"{version}: {', '.join(files)}")
    return versions, duplicates


def parse_remote(text: str) -> set[str]:
    remote: set[str] = set()
    for raw in text.splitlines():
        line = raw.strip()
        match = ROW_RE.match(line)
        if match:
            remote.add(match.group(2) or match.group(1))
            continue
        # Also accept the CLI's compact table format if spacing changes.
        versions = re.findall(r"(?<!\d)(\d{4,14})(?!\d)", line)
        if "│" in line or "|" in line:
            remote.update(versions[:2])
    return remote


def check_local() -> tuple[set[str], int]:
    if not MIGRATIONS.is_dir():
        print("::error::supabase/migrations directory is missing")
        return set(), 1
    versions, duplicates = local_versions()
    if duplicates:
        print("::error::duplicate local migration versions detected")
        for item in duplicates:
            print(f"  {item}")
        return set(versions), 1
    print(f"local migration versions: {len(versions)}")
    if versions:
        print(f"local migration range: {min(versions)} -> {max(versions)}")
    return set(versions), 0


def check_remote_text(text: str, local: set[str]) -> int:
    remote = parse_remote(text)
    if not remote:
        print("::error::could not parse any remote migration versions")
        return 1
    missing = sorted(remote - local, key=lambda x: (len(x), x))
    local_only = sorted(local - remote, key=lambda x: (len(x), x))
    print(f"remote migration versions: {len(remote)}")
    print(f"remote migration range: {min(remote)} -> {max(remote)}")
    if missing:
        print("::error::remote migration versions missing locally")
        for version in missing:
            print(f"  {version}")
        print("Repair rule: recover/preserve the exact remote version in supabase/migrations; do not mark it reverted merely to make CI green.")
        return 1
    if local_only:
        print("::error::local migration versions missing remotely")
        for version in local_only:
            print(f"  {version}")
        print("Apply the pending local migration through the normal deployment pipeline before declaring production synchronized.")
        return 1
    print("OK — local and remote migration histories are exactly synchronized.")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--local", action="store_true")
    parser.add_argument("--remote-output", type=Path)
    args = parser.parse_args()
    local, code = check_local()
    if code:
        return code
    if args.remote_output:
        text = args.remote_output.read_text(encoding="utf-8", errors="replace")
        return check_remote_text(text, local)
    if args.local:
        print("OK — local migration history is structurally valid.")
        return 0
    print("No remote comparison requested; local contract only.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
