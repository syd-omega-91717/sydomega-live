#!/usr/bin/env python3
"""
Auto-generate TypeScript types from SQL schema.

Reads supabase/*.sql files, parses CREATE TABLE statements, and generates
a .d.ts file with TypeScript interfaces for every table and RPC.

Generated types are kept in sync with the actual schema, catching type
mismatches between client code and database.

Exit code 0 if successful, 1 if generation failed.
"""

import os
import re
import sys
from pathlib import Path
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

# ============================================================================
# TYPE MAPPING
# ============================================================================

SQL_TYPE_MAP = {
    "text": "string",
    "varchar": "string",
    "char": "string",
    "uuid": "string",
    "int": "number",
    "integer": "number",
    "bigint": "number",
    "serial": "number",
    "smallint": "number",
    "decimal": "number",
    "numeric": "number",
    "real": "number",
    "double": "number",
    "boolean": "boolean",
    "bool": "boolean",
    "timestamp": "string",  # ISO 8601
    "date": "string",
    "time": "string",
    "json": "Record<string, any>",
    "jsonb": "Record<string, any>",
    "bytea": "Buffer",
    "enum": "string",
}


def sql_type_to_ts(sql_type):
    """Convert SQL type to TypeScript type."""
    sql_type = sql_type.lower().strip()

    # Handle array types (e.g. text[])
    if sql_type.endswith("[]"):
        base = sql_type[:-2]
        base_ts = sql_type_to_ts(base)
        return f"{base_ts}[]"

    # Handle direct matches
    for sql, ts in SQL_TYPE_MAP.items():
        if sql_type.startswith(sql):
            return ts

    # Default fallback
    return "any"


