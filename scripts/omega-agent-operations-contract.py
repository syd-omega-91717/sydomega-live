#!/usr/bin/env python3
"""Validate the read-only Agent Operations gateway."""
from pathlib import Path
import json,sys
R=Path(__file__).resolve().parents[1]
if "--help" in sys.argv or "-h" in sys.argv: print(__doc__.strip()); raise SystemExit(0)
f=(R/"supabase/functions/agent-execute/index.ts").read_text(); reg=json.loads((R/"supabase/functions/agent-execute/agent-tools.json").read_text()); sql=(R/"supabase/migrations/20260929120000_omega_agent_operations_readonly_foundation_20260929.sql").read_text(); doc=(R/"docs/OMEGA_AGENT_OPERATIONS_READONLY.md").read_text()
checks=[("12 agents",len(reg["agents"])==12),("3 low-risk read tools",len(reg["tools"])==3 and all(v["risk"]=="low" and not v["mutation"] for v in reg["tools"].values())),("jwt", "Bearer" in f and "authentication_required" in f),("binding","bound.includes(tool)" in f),("rls client","Authorization:auth" in f),("service audit key","serviceKey=secretKey()" in f and "const admin=createClient(url,serviceKey)" in f),("pre audit",'AUTHORIZED' in f),("completion audit",'EXECUTED' in f),("audit user binding","p_user_id:userId" in f),("rls", "enable row level security" in sql.lower()),("direct writes denied","revoke all on table public.omega_agent_operations from anon, authenticated" in sql),("rpc service-only","revoke execute on function public.omega_record_agent_operation(uuid,text,text,text,text,text,text,text) from public, anon, authenticated" in sql and "grant execute on function public.omega_record_agent_operation(uuid,text,text,text,text,text,text,text) to service_role" in sql),("read-only boundary","No write" in doc)]
bad=[n for n,ok in checks if not ok]
if bad: raise SystemExit("OMEGA AGENT OPERATIONS CONTRACT: FAIL: "+", ".join(bad))
print("OMEGA AGENT OPERATIONS CONTRACT: PASS")