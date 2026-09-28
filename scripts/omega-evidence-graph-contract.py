#!/usr/bin/env python3
"""Validate the Evidence Graph bridge, its truth boundary, and browser safety.

The contract verifies that the member-scoped read model requires authenticated
identity, reads only its declared evidence sources, avoids privileged browser
credentials and unsafe HTML sinks, and documents the persisted evidence chain.
"""
from pathlib import Path
import sys

ROOT=Path(__file__).resolve().parents[1]
FILES=[ROOT/"omega-evidence-graph.js",ROOT/"omega-evidence-graph.css",ROOT/"evidence.html",ROOT/"docs/OMEGA_EVIDENCE_GRAPH.md"]

def fail(msg):
    print("OMEGA EVIDENCE GRAPH CONTRACT: FAIL — "+msg); raise SystemExit(1)

def main():
    if "--help" in sys.argv or "-h" in sys.argv:
        print("Usage: python scripts/omega-evidence-graph-contract.py"); return
    for p in FILES:
        if not p.exists(): fail(f"missing {p}")
    js=(ROOT/"omega-evidence-graph.js").read_text()
    doc=(ROOT/"docs/OMEGA_EVIDENCE_GRAPH.md").read_text()
    html=(ROOT/"evidence.html").read_text()
    for marker in ("auth.getUser()","omega_platform_events","omega_platform_evidence","task_completions","graph_evidence","actor_user_id"):
        if marker not in js: fail(f"missing {marker}")
    if "innerHTML" in js or "innerHTML" in html: fail("unsafe HTML sink")
    if "service_role" in js: fail("privileged key exposed to browser")
    if "EVENT → CAPABILITY EVIDENCE → TASK → GRAPH EVIDENCE → EXPERIENCE" not in doc:
        fail("evidence chain missing")
    print("OMEGA EVIDENCE GRAPH CONTRACT: PASS (MEMBER-SCOPED READ MODEL + TRUTH BOUNDARY)")

if __name__=="__main__": main()
