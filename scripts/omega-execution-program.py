#!/usr/bin/env python3
"""Validate the global Ω execution program against its control-plane contract.

Repository-only gate. It does not contact providers and cannot prove live state.
Use --help to inspect this contract without executing validation.
"""
from __future__ import annotations
import argparse, json, pathlib

ROOT=pathlib.Path(__file__).resolve().parents[1]
CFG=ROOT/"config/omega-execution-program.json"
VALID_STATUS={"IMPLEMENTED_BY_THIS_CHANGE","IMPLEMENTED","PARTIAL","BLOCKED_EXTERNAL","DESIGN_REQUIRED","FUTURE"}
VALID_PRIORITY={"P0","P1","P2"}

def fail(msg):
    print("OMEGA EXECUTION PROGRAM: FAIL "+msg)
    raise SystemExit(1)

def validate(cfg):
    if cfg.get("schema_version") != 1: fail("schema_version")
    if cfg.get("principle") != "ONE_PLATFORM_MANY_GOVERNED_PROJECTIONS": fail("principle")
    if cfg.get("truth_rule") != "IMPLEMENTATION_IS_NOT_PROVIDER_EVIDENCE": fail("truth_rule")
    waves=cfg.get("waves")
    if not isinstance(waves,list) or len(waves)!=7: fail("expected 7 waves")
    track_ids=set(); wave_ids=set()
    for wave in waves:
        wid=wave.get("id")
        if wid in wave_ids: fail("duplicate wave "+str(wid))
        wave_ids.add(wid)
        if wave.get("priority") not in VALID_PRIORITY: fail("invalid priority "+str(wid))
        tracks=wave.get("tracks")
        if not isinstance(tracks,list) or not tracks: fail("wave has no tracks "+str(wid))
        for track in tracks:
            tid=track.get("id")
            if tid in track_ids: fail("duplicate track "+str(tid))
            track_ids.add(tid)
            if track.get("status") not in VALID_STATUS: fail("invalid status "+str(tid))
            if not track.get("name"): fail("missing track name "+str(tid))
            if not isinstance(track.get("depends",[]),list): fail("depends must be list "+str(tid))
            if not track.get("evidence"): fail("missing evidence "+str(tid))
    for wave in waves:
        for track in wave["tracks"]:
            for dep in track.get("depends",[]):
                if dep not in track_ids: fail("unknown dependency "+dep+" from "+track["id"])
    gate_ids=set()
    for gate in cfg.get("release_gates",[]):
        if gate["id"] in gate_ids: fail("duplicate gate "+gate["id"])
        gate_ids.add(gate["id"])
        for req in gate.get("requires",[]):
            if req not in track_ids: fail("gate references unknown track "+req)
    if not cfg.get("external_blockers"): fail("external blockers missing")
    if len(cfg.get("forbidden_shortcuts",[])) < 5: fail("forbidden shortcuts incomplete")

def main():
    ap=argparse.ArgumentParser(description=__doc__.splitlines()[0],
        epilog="Provider-dependent state remains explicitly non-LIVE until independently evidenced.")
    ap.parse_args()
    cfg=json.loads(CFG.read_text(encoding="utf-8"))
    validate(cfg)
    track_count=sum(len(w["tracks"]) for w in cfg["waves"])
    print("OMEGA EXECUTION PROGRAM: PASS")
    print(f"7 waves; {track_count} controlled tracks; {len(cfg['release_gates'])} release gates.")
    print("Provider-dependent blockers remain explicitly non-LIVE.")
    return 0

if __name__=="__main__":
    raise SystemExit(main())
