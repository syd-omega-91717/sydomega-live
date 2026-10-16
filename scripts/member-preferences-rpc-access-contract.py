#!/usr/bin/env python3
"""Fail closed if member preference RPCs regain anonymous execute privileges."""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
MIGRATION = ROOT / "supabase/migrations/20261016193000_revoke_anon_member_preferences_rpc_20261016.sql"
IMPLEMENTATION = ROOT / "supabase/migrations/20261002180500_member_preferences_persistence_20261002.sql"


def main() -> int:
    if "--help" in sys.argv or "-h" in sys.argv:
        print(__doc__.strip())
        return 0
    if not MIGRATION.is_file() or not IMPLEMENTATION.is_file():
        print("MEMBER PREFERENCES RPC ACCESS CONTRACT: FAIL — migration missing")
        return 1

    sql = " ".join(MIGRATION.read_text(encoding="utf-8").lower().split())
    implementation = IMPLEMENTATION.read_text(encoding="utf-8").lower()
    signatures = {
        "get_member_preferences()",
        "set_member_preferences(boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean)",
    }
    errors = []
    for signature in signatures:
        if f"revoke execute on function public.{signature} from public, anon" not in sql:
            errors.append(f"{signature}: missing PUBLIC and anon execute revocation")
        if f"grant execute on function public.{signature} to authenticated" not in sql:
            errors.append(f"{signature}: missing authenticated execute grant")

    if "if v_uid is null then" not in implementation or "authenticated session required" not in implementation:
        errors.append("set_member_preferences must retain its explicit authenticated-user guard")
    if "where user_id = v_uid" not in implementation:
        errors.append("set_member_preferences must remain scoped to auth.uid()")

    if errors:
        print("MEMBER PREFERENCES RPC ACCESS CONTRACT: FAIL")
        for error in errors:
            print(" - " + error)
        return 1
    print("MEMBER PREFERENCES RPC ACCESS CONTRACT: PASS (2 RPCs; PUBLIC/anon denied; authenticated retained)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
