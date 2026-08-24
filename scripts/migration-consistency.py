#!/usr/bin/env python3
"""
Migration consistency validator.

Compares flat supabase/*.sql files against ordered supabase/migrations/*.sql.
Detects:
- Duplicate table definitions with incompatible schemas
- Mismatches between file versions
- Missing ALTER TABLE sequences
- Schema drift

Exit code 0 if clean, 1 if critical findings.
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
    """Compare flat and migrations schemas, report differences."""
    findings = []

    # Check for conflicting CREATE TABLE definitions
    all_tables = set(flat_schema.keys()) | set(migrations_schema.keys())

    for table in all_tables:
        flat_creates = flat_schema.get(table, {}).get("creates", [])
        mig_creates = migrations_schema.get(table, {}).get("creates", [])

        if flat_creates and mig_creates:
            # Both have definitions - check if they match
            flat_hashes = {c["hash"] for c in flat_creates}
            mig_hashes = {c["hash"] for c in mig_creates}

            if flat_hashes != mig_hashes:
                findings.append({
                    "severity": "WARNING",
                    "table": table,
                    "message": f"Definition mismatch: {len(flat_hashes)} variant(s) in flat bag, {len(mig_hashes)} in migrations/",
                    "flat_files": flat_schema[table]["files"],
                    "mig_files": migrations_schema[table]["files"] if table in migrations_schema else [],
                })

        # Check for missing ALTER columns
        flat_alters = flat_schema.get(table, {}).get("alters", [])
        mig_alters = migrations_schema.get(table, {}).get("alters", [])

        flat_cols = {a["column"] for a in flat_alters}
        mig_cols = {a["column"] for a in mig_alters}

        if flat_cols and not mig_cols:
            findings.append({
                "severity": "WARNING",
                "table": table,
                "message": f"ALTER TABLE columns defined in flat bag but missing in migrations/: {', '.join(sorted(flat_cols))}",
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
        print("OK — flat and migrations schemas are consistent.")
        return 0

    print(f"\nFOUND {len(findings)} CONSISTENCY ISSUE(S):")
    for f in findings:
        print(f"  {f['table']}: {f['message']}")
        if f.get("flat_files"):
            print(f"    Flat bag: {', '.join(f['flat_files'])}")

    return 1


if __name__ == "__main__":
    sys.exit(main())
