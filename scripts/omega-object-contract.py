#!/usr/bin/env python3
"""Validate the canonical Ω Object contract against live-schema evidence.

An object is backed either by live tables (names present in supabase/live-schema.json)
or by a static registry under config/*.json. A registry source must name the record
types that back the object (`recordTypes`), and every such record must carry the
object's identity and label fields and a `state` from the truth vocabulary -- a
registry can declare SOURCE/SIMULATED/LIVE per record, but a missing file, an
undeclared record type, or a record without identity, label or truth fails.
"""
from __future__ import annotations
import json
import sys
from pathlib import Path

if __name__ == "__main__" and ("--help" in sys.argv or "-h" in sys.argv):
    print(__doc__)
    raise SystemExit(0)

ROOT = Path(__file__).resolve().parents[1]
MODEL = ROOT / "config/omega-object-model.json"
SCHEMA = ROOT / "supabase/live-schema.json"
OBJECT_SCHEMA = ROOT / "config/omega-object-contract.schema.json"

ALLOWED_TRUTH = {
    "LIVE", "VERIFIED", "CALCULATED", "SOURCE",
    "SIMULATED", "STALE", "UNAVAILABLE", "UNKNOWN",
}

def registry_errors(path: Path, record_types, identity, label) -> list:
    """Problems with a static registry source; [] when it backs the object."""
    if not path.is_file():
        return ["registry file missing: " + str(path.relative_to(ROOT) if path.is_relative_to(ROOT) else path)]
    if not record_types:
        return ["registry source declares no recordTypes"]
    data = json.loads(path.read_text(encoding="utf-8"))
    found = {t: [] for t in record_types}
    def walk(node):
        if isinstance(node, dict):
            t = node.get("type")
            if t in found and "id" in node:
                found[t].append(node)
            for v in node.values():
                walk(v)
        elif isinstance(node, list):
            for v in node:
                walk(v)
    walk(data)
    errors = []
    for t, records in found.items():
        if not records:
            errors.append("no records of type " + t)
        for r in records:
            rid = r.get("id")
            for field in (identity, label):
                if field and field not in r:
                    errors.append(f"{t}:{rid} lacks {field}")
            if r.get("state") not in ALLOWED_TRUTH:
                errors.append(f"{t}:{rid} state {r.get('state')!r} is not a truth state")
    return errors


def is_registry(source: str) -> bool:
    return source.startswith("config/") and source.endswith(".json")

def main() -> None:
    model = json.loads(MODEL.read_text())
    schema = json.loads(SCHEMA.read_text())
    object_schema = json.loads(OBJECT_SCHEMA.read_text())

    raw_tables = schema.get("tables", {})
    assert isinstance(raw_tables, dict) and raw_tables
    # The source model intentionally uses canonical unqualified table names,
    # while live-schema evidence is emitted with explicit public.* keys.
    # Preserve both forms so the contract compares names, not formatting.
    tables = dict(raw_tables)
    for qualified_name, columns in raw_tables.items():
        if qualified_name.startswith("public."):
            tables.setdefault(qualified_name.split(".", 1)[1], columns)
    assert model["contract"] == "OmegaObject"

    required_schema_fields = {"id", "type", "label", "truth", "state", "source", "observedAt"}
    assert set(object_schema.get("required", [])) == required_schema_fields
    assert set(object_schema["properties"]["truth"]["enum"]) == ALLOWED_TRUTH

    objects = model["objects"]
    assert objects and len({x["type"] for x in objects}) == len(objects)

    missing_sources = {}
    invalid_fields = {}
    invalid_registry = {}
    registry_backed = 0
    for obj in objects:
        sources = obj.get("sources", [])
        registries = [name for name in sources if is_registry(name)]
        if registries and len(registries) == len(sources):
            problems = []
            for name in registries:
                problems += registry_errors(ROOT / name, obj.get("recordTypes"), obj.get("identity"), obj.get("label"))
            if problems:
                invalid_registry[obj["type"]] = problems[:8]
            else:
                registry_backed += 1
            continue
        available = [name for name in sources if name in tables]
        if not available:
            missing_sources[obj["type"]] = sources
            continue

        identity = obj.get("identity")
        label = obj.get("label")
        owner = obj.get("owner")
        candidates = []
        for source in available:
            cols = set(tables[source])
            required = [x for x in (identity, label, owner) if x]
            missing = [x for x in required if x not in cols]
            if not missing:
                candidates.append(source)
        if not candidates:
            invalid_fields[obj["type"]] = {
                "sources": available,
                "identity": identity,
                "label": label,
                "owner": owner,
                "missingBySource": {
                    source: [
                        x for x in (identity, label, owner)
                        if x and x not in set(tables[source])
                    ]
                    for source in available
                },
            }

    if missing_sources:
        raise SystemExit(
            "OMEGA_OBJECT_CONTRACT=FAIL missing source tables: "
            + json.dumps(missing_sources, sort_keys=True)
        )
    if invalid_registry:
        raise SystemExit(
            "OMEGA_OBJECT_CONTRACT=FAIL invalid registry sources: "
            + json.dumps(invalid_registry, sort_keys=True)
        )
    if invalid_fields:
        raise SystemExit(
            "OMEGA_OBJECT_CONTRACT=FAIL invalid source fields: "
            + json.dumps(invalid_fields, sort_keys=True)
        )

    object_types = {x["type"] for x in objects}
    relations = model["relations"]
    assert relations and all({"type", "from", "to"} <= set(r) for r in relations)
    for rel in relations:
        for side in ("from", "to"):
            for endpoint in rel[side]:
                if endpoint != "*" and endpoint not in object_types:
                    raise SystemExit(
                        f"OMEGA_OBJECT_CONTRACT=FAIL unknown relation endpoint: "
                        f"{rel['type']}:{side}:{endpoint}"
                    )

    assert set(model["truth"]["allowedStates"]) == ALLOWED_TRUTH

    print(
        f"OMEGA_OBJECT_CONTRACT=PASS objects={len(objects)} "
        f"relations={len(relations)} tables={len(tables)} registry_backed={registry_backed}"
    )

if __name__ == "__main__":
    main()
