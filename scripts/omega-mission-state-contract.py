#!/usr/bin/env python3
"""Validate the repository contract for the server-authoritative mission layer."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MIGRATIONS = [
    ROOT / "supabase/migrations/20260928135609_omega_mission_state_foundation_20260928.sql",
    ROOT / "supabase/migrations/20260928135726_omega_mission_state_start_idempotency_fix_20260928.sql",
]
DOC = ROOT / "docs/OMEGA_MISSION_STATE.md"
BRIDGE = ROOT / "supabase/migrations/20260929092815_omega_mission_public_rpc_bridge_20260929.sql"
BOARD = ROOT / "missions.html"
RUNTIME = ROOT / "omega-mission-board.js"

REQUIRED = (
    "omega_missions",
    "omega_quests",
    "omega_quest_missions",
    "omega_member_mission_state",
    "omega_member_quest_state",
    "omega_mission_transitions",
    "omega_start_mission",
    "omega_complete_mission",
    "security definer",
    "set search_path = ''",
    "revoke all on table",
    "revoke execute on function",
)

def main():
    for path in (*MIGRATIONS, DOC, BRIDGE, BOARD, RUNTIME):
        if not path.exists():
            raise SystemExit(f"OMEGA MISSION STATE CONTRACT: FAIL missing {path}")
    sql = "\\n".join(path.read_text(encoding="utf-8").lower() for path in (*MIGRATIONS, BRIDGE))
    for marker in REQUIRED:
        if marker.lower() not in sql:
            raise SystemExit(f"OMEGA MISSION STATE CONTRACT: FAIL missing {marker}")
    if "grant insert" in sql or "grant update" in sql or "grant delete" in sql:
        raise SystemExit("OMEGA MISSION STATE CONTRACT: FAIL direct member mutation grant")
    bridge = BRIDGE.read_text(encoding="utf-8").lower()
    for marker in ("create or replace function public.omega_start_mission", "create or replace function public.omega_complete_mission", "security invoker", "grant execute on function public.omega_start_mission", "grant execute on function public.omega_complete_mission", "revoke execute on function public.omega_start_mission", "revoke execute on function public.omega_complete_mission"):
        if marker not in bridge:
            raise SystemExit(f"OMEGA MISSION STATE CONTRACT: FAIL bridge missing {marker}")
    board = BOARD.read_text(encoding="utf-8").lower()
    runtime = RUNTIME.read_text(encoding="utf-8").lower()
    for marker in ('import "/omega-mission-board.js"',):
        if marker not in board:
            raise SystemExit(f"OMEGA MISSION STATE CONTRACT: FAIL board missing {marker}")
    for forbidden in ("localStorage.", "daily_missions", "weekly_missions", "legendary_missions", "totalXp", "streakCount"):
        if forbidden in board or forbidden in runtime:
            raise SystemExit(f"OMEGA MISSION STATE CONTRACT: FAIL simulated mission state marker remains: {forbidden}")
    doc = DOC.read_text(encoding="utf-8")
    for marker in ("server-authoritative", "persisted member-owned evidence", "No missions or quests are seeded"):
        if marker not in doc:
            raise SystemExit(f"OMEGA MISSION STATE CONTRACT: FAIL missing truth-boundary text: {marker}")
    print("OMEGA MISSION STATE CONTRACT: PASS (SERVER-AUTHORITATIVE + EVIDENCE-BOUND)")
    
if __name__ == "__main__":
    import sys
    if "--help" in sys.argv or "-h" in sys.argv:
        print(__doc__ or "")
        raise SystemExit(0)
    main()
