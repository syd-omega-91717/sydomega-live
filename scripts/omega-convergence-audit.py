#!/usr/bin/env python3
"""Architecture-convergence audit for Ω SYD OMEGA 91717.

This is intentionally conservative. It reports competing authorities and
references; it does not rewrite or mutate production data.

Usage:
  python3 scripts/omega-convergence-audit.py
  python3 scripts/omega-convergence-audit.py --json

Exit status:
  0 = report generated; findings may require review
  2 = repository layout/read failure
"""

from __future__ import annotations

import argparse
import collections
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]

AUTHORITY_PATTERNS = {
    "navigation": ["nav.js"],
    "visual3d": ["omega-sculpture.js"],
    "canon": ["omega-canon.js"],
    "i18n": ["i18n.js"],
}

FUNCTION_RE = re.compile(r"\b(?:create|replace)\s+function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)", re.I)
TABLE_RE = re.compile(r"\bcreate\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?([a-zA-Z_][a-zA-Z0-9_]*)", re.I)
RPC_RE = re.compile(r"\b\.rpc\(\s*['\"]([^'\"]+)['\"]", re.I)
FROM_RE = re.compile(r"\b\.from\(\s*['\"]([^'\"]+)['\"]", re.I)


def read_text(path: pathlib.Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def files_with_suffix(suffix: str):
    return sorted(p for p in ROOT.rglob(f"*{suffix}") if ".git" not in p.parts)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    try:
        js_files = files_with_suffix(".js")
        html_files = files_with_suffix(".html")
        sql_files = files_with_suffix(".sql")
    except OSError as exc:
        print(f"ERROR: cannot scan repository: {exc}", file=sys.stderr)
        return 2

    functions = collections.defaultdict(list)
    tables = collections.defaultdict(list)
    client_rpcs = collections.defaultdict(list)
    client_tables = collections.defaultdict(list)

    for path in sql_files:
        text = read_text(path)
        for name, signature in FUNCTION_RE.findall(text):
            functions[name].append({"file": str(path.relative_to(ROOT)), "signature": signature.strip()})
        for name in TABLE_RE.findall(text):
            tables[name].append(str(path.relative_to(ROOT)))

    for path in js_files + html_files:
        text = read_text(path)
        rel = str(path.relative_to(ROOT))
        for name in RPC_RE.findall(text):
            client_rpcs[name].append(rel)
        for name in FROM_RE.findall(text):
            client_tables[name].append(rel)

    duplicate_functions = {
        name: entries for name, entries in functions.items() if len(entries) > 1
    }
    duplicate_tables = {
        name: entries for name, entries in tables.items() if len(entries) > 1
    }

    missing_rpc_definitions = {
        name: callers for name, callers in client_rpcs.items() if name not in functions
    }
    missing_table_definitions = {
        name: callers for name, callers in client_tables.items() if name not in tables
    }

    authority = {}
    for domain, expected in AUTHORITY_PATTERNS.items():
        authority[domain] = {
            "expected": expected,
            "present": [name for name in expected if (ROOT / name).exists()],
        }

    report = {
        "schemaVersion": "1.0.0",
        "repository": ROOT.name,
        "counts": {
            "javascript": len(js_files),
            "html": len(html_files),
            "sql": len(sql_files),
        },
        "authorityPresence": authority,
        "duplicateFunctionDefinitions": duplicate_functions,
        "duplicateTableDefinitions": duplicate_tables,
        "clientRpcWithoutSourceDefinition": missing_rpc_definitions,
        "clientTableWithoutSourceDefinition": missing_table_definitions,
        "interpretation": {
            "duplicateDefinitions": "review; some historical SQL files may be migration artifacts",
            "missingReferences": "review against live schema; source-only evidence is not proof of absence",
            "authorityPresence": "hardening check; absence of a canonical owner is a convergence blocker",
        },
    }

    if args.json:
        print(json.dumps(report, indent=2, sort_keys=True))
    else:
        print("Ω SYD OMEGA 91717 — architecture convergence audit")
        print(f"Repository: {ROOT.name}")
        print(f"Files: {len(js_files)} JS / {len(html_files)} HTML / {len(sql_files)} SQL")
        print("\nCanonical authority presence:")
        for domain, value in authority.items():
            print(f"  {domain}: {value['present']} / expected {value['expected']}")
        print(f"\nDuplicate SQL functions: {len(duplicate_functions)}")
        print(f"Duplicate SQL tables:    {len(duplicate_tables)}")
        print(f"Missing RPC definitions: {len(missing_rpc_definitions)}")
        print(f"Missing table refs:      {len(missing_table_definitions)}")
        print("\nThis report is evidence for review, not proof of live production state.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
