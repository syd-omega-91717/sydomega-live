#!/usr/bin/env python3
"""Validate the production runtime frontier artifacts without inventing provider state."""
from __future__ import annotations
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
def fail(msg):
    print(f"OMEGA RUNTIME FRONTIER CONTRACT: FAIL — {msg}")
    return 1

def main():
    runtime=json.loads((ROOT/"config/omega-module-runtime.json").read_text(encoding="utf-8"))
    if len(runtime["modules"]) != 18 or sum(len(m["actions"]) for m in runtime["modules"]) != 54:
        return fail("canonical module/action count changed")
    cfg=(ROOT/"supabase/config.toml").read_text(encoding="utf-8")
    if "[functions.omega-runtime-gateway]" not in cfg or "verify_jwt = true" not in cfg.split("[functions.omega-runtime-gateway]",1)[1]:
        return fail("runtime gateway must require JWT verification")
    if "[functions.omega-media-worker]" not in cfg or "verify_jwt = false" not in cfg.split("[functions.omega-media-worker]",1)[1]:
        return fail("media worker secret-auth boundary is missing")
    gateway=(ROOT/"supabase/functions/omega-runtime-gateway/index.ts").read_text(encoding="utf-8")
    for marker in ("verify_blockchain_ownership","create_media_job","upsert_investment_watchlist","createSupabaseContext","auth: 'user'"):
        if marker not in gateway: return fail(f"gateway missing {marker}")
    worker=(ROOT/"supabase/functions/omega-media-worker/index.ts").read_text(encoding="utf-8")
    for marker in ("OMEGA_MEDIA_PROVIDER_URL","OMEGA_MEDIA_PROVIDER_SECRET","claim_media_jobs","complete_media_job","BLOCKED_PROVIDER"):
        if marker not in worker: return fail(f"media worker missing {marker}")
    migration="\n".join(p.read_text(encoding="utf-8") for p in sorted((ROOT/"supabase/migrations").glob("20261002*runtime_frontier*.sql")) + sorted((ROOT/"supabase/migrations").glob("20261002*media_job_worker*.sql")))
    for marker in ("omega_media_jobs","omega_investment_watchlists","omega_legal_documents","omega_blockchain_ownership_verifications","record_blockchain_ownership_verification"):
        if marker not in migration: return fail(f"frontier migration missing {marker}")
    print("OMEGA RUNTIME FRONTIER CONTRACT: PASS — durable frontier boundaries are present and provider-dependent execution fails closed")
    return 0

if __name__=="__main__":
    raise SystemExit(main())
