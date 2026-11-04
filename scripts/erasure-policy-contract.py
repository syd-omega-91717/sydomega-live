#!/usr/bin/env python3
"""Check that every table holding member data is classified for erasure.

docs/legal/ERASURE_PLAN.md (finding 9): the prototype purge deletes every table with a member
column unless a human listed it, so a table added next month is silently deleted or silently kept.
This contract makes classification a merge requirement. `config/erasure-policy.json` must list
every public table in `supabase/live-schema.json` that carries a member column (user_id,
profile_id, member_id) or a reference column (owner_id, author_id, actor_id, created_by,
sender_id, recipient_id, granted_by), with an action and a reason.

Default mode (blocking in CI) checks completeness and shape only; it passes while rows are still
unreviewed or pending a decision.

    python3 scripts/erasure-policy-contract.py          completeness and shape
    python3 scripts/erasure-policy-contract.py --gate   ALSO require every row reviewed and no
                                                        pending_decision. This is the check that
                                                        must pass before erasure_worker_enabled
                                                        is ever set to true. It is expected to
                                                        fail until the owner and counsel decide.

The snapshot (supabase/live-schema.json) is dated and is not a live connection, so a table added after it
was captured would be invisible. To close that gap the contract ALSO reads supabase/migrations/*.sql: any
table a migration creates with a member column (user_id, profile_id, member_id) is required too, and a
table a later migration drops is not. That parser was measured against a replica built by replaying every
migration (116 member-data tables): it missed none and over-reported one that a later migration drops,
which DROP TABLE handling now removes. It reads SQL text, so it cannot see a table created by hand in the
dashboard; that is what the snapshot and docs/runtime/production-facts.sql are for.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCHEMA = ROOT / "supabase" / "live-schema.json"
POLICY = ROOT / "config" / "erasure-policy.json"
MIGRATIONS = ROOT / "supabase" / "migrations"

MEMBER_COLUMNS = ("user_id", "profile_id", "member_id")
REFERENCE_COLUMNS = ("owner_id", "author_id", "actor_id", "created_by", "sender_id", "recipient_id", "granted_by")
ACTIONS = {"delete", "anonymise", "retain", "pending_decision"}
# profiles is removed together with auth.users, not classified table by table.
EXEMPT = {"profiles"}


def required_tables(schema: dict) -> set[str]:
    out: set[str] = set()
    for qualified, columns in schema.get("tables", {}).items():
        if not qualified.startswith("public."):
            continue
        name = qualified[len("public."):]
        if name in EXEMPT:
            continue
        if any(c in columns for c in MEMBER_COLUMNS + REFERENCE_COLUMNS):
            out.add(name)
    return out


def _strip_sql_comments(sql: str) -> str:
    sql = re.sub(r"--[^\n]*", "", sql)
    return re.sub(r"/\*.*?\*/", "", sql, flags=re.S)


def tables_from_migrations(directory: Path) -> tuple[set[str], set[str]]:
    """Return (every table the migrations leave in public, those with a member column).

    Files are read in name order, as the Supabase CLI applies them; a DROP TABLE removes a table.
    """
    created: set[str] = set()
    member: set[str] = set()
    if not directory.is_dir():
        return created, member
    for path in sorted(directory.glob("*.sql")):
        sql = _strip_sql_comments(path.read_text(encoding="utf-8", errors="replace"))
        for m in re.finditer(r'create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?"?([a-z_][a-z0-9_]*)"?\s*\(', sql, flags=re.I):
            name, i, depth = m.group(1).lower(), m.end(), 1
            while i < len(sql) and depth:
                depth += (sql[i] == "(") - (sql[i] == ")")
                i += 1
            body = sql[m.end():i - 1]
            created.add(name)
            if any(re.search(r'(^|,)\s*"?%s"?\s+uuid\b' % c, body, flags=re.I | re.M) for c in MEMBER_COLUMNS):
                member.add(name)
        for m in re.finditer(r'alter\s+table\s+(?:if\s+exists\s+)?(?:only\s+)?(?:public\.)?"?([a-z_][a-z0-9_]*)"?\s+(.*?);', sql, flags=re.I | re.S):
            if any(re.search(r'add\s+column\s+(?:if\s+not\s+exists\s+)?"?%s"?\s+uuid\b' % c, m.group(2), flags=re.I) for c in MEMBER_COLUMNS):
                member.add(m.group(1).lower())
        for m in re.finditer(r'drop\s+table\s+(?:if\s+exists\s+)?([^;]+);', sql, flags=re.I):
            for part in m.group(1).split(","):
                name = re.sub(r'^\s*(?:public\.)?"?([a-z_][a-z0-9_]*)"?.*$', r"\1", part.strip(), flags=re.I | re.S).lower()
                created.discard(name)
                member.discard(name)
    return created - EXEMPT, member - EXEMPT


def check(schema: dict, policy: dict, gate: bool, mig_all: set[str] | None = None, mig_member: set[str] | None = None) -> list[str]:
    problems: list[str] = []
    rows = policy.get("tables")
    if not isinstance(rows, dict) or not rows:
        return ["config/erasure-policy.json has no 'tables' object"]
    required = required_tables(schema) | (mig_member or set())
    snapshot = {q[len("public."):] for q in schema.get("tables", {}) if q.startswith("public.")} | (mig_all or set())

    for name in sorted(required - set(rows)):
        problems.append(f"unclassified: public.{name} has a member or reference column but is not in the policy")
    for name in sorted(set(rows) - snapshot):
        problems.append(f"stale: {name} is in the policy but not in the schema snapshot")
    for name, row in sorted(rows.items()):
        if not isinstance(row, dict):
            problems.append(f"{name}: row is not an object")
            continue
        if row.get("action") not in ACTIONS:
            problems.append(f"{name}: action {row.get('action')!r} is not one of {sorted(ACTIONS)}")
        if not str(row.get("why", "")).strip():
            problems.append(f"{name}: missing 'why'")
        if not isinstance(row.get("reviewed"), bool):
            problems.append(f"{name}: 'reviewed' must be true or false")
        if gate:
            if row.get("action") == "pending_decision":
                problems.append(f"gate: {name} is still pending_decision")
            elif row.get("reviewed") is not True:
                problems.append(f"gate: {name} is not reviewed")
    return problems


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--gate", action="store_true", help="also require every row reviewed and none pending")
    parser.add_argument("--schema", type=Path, default=SCHEMA)
    parser.add_argument("--policy", type=Path, default=POLICY)
    parser.add_argument("--migrations", type=Path, default=MIGRATIONS, help="directory of migrations to read as well as the snapshot")
    args = parser.parse_args()
    try:
        schema = json.loads(args.schema.read_text(encoding="utf-8"))
        policy = json.loads(args.policy.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        print(f"::error::cannot read inputs: {exc}")
        return 1
    mig_all, mig_member = tables_from_migrations(args.migrations)
    problems = check(schema, policy, args.gate, mig_all, mig_member)
    rows = policy.get("tables", {})
    pending = sum(1 for r in rows.values() if isinstance(r, dict) and r.get("action") == "pending_decision")
    unreviewed = sum(1 for r in rows.values() if isinstance(r, dict) and r.get("reviewed") is not True)
    print(f"erasure policy: {len(rows)} tables classified, {pending} pending a decision, {unreviewed} not reviewed")
    if problems:
        print("::error::erasure policy contract failed" + (" (gate)" if args.gate else ""))
        for p in problems[:60]:
            print(f"  {p}")
        if len(problems) > 60:
            print(f"  ... and {len(problems) - 60} more")
        return 1
    print("OK — every table with a member or reference column is classified." + ("" if args.gate else " (not gated: rows may still be pending)"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
