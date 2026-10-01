#!/usr/bin/env python3
"""Validate the canonical Ω Object contract against live-schema evidence."""
from __future__ import annotations
import json
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
    for obj in objects:
        sources = obj.get("sources", [])
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
        f"relations={len(relations)} tables={len(tables)}"
    )

if __name__ == "__main__":
    main()
