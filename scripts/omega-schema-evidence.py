#!/usr/bin/env python3
"""Validate live-schema evidence against repository migration declarations.

This is an evidence report, not a schema deployment mechanism. The dated
supabase/live-schema.json snapshot is the only source that can mark a table
LIVE_VERIFIED. SQL migrations can only mark a table MIGRATION_DECLARED_UNVERIFIED.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LIVE = ROOT / "supabase/live-schema.json"
MIGRATIONS = ROOT / "supabase" / "migrations"
POLICY = ROOT / "config/omega-schema-evidence-policy.json"

CREATE_TABLE = re.compile(
    r"\bcreate\s+(?:or\s+replace\s+)?table\s+(?:if\s+not\s+exists\s+)?"
    r"(?:[\w\"-]+\.)?([\w\"-]+)",
    re.IGNORECASE,
)

def unquote(name: str) -> str:
    return name.strip('"').lower()

def migration_tables() -> set[str]:
    found: set[str] = set()
    if not MIGRATIONS.exists():
        return found
    for path in sorted(MIGRATIONS.rglob("*.sql")):
        text = path.read_text(encoding="utf-8", errors="replace")
        for match in CREATE_TABLE.finditer(text):
            found.add(unquote(match.group(1)))
    return found

def main() -> None:
    live = json.loads(LIVE.read_text(encoding="utf-8"))
    policy = json.loads(POLICY.read_text(encoding="utf-8"))
    tables = live.get("tables")
    if not isinstance(tables, dict) or not tables:
        raise SystemExit("OMEGA_SCHEMA_EVIDENCE=FAIL live schema is missing or empty")

    live_names = {str(x).lower() for x in tables}
    declared = migration_tables()

    both = sorted(live_names & declared)
    migration_only = sorted(declared - live_names)
    live_only = sorted(live_names - declared)

    capture = live.get("_captured")
    project = live.get("_project")
    if not capture or not project:
        raise SystemExit("OMEGA_SCHEMA_EVIDENCE=FAIL live evidence lacks capture/project metadata")
    if policy.get("contract") != "OmegaSchemaEvidence":
        raise SystemExit("OMEGA_SCHEMA_EVIDENCE=FAIL invalid evidence policy")

    report = {
        "contract": "OmegaSchemaEvidence",
        "policyVersion": policy.get("schemaVersion"),
        "captured": capture,
        "project": project,
        "liveTableCount": len(live_names),
        "migrationDeclaredTableCount": len(declared),
        "bothCount": len(both),
        "migrationOnlyCount": len(migration_only),
        "liveOnlyCount": len(live_only),
        "states": {
            "LIVE_VERIFIED": both,
            "BOTH": both,
            "MIGRATION_DECLARED_UNVERIFIED": migration_only,
            "UNKNOWN": [],
        },
    }
    print(json.dumps(report, indent=2, sort_keys=True))
    print(
        "OMEGA_SCHEMA_EVIDENCE=PASS "
        f"live={len(live_names)} migration_declared={len(declared)} "
        f"migration_only={len(migration_only)}"
    )

import sys

if "--help" in sys.argv:
    print(__doc__ or "")
    raise SystemExit(0)

if __name__ == "__main__":
    main()
