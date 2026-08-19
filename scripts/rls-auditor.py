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

import os
import re
import sys
from pathlib import Path

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
# DEBUG
import sys
print(f"DEBUG: __file__={__file__}, ROOT={ROOT}, cwd={os.getcwd()}", file=sys.stderr)

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


def parse_rls_policies():
    """Parse all CREATE POLICY statements from supabase/*.sql files."""
    policies = []
    sql_dir = Path("supabase")

    if not sql_dir.exists():
        import sys
        print(f"DEBUG: sql_dir does not exist. CWD={os.getcwd()}, sql_dir={sql_dir.absolute()}", file=sys.stderr)
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

            # Extract clauses after TO role
            start_pos = match.end()
            rest = content[start_pos:]

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

        # CRITICAL: WITH CHECK(true) unscoped to user identity
        if with_check.lower() == "true":
            findings.append({
                "severity": "CRITICAL",
                "policy": policy["name"],
                "table": table,
                "file": policy["file"],
                "line": policy["line"],
                "message": f"WITH CHECK(true) — grants unconditional {policy['action']} to {role}",
            })

        # CRITICAL: WITH CHECK(true) on a table with user_id but no auth.uid() scoping
        if with_check and "true" in with_check.lower() and table in identity_cols:
            if "auth.uid()" not in with_check and "auth.role()" not in with_check:
                findings.append({
                    "severity": "CRITICAL",
                    "policy": policy["name"],
                    "table": table,
                    "file": policy["file"],
                    "line": policy["line"],
                    "message": f"Permissive {policy['action']} without auth.uid() on table with user_id",
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
