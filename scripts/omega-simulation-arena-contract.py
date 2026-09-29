#!/usr/bin/env python3
"""Contract for the deterministic, persisted Simulation Arena."""
from pathlib import Path
import re
import sys
ROOT=Path(__file__).resolve().parents[1]
if "--help" in sys.argv or "-h" in sys.argv:
    print(__doc__)
    raise SystemExit(0)
html=(ROOT/"arena.html").read_text(encoding="utf-8")
js=(ROOT/"omega-simulation-arena.js").read_text(encoding="utf-8")
css=(ROOT/"omega-simulation-arena.css").read_text(encoding="utf-8")
sql=(ROOT/"supabase/migrations/20260929112443_omega_simulation_arena_foundation_20260929.sql").read_text(encoding="utf-8")
checks=[
 ("simulation page", "SIMULATION ARENA" in html),
 ("reality label", "SIMULATED" in html and "SIMULATED" in js),
 ("versioned model", "MODEL_VERSION='1.0.0'" in js),
 ("deterministic seed", "deterministic_seed" in js and "xorshift" in js),
 ("no localStorage", "localStorage" not in js),
 ("safe DOM", "innerHTML" not in js),
 ("save RPC", "omega_record_simulation_run" in js and "omega_record_simulation_run" in sql),
 ("RLS", "enable row level security" in sql.lower()),
 ("anon denied", "revoke all on table public.omega_simulation_runs from anon, authenticated" in sql),
 ("authenticated read", "grant select on table public.omega_simulation_runs to authenticated" in sql),
 ("function restricted", "revoke execute on function public.omega_record_simulation_run" in sql),
 ("visual DNA", "CONCENTRIC RINGS" in html and "CYAN INTELLIGENCE" in html),
 ("responsive css", "@media(max-width:850px)" in css),
]
bad=[name for name,ok in checks if not ok]
if bad: raise SystemExit("OMEGA SIMULATION ARENA CONTRACT: FAIL: "+", ".join(bad))
print("OMEGA SIMULATION ARENA CONTRACT: PASS")
