#!/usr/bin/env python3
"""Validate that every architecture block has a concrete implementation mapping.

This intentionally validates implementation readiness, not live production health.
Live verification remains evidence-based and environment-dependent.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONTRACT = ROOT / "docs/architecture/16-block-system.json"
MAP = ROOT / "docs/architecture/production-building-blocks.json"


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> int:
    errors: list[str] = []
    try:
        contract = load(CONTRACT)
        mapping = load(MAP)
    except Exception as exc:
        print(f"ARCHITECTURE READINESS FAILED: {exc}")
        return 1

    blocks = contract.get("blocks", [])
    mapped = mapping.get("blocks", {})
    expected = {b.get("id") for b in blocks}

    if len(blocks) != 16:
        errors.append(f"contract contains {len(blocks)} blocks; expected 16")
    if set(mapped) != expected:
        errors.append(f"implementation map mismatch: missing={sorted(expected-set(mapped))}, extra={sorted(set(mapped)-expected)}")

    for block_id in sorted(expected):
        item = mapped.get(block_id, {})
        for key in ("implementation", "source_of_truth", "required_evidence"):
            if not item.get(key):
                errors.append(f"{block_id}: missing {key}")
        if not isinstance(item.get("required_evidence"), list) or not item["required_evidence"]:
            errors.append(f"{block_id}: required_evidence must be non-empty")

    if errors:
        print("ARCHITECTURE READINESS FAILED")
        for error in errors:
            print(f"  - {error}")
        return 1

    print("ARCHITECTURE READINESS PASSED: 16/16 blocks have concrete implementation mappings")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
