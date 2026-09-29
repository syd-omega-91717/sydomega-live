#!/usr/bin/env python3
"""Contract for the governed Agent Operations proposal boundary."""
from pathlib import Path
import re,sys
ROOT=Path(__file__).resolve().parents[1]
if "--help" in sys.argv or "-h" in sys.argv:
    print(__doc__); raise SystemExit(0)
html=(ROOT/"agent-operations.html").read_text(encoding="utf-8")
js=(ROOT/"omega-agent-operations.js").read_text(encoding="utf-8")
css=(ROOT/"omega-agent-operations.css").read_text(encoding="utf-8")
sql=(ROOT/"supabase/migrations/20260929113731_omega_agent_operations_governance_20260929.sql").read_text(encoding="utf-8")
checks=[
("shared Supabase client","OmegaSB.get()" in js),
("no client key","sb_publishable_" not in js and "createClient" not in js),
("safe DOM","innerHTML" not in js and "innerHTML" not in html),
("proposal page","AGENT OPERATIONS" in html),
("proposal truth boundary","PROPOSAL ONLY" in html and "EXECUTOR NOT CONNECTED" in js),
("tool registry", "omega_agent_tool_registry" in sql and "PROPOSAL_ONLY" in sql),
("proposal table","omega_agent_action_proposals" in sql),
("RLS","enable row level security" in sql),
("direct writes revoked","revoke all on table public.omega_agent_action_proposals from anon, authenticated" in sql),
("owner decision","is_platform_owner" in sql and "omega_decide_agent_action_proposal" in sql),
("private helpers","create or replace function private.omega_" in sql),
("public bridges authenticated","grant execute on function public.omega_submit_agent_action_proposal" in sql),
("responsive","@media(max-width:900px)" in css),
]
bad=[n for n,ok in checks if not ok]
if bad: raise SystemExit("OMEGA AGENT OPERATIONS CONTRACT: FAIL: "+", ".join(bad))
print("OMEGA AGENT OPERATIONS CONTRACT: PASS")
