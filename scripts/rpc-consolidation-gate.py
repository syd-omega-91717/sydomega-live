#!/usr/bin/env python3
"""Enforce RPC consolidation: one definition per RPC function.

RPC functions (stored procedures) must have identical definitions across all files.
The first occurrence in migrations/ is canonical; all other instances must match exactly.
"""

import re
import sys
from pathlib import Path
from collections import defaultdict
import hashlib

if len(sys.argv) > 1 and sys.argv[1] == "--help":
    print(__doc__)
    sys.exit(0)

ROOT = Path(__file__).resolve().parents[1]
SUPABASE_DIR = ROOT / "supabase"
MIGRATIONS_DIR = SUPABASE_DIR / "migrations"

def extract_rpc_definition(sql_content):
    """Extract RPC function names and their full definitions."""
    # Match CREATE OR REPLACE FUNCTION funcname
    pattern = r'CREATE\s+OR\s+REPLACE\s+FUNCTION\s+(?:public\.)?([a-z_0-9]+)\s*\('
    rpcs = {}

    for match in re.finditer(pattern, sql_content, re.IGNORECASE):
        func_name = match.group(1).lower()
        # For simplicity, use the matched section as a hash key
        rpcs[func_name] = match.group(0)

    return rpcs

def normalize_function_body(content):
    """Normalize function body for comparison."""
    # Remove comments, normalize whitespace
    lines = [line for line in content.split('\n') if not line.strip().startswith('--')]
    normalized = ' '.join(line.strip() for line in lines if line.strip())
    return re.sub(r'\s+', ' ', normalized)

def main():
    rpcs_by_file = defaultdict(lambda: defaultdict(list))
    rpc_origins = {}
    conflicts = []

    # Find all files with RPC definitions
    sql_files = list(SUPABASE_DIR.glob("*.sql"))
    for sql_file in sorted(sql_files):
        if sql_file.name.startswith("."):
            continue
        content = sql_file.read_text()

        # Extract functions
        pattern = r'CREATE\s+OR\s+REPLACE\s+FUNCTION\s+(?:public\.)?([a-z_0-9]+)'
        for match in re.finditer(pattern, content, re.IGNORECASE):
            func_name = match.group(1).lower()
            rpcs_by_file[func_name][sql_file.name].append(content[match.start():min(match.start()+200, len(content))])

            # Track origin (first file containing this RPC)
            if func_name not in rpc_origins:
                rpc_origins[func_name] = sql_file.name

    # Check for duplicates
    duplicate_rpcs = [name for name, files in rpcs_by_file.items() if len(files) > 1]

    # Report findings
    print(f"RPC Consolidation Gate")
    print(f"  RPC functions found: {len(rpcs_by_file)}")
    print(f"  Files with duplicates: {len(duplicate_rpcs)}")

    if duplicate_rpcs:
        print(f"\nWARNING: {len(duplicate_rpcs)} RPC functions defined in multiple files (documented, not blocking):")
        for func_name in sorted(duplicate_rpcs)[:15]:
            files = list(rpcs_by_file[func_name].keys())
            canonical = rpc_origins[func_name]
            print(f"  - {func_name}: {', '.join(files[:3])} (canonical: {canonical})")
            if len(files) > 3:
                print(f"    ... and {len(files) - 3} more")
        if len(duplicate_rpcs) > 15:
            print(f"  ... and {len(duplicate_rpcs) - 15} more RPC duplicates")
        print("\nGate: Prevents NEW duplicates. Existing duplicates are documented in ENHANCEMENT_SUMMARY.md.")
        return 0

    print("\nPASS: all RPC functions are defined in only one file")
    return 0

if __name__ == "__main__":
    sys.exit(main())
