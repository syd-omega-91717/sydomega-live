#!/usr/bin/env python3
"""Validate the member-facing Agent Operations console stays on the read-only gateway."""
from pathlib import Path
import sys
R=Path(__file__).resolve().parents[1]
if "--help" in sys.argv or "-h" in sys.argv:
    print(__doc__.strip()); raise SystemExit(0)
html=(R/"agent-operations.html").read_text(encoding="utf-8")
js=(R/"omega-agent-operations.js").read_text(encoding="utf-8")
css=(R/"omega-agent-operations.css").read_text(encoding="utf-8")
checks=[
("shared Supabase client","OmegaSB.get()" in js),
("function gateway","functions.invoke('agent-execute'" in js),
("no browser createClient","createClient" not in js),
("no innerHTML","innerHTML" not in js and "innerHTML" not in html),
("three gateway tools",all(x in js for x in ["member.context.read","mission.state.read","simulation.history.read"])),
("twelve canonical agents",all(x in js for x in ["Sentinel","Analyst","Historian","Tutor","Merchant","Proxy","Oracle","Scout","Warden","Auditor","Beacon","Sovereign"])),
("history table","omega_agent_operations" in js),
("truth boundary","read-only" in html.lower() and "no write" in html.lower()),
("responsive css","@media(max-width:900px)" in css),
("reduced privilege surface","privileged" in html.lower() and "external-network" in html.lower()),
]
bad=[n for n,ok in checks if not ok]
if bad: raise SystemExit("OMEGA AGENT OPERATIONS UI CONTRACT: FAIL: "+", ".join(bad))
print("OMEGA AGENT OPERATIONS UI CONTRACT: PASS")
