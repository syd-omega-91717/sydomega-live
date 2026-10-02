#!/usr/bin/env python3
"""Validate the universal Omega value-layer contract."""
from __future__ import annotations
import json,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
CFG=ROOT/"config"/"omega-value-layer.json"; JS=ROOT/"omega-value-layer.js"; CSS=ROOT/"omega-value-layer.css"; BG=ROOT/"bg.js"
REQUIRED_STATES={"LIVE","CALCULATED","SIMULATED","USER-CREATED","LORE","UNAVAILABLE","PARTIAL"}
REQUIRED_REALMS={"command","identity","ascend","cosmos","vault","order","services","intel","universe"}
REQUIRED_MODULES={"CORE","CONSULTANCY","GAMING","ACHIEVEMENTS","FAMILY","MEDIA","BLOCKCHAIN_NFT","COMMUNICATION","HOROSCOPE","NEWS","HERITAGE","PROGRESS","CREDENTIALS","LEGAL","ELEMENTAL","INVESTMENT","INTELLIGENCE","HIERARCHY"}
def fail(msg:str)->int:
    print(f"OMEGA VALUE LAYER CONTRACT: FAIL — {msg}"); return 1
def main()->int:
    if "--help" in sys.argv or "-h" in sys.argv: print(__doc__.strip()); return 0
    for p in (CFG,JS,CSS,BG):
        if not p.exists(): return fail(f"missing {p.relative_to(ROOT)}")
    data=json.loads(CFG.read_text(encoding="utf-8"))
    if data.get("schemaVersion")!="1.0.0": return fail("unsupported schemaVersion")
    if set(data.get("states",[]))!=REQUIRED_STATES: return fail("canonical seven truth states are required")
    if set(data.get("realms",{}))!=REQUIRED_REALMS: return fail("nine canonical realms are required")
modules=data.get("modules",[])
if len(modules)!=18 or {m.get("id") for m in modules}!=REQUIRED_MODULES: return fail("all 18 canonical product modules are required")
for m in modules:
    if not m.get("page") or not str(m.get("href","")).startswith("/") or not m.get("promise"): return fail(f"invalid module mapping: {m}")
    if not data.get("pages"): return fail("page value map is empty")
    for page,info in data["pages"].items():
        if not info.get("purpose"): return fail(f"{page}: missing purpose")
        if not info.get("value"): return fail(f"{page}: missing value")
        if not info.get("proof"): return fail(f"{page}: missing proof state")
        nxt=info.get("next") or {}
        if not nxt.get("label") or not str(nxt.get("href","")).startswith("/"): return fail(f"{page}: invalid next action")
    js=JS.read_text(encoding="utf-8"); css=CSS.read_text(encoding="utf-8"); bg=BG.read_text(encoding="utf-8")
    for token in ("omega-value-layer","omega:value-layer-ready","UNAVAILABLE","SIMULATED"):
        if token not in js:return fail(f"omega-value-layer.js missing {token}")
    if "#omega-value-layer" not in css:return fail("omega-value-layer.css missing root selector")
    if "omega-value-layer.js" not in bg:return fail("bg.js does not load the value layer")
    print(f"OMEGA VALUE LAYER CONTRACT: PASS — {len(data['pages'])} explicit page mappings / 18 modules / 9 realms / 7 truth states")
    print("policy=no fabricated activity, scarcity, social proof, balances or financial outcomes")
    return 0
if __name__=="__main__":raise SystemExit(main())
