#!/usr/bin/env python3
"""
Migration deployability validator.

supabase/migrations/ is the deployment sequence: `supabase db push` applies it,
and the live project records what it applied in
supabase_migrations.schema_migrations. On 2026-09-05 that ledger held 169 rows
(0001 .. 20260905080109) against 169 local files -- an exact match. The flat
supabase/*.sql bag has no ledger and is applied, when at all, by hand.

So schema declared ONLY in the flat bag never reaches production. That is the
one asymmetry worth gating, and it is what this script checks.

It used to demand the two directories hold identical CREATE-definition hash
SETS. That encoded the opposite architecture and made every PR red: the flat
bag legitimately carries stale and duplicate variants of tables migrations/
already defines, and migrations/ legitimately carries definitions with no
flat-bag twin. Neither direction of that difference can stop a deployment, so
neither is a defect. See FIXES_LOG and CLAUDE.md section 5.

Exit code 0 if clean, 1 if anything in the flat bag would never deploy.
"""

import sys as _sys
if "--help" in _sys.argv[1:] or "-h" in _sys.argv[1:]:
    print(__doc__.strip())
    raise SystemExit(0)

import hashlib
import os
import re
import sys
from pathlib import Path
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

# ============================================================================
# SCHEMA PARSING
# ============================================================================

def parse_creates_and_alters(sql_text):
    """Parse all CREATE TABLE and ALTER TABLE statements from SQL text."""
    statements = {"creates": defaultdict(list), "alters": defaultdict(list)}

    # CREATE TABLE statements
    create_pattern = r"CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?(\w+)\s*\(([\s\S]*?)\)(?:\s+WITH|;)"
    for match in re.finditer(create_pattern, sql_text, re.IGNORECASE):
        table_name = match.group(1)
        body = match.group(2)
        # Normalize: strip extra whitespace, lowercase keywords for comparison
        normalized = " ".join(body.split())
        statements["creates"][table_name].append({
            "body": body,
            "normalized": normalized,
            "hash": hashlib.sha256(normalized.encode()).hexdigest()[:16],
        })

    # ALTER TABLE ADD COLUMN statements
    alter_pattern = r"ALTER\s+TABLE\s+(?:public\.)?(\w+)\s+ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+(\w+)\s+(\w+(?:\s+[^,;]+)?)"
    for match in re.finditer(alter_pattern, sql_text, re.IGNORECASE):
        table_name = match.group(1)
        col_name = match.group(2)
        col_type = match.group(3).strip()
        statements["alters"][table_name].append({
            "column": col_name,
            "type": col_type,
        })

    return statements


def load_schema_from_files(directory_pattern):
    """Load schema from directory matching pattern."""
    schema = defaultdict(lambda: {"files": [], "creates": [], "alters": []})

    for sql_file in sorted(Path(".").glob(directory_pattern)):
        with open(sql_file, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()

        stmts = parse_creates_and_alters(content)

        for table_name, creates in stmts["creates"].items():
            schema[table_name]["files"].append(sql_file.name)
            schema[table_name]["creates"].extend(creates)

        for table_name, alters in stmts["alters"].items():
            schema[table_name]["alters"].extend(alters)

    return schema


def compare_schemas(flat_schema, migrations_schema):
    """Report flat-bag schema that the deployment sequence would never apply."""
    findings = []

    for table in sorted(flat_schema.keys()):
        flat_creates = flat_schema.get(table, {}).get("creates", [])
        mig_creates = migrations_schema.get(table, {}).get("creates", [])

        # A table the flat bag declares and migrations/ never defines is
        # unreachable: `supabase db push` will not create it.
        if flat_creates and not mig_creates:
            findings.append({
                "severity": "CRITICAL",
                "table": table,
                "message": "declared in the flat bag but absent from migrations/ -- it would never deploy",
                "flat_files": flat_schema[table]["files"],
            })
            continue

        # Per column, not merely "migrations/ has no ALTERs at all". The old
        # form was `if flat_cols and not mig_cols`, which cleared a table the
        # moment migrations/ carried any unrelated ADD COLUMN -- so a genuinely
        # missing column hid behind an unrelated present one.
        flat_cols = {a["column"] for a in flat_schema.get(table, {}).get("alters", [])}
        mig_cols = {a["column"] for a in migrations_schema.get(table, {}).get("alters", [])}

        # A column migrations/ declares inline in its CREATE TABLE body is
        # deployed just as surely as one added by a later ALTER.
        mig_inline = set()
        for c in mig_creates:
            mig_inline |= {m.group(1) for m in re.finditer(r"^\s*(\w+)\s", c["body"], re.MULTILINE)}

        missing = flat_cols - mig_cols - mig_inline
        if missing:
            findings.append({
                "severity": "CRITICAL",
                "table": table,
                "message": "column(s) added in the flat bag but absent from migrations/, so never deployed: "
                           + ", ".join(sorted(missing)),
                "flat_files": flat_schema[table]["files"],
            })

    return findings


# ============================================================================
# MAIN
# ============================================================================

def main():
    """Check migration consistency."""
    print("Loading schema from supabase/*.sql...")
    flat_schema = load_schema_from_files("supabase/*.sql")

    print(f"Found {len(flat_schema)} tables in flat bag.")

    if not Path("supabase/migrations").exists():
        print("INFO — supabase/migrations/ not found, skipping migrations comparison")
        return 0

    print("Loading schema from supabase/migrations/*.sql...")
    mig_schema = load_schema_from_files("supabase/migrations/*.sql")

    print(f"Found {len(mig_schema)} tables in migrations/.")

    print("\nComparing schemas...")
    findings = compare_schemas(flat_schema, mig_schema)

    if not findings:
        print("OK — everything the flat bag declares is reachable through migrations/.")
        return 0

    print(f"\nFOUND {len(findings)} UNDEPLOYABLE DECLARATION(S):")
    for f in findings:
        print(f"  {f['table']}: {f['message']}")
        if f.get("flat_files"):
            print(f"    Flat bag: {', '.join(f['flat_files'])}")

    return 1


if __name__ == "__main__":
    sys.exit(main())
