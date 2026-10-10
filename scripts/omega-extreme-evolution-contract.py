#!/usr/bin/env python3
"""Validate the governed Omega extreme-evolution control.

This is intentionally a static structural gate. It does not manufacture
provider evidence; it verifies that high-impact evolution work remains
explicitly classified, dependency-aware, and subject to evidence rules.
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PATH = os.path.join(ROOT, "config", "omega-extreme-evolution-control.json")

REQUIRED = {
    "id", "priority", "area", "status", "exit_evidence"
}
VALID_PRIORITIES = {
    "EXTREME_0", "MAJOR_1", "MAJOR_2", "EXPANSION_3", "FUTURE_4"
}
VALID_STATUSES = {
    "BLOCKED", "UNVERIFIED", "PARTIAL", "PENDING",
    "IMPLEMENTED_CONTROL_UNVERIFIED_PROVIDER_CLOSURE",
    "IMPLEMENTED", "FUTURE"
}


def fail(message):
    print("FAIL:", message)
    return 1


def main():
    with open(PATH, encoding="utf-8") as fh:
        doc = json.load(fh)

    if doc.get("status") != "GOVERNED_BACKLOG_NOT_PRODUCTION_PROOF":
        return fail("control status must preserve its non-production-proof boundary")

    gates = doc.get("gates")
    if not isinstance(gates, list) or not gates:
        return fail("gates must be a non-empty list")

    seen = set()
    for gate in gates:
        missing = REQUIRED - set(gate)
        if missing:
            return fail("%s missing %s" % (gate.get("id", "<unknown>"), sorted(missing)))
        gate_id = gate["id"]
        if gate_id in seen:
            return fail("duplicate gate id %s" % gate_id)
        seen.add(gate_id)
        if gate["priority"] not in VALID_PRIORITIES:
            return fail("%s has invalid priority %s" % (gate_id, gate["priority"]))
        if gate["status"] not in VALID_STATUSES:
            return fail("%s has invalid status %s" % (gate_id, gate["status"]))
        if not isinstance(gate["exit_evidence"], list) or not gate["exit_evidence"]:
            return fail("%s must define exit evidence" % gate_id)
        if gate["priority"] == "EXTREME_0" and not gate.get("rule"):
            return fail("%s must define an extreme-tier rule" % gate_id)

    ids = {g["id"] for g in gates}
    for gate in gates:
        for dep in gate.get("depends_on", []):
            if dep.startswith(("EXT-", "MAJ-", "EXP-", "FUT-")) and dep not in ids:
                return fail("%s depends on unknown gate %s" % (gate["id"], dep))

    anti = doc.get("anti_shortcuts", [])
    required_shortcuts = {
        "no synthetic production evidence",
        "no blind page-action mappings",
        "no client-authoritative security or financial state",
        "no credentials in documentation",
        "no provider failure suppression",
        "no architectural rewrite without measured need",
        "no vanity metrics without source and freshness",
        "no lore presented as real-world fact",
    }
    if not required_shortcuts.issubset(set(anti)):
        return fail("anti-shortcut protections are incomplete")

    print("PASS: %d extreme/major evolution gates validated" % len(gates))
    return 0


if __name__ == "__main__":
    sys.exit(main())
