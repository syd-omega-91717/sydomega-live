#!/usr/bin/env python3
"""
Schema Consolidation Phase 1 — Identify canonical definitions
Analyzes duplicate table definitions and creates a mapping file for cleanup.

Usage:
  python3 scripts/schema-consolidation-phase1.py [--output <file>]

Output:
  Creates schema_consolidation_mapping.json with canonical paths and duplicates.
"""

import json
import os
import re
import sys
from collections import defaultdict
from datetime import datetime

def parse_create_table_statements(sql_file):
    """Extract table names from CREATE TABLE statements in a SQL file."""
    tables = {}
    try:
        with open(sql_file, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            # Match CREATE TABLE [IF NOT EXISTS] [public.]<table_name>
            pattern = r'CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?(\w+)'
            for match in re.finditer(pattern, content, re.IGNORECASE):
                table_name = match.group(1).lower()
                if table_name not in tables:
                    tables[table_name] = match.start()
    except Exception:
        pass
    return tables

def is_sql_keyword(word):
    """Identify SQL keywords that might be matched by regex as table names."""
    keywords = {
        'above', 'alone', 'bodies', 'for', 'if', 'is', 'and', 'or', 'not',
        'table', 'create', 'insert', 'update', 'delete', 'select', 'where',
        'from', 'join', 'on', 'as', 'with', 'grant', 'revoke', 'enable',
        'disable', 'drop', 'alter', 'add', 'column', 'constraint', 'primary',
        'key', 'foreign', 'unique', 'index', 'trigger', 'function', 'procedure'
    }
    return word in keywords

def get_migration_order(filepath):
    """Extract migration number for ordering (0001, 0002, etc. or timestamp)."""
    basename = os.path.basename(filepath)
    # Match NNNN_* or YYYYMMDDHHMMSS_*
    num_match = re.match(r'(\d+)_', basename)
    if num_match:
        return int(num_match.group(1))
    # Timestamp format (later migrations)
    ts_match = re.match(r'(\d{14})_', basename)
    if ts_match:
        return 10000 + int(ts_match.group(1)[:4])  # Sort after numbered migrations
    return 999999

def classify_duplicate(table_name, files):
    """Classify a duplicate set into Tier 1 (parser artifacts) or Tier 2 (real)."""
    if is_sql_keyword(table_name):
        return 'TIER_1_PARSER_ARTIFACT'
    return 'TIER_2_LEGITIMATE'

def find_canonical_migration(table_name, files):
    """
    Determine which file likely contains the authoritative definition.
    Priority:
    1. Earliest numbered migration (0001, 0002, etc.)
    2. Latest timestamped migration (feature updates)
    3. Feature-specific file (omega_<feature>.sql)
    """
    migrations = [f for f in files if 'migrations' in f]
    flat_files = [f for f in files if 'migrations' not in f]

    if migrations:
        migrations.sort(key=get_migration_order)
        # Prefer numbered migrations (0001–0094) over timestamped
        for f in migrations:
            if re.match(r'migrations/\d{4}_', os.path.basename(f)):
                return f
        # Fall back to latest timestamped migration
        return migrations[-1]

    # If only flat files, prefer feature-specific over aggregate
    omega_specific = [f for f in flat_files if re.match(r'omega_\w+\.sql$', os.path.basename(f))]
    if omega_specific:
        return omega_specific[0]

    return flat_files[0] if flat_files else None

def main():
    output_file = 'schema_consolidation_mapping.json'

    # Parse arguments
    if '--output' in sys.argv:
        idx = sys.argv.index('--output')
        if idx + 1 < len(sys.argv):
            output_file = sys.argv[idx + 1]

    # Find all SQL files
    table_files = defaultdict(list)
    sql_files = []

    for root, dirs, files in os.walk('supabase'):
        for file in files:
            if file.endswith('.sql'):
                filepath = os.path.join(root, file)
                sql_files.append(filepath)
                tables = parse_create_table_statements(filepath)
                for table_name in tables:
                    table_files[table_name].append(filepath)

    # Analyze and classify
    mapping = {
        'metadata': {
            'generated': datetime.now().isoformat(),
            'total_unique_tables': len(table_files),
            'total_duplicates': sum(1 for t, f in table_files.items() if len(f) > 1),
            'tier_1_parser_artifacts': 0,
            'tier_2_legitimate_duplicates': 0
        },
        'tier_1': {},
        'tier_2': {}
    }

    # Process each table
    for table_name, files in sorted(table_files.items()):
        if len(files) == 1:
            continue  # Skip singletons

        tier = classify_duplicate(table_name, files)
        canonical = find_canonical_migration(table_name, files)
        duplicates = [f for f in sorted(files) if f != canonical]

        entry = {
            'canonical_definition': canonical,
            'duplicate_files': duplicates,
            'duplicate_count': len(files),
            'requires_manual_verification': tier == 'TIER_1_PARSER_ARTIFACT'
        }

        if tier == 'TIER_1_PARSER_ARTIFACT':
            mapping['tier_1'][table_name] = entry
            mapping['metadata']['tier_1_parser_artifacts'] += 1
        else:
            mapping['tier_2'][table_name] = entry
            mapping['metadata']['tier_2_legitimate_duplicates'] += 1

    # Write output
    with open(output_file, 'w') as f:
        json.dump(mapping, f, indent=2)

    # Print summary
    print(f"Schema Consolidation Phase 1 — Analysis Complete")
    print(f"  Total unique tables: {mapping['metadata']['total_unique_tables']}")
    print(f"  Tier 1 (Parser artifacts): {mapping['metadata']['tier_1_parser_artifacts']}")
    print(f"  Tier 2 (Legitimate duplicates): {mapping['metadata']['tier_2_legitimate_duplicates']}")
    print(f"  Mapping written to: {output_file}")
    print()
    print("Next steps:")
    print("  1. Review Tier 1 entries (likely false positives)")
    print("  2. Verify canonical definitions match live schema via:")
    print("     scripts/schema-dictionary.py --regenerate")
    print("  3. Use Tier 2 mapping to identify files to delete in Phase 2")

if __name__ == '__main__':
    main()
