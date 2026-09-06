#!/usr/bin/env python3
"""
RLS policy auditor.

Validates Row Level Security policies for dangerous patterns:
- WITH CHECK(true) unscoped to user identity
- Missing auth.uid() checks on user-identity columns
- TO public on sensitive tables
- Policies that grant unintended access to anon/authenticated

Exit code 0 if clean, 1 if critical findings.
"""

import sys as _sys
if "--help" in _sys.argv[1:] or "-h" in _sys.argv[1:]:
    print(__doc__.strip())
    raise SystemExit(0)

import os
import re
import sys
from pathlib import Path

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
import sys

# ============================================================================
# RLS PARSING
# ============================================================================

def extract_paren_content(s, start_pos):
    """Extract content between parentheses, handling nesting."""
    if start_pos >= len(s) or s[start_pos] != '(':
        return None
    depth = 0
    for i in range(start_pos, len(s)):
        if s[i] == '(':
            depth += 1
        elif s[i] == ')':
            depth -= 1
            if depth == 0:
                return s[start_pos+1:i]
    return None


def statement_end(s, start_pos):
    """Index just past the `;` that terminates the statement at start_pos.

    THE BUG THIS EXISTS TO KILL. The clause search below used to run over
    `content[start_pos:]` -- the whole rest of the file -- so a policy with no
    WITH CHECK clause picked up the NEXT policy's. Measured on
    supabase/refinements.sql: line 8 is

        create policy "owner reads publications" on public.publications
          for select to authenticated using (public.is_platform_owner());

    which has no WITH CHECK and cannot have one (Postgres rejects WITH CHECK on
    FOR SELECT). The parser reported with_check='true', scavenged from line 10.
    That single defect produced the bulk of a 39-finding CRITICAL report, none
    of which corresponded to anything in the live database: measured
    2026-09-05, 304 live policies, 197 carrying a WITH CHECK clause, and
    **zero** whose WITH CHECK is `true`.

    Semicolons inside parentheses or string literals do not end a statement.
    """
    depth = 0
    in_str = False
    i = start_pos
    while i < len(s):
        ch = s[i]
        if in_str:
            if ch == "'":
                if i + 1 < len(s) and s[i + 1] == "'":   # '' is an escaped quote
                    i += 1
                else:
                    in_str = False
        elif ch == "'":
            in_str = True
        elif ch == '(':
            depth += 1
        elif ch == ')':
            depth -= 1
        elif ch == ';' and depth <= 0:
            return i
        i += 1
    return len(s)


