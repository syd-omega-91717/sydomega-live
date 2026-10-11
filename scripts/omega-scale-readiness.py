#!/usr/bin/env python3
"""Audit scale-sensitive repository evidence without pretending it is live SLO data."""
from __future__ import annotations
import json,re,pathlib
ROOT=pathlib.Path(__file__).resolve().parents[1]
cfg=json.loads((ROOT/"config/omega-scale-policy.json").read_text())
schema=ROOT/"supabase/live-schema.json"
if not schema.exists():
    print("OMEGA_SCALE_READINESS=UNKNOWN live-schema.json missing"); raise SystemExit(0)
data=json.loads(schema.read_text())
# Keys are schema-qualified ("public.profiles") since 2026-10-01; the policy
# names bare tables, so normalise or every lookup below silently misses.
tables={(k[len("public."):] if k.startswith("public.") else k).lower() for k in data.get("tables",{})}
candidates=cfg["partitioningCandidates"]
hot=cfg["hotPathCandidates"]
if tables and not any(x in tables for x in hot):
    raise SystemExit("OMEGA_SCALE_READINESS=FAIL no hot-path table found in the snapshot: "
                     "key format mismatch (measuring nothing)")
print(f"OMEGA_SCALE_READINESS=PASS table_snapshot={len(tables)}")
print("HOT_PATH_PRESENT="+",".join(x for x in hot if x in tables))
print("PARTITION_CANDIDATES_PRESENT="+",".join(x for x in candidates if x in tables))
if cfg.get("doNotAutoDeleteIndexes") is not True: raise SystemExit("scale policy must forbid automatic index deletion")
print("INDEX_POLICY=EVIDENCE_REQUIRED")
print("CLIENT_CONCURRENCY="+str(cfg["clientBudgets"]["maxConcurrentDataReads"]))
print("CLIENT_PAGE_MAX="+str(cfg["clientBudgets"]["maxPageSize"]))

import sys

if "--help" in sys.argv:
    print(__doc__ or "")
    raise SystemExit(0)
