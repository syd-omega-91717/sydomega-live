#!/usr/bin/env python3
"""Validate the canonical SYD OMEGA content registry."""
from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
registry_path = ROOT / "config" / "content-registry.json"
schema_path = ROOT / "config" / "content-registry.schema.json"
errors = []

try:
    registry = json.loads(registry_path.read_text(encoding="utf-8"))
except Exception as exc:
    errors.append(f"registry invalid JSON: {exc}")
    registry = None

try:
    schema = json.loads(schema_path.read_text(encoding="utf-8"))
except Exception as exc:
    errors.append(f"schema invalid JSON: {exc}")
    schema = None

if isinstance(registry, dict):
    if not isinstance(registry.get("version"), str):
        errors.append("version must be a string")
    entries = registry.get("entries")
    if not isinstance(entries, list):
        errors.append("entries must be an array")
        entries = []
    ids, routes = set(), set()
    for i, entry in enumerate(entries):
        if not isinstance(entry, dict):
            errors.append(f"entries[{i}] must be an object")
            continue
        for field in ("id", "route", "purpose", "audience", "status"):
            if not isinstance(entry.get(field), str) or not entry[field].strip():
                errors.append(f"entries[{i}].{field} is required")
        eid, route = entry.get("id"), entry.get("route")
        if eid in ids: errors.append(f"duplicate content id: {eid}")
        if route in routes: errors.append(f"duplicate canonical route: {route}")
        ids.add(eid); routes.add(route)
        if isinstance(route, str) and not route.startswith("/"):
            errors.append(f"invalid route: {route}")
        if entry.get("status") not in {"planned", "draft", "review", "published", "archived"}:
            errors.append(f"invalid status for {eid}")

if errors:
    print("CONTENT REGISTRY CONTRACT: FAIL")
    for error in errors: print(f"- {error}")
    sys.exit(1)
print("CONTENT REGISTRY CONTRACT: PASS")
