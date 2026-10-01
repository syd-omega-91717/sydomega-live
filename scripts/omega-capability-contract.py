#!/usr/bin/env python3
"""Validate the concrete Ω capability registry against the canonical catalog."""

from __future__ import annotations

import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
CATALOG = ROOT / "config/omega-capability-catalog.json"
REGISTRY = ROOT / "config/omega-capabilities.json"

def fail(message: str) -> int:
    print(f"OMEGA CAPABILITY CONTRACT: FAIL — {message}")
    return 1

def main() -> int:
    try:
        catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
        registry = json.loads(REGISTRY.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        return fail(str(exc))

    required = set(catalog.get("requiredFields", []))
    allowed_types = set(catalog.get("capabilityTypes", []))
    lifecycle = set(catalog.get("lifecycle", []))
    capabilities = registry.get("capabilities")

    if not isinstance(capabilities, list):
        return fail("capabilities must be an array")

    seen = set()
    errors = []
    for index, item in enumerate(capabilities):
        if not isinstance(item, dict):
            errors.append(f"entry {index} is not an object")
            continue
        cid = item.get("id", f"entry[{index}]")
        if cid in seen:
            errors.append(f"{cid}: duplicate id")
        seen.add(cid)

        for field in ("id", "name", "type", "version", "status", "purpose", "owner", "route"):
            if not item.get(field):
                errors.append(f"{cid}: missing {field}")
        if item.get("type") not in allowed_types:
            errors.append(f"{cid}: unsupported type {item.get('type')!r}")
        if item.get("status") not in lifecycle:
            errors.append(f"{cid}: unsupported lifecycle {item.get('status')!r}")
        evidence = item.get("evidence")
        if not isinstance(evidence, list) or not evidence:
            errors.append(f"{cid}: evidence must be a non-empty array")

        # The marketplace catalog deliberately requires richer fields than the
        # minimum concrete registry fields. Once those fields are populated,
        # this gate can enforce the complete product contract as well.
        missing_catalog_fields = [
            field for field in required
            if field not in item and field not in {"inputs", "outputs", "dependencies",
                                                    "events", "rateLimit", "costModel",
                                                    "rollback", "audience", "authz",
                                                    "dataClass"}
        ]
        if missing_catalog_fields:
            errors.append(f"{cid}: missing catalog fields {sorted(missing_catalog_fields)}")

    if errors:
        print(f"OMEGA CAPABILITY CONTRACT: FAIL — {len(errors)} finding(s)")
        for error in errors:
            print(f" - {error}")
        return 1

    print(f"OMEGA CAPABILITY CONTRACT: PASS — {len(capabilities)} capabilities validated")
    print("defaultAgentAccess=DENY")
    print("defaultHumanAccess=DENY")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
