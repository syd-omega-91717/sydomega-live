#!/usr/bin/env python3
"""Deterministic contract for the governed OMEGA event fabric."""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
FUNCTION = ROOT / "supabase/functions/event-ingest/index.ts"
MIGRATION = ROOT / "supabase/migrations/20260928100000_omega_event_fabric_idempotency.sql"
DOC = ROOT / "docs/OMEGA_EVENT_FABRIC.md"

EVENT_TYPES = (
    "route_view","action_started","action_completed","mission_progress",
    "capability_used","simulation_run","evidence_recorded","replay_checkpoint",
)

def fail(message):
    print(f"OMEGA EVENT FABRIC CONTRACT: FAIL — {message}")
    raise SystemExit(1)

def main():
    if "--help" in sys.argv or "-h" in sys.argv:
        print("Usage: python scripts/omega-event-fabric-contract.py")
        return
    for path in (FUNCTION, MIGRATION, DOC):
        if not path.exists(): fail(f"missing required file: {path}")
    source = FUNCTION.read_text(encoding="utf-8")
    migration = MIGRATION.read_text(encoding="utf-8")
    doc = DOC.read_text(encoding="utf-8")
    for marker in ("auth.getUser()","actorUserId","omega_platform_events","metadata.schema_version","idempotency_key","secretKey()"):
        if marker not in source: fail(f"missing runtime marker: {marker}")
    for event_type in EVENT_TYPES:
        if f'"{event_type}"' not in source or event_type not in doc:
            fail(f"missing event type: {event_type}")
    if "create unique index" not in migration: fail("missing database idempotency constraint")
    if "actor_user_id" not in migration or "metadata ->> 'idempotency_key'" not in migration:
        fail("idempotency constraint is not actor-bound")
    if re.search(r"body\??\.user_?id|body\??\.actor_?user_?id", source, re.I):
        fail("caller identity appears to be accepted from request body")
    print("OMEGA EVENT FABRIC CONTRACT: PASS (AUTH + ALLOWLIST + IDEMPOTENCY + SINGLE EVENT STORE)")

if __name__ == "__main__":
    main()
