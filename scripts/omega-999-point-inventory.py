#!/usr/bin/env python3
"""Deterministic, line-preserving inventory for the supplied Ω 999-point blueprint.

Usage:
  python3 scripts/omega-999-point-inventory.py /path/to/blueprint.txt
  python3 scripts/omega-999-point-inventory.py /path/to/blueprint.txt --json

The inventory distinguishes explicit numbered bullets from inline point references.
Each numbered source occurrence receives a deterministic, content-derived source_record_id;
the point number remains a non-unique source locator. IDs change when that occurrence's
source identity changes, and do not imply implementation or approval.
It does not infer missing requirements or claim that a concept is implemented,
safe, legal, or production-ready.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
from collections import Counter, defaultdict
from pathlib import Path

POINT = re.compile(r"^\s*\*\s*(\d+)\.\s*(.*)$")
SECTION = re.compile(r"^\s*(SECTION\b.*)$", re.IGNORECASE)
SUBSECTION = re.compile(r"^\s*Ω\s+(.+?\(Points?\s+\d+\s*[-–]\s*\d+\).*)$")
REFERENCE = re.compile(r"\bPoints?\s+(\d+)(?:\s*[-–]\s*(\d+))?", re.IGNORECASE)
RANGE = re.compile(r"\((\d+)\s*[-–]\s*(\d+)\)")


def inventory(path: Path) -> dict:
    raw = path.read_bytes()
    text = raw.decode("utf-8", errors="replace")
    lines = text.splitlines()
    rows = []
    references = []
    section_ranges = []
    current_section = None
    current_subsection = None

    occurrence_counts = Counter()

    for line_no, line in enumerate(lines, 1):
        section_match = SECTION.match(line)
        if section_match:
            current_section = section_match.group(1).strip()
            current_subsection = None
            range_match = RANGE.search(current_section)
            if range_match:
                start, end = map(int, range_match.groups())
                section_ranges.append({
                    "line": line_no,
                    "heading": current_section,
                    "start": start,
                    "end": end,
                })
            continue

        subsection_match = SUBSECTION.match(line)
        if subsection_match:
            current_subsection = subsection_match.group(1).strip()

        point_match = POINT.match(line)
        if point_match:
            point = int(point_match.group(1))
            source_text = point_match.group(2).strip()
            occurrence_counts[point] += 1
            identity = {
                "source_file": path.name,
                "point": point,
                "section": current_section,
                "subsection": current_subsection,
                "text": source_text,
                "occurrence_index": occurrence_counts[point],
            }
            identity_hash = hashlib.sha256(
                json.dumps(identity, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
            ).hexdigest()
            rows.append({
                "source_record_id": f"BP-{point:03d}-{identity_hash}",
                "source_occurrence_index": occurrence_counts[point],
                "point": point,
                "line": line_no,
                "section": current_section,
                "subsection": current_subsection,
                "text": source_text,
            })

        # Preserve every explicit prose cross-reference and its source line.
        for ref_match in REFERENCE.finditer(line):
            start = int(ref_match.group(1))
            end = int(ref_match.group(2) or start)
            references.append({
                "line": line_no,
                "start": start,
                "end": end,
                "referenced_points": list(range(start, end + 1)) if end >= start and end - start <= 998 else [],
                "section": current_section,
                "subsection": current_subsection,
                "text": line.strip(),
            })

    counts = Counter(row["point"] for row in rows)
    occurrences = defaultdict(list)
    for row in rows:
        occurrences[row["point"]].append(row["line"])
        row["duplicate"] = counts[row["point"]] > 1

    present = set(counts)
    duplicates = sorted(point for point, count in counts.items() if count > 1)
    missing = sorted(set(range(1, 1000)) - present)

    overlaps = []
    for index, left in enumerate(section_ranges):
        for right in section_ranges[index + 1:]:
            if max(left["start"], right["start"]) <= min(left["end"], right["end"]):
                overlaps.append({
                    "left_line": left["line"],
                    "left_heading": left["heading"],
                    "right_line": right["line"],
                    "right_heading": right["heading"],
                    "overlap_start": max(left["start"], right["start"]),
                    "overlap_end": min(left["end"], right["end"]),
                })

    return {
        "schema_version": 2,
        "source_file": path.name,
        "source_sha256": hashlib.sha256(raw).hexdigest(),
        "source_line_count": len(lines),
        "source_word_count": len(text.split()),
        "source_byte_count": len(raw),
        "numbered_bullet_pattern": r"^\s*\*\s*(\d+)\.\s*(.*)$",
        "explicit_bullet_count": len(rows),
        "unique_point_count": len(counts),
        "duplicate_point_numbers": duplicates,
        "duplicate_point_occurrences": {
            str(point): occurrences[point] for point in duplicates
        },
        "missing_numbers_1_to_999": missing,
        "section_ranges": section_ranges,
        "overlapping_section_ranges": overlaps,
        "inline_point_reference_count": len(references),
        "inline_point_references": references,
        "points": rows,
        "scope_note": (
            "Missing numbers are absent from the explicit numbered-bullet inventory. "
            "Inline references and section ranges are separately indexed; neither "
            "creates a missing point requirement or proves implementation."
        ),
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
        print(f"source_lines={result['source_line_count']}")
        print(f"explicit_bullets={result['explicit_bullet_count']}")
        print(f"unique_points={result['unique_point_count']}")
        print(f"duplicates={len(result['duplicate_point_numbers'])}")
        print(f"inline_point_references={result['inline_point_reference_count']}")
        print(f"overlapping_section_ranges={len(result['overlapping_section_ranges'])}")
        print(f"missing_1_to_999={len(result['missing_numbers_1_to_999'])}")
        if result["duplicate_point_numbers"]:
            print("duplicate_numbers=" + ",".join(map(str, result["duplicate_point_numbers"])))
        print("NOTE=missing numbers are missing from the explicit numbered-bullet inventory only")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
