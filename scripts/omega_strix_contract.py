#!/usr/bin/env python3
"""Validate a recorded Strix security-evidence manifest.

This script intentionally does not execute penetration testing. It validates
that a separately produced, authorized Strix result contains the minimum
metadata required before OMEGA can treat it as security evidence.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

REQUIRED = (
    "engine",
    "engine_version",
    "target",
    "commit",
    "scan_mode",
    "scope",
    "started_at",
    "completed_at",
    "status",
    "findings",
    "artifact",
)
MODES = {"quick", "standard", "deep"}
STATUSES = {"completed", "failed", "blocked"}


def main() -> int:
    if len(sys.argv) != 2 or sys.argv[1] in {"-h", "--help"}:
        print("usage: python scripts/omega_strix_contract.py <strix-evidence.json>")
        return 0 if len(sys.argv) == 2 else 2

    path = Path(sys.argv[1])
    if not path.is_file():
        print(f"FAIL: evidence file not found: {path}")
        return 1

    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        print(f"FAIL: invalid JSON: {exc}")
        return 1

    failures = []
    if data.get("engine", "").lower() != "strix":
        failures.append("engine must be 'strix'")
    for key in REQUIRED:
        value = data.get(key)
        if value is None or value == "" or value == []:
            failures.append(f"missing evidence field: {key}")
    if data.get("scan_mode") not in MODES:
        failures.append("scan_mode must be quick, standard, or deep")
    if data.get("status") not in STATUSES:
        failures.append("status must be completed, failed, or blocked")
    if not isinstance(data.get("findings"), dict):
        failures.append("findings must be an object keyed by severity")
    if not isinstance(data.get("scope"), str):
        failures.append("scope must be a recorded string")

    if failures:
        print("OMEGA STRIX CONTRACT=FAIL")
        for item in failures:
            print(f"FAIL: {item}")
        return 1

    print("OMEGA STRIX CONTRACT=PASS")
    print(f"target={data['target']}")
    print(f"commit={data['commit']}")
    print(f"scan_mode={data['scan_mode']}")
    print(f"status={data['status']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
