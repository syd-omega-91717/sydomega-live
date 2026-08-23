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

def _strip_sql_comments(sql):
    """Remove -- line comments and /* */ block comments, respecting quotes.

    A comment containing commas silently corrupts column parsing. In
    platform_expansion.sql:

        activity_type text NOT NULL,  -- 'task_complete','gate_unlock','join',...

    the commas inside that comment were split as if they separated columns, and
    the real column that followed (`title`) was lost from the dictionary --
    which is why activity_feed.title was reported missing against five
    different files that all read it correctly.
    """
    out = []
    i = 0
    n = len(sql)
    while i < n:
        c = sql[i]
        if c in "'\"":
            quote = c
            out.append(c)
            i += 1
            while i < n:
                out.append(sql[i])
                if sql[i] == quote:
                    i += 1
                    break
                i += 1
            continue
        if c == "-" and i + 1 < n and sql[i + 1] == "-":
            while i < n and sql[i] != "\n":
                i += 1
            continue
        if c == "/" and i + 1 < n and sql[i + 1] == "*":
            i += 2
            while i + 1 < n and not (sql[i] == "*" and sql[i + 1] == "/"):
                i += 1
            i += 2
            continue
        out.append(c)
        i += 1
    return "".join(out)


def _split_top_level(body):
    """Split a CREATE TABLE body on commas that are NOT inside parentheses.

    A plain body.split(",") breaks on commas belonging to a constraint, e.g.

        depth text DEFAULT 'standard' CHECK (depth IN ('quick','standard','deep')),
        created_at timestamp DEFAULT now(),

    Those inner commas produced fragments that matched no column, and every
    real column defined after such a line was dropped from the dictionary --
    which is why council_deliberations.created_at was reported missing even
    though it is declared two lines below the CHECK.
    """
    parts = []
    depth = 0
    token = []
    i = 0
    n = len(body)
    while i < n:
        c = body[i]
        if c in "'\"":
            quote = c
            token.append(c)
            i += 1
            while i < n:
                token.append(body[i])
                if body[i] == quote:
                    i += 1
                    break
                i += 1
            continue
        if c == "(":
            depth += 1
        elif c == ")":
            depth -= 1
        if c == "," and depth == 0:
            parts.append("".join(token))
            token = []
        else:
            token.append(c)
        i += 1
    parts.append("".join(token))
    return parts


# Columns that are live in production but appear in no CREATE TABLE in this
# repo, because they were created out-of-band. Documented in CLAUDE.md §8:
# the owner's live public.task_completions has an older shape (id bigint,
# user_id, kind, task, completed_at, axis, increment, created_at) confirmed
# via information_schema.columns, which matches none of the competing
# definitions in the SQL bag. Without this the checker permanently reports
# columns that genuinely exist, and an advisory checker that cries wolf is one
# nobody reads -- which is exactly what had happened here.
KNOWN_LIVE_COLUMNS = {
    "task_completions": {"kind", "task", "axis", "increment"},
}


def parse_sql_files():
    """Parse all supabase/*.sql files and build table→columns dictionary."""
    schema = {}
    sql_dir = Path("supabase")

    if not sql_dir.exists():
        print("ERROR: supabase/ directory not found")
        return schema

    for sql_file in sorted(sql_dir.glob("*.sql")):
        with open(sql_file, "r", encoding="utf-8", errors="ignore") as f:
            content = _strip_sql_comments(f.read())

        # Parse CREATE TABLE statements
        create_table_pattern = r"CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?(\w+)\s*\(([\s\S]*?)\)(?:\s+WITH|;)"
        for match in re.finditer(create_table_pattern, content, re.IGNORECASE):
            table_name = match.group(1)
            body = match.group(2)

            if table_name not in schema:
                schema[table_name] = {"columns": set(), "files": []}

            schema[table_name]["files"].append(sql_file.name)

            # Extract column names from the CREATE TABLE body.
            # Split only on top-level commas -- see _split_top_level.
            for segment in _split_top_level(body):
                # Match first identifier that is followed by a type
                col_match = re.match(r"^\s*(\w+)\s+(?:timestamptz|timestamp|varchar|character\s+varying|char|text|bigserial|smallserial|serial|bigint|smallint|integer|int8|int4|int2|int|uuid|numeric|decimal|boolean|bool|jsonb|json|real|double\s+precision|double|float8|float4|float|date|time|bytea|xml|interval|inet|money|citext)\b", segment, re.IGNORECASE)
                if col_match:
                    col_name = col_match.group(1)
                    # Skip SQL keywords and table constraints
                    if col_name.upper() not in ("PRIMARY", "UNIQUE", "FOREIGN", "CHECK", "CONSTRAINT", "INDEX", "GRANT", "DROP", "ALTER"):
                        schema[table_name]["columns"].add(col_name)

        # Parse ALTER TABLE ... ADD COLUMN statements.
        # One ALTER statement may add SEVERAL columns:
        #     ALTER TABLE public.profiles
        #       ADD COLUMN IF NOT EXISTS a text,
        #       ADD COLUMN IF NOT EXISTS membership_tier text DEFAULT 'INITIATE',
        # The previous pattern anchored ADD COLUMN directly to ALTER TABLE, so
        # it only ever captured the FIRST column and silently dropped the rest.
        # That is why membership_tier -- a real column, present in 32 files --
        # was being reported as "column does not exist" against bg.js.
        # IF NOT EXISTS is optional here too; requiring it missed plain forms.
        alter_stmt = r"ALTER\s+TABLE\s+(?:public\.)?(\w+)([^;]*)"
        add_col = r"ADD\s+COLUMN\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)"
        for match in re.finditer(alter_stmt, content, re.IGNORECASE | re.DOTALL):
            table_name = match.group(1)
            body = match.group(2)
            cols = [m.group(1) for m in re.finditer(add_col, body, re.IGNORECASE)]
            if not cols:
                continue

            if table_name not in schema:
                schema[table_name] = {"columns": set(), "files": []}

            if sql_file.name not in schema[table_name]["files"]:
                schema[table_name]["files"].append(sql_file.name)

            for col_name in cols:
                schema[table_name]["columns"].add(col_name)

    # Fold in columns known to be live but absent from the SQL bag.
    for table, cols in KNOWN_LIVE_COLUMNS.items():
        if table in schema:
            schema[table]["columns"].update(cols)

    return schema


