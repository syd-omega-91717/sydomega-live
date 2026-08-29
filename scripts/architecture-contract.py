#!/usr/bin/env python3
"""Validate the SYD OMEGA 91717 16-block architecture contract.

This is a source-level contract only. It deliberately does not mark runtime
systems verified; environment-dependent verification requires executable
integration/e2e evidence from the target deployment.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONTRACT = ROOT / "docs/architecture/16-block-system.json"
REQUIRED = {
    "api-gateway", "load-balancer", "microservices", "event-driven",
    "database", "caching", "data-partitioning", "object-blob-storage",
    "message-queues", "fault-tolerance", "cdn", "high-availability",
    "observability", "security-identity", "ai-llm-gateway", "vector-search-rag",
}


def main() -> int:
    try:
        data = json.loads(CONTRACT.read_text(encoding="utf-8"))
    except Exception as exc:
        print(f"ARCHITECTURE CONTRACT FAILED: {exc}")
        return 1

    blocks = data.get("blocks")
    ids = {b.get("id") for b in blocks} if isinstance(blocks, list) else set()
    errors = []
    if not isinstance(blocks, list) or len(blocks) != 16:
        errors.append(f"expected exactly 16 blocks, found {len(blocks) if isinstance(blocks, list) else 0}")
    errors.extend(f"missing block: {ident}" for ident in sorted(REQUIRED - ids))
    errors.extend(f"unexpected block: {ident}" for ident in sorted(ids - REQUIRED))
    for block in blocks if isinstance(blocks, list) else []:
        if not block.get("purpose"):
            errors.append(f"{block.get('id')}: purpose required")
        if not isinstance(block.get("evidence"), list) or not block["evidence"]:
            errors.append(f"{block.get('id')}: executable evidence requirements required")

    if errors:
        print("ARCHITECTURE CONTRACT FAILED")
        for error in errors:
            print(f"  - {error}")
        return 1
    print("ARCHITECTURE CONTRACT PASSED: 16 blocks / 16 evidence contracts")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
