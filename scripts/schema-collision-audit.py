#!/usr/bin/env python3
"""Report duplicate and divergent CREATE TABLE definitions in the SQL source.

Usage:
  python3 scripts/schema-collision-audit.py
  python3 scripts/schema-collision-audit.py --json

The authoritative schema remains ``supabase/migrations/``. This tool is a
source-only diagnostic for the legacy ``supabase/*.sql`` bag; it never connects
to PostgreSQL and never applies or rewrites migrations. It is deliberately
non-blocking because only a live-schema comparison can establish which
competing definition matches production.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SQL_ROOT = ROOT / "supabase"
CREATE_RE = re.compile(
    r"CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:[\"']?public[\"']?\s*\.\s*)?"
    r"[\"']?([A-Za-z_][A-Za-z0-9_]*)[\"']?\s*\(",
    re.IGNORECASE,
)


def sql_files():
    yield from sorted(SQL_ROOT.glob("*.sql"))


def extract_create_statements(text: str):
    for match in CREATE_RE.finditer(text):
        depth = 1
        quote = None
        escaped = False
        i = match.end()
        while i < len(text) and depth:
            ch = text[i]
            if quote:
                if escaped:
                    escaped = False
                elif ch == "\\":
                    escaped = True
                elif ch == quote:
                    quote = None
            elif ch in "'\"":
                quote = ch
            elif ch == "(":
                depth += 1
            elif ch == ")":
                depth -= 1
            i += 1
        if depth == 0:
            body = text[match.end() : i - 1]
            yield match.group(1), body, match.start()


def normalize(sql: str) -> str:
    sql = re.sub(r"--[^\n]*", " ", sql)
    sql = re.sub(r"/\*.*?\*/", " ", sql, flags=re.S)
    return re.sub(r"\s+", " ", sql).strip().lower()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json", action="store_true", help="emit machine-readable JSON")
    args = parser.parse_args()

    definitions = {}
    for path in sql_files():
        text = path.read_text(encoding="utf-8", errors="replace")
        for table, body, offset in extract_create_statements(text):
            normalized = normalize(body)
            definitions.setdefault(table, []).append(
                {
                    "file": path.relative_to(ROOT).as_posix(),
                    "offset": offset,
                    "hash": hashlib.sha256(normalized.encode()).hexdigest()[:16],
                }
            )

    duplicates = {}
    for table, entries in definitions.items():
        if len(entries) > 1:
            hashes = sorted({entry["hash"] for entry in entries})
            duplicates[table] = {
                "definitions": len(entries),
                "distinct_shapes": len(hashes),
                "identical": len(hashes) == 1,
                "entries": entries,
            }

    divergent = {name: value for name, value in duplicates.items() if not value["identical"]}
    identical = {name: value for name, value in duplicates.items() if value["identical"]}
    result = {
        "audit": "schema-collision-audit",
        "sql_files": len(list(sql_files())),
        "tables_seen": len(definitions),
        "duplicated_tables": len(duplicates),
        "identical_duplicate_tables": len(identical),
        "divergent_duplicate_tables": len(divergent),
        "duplicates": duplicates,
        "authoritative_source": "supabase/migrations/",
        "live_database_touched": False,
    }

    if args.json:
        print(json.dumps(result, indent=2, sort_keys=True))
    else:
        print("OMEGA SCHEMA COLLISION AUDIT")
        print(f"SQL_FILES={result['sql_files']}")
        print(f"TABLES_SEEN={result['tables_seen']}")
        print(f"DUPLICATED_TABLES={result['duplicated_tables']}")
        print(f"IDENTICAL_DUPLICATES={result['identical_duplicate_tables']}")
        print(f"DIVERGENT_DUPLICATES={result['divergent_duplicate_tables']}")
        for table in sorted(divergent):
            value = divergent[table]
            print(f"DIVERGENT {table}: {value['definitions']} definitions / {value['distinct_shapes']} shapes")
        print("LIVE_DATABASE_TOUCHED=NO")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