def _object_body(content, brace_pos):
    """Return the text inside a { ... } starting at brace_pos, brace-matched.

    The patterns below previously captured the object with `\{([^}]+)\}`, which
    stops at the FIRST closing brace. For a payload like

        .insert({ event_type:'x', metrics:{ lcp:1, fcp:2 } })

    that captured up to metrics' own closing brace, so lcp/fcp were pulled out
    as if they were top-level columns of the table. They are keys inside a jsonb
    value. Brace matching plus _top_level_keys below fixes both halves.
    """
    depth = 0
    i = brace_pos
    n = len(content)
    while i < n:
        c = content[i]
        if c in "\"'":
            quote = c
            i += 1
            while i < n and content[i] != quote:
                if content[i] == "\\":
                    i += 1
                i += 1
        elif c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                return content[brace_pos + 1:i]
        i += 1
    return content[brace_pos + 1:]


def _top_level_keys(obj_body):
    """Keys declared directly on the object, ignoring keys nested inside it."""
    keys = []
    depth = 0
    token = ""
    i = 0
    n = len(obj_body)
    while i < n:
        c = obj_body[i]
        if c in "\"'":
            quote = c
            i += 1
            while i < n and obj_body[i] != quote:
                if obj_body[i] == "\\":
                    i += 1
                i += 1
            token = ""
        elif c in "{[(":
            depth += 1
            token = ""
        elif c in "}])":
            depth -= 1
            token = ""
        elif c == ":" and depth == 0:
            name = token.strip()
            if name.isidentifier():
                keys.append(name)
            token = ""
        elif c == "," and depth == 0:
            token = ""
        else:
            token += c
        i += 1
    return keys


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
        (r"\.insert\s*\(\s*\{", "insert", True),
        # .update({col: value, ...})
        (r"\.update\s*\(\s*\{", "update", True),
        # .upsert({col: value, ...})
        (r"\.upsert\s*\(\s*\{", "upsert", True),
    ]

    for html_file in Path(".").glob("*.html"):
        with open(html_file, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()

        # Look for .from('table_name') to get context
        for from_match in re.finditer(r"\.from\(['\"](\w+)['\"]\)", content):
            table_name = from_match.group(1)
            if table_name not in schema:
                continue

            # Check patterns after this .from() call, up to the NEXT .from().
            # Previously the window ran to the end of the file, so every table
            # was blamed for every .select() that appeared later anywhere in
            # that file -- which is why profiles was reported as missing
            # activity_type and title (they belong to activity_feed, selected
            # further down omega-live.js).
            search_start = from_match.end()
            nxt = re.search(r"\.from\(['\"]\w+['\"]\)", content[search_start:])
            window_end = search_start + (nxt.start() if nxt else len(content) - search_start)
            for pattern, op_type, is_write in patterns:
                for match in re.finditer(pattern, content[search_start:window_end]):
                    if op_type == "select":
                        fields = [f.strip() for f in match.group(1).split(",")]
                    else:
                        body = _object_body(content, search_start + match.end() - 1)
                        fields = _top_level_keys(body)

                    # Validate each field
                    for field in fields:
                        # `*` is not a column, and neither is an embedded
                        # resource like `profiles(display_name)` -- PostgREST
                        # select syntax, not a column of this table.
                        if not field or field == "*" or "(" in field:
                            continue
                        if field not in schema[table_name]["columns"]:
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
            nxt = re.search(r"\.from\(['\"]\w+['\"]\)", content[search_start:])
            window_end = search_start + (nxt.start() if nxt else len(content) - search_start)
            for pattern, op_type, is_write in patterns:
                for match in re.finditer(pattern, content[search_start:window_end]):
                    if op_type == "select":
                        fields = [f.strip() for f in match.group(1).split(",")]
                    else:
                        body = _object_body(content, search_start + match.end() - 1)
                        fields = _top_level_keys(body)

                    for field in fields:
                        # `*` is not a column, and neither is an embedded
                        # resource like `profiles(display_name)` -- PostgREST
                        # select syntax, not a column of this table.
                        if not field or field == "*" or "(" in field:
                            continue
                        if field not in schema[table_name]["columns"]:
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
