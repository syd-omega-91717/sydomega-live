#!/usr/bin/env python3
"""Deterministic inventory for the supplied Ω 999-point blueprint.

Usage:
  python3 scripts/omega-999-point-inventory.py /path/to/blueprint.txt
  python3 scripts/omega-999-point-inventory.py /path/to/blueprint.txt --json

The scanner intentionally inventories only explicit '* N.' bullets. It does not
claim that unnumbered prose is absent, implemented, legal, or production-ready.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
from collections import Counter
from pathlib import Path

POINT = re.compile(r"^\s*\*\s*(\d+)\.\s*(.*)$")


def inventory(path: Path) -> dict:
    text = path.read_text(encoding="utf-8", errors="replace")
    rows = []
    for line_no, line in enumerate(text.splitlines(), 1):
        match = POINT.match(line)
        if match:
            rows.append(
                {
                    "point": int(match.group(1)),
                    "line": line_no,
                    "text": match.group(2).strip(),
                }
            )

    counts = Counter(row["point"] for row in rows)
    for row in rows:
        row["duplicate"] = counts[row["point"]] > 1

    present = set(counts)
    duplicates = sorted(point for point, count in counts.items() if count > 1)
    missing = sorted(set(range(1, 1000)) - present)

    return {
        "schema_version": 1,
        "source_file": path.name,
        "source_sha256": hashlib.sha256(text.encode("utf-8")).hexdigest(),
        "numbered_bullet_pattern": r"^\s*\*\s*(\d+)\.\s*(.*)$",
        "explicit_bullet_count": len(rows),
        "unique_point_count": len(counts),
        "duplicate_point_numbers": duplicates,
        "missing_numbers_1_to_999": missing,
        "points": rows,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("--json", action="store_true", dest="as_json")
    args = parser.parse_args()

    if not args.source.is_file():
        parser.error(f"source file does not exist: {args.source}")

    result = inventory(args.source)
    if args.as_json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print("OMEGA 999-POINT SOURCE INVENTORY")
        print(f"source={result['source_file']}")
        print(f"sha256={result['source_sha256']}")
        print(f"explicit_bullets={result['explicit_bullet_count']}")
        print(f"unique_points={result['unique_point_count']}")
        print(f"duplicates={len(result['duplicate_point_numbers'])}")
        print(f"missing_1_to_999={len(result['missing_numbers_1_to_999'])}")
        if result["duplicate_point_numbers"]:
            print("duplicate_numbers=" + ",".join(map(str, result["duplicate_point_numbers"])))
        print("NOTE=missing numbers are missing from the explicit '* N.' inventory only")


if __name__ == "__main__":
    raise SystemExit(main())
