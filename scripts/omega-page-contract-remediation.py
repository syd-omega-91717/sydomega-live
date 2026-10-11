#!/usr/bin/env python3
"""Generate evidence-bound remediation tasks from the canonical page contracts.

This tool never fills missing page facts. It converts explicit UNVERIFIED or
OPEN_TASK fields into deterministic work items, preserving the page contract
as the authority. It is intentionally source-only and requires no provider
access.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONTRACTS = ROOT / "config" / "omega-page-contracts.json"
OUTPUT = ROOT / "config" / "omega-page-contract-remediation.json"

FIELDS = (
    "workspace", "domain", "primary_role", "purpose", "data_sources",
    "capabilities", "authorization", "truth_states", "asset_requirements",
    "events", "failure_paths", "accessibility", "responsive",
)

TASK_KIND = {
    "workspace": "PAGE_WORKSPACE_REVIEW",
    "domain": "PAGE_DOMAIN_OWNERSHIP_REVIEW",
    "primary_role": "PAGE_ROLE_REVIEW",
    "purpose": "PAGE_PURPOSE_REVIEW",
    "data_sources": "PAGE_DATA_SOURCE_REVIEW",
    "capabilities": "PAGE_CAPABILITY_REVIEW",
    "authorization": "PAGE_AUTHORIZATION_REVIEW",
    "truth_states": "PAGE_TRUTH_STATE_REVIEW",
    "asset_requirements": "PAGE_ASSET_REVIEW",
    "events": "PAGE_OBSERVABILITY_REVIEW",
    "failure_paths": "PAGE_FAILURE_PATH_REVIEW",
    "accessibility": "PAGE_ACCESSIBILITY_REVIEW",
    "responsive": "PAGE_RESPONSIVE_REVIEW",
}


def is_missing(value) -> bool:
    if value is None:
        return True
    if isinstance(value, str):
        return value in {"UNVERIFIED", "OPEN_TASK", ""}
    if isinstance(value, list):
        return not value or "UNVERIFIED" in value
    if isinstance(value, dict):
        if value.get("state") == "OPEN_TASK":
            return True
        return any(is_missing(v) for v in value.values())
    return False


def main() -> int:
    data = json.loads(CONTRACTS.read_text(encoding="utf-8"))
    contracts = data.get("contracts", [])
    tasks = []
    for page in contracts:
        page_id = page.get("page_id")
        path = page.get("path")
        for field in FIELDS:
            if is_missing(page.get(field)):
                tasks.append({
                    "task_id": f"PAGE::{page_id}::{TASK_KIND[field]}",
                    "page_id": page_id,
                    "path": path,
                    "field": field,
                    "state": "OPEN",
                    "authority": "config/omega-page-contracts.json",
                    "evidence_required": [
                        "source inspection",
                        "explicit implementation evidence",
                        "authorization evidence where applicable",
                        "truth-state evidence",
                        "test evidence",
                        "production evidence where applicable",
                    ],
                    "prohibition": "Do not infer or synthesize the missing value.",
                })

    output = {
        "schema_version": 1,
        "name": "Ω Page Contract Remediation Queue",
        "status": "SOURCE_EVIDENCE_ONLY",
        "source": "config/omega-page-contracts.json",
        "source_sha256": hashlib.sha256(
            CONTRACTS.read_bytes()
        ).hexdigest(),
        "page_count": len(contracts),
        "source_audited_pages": data.get("audit_summary", {}).get(
            "source_audited_pages", 0
        ),
        "remaining_source_audit_pages": data.get("audit_summary", {}).get(
            "remaining_source_audit_pages", len(contracts)
        ),
        "open_task_count": len(tasks),
        "tasks": tasks,
        "truth_boundary": (
            "A remediation task is evidence work, not evidence itself. "
            "Completing this queue requires inspecting the source and, where "
            "applicable, runtime/provider state."
        ),
    }
    OUTPUT.write_text(
        json.dumps(output, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(f"PAGES={len(contracts)}")
    print(f"SOURCE_AUDITED={output['source_audited_pages']}")
    print(f"REMAINING_SOURCE_AUDIT={output['remaining_source_audit_pages']}")
    print(f"OPEN_REMEDIATION_TASKS={len(tasks)}")
    print(f"WROTE={OUTPUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
