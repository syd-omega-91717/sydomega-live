#!/usr/bin/env python3
"""Validate the governed runtime gateway authentication boundary."""
from __future__ import annotations
from pathlib import Path
import sys

ROOT=Path(__file__).resolve().parents[1]
GATEWAY=ROOT/"supabase/functions/omega-runtime-gateway/index.ts"

def main()->int:
    if "--help" in sys.argv:
        print(__doc__.strip())
        return 0
    if not GATEWAY.is_file():
        print("OMEGA RUNTIME GATEWAY CONTRACT: FAIL — gateway missing")
        return 1
    text=GATEWAY.read_text(encoding="utf-8")
    required=("createSupabaseContext","auth: 'user'","ctx.supabaseAdmin","verify_jwt")
    missing=[x for x in required if x not in text]
    forbidden=("SUPABASE_SERVICE_ROLE_KEY","SUPABASE_ANON_KEY",".auth.getUser(")
    found=[x for x in forbidden if x in text]
    if missing or found:
        print("OMEGA RUNTIME GATEWAY CONTRACT: FAIL")
        if missing: print(" missing:", ", ".join(missing))
        if found: print(" forbidden legacy/runtime patterns:", ", ".join(found))
        return 1
    print("OMEGA RUNTIME GATEWAY CONTRACT: PASS — user auth context + server admin boundary")
    return 0

if __name__=="__main__":
    raise SystemExit(main())
