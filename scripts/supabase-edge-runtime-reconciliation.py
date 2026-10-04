#!/usr/bin/env python3
"""Fail-closed Supabase Edge Function source/runtime reconciliation contract."""
from __future__ import annotations
import hashlib,json,re
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
FUNCTIONS=ROOT/"supabase"/"functions"
SNAPSHOT=ROOT/"docs"/"runtime"/"supabase-edge-functions-live.json"
NAME_RE=re.compile(r"^[a-z0-9][a-z0-9-]*$")

def fail(message:str)->int:
    print(f"EDGE_RUNTIME_RECONCILIATION=FAILED: {message}")
    return 1

def main()->int:
    if not FUNCTIONS.is_dir(): return fail("supabase/functions is missing")
    if not SNAPSHOT.is_file(): return fail("live snapshot is missing")
    data=json.loads(SNAPSHOT.read_text(encoding="utf-8"))
    expected=data.get("functions",{})
    if not isinstance(expected,dict) or not expected: return fail("snapshot has no functions")
    actual={}
    for path in sorted(FUNCTIONS.iterdir()):
        if not path.is_dir() or path.name.startswith("_"): continue
        if not NAME_RE.fullmatch(path.name): return fail(f"invalid function directory name: {path.name}")
        entry=path/"index.ts"
        if not entry.is_file(): return fail(f"function {path.name} has no index.ts")
        actual[path.name]=hashlib.sha1(entry.read_bytes()).hexdigest()
    missing=sorted(set(expected)-set(actual))
    unclassified=sorted(set(actual)-set(expected))
    if missing: return fail(f"snapshot functions missing from repository: {missing}")
    if unclassified: return fail(f"repository functions missing runtime classification: {unclassified}")
    drift=[]
    for name,meta in expected.items():
        state=meta.get("state")
        if state not in {"DEPLOYED","LOCAL_ONLY"}: return fail(f"{name}: invalid state {state!r}")
        if state=="DEPLOYED":
            recorded=meta.get("repository_blob_sha")
            if not recorded: return fail(f"{name}: DEPLOYED requires repository_blob_sha")
            if actual[name]!=recorded: drift.append(name)
    if drift: return fail(f"deployed source changed without runtime reconciliation: {drift}")
    deployed=sum(1 for m in expected.values() if m.get("state")=="DEPLOYED")
    local_only=sum(1 for m in expected.values() if m.get("state")=="LOCAL_ONLY")
    print(f"EDGE_RUNTIME_RECONCILIATION=PASS repository={len(actual)} deployed={deployed} local_only={local_only}")
    return 0

if __name__=="__main__":
    raise SystemExit(main())