def parse_rls_policies():
    """Parse all CREATE POLICY statements from supabase/*.sql files."""
    policies = []
    sql_dir = Path("supabase")

    if not sql_dir.exists():
        import sys
        return policies

    for sql_file in sorted(sql_dir.glob("*.sql")):
        with open(sql_file, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()

        # Find CREATE POLICY statements
        policy_pattern = r'CREATE\s+POLICY\s+"([^"]+)"\s+ON\s+public\.(\w+)(?:\s+FOR\s+(\w+))?\s+TO\s+(\w+)'
        matches = list(re.finditer(policy_pattern, content, re.IGNORECASE))

        for match in matches:
            policy_name = match.group(1)
            table_name = match.group(2)
            action = (match.group(3) or "ALL").upper()
            role = match.group(4)

            # Extract clauses after TO role -- ONLY within this statement.
            # `rest` used to be content[start_pos:], the whole rest of the file
            # (see statement_end's docstring for the measured consequence).
            start_pos = match.end()
            stmt_end = statement_end(content, start_pos)
            rest = content[start_pos:stmt_end]

            using_clause = ""
            with_check_clause = ""

            # Find USING clause
            using_match = re.search(r'USING\s*\(', rest, re.IGNORECASE)
            if using_match:
                paren_start = start_pos + using_match.end() - 1
                using_clause = extract_paren_content(content, paren_start) or ""
                using_clause = using_clause.strip()

            # Find WITH CHECK clause
            with_check_match = re.search(r'WITH\s+CHECK\s*\(', rest, re.IGNORECASE)
            if with_check_match:
                paren_start = start_pos + with_check_match.end() - 1
                with_check_clause = extract_paren_content(content, paren_start) or ""
                with_check_clause = with_check_clause.strip()

            # Postgres forbids WITH CHECK on FOR SELECT and FOR DELETE. If one
            # was matched for such a policy the parse is wrong, not the SQL.
            if action in ("SELECT", "DELETE"):
                with_check_clause = ""

            # Skip if neither clause found
            if not using_clause and not with_check_clause:
                continue

            # Find line number
            line_num = content[:match.start()].count("\n") + 1

            policies.append({
                "file": sql_file.name,
                "line": line_num,
                "name": policy_name,
                "table": table_name,
                "action": action,
                "role": role,
                "using": using_clause,
                "with_check": with_check_clause,
            })

    return policies


def get_identity_columns():
    """Get user-identity columns per table."""
    identity_cols = {}
    sql_dir = Path("supabase")

    if not sql_dir.exists():
        return identity_cols

    for sql_file in sorted(sql_dir.glob("*.sql")):
        with open(sql_file, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()

        # Find tables with user_id or uid columns (common identity patterns)
        create_pattern = r"CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?public\.(\w+)\s*\(([\s\S]*?)\)(?:\s+WITH|;)"
        for match in re.finditer(create_pattern, content, re.IGNORECASE):
            table_name = match.group(1)
            body = match.group(2)

            # Check for user_id, uid, or user_identity columns
            if re.search(r"\buser_id\b", body, re.IGNORECASE):
                if table_name not in identity_cols:
                    identity_cols[table_name] = []
                if "user_id" not in identity_cols[table_name]:
                    identity_cols[table_name].append("user_id")

            if re.search(r"\buid\b", body, re.IGNORECASE):
                if table_name not in identity_cols:
                    identity_cols[table_name] = []
                if "uid" not in identity_cols[table_name]:
                    identity_cols[table_name].append("uid")

    return identity_cols


def audit_policies(policies, identity_cols):
    """Audit policies for dangerous patterns."""
    findings = []

    for policy in policies:
        table = policy["table"]
        role = policy["role"]
        using = policy["using"]
        with_check = policy["with_check"]

        # CRITICAL: an unconditional write.
        #
        # WITH CHECK(true) alone is NOT that finding, and reporting it as one
        # was wrong twice over. For UPDATE, DELETE and ALL, the USING clause
        # decides which rows the statement may touch at all -- so
        #   for update ... using (public.is_platform_owner()) with check (true)
        # lets the OWNER write any value into rows only the owner can reach.
        # That is what "owner" means, not a member spoofing gap, and it was
        # reported as "grants unconditional UPDATE to authenticated" on real,
        # correct policies (supabase/chunk_05_migrations.sql:39 among them).
        #
        # INSERT is the genuine case: there is no USING clause on an INSERT
        # policy, so WITH CHECK is the only gate and `true` really does admit
        # any row -- CLAUDE.md 8.1 class 6(b).
        gated_by_using = using.strip().lower() not in ("", "true")
        unconditional_write = (
            with_check.lower() == "true"
            and (policy["action"] == "INSERT" or not gated_by_using)
        )

        if unconditional_write:
            # One finding, not two. The old code emitted this AND a separate
            # "Permissive X without auth.uid()" line for the same condition,
            # double-counting every hit on a table with a user_id column.
            scope = (" on a table with user_id, so a member can write rows "
                     "attributed to anyone") if table in identity_cols else ""
            findings.append({
                "severity": "CRITICAL",
                "policy": policy["name"],
                "table": table,
                "file": policy["file"],
                "line": policy["line"],
                "message": (f"WITH CHECK(true) with no USING gate — grants "
                            f"unconditional {policy['action']} to {role}{scope}"),
            })

        # WARNING: TO public on sensitive tables (profiles, members, etc.)
        if role == "public" and table in ("profiles", "members", "users", "accounts"):
            if "auth.uid()" not in using or not with_check:
                findings.append({
                    "severity": "WARNING",
                    "policy": policy["name"],
                    "table": table,
                    "file": policy["file"],
                    "line": policy["line"],
                    "message": f"TO public on sensitive table {table} — verify access is intentional",
                })

        # INFO: USING(true) without WITH CHECK scoping on writes
        if using.lower() == "true" and policy["action"] in ("INSERT", "UPDATE", "ALL"):
            if not with_check or "auth.uid()" not in with_check:
                findings.append({
                    "severity": "INFO",
                    "policy": policy["name"],
                    "table": table,
                    "file": policy["file"],
                    "line": policy["line"],
                    "message": f"USING(true) with unscoped {policy['action']} — verify intentional",
                })

    return findings


# ============================================================================
# MAIN
# ============================================================================

def main():
    """Audit RLS policies."""
    print("Scanning for RLS policies...")
    policies = parse_rls_policies()

    if not policies:
        print("WARNING — no CREATE POLICY statements found")
        return 0

    print(f"Found {len(policies)} policies.")

    print("Auditing policies for dangerous patterns...")
    identity_cols = get_identity_columns()
    findings = audit_policies(policies, identity_cols)

    if not findings:
        print("OK — no RLS policy issues detected.")
        return 0

    # Report findings by severity
    critical = [f for f in findings if f["severity"] == "CRITICAL"]
    warnings = [f for f in findings if f["severity"] == "WARNING"]
    infos = [f for f in findings if f["severity"] == "INFO"]

    if critical:
        print(f"\nCRITICAL — {len(critical)} RLS policy issue(s):")
        for f in critical:
            print(f"  {f['file']}:{f['line']} — {f['policy']}")
            print(f"    {f['message']}")

    if warnings:
        print(f"\nWARNING — {len(warnings)} policy issue(s) to review:")
        for f in warnings:
            print(f"  {f['file']}:{f['line']} — {f['policy']}")
            print(f"    {f['message']}")

    if infos:
        print(f"\nINFO — {len(infos)} informational finding(s):")
        for f in infos:
            print(f"  {f['file']}:{f['line']} — {f['policy']}")
            print(f"    {f['message']}")

    return 1 if critical else 0


if __name__ == "__main__":
    sys.exit(main())
