#!/usr/bin/env python3
"""
Schema dictionary builder and validator.

Builds a complete table→columns mapping from all supabase/*.sql files,
then validates every .select()/.insert()/.update()/.upsert() call in
.html/.js files against the live schema. Reports column-name mismatches
with exact file:line references.

Exit code 0 if clean, 1 if critical findings.
"""

import os
import re
import sys
from pathlib import Path

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

# ============================================================================
# SCHEMA PARSING
# ============================================================================

def parse_sql_files():
    """Parse all supabase/*.sql files and build table→columns dictionary."""
    schema = {}
    sql_dir = Path("supabase")

    if not sql_dir.exists():
        print("ERROR: supabase/ directory not found")
        return schema

    for sql_file in sorted(sql_dir.glob("*.sql")):
        with open(sql_file, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()

        # Parse CREATE TABLE statements
        create_table_pattern = r"CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?(\w+)\s*\(([\s\S]*?)\)(?:\s+WITH|;)"
        for match in re.finditer(create_table_pattern, content, re.IGNORECASE):
            table_name = match.group(1)
            body = match.group(2)

            if table_name not in schema:
                schema[table_name] = {"columns": set(), "files": []}

            schema[table_name]["files"].append(sql_file.name)

            # Extract column names from the CREATE TABLE body
            # Match patterns like: column_name type [constraints]
            col_pattern = r"^\s*(\w+)\s+\w+.*?(?:,|$)"
            for col_match in re.finditer(col_pattern, body, re.MULTILINE):
                col_name = col_match.group(1)
                # Skip SQL keywords and table constraints
                if col_name.upper() not in ("PRIMARY", "UNIQUE", "FOREIGN", "CHECK", "CONSTRAINT", "INDEX"):
                    schema[table_name]["columns"].add(col_name)

        # Parse ALTER TABLE ADD COLUMN statements
        alter_pattern = r"ALTER\s+TABLE\s+(?:public\.)?(\w+)\s+ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+(\w+)"
        for match in re.finditer(alter_pattern, content, re.IGNORECASE):
            table_name = match.group(1)
            col_name = match.group(2)

            if table_name not in schema:
                schema[table_name] = {"columns": set(), "files": []}

            if sql_file.name not in schema[table_name]["files"]:
                schema[table_name]["files"].append(sql_file.name)

            schema[table_name]["columns"].add(col_name)

    return schema


def validate_client_calls(schema):
    """Scan all .html/.js files for .select()/.insert()/.update()/.upsert()/.rpc() calls.

    Returns list of (file, line_num, table, column, is_error) tuples.
    """
    findings = []

    # Patterns for Supabase calls
    patterns = [
        # .select('col1,col2,...')
        (r"\.select\(['\"]([^'\"]+)['\"]\)", "select", False),
        # .insert({col: value, ...})
        (r"\.insert\s*\(\s*\{([^}]+)\}", "insert", True),
        # .update({col: value, ...})
        (r"\.update\s*\(\s*\{([^}]+)\}", "update", True),
        # .upsert({col: value, ...})
        (r"\.upsert\s*\(\s*\{([^}]+)\}", "upsert", True),
    ]

    for html_file in Path(".").glob("*.html"):
        with open(html_file, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()

        # Look for .from('table_name') to get context
        for from_match in re.finditer(r"\.from\(['\"](\w+)['\"]\)", content):
            table_name = from_match.group(1)
            if table_name not in schema:
                continue

            # Check patterns after this .from() call
            search_start = from_match.end()
            for pattern, op_type, is_write in patterns:
                for match in re.finditer(pattern, content[search_start:]):
                    fields_str = match.group(1)

                    if op_type == "select":
                        # Parse select fields (col1,col2,...)
                        fields = [f.strip() for f in fields_str.split(",")]
                    else:
                        # Parse object keys (col: value, ...)
                        key_pattern = r"(\w+)\s*:"
                        fields = [m.group(1) for m in re.finditer(key_pattern, fields_str)]

                    # Validate each field
                    for field in fields:
                        if field and field not in schema[table_name]["columns"]:
                            line_num = content[:search_start + match.start()].count("\n") + 1
                            findings.append((
                                str(html_file),
                                line_num,
                                table_name,
                                field,
                                is_write
                            ))

    # Same for .js files
    for js_file in Path(".").glob("**/*.js"):
        with open(js_file, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()

        for from_match in re.finditer(r"\.from\(['\"](\w+)['\"]\)", content):
            table_name = from_match.group(1)
            if table_name not in schema:
                continue

            search_start = from_match.end()
            for pattern, op_type, is_write in patterns:
                for match in re.finditer(pattern, content[search_start:]):
                    fields_str = match.group(1)

                    if op_type == "select":
                        fields = [f.strip() for f in fields_str.split(",")]
                    else:
                        key_pattern = r"(\w+)\s*:"
                        fields = [m.group(1) for m in re.finditer(key_pattern, fields_str)]

                    for field in fields:
                        if field and field not in schema[table_name]["columns"]:
                            line_num = content[:search_start + match.start()].count("\n") + 1
                            findings.append((
                                str(js_file),
                                line_num,
                                table_name,
                                field,
                                is_write
                            ))

    return findings


# ============================================================================
# MAIN
# ============================================================================

def main():
    """Build schema and validate client calls."""
    print("Building schema dictionary from supabase/*.sql...")
    schema = parse_sql_files()

    if not schema:
        print("WARNING — no tables found in supabase/*.sql")
        return 0

    print(f"Found {len(schema)} tables with {sum(len(t['columns']) for t in schema.values())} total columns.")

    print("\nValidating client-side .select()/.insert()/.update()/.upsert() calls...")
    findings = validate_client_calls(schema)

    if not findings:
        print("OK — all client calls reference existing columns.")
        return 0

    # Report findings
    print(f"\nFOUND {len(findings)} COLUMN-NAME MISMATCH(ES):")
    for file_path, line_num, table, column, is_write in findings:
        op_type = "write to" if is_write else "read from"
        print(f"  {file_path}:{line_num} — {op_type} {table}.{column} (column does not exist)")

    return 1


if __name__ == "__main__":
    sys.exit(main())
