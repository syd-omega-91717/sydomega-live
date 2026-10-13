#!/usr/bin/env python3
"""Fail closed if a member-visible ranking can expose linked family accounts.

This is a source-level guard, not a substitute for a live-role integration test.
The database migration must keep all known ranking/snapshot paths privacy-aware.
"""
from __future__ import annotations

import sys
if __name__ == "__main__" and any(arg in {"--help", "-h"} for arg in sys.argv[1:]):
    print(__doc__.strip())
    raise SystemExit(0)

import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
MIGRATION = ROOT / "supabase/migrations/20261012150000_omega_family_access.sql"
EDGE = ROOT / "supabase/functions/snapshot-leaderboard/index.ts"


def function_body(source: str, name: str) -> str:
    pattern = re.compile(
        rf"create\s+or\s+replace\s+function\s+{re.escape(name)}\b"
        rf"[\s\S]*?as\s+\$function\$([\s\S]*?)\$function\$\s*;",
        re.IGNORECASE,
    )
    match = pattern.search(source)
    if not match:
        raise AssertionError(f"missing function definition: {name}")
    return match.group(1).lower()


def main() -> int:
    migration = MIGRATION.read_text(encoding="utf-8")
    edge = EDGE.read_text(encoding="utf-8")
    checks = {
        "public leaderboard excludes linked family": "family_of is null" in function_body(migration, "private.public_leaderboard"),
        "points leaderboard excludes other linked family": "p.family_of is null or p.id = v_uid" in function_body(migration, "public.get_points_leaderboard"),
        "snapshot recomputation excludes linked family": "family_of is null" in function_body(migration, "public.compute_leaderboard_snapshot"),
        "activity feed excludes linked family": "pr.family_of is null" in function_body(migration, "public.get_activity_feed"),
        "grant deletes any pre-existing snapshot": bool(re.search(r"delete\s+from\s+public\.leaderboard_snapshots\s+where\s+user_id\s*=\s*p_uid", migration, re.I)),
        "owner RPCs require AAL2": migration.count("auth.jwt()->>'aal'") >= 2 and "aal2_required" in migration,
        "missing DOB requires explicit server-side adult attestation": "p_attested_adult boolean default false" in function_body(migration, "private.grant_family_access") and "adult_attestation_required" in function_body(migration, "private.grant_family_access") and "owner_attested_adult" in function_body(migration, "private.grant_family_access"),
        "service-role snapshot source filters family": '.is("family_of", null)' in edge,
        "family link is guarded against non-owner writes": "new.family_of is distinct from old.family_of" in migration,
    }
    failed = [name for name, ok in checks.items() if not ok]
    for name, ok in checks.items():
        print(f"{'PASS' if ok else 'FAIL'} family-access: {name}")
    if failed:
        print(f"FAMILY_ACCESS_CONTRACT=FAIL checks={len(failed)}/{len(checks)}")
        return 1
    print(f"FAMILY_ACCESS_CONTRACT=PASS checks={len(checks)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
