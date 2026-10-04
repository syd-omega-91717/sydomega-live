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
DROP_TABLE = re.compile(
    r"\bdrop\s+table\s+(?:if\s+exists\s+)?(?:[\w\"-]+\.)?([\w\"-]+)",
    re.IGNORECASE,
)

def unquote(name: str) -> str:
    """Bare, lower-case relation name. live-schema.json switched to schema-
    qualified keys ("public.profiles") on 2026-10-01 (f1fb10ce); compared
    against bare migration names, every table then read as live-only and the
    overlap as 0 while this script still printed PASS."""
    name = name.strip('"').lower()
    return name[len("public."):] if name.startswith("public.") else name

def strip_sql_noise(text: str) -> str:
    """Blank out comments and single-quoted literals before matching CREATE TABLE.

    Prose like "-- create table if ... above" and literals like
    'CREATE TABLE AS' otherwise yield relations named "--", "above", "as",
    "if" (10 of the 13 "migration-only" tables measured 2026-10-04 were these;
    evidence-audit.py hit the same class with "as"). A single left-to-right
    scan, because regex passes interfere: an apostrophe inside a comment
    ("don't") would open a string and swallow real DDL. Dollar-quoted bodies
    are kept on purpose -- DO $$ ... CREATE TABLE ... $$ is real DDL."""
    out = []
    i, n = 0, len(text)
    while i < n:
        c = text[i]
        if c == "-" and text.startswith("--", i):
            j = text.find("\n", i)
            i = n if j < 0 else j
        elif c == "/" and text.startswith("/*", i):
            j = text.find("*/", i + 2)
            i = n if j < 0 else j + 2
            out.append(" ")
        elif c == "'":
            j = i + 1
            while j < n:
                if text[j] == "'":
                    if j + 1 < n and text[j + 1] == "'":
                        j += 2
                        continue
                    break
                j += 1
            i = j + 1
            out.append("''")
        else:
            out.append(c)
            i += 1
    return "".join(out)


def migration_tables() -> set[str]:
    found: set[str] = set()
    if not MIGRATIONS.exists():
        return found
    # Replay creates and drops in migration order: a table a later migration
    # drops (omega_agent_tool_registry / omega_agent_action_proposals, created
    # in 20260929113731 and dropped in 20260929115306) is not declared.
    for path in sorted(MIGRATIONS.rglob("*.sql")):
        text = strip_sql_noise(path.read_text(encoding="utf-8", errors="replace"))
        events = [(m.start(), "create", m.group(1)) for m in CREATE_TABLE.finditer(text)]
        for m in DROP_TABLE.finditer(text):
            # "ALTER PUBLICATION ... DROP TABLE x" leaves the table in place.
            stmt = text[text.rfind(";", 0, m.start()) + 1:m.start()]
            if not re.search(r"\bpublication\b", stmt, re.IGNORECASE):
                events.append((m.start(), "drop", m.group(1)))
        for _, kind, name in sorted(events):
            if kind == "create":
                found.add(unquote(name))
            else:
                found.discard(unquote(name))
    return found

def main() -> None:
    live = json.loads(LIVE.read_text(encoding="utf-8"))
    policy = json.loads(POLICY.read_text(encoding="utf-8"))
    tables = live.get("tables")
    if not isinstance(tables, dict) or not tables:
        raise SystemExit("OMEGA_SCHEMA_EVIDENCE=FAIL live schema is missing or empty")

    live_names = {unquote(str(x)) for x in tables}
    declared = migration_tables()

    both = sorted(live_names & declared)
    if live_names and declared and not both:
        raise SystemExit("OMEGA_SCHEMA_EVIDENCE=FAIL no table is both declared and live: "
                         "the snapshot's key format no longer matches (measuring nothing)")
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
