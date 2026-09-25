#!/usr/bin/env python3
"""Audit SECURITY DEFINER SQL functions without changing application behavior.

The audit is intentionally conservative: it reports findings that require
human/database verification rather than weakening contracts to make CI green.
"""
from pathlib import Path
import re, sys

ROOT = Path(__file__).resolve().parents[1]
SQL_ROOTS = [ROOT / "supabase"]
FUNCTION_RE = re.compile(
    r"create\s+(?:or\s+replace\s+)?function\s+"
    r"(?P<name>(?:[a-zA-Z_][\w$]*\.)?[a-zA-Z_][\w$]*)\s*\([^)]*\)"
    r"(?P<body>.*?)(?=\n\s*(?:create\s+(?:or\s+replace\s+)?function|$))",
    re.I | re.S,
)

def main():
    sql_files = [p for root in SQL_ROOTS if root.exists() for p in root.rglob("*.sql")]
    findings = []
    total = 0
    definers = 0
    for path in sorted(sql_files):
        text = path.read_text(encoding="utf-8", errors="replace")
        for m in FUNCTION_RE.finditer(text):
            total += 1
            body = m.group("body")
            if not re.search(r"\bsecurity\s+definer\b", body, re.I):
                continue
            definers += 1
            name = m.group("name")
            normalized = body.lower()
            schema_qualified = "." in name
            if "set search_path" not in normalized:
                findings.append(f"{path.relative_to(ROOT)}: {name}: SECURITY DEFINER without explicit search_path")
            if not schema_qualified:
                findings.append(f"{path.relative_to(ROOT)}: {name}: unqualified function name; verify intended schema")
            if re.search(r"execute\s+format\s*\(", normalized) or re.search(r"execute\s+['\"]", normalized):
                findings.append(f"{path.relative_to(ROOT)}: {name}: dynamic SQL detected; verify identifier/value handling")
            if "auth.uid()" not in normalized and re.search(r"\b(insert|update|delete)\b", normalized):
                findings.append(f"{path.relative_to(ROOT)}: {name}: mutating SECURITY DEFINER function has no auth.uid() reference; verify authorization model")
    print(f"SECURITY DEFINER AUDIT: functions={total} security_definer={definers} findings={len(findings)}")
    for finding in findings:
        print(" - " + finding)
    # Findings are evidence for review, not automatic release blockers. CI can
    # block only on malformed audit execution; authorization is context-specific.
    if "--strict" in sys.argv and findings:
        return 1
    return 0

if __name__ == "__main__":
    if "--help" in sys.argv or "-h" in sys.argv:
        print(__doc__)
        raise SystemExit(0)
    raise SystemExit(main())
