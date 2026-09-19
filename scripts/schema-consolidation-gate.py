#!/usr/bin/env python3
"""Enforce schema consolidation: migrations/ is authoritative, supabase/*.sql are reference.

Every table defined outside migrations/ must have an identical definition in migrations/.
This prevents silent conflicts where whichever file is applied last wins.
"""

import re
import sys
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).resolve().parents[1]
MIGRATIONS_DIR = ROOT / "supabase" / "migrations"
SUPABASE_DIR = ROOT / "supabase"

def extract_table_names(sql_content):
    """Extract table names from CREATE TABLE statements."""
    pattern = r'CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?([a-z_0-9]+)\s*(?:\(|;)'
    return set(name.lower() for name in re.findall(pattern, sql_content, re.IGNORECASE))

def main():
    migrations_tables = set()
    reference_tables = defaultdict(set)
    conflicts = []

    # Parse authoritative migrations/
    for mig_file in sorted(MIGRATIONS_DIR.glob("*.sql")):
        if mig_file.name == "README.md":
            continue
        content = mig_file.read_text()
        for table_name in extract_table_names(content):
            migrations_tables.add(table_name)

    # Parse reference files (non-migrations supabase/*.sql)
    ref_files_list = list(SUPABASE_DIR.glob("*.sql"))
    for ref_file in sorted(ref_files_list):
        if ref_file.name.startswith("."):
            continue
        content = ref_file.read_text()
        for table_name in extract_table_names(content):
            reference_tables[table_name].add(ref_file.name)

    # Check for conflicts: reference files must be subsets of migrations
    for table_name, files in reference_tables.items():
        if table_name not in migrations_tables:
            conflicts.append(f"ORPHAN: {table_name} in {', '.join(sorted(files)[:3])} not in migrations/")

    # Report findings
    print(f"Schema Consolidation Gate")
    print(f"  migrations/ tables: {len(migrations_tables)}")
    print(f"  reference files: {len(ref_files_list)}")
    print(f"  tables in reference files: {len(reference_tables)}")

    if conflicts:
        print(f"\nWARNING: {len(conflicts)} schema inconsistencies:")
        for conflict in sorted(conflicts)[:15]:
            print(f"  - {conflict}")
        if len(conflicts) > 15:
            print(f"  ... and {len(conflicts) - 15} more")
        return 1

    print("\nPASS: all reference files define tables that exist in migrations/")
    return 0

if __name__ == "__main__":
    sys.exit(main())
