#!/usr/bin/env python3
"""Deterministic audit for the Ω unified page fabric.

The auditor validates declared contracts, source-page coverage, and legacy
redirect aliases. It emits remediation tasks for missing or explicitly
UNVERIFIED contract facts and never infers production truth from HTML.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

if any(arg in {"--help", "-h"} for arg in sys.argv[1:]):
    print(__doc__.strip())
    raise SystemExit(0)

ROOT = Path(__file__).resolve().parents[1]
FABRIC = json.loads((ROOT / "config/omega-unified-platform-fabric.json").read_text())
REGISTRY = json.loads((ROOT / "config/omega-page-contracts.json").read_text())
ALIASES = json.loads((ROOT / "config/omega-page-aliases.json").read_text())
UNVERIFIED = {"UNVERIFIED", "UNAVAILABLE_UNVERIFIED", "SOURCE_UNVERIFIED"}
# Keep this aligned with scripts/vercel-build.sh. A page is part of the shipped
# static estate only when the build copies it into public/.
EXCLUDED_PATH_PARTS = {
    ".git", "node_modules", "tests", "scripts", ".claude", "supabase",
    "core", "docs", "config", "vendor", "i18n", "public",
}


def unresolved(value):
    if value is None or value == "" or value == []:
        return True
    if isinstance(value, str):
        return value in UNVERIFIED
    if isinstance(value, dict):
        state = value.get("state")
        return state in UNVERIFIED or state == "OPEN_TASK"
    return False


def shipped_html_paths(root: Path) -> set[str]:
    """Return HTML paths included by the static build's directory exclusions."""
    paths = set()
    for path in root.rglob("*.html"):
        if not path.is_file():
            continue
        relative = path.relative_to(root)
        if any(part in EXCLUDED_PATH_PARTS for part in relative.parts):
            continue
        paths.add(relative.as_posix())
    return paths


def page_inventory_errors(root: Path, registry: dict, alias_registry: dict) -> list[str]:
    """Fail closed if a shipped HTML file has neither a page contract nor alias."""
    errors = []
    contracts = registry.get("contracts", [])
    aliases = alias_registry.get("aliases", [])
    contract_paths = [str(row.get("path", "")) for row in contracts]
    alias_paths = [str(row.get("path", "")) for row in aliases]

    for path in sorted({p for p in contract_paths if p} & {p for p in alias_paths if p}):
        errors.append(f"page path declared as both canonical and alias: {path}")

    if len(contract_paths) != len(set(contract_paths)):
        errors.append("duplicate canonical page path in omega-page-contracts.json")
    if len(alias_paths) != len(set(alias_paths)):
        errors.append("duplicate alias path in omega-page-aliases.json")

    shipped = shipped_html_paths(root)
    declared = set(contract_paths) | set(alias_paths)
    for path in sorted(declared - shipped):
        errors.append(f"declared page or alias is not shipped by the static build: {path}")
    for path in sorted(shipped - declared):
        errors.append(f"shipped HTML has no canonical contract or alias declaration: {path}")

    for alias in aliases:
        path = str(alias.get("path", ""))
        target = str(alias.get("target", ""))
        if not path or not target:
            errors.append("alias entry requires non-empty path and target")
            continue
        if not target.startswith("/") or target.startswith("//"):
            errors.append(f"alias target must be an absolute same-origin path: {path} -> {target}")
            continue
        target_file = root / target.lstrip("/")
        source_file = root / path
        if not target_file.is_file():
            errors.append(f"alias target does not exist: {path} -> {target}")
        if source_file.is_file():
            body = source_file.read_text(encoding="utf-8", errors="ignore")
            if target not in body or not re.search(
                r"window\.location\.(?:href|assign|replace)|http-equiv=[\"']refresh",
                body,
                re.IGNORECASE,
            ):
                errors.append(f"alias source does not prove its declared redirect target: {path} -> {target}")
    return errors


def main() -> int:
    required = FABRIC["page_contract_required"]
    valid = set(FABRIC["truth_states"])
    contracts = REGISTRY.get("contracts", [])
    errors = page_inventory_errors(ROOT, REGISTRY, ALIASES)
    tasks = []
    seen = set()
    for contract in contracts:
        page_id = contract.get("page_id", "")
        if not page_id:
            errors.append("contract missing page_id")
            continue
        if page_id in seen:
            errors.append(f"duplicate page_id: {page_id}")
        seen.add(page_id)
        for key in required:
            if unresolved(contract.get(key)):
                tasks.append(f"PAGE-CONTRACT::{page_id}::MISSING::{key}")
        for state in contract.get("truth_states", []):
            if state not in valid:
                errors.append(f"{page_id}: invalid truth state {state}")
        if contract.get("production_complete") is True:
            for key in ("authorization", "evidence", "traceability", "failure_paths"):
                if unresolved(contract.get(key)):
                    errors.append(f"{page_id}: production_complete requires {key}")

    print(f"PAGE_CONTRACTS={len(contracts)}")
    print(f"PAGE_ALIASES={len(ALIASES.get('aliases', []))}")
    print(f"SHIPPED_HTML={len(shipped_html_paths(ROOT))}")
    print(f"REMEDIATION_TASKS={len(tasks)}")
    print(f"ERRORS={len(errors)}")
    for task in tasks:
        print("TASK " + task)
    for error in errors:
        print("ERROR " + error)
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
