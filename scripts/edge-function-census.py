#!/usr/bin/env python3
"""Report the repository's actual Supabase Edge Function census.

This is intentionally filesystem-derived: documentation must not become the
source of truth for how many functions exist. The script exits non-zero when
an expected manifest entry is missing or when a function directory lacks an
index.ts entrypoint.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
FUNCTIONS = ROOT / "supabase" / "functions"
MANIFEST = ROOT / "supabase" / "edge-functions.json"


def discover() -> list[str]:
    if not FUNCTIONS.is_dir():
        return []
    return sorted(
        p.name for p in FUNCTIONS.iterdir()
        if p.is_dir() and not p.name.startswith(".") and (p / "index.ts").is_file()
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json", action="store_true", help="emit machine-readable JSON")
    args = parser.parse_args()

    actual = discover()
    manifest = []
    if MANIFEST.exists():
        data = json.loads(MANIFEST.read_text(encoding="utf-8"))
        manifest = sorted(data.get("functions", []))

    missing = sorted(set(actual) - set(manifest))
    stale = sorted(set(manifest) - set(actual))
    result = {
        "count": len(actual),
        "functions": actual,
        "manifest_count": len(manifest),
        "missing_from_manifest": missing,
        "stale_manifest_entries": stale,
    }

    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print(f"EDGE_FUNCTION_COUNT={len(actual)}")
        for name in actual:
            print(name)
        if missing:
            print("MISSING_FROM_MANIFEST=" + ",".join(missing))
        if stale:
            print("STALE_MANIFEST_ENTRIES=" + ",".join(stale))

    return 1 if missing or stale else 0


if __name__ == "__main__":
    raise SystemExit(main())