def parse_table_schema():
    """Parse all tables and columns from supabase/*.sql files."""
    tables = defaultdict(lambda: {"columns": {}, "files": []})
    rpcs = defaultdict(lambda: {"params": {}, "return_type": "any", "files": []})

    sql_dir = Path("supabase")
    if not sql_dir.exists():
        return tables, rpcs

    for sql_file in sorted(sql_dir.glob("*.sql")):
        with open(sql_file, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()

        # Parse CREATE TABLE
        create_pattern = r"CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?(\w+)\s*\(([\s\S]*?)\)(?:\s+WITH|;)"
        for match in re.finditer(create_pattern, content, re.IGNORECASE):
            table_name = match.group(1)
            body = match.group(2)

            if sql_file.name not in tables[table_name]["files"]:
                tables[table_name]["files"].append(sql_file.name)

            # Parse columns: "name type [constraints]"
            col_pattern = r"^\s*(\w+)\s+(\w+(?:\s+[\w\s()]*?)?)\s*(?:DEFAULT|,|;|$)"
            for col_match in re.finditer(col_pattern, body, re.MULTILINE | re.IGNORECASE):
                col_name = col_match.group(1)
                col_type = col_match.group(2).strip()

                # Skip SQL keywords
                if col_name.upper() not in ("PRIMARY", "UNIQUE", "FOREIGN", "CHECK", "CONSTRAINT", "INDEX"):
                    # Determine nullability (assume nullable unless NOT NULL)
                    is_nullable = "NOT NULL" not in body[col_match.start():col_match.end()].upper()
                    ts_type = sql_type_to_ts(col_type)

                    tables[table_name]["columns"][col_name] = {
                        "type": ts_type,
                        "nullable": is_nullable,
                    }

        # Parse ALTER TABLE ADD COLUMN
        alter_pattern = r"ALTER\s+TABLE\s+(?:public\.)?(\w+)\s+ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+(\w+)\s+(\w+(?:\s+[^,;]+)?)"
        for match in re.finditer(alter_pattern, content, re.IGNORECASE):
            table_name = match.group(1)
            col_name = match.group(2)
            col_type = match.group(3).strip()

            if sql_file.name not in tables[table_name]["files"]:
                tables[table_name]["files"].append(sql_file.name)

            is_nullable = True  # ALTERs typically allow null
            ts_type = sql_type_to_ts(col_type)

            tables[table_name]["columns"][col_name] = {
                "type": ts_type,
                "nullable": is_nullable,
            }

        # Parse CREATE FUNCTION (RPC definitions)
        func_pattern = r"CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.(\w+)\s*\(([\s\S]*?)\)\s+RETURNS\s+(\w+)"
        for match in re.finditer(func_pattern, content, re.IGNORECASE):
            func_name = match.group(1)
            params_str = match.group(2)
            return_type = match.group(3).lower().strip()

            if sql_file.name not in rpcs[func_name]["files"]:
                rpcs[func_name]["files"].append(sql_file.name)

            # Parse parameters: "p_name type DEFAULT value"
            param_pattern = r"(\w+)\s+(\w+)(?:\s+DEFAULT)?"
            for param_match in re.finditer(param_pattern, params_str):
                param_name = param_match.group(1)
                param_type = param_match.group(2).lower()

                rpcs[func_name]["params"][param_name] = sql_type_to_ts(param_type)

            # Map return type
            if return_type in ("void", "json", "jsonb", "TABLE"):
                rpcs[func_name]["return_type"] = return_type.lower()
            else:
                rpcs[func_name]["return_type"] = sql_type_to_ts(return_type)

    return tables, rpcs


def generate_types_file(tables, rpcs):
    """Generate TypeScript types file."""
    lines = [
        '/**',
        ' * Auto-generated TypeScript types from supabase schema.',
        ' * Generated by scripts/types-from-schema.py — DO NOT EDIT MANUALLY',
        ' * To regenerate, run: python3 scripts/types-from-schema.py',
        ' */',
        '',
    ]

    # Table types
    if tables:
        lines.append("// ============================================================================")
        lines.append("// Table Types")
        lines.append("// ============================================================================")
        lines.append("")

        for table_name in sorted(tables.keys()):
            table = tables[table_name]
            if not table["columns"]:
                continue

            # Interface name: PascalCase
            interface_name = "".join(word.capitalize() for word in table_name.split("_"))
            lines.append(f"export interface {interface_name} {{")

            for col_name in sorted(table["columns"].keys()):
                col = table["columns"][col_name]
                ts_type = col["type"]
                if col["nullable"]:
                    ts_type += " | null"

                # Convert snake_case to camelCase for JS
                js_name = "".join(
                    word if i == 0 else word.capitalize()
                    for i, word in enumerate(col_name.split("_"))
                )

                lines.append(f"  {js_name}: {ts_type};")

            lines.append("}")
            lines.append("")

    # RPC types
    if rpcs:
        lines.append("// ============================================================================")
        lines.append("// RPC Function Types")
        lines.append("// ============================================================================")
        lines.append("")

        for func_name in sorted(rpcs.keys()):
            rpc = rpcs[func_name]
            if not rpc["params"]:
                continue

            # Type for parameters object
            lines.append(f"export interface {func_name}Params {{")
            for param_name in sorted(rpc["params"].keys()):
                param_type = rpc["params"][param_name]
                # Remove p_ prefix and convert to camelCase
                clean_name = param_name
                if clean_name.startswith("p_"):
                    clean_name = clean_name[2:]

                lines.append(f"  {clean_name}: {param_type};")

            lines.append("}")
            lines.append("")

    lines.append("// ============================================================================")
    lines.append("// Supabase Client Type")
    lines.append("// ============================================================================")
    lines.append("")
    lines.append("export interface Database {")
    lines.append("  public: {")
    lines.append("    Tables: {")

    for table_name in sorted(tables.keys()):
        interface_name = "".join(word.capitalize() for word in table_name.split("_"))
        lines.append(f"      {table_name}: {interface_name};")

    lines.append("    };")
    lines.append("  };")
    lines.append("}")
    lines.append("")

    return "\n".join(lines)


# ============================================================================
# MAIN
# ============================================================================

def main():
    """Generate TypeScript types."""
    print("Parsing SQL schema...")
    tables, rpcs = parse_table_schema()

    print(f"Found {len(tables)} tables, {len(rpcs)} RPC functions.")

    if not tables and not rpcs:
        print("WARNING — no tables or functions found")
        return 1

    print("Generating TypeScript types...")
    types_content = generate_types_file(tables, rpcs)

    output_file = Path("types/database.types.ts")
    output_file.parent.mkdir(exist_ok=True)

    with open(output_file, "w", encoding="utf-8") as f:
        f.write(types_content)

    print(f"OK — types written to {output_file}")
    print(f"  {len(tables)} table interfaces")
    print(f"  {len(rpcs)} RPC parameter types")

    return 0


if __name__ == "__main__":
    sys.exit(main())
