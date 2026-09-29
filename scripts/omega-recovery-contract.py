#!/usr/bin/env python3
"""Blocking contract for the member Recovery continuity surface."""
from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]
FILES=["recovery.html","omega-recovery.js","omega-recovery.css","docs/OMEGA_RECOVERY.md"]
def fail(msg): raise SystemExit("FAIL: "+msg)
def main():
    if "--help" in __import__("sys").argv or "-h" in __import__("sys").argv:
        print(__doc__); return 0
    for rel in FILES:
        if not (ROOT/rel).exists(): fail("missing "+rel)
    html=(ROOT/"recovery.html").read_text(encoding="utf-8")
    js=(ROOT/"omega-recovery.js").read_text(encoding="utf-8")
    doc=(ROOT/"docs/OMEGA_RECOVERY.md").read_text(encoding="utf-8")
    for marker in ['data-page="recovery"','omega-recovery.css','omega-recovery.js','omega_recovery_checkpoints','CREATE CHECKPOINT','NOT VERIFIED']:
        if marker not in html and marker not in js: fail("required marker missing: "+marker)
    for marker in ["omega_create_recovery_checkpoint","omega_verify_recovery_checkpoint","RTO","RPO","Storage"]:
        if marker not in doc: fail("recovery boundary missing: "+marker)
    if "payments_enabled" in js or "is_owner" in js: fail("recovery page must not invent authority")
    if re.search(r"localStorage.*(?:checkpoint|recovery)",js,re.I): fail("recovery checkpoint truth must not be browser-local")
    if "innerHTML" in js: fail("recovery renderer must use safe DOM APIs")
    print("PASS: recovery continuity contract")
    return 0
if __name__=="__main__": raise SystemExit(main())