#!/usr/bin/env python3
"""Build an evidence-only bootstrap inventory for every HTML page.

The output is NOT the authoritative page-contract registry. It records direct
source evidence, explicit capability entrypoint matches, and deterministic
OPEN_TASK remediation IDs for fields that cannot be proven from source.

Usage:
  python3 scripts/omega-page-contract-bootstrap.py
  python3 scripts/omega-page-contract-bootstrap.py --help
  python3 scripts/omega-page-contract-bootstrap.py --promote
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CAPABILITIES = ROOT / "docs" / "capabilities" / "registry.json"
DOMAIN_DOC = ROOT / "docs" / "OMEGA_DOMAIN_REGISTRY.md"
OUT = ROOT / "config" / "omega-page-contract-bootstrap.json"
CONTRACTS_OUT = ROOT / "config" / "omega-page-contracts.json"
TASKS_OUT = ROOT / "config" / "omega-page-review-tasks.json"
REQUIRED = [
    "page_id", "path", "workspace", "domain", "primary_role", "purpose",
    "data_sources", "capabilities", "tasks", "authorization", "truth_states",
    "asset_requirements", "events", "failure_paths", "accessibility",
    "responsive", "traceability", "evidence",
]


def norm(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def load_domains() -> list[dict]:
    rows = []
    for line in DOMAIN_DOC.read_text(encoding="utf-8", errors="replace").splitlines():
        m = re.match(r"^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|", line)
        if m and m.group(1).strip().lower() != "domain":
            rows.append({
                "domain": m.group(1).strip(),
                "primary_role": m.group(2).strip(),
            })
    return rows


def load_capabilities() -> list[dict]:
    return json.loads(CAPABILITIES.read_text(encoding="utf-8"))["capabilities"]


def scan_page(path: Path, capabilities: list[dict], domains: list[dict]) -> dict:
    text = path.read_text(encoding="utf-8", errors="ignore")
    title = re.findall(r"<title[^>]*>(.*?)</title>", text, re.I | re.S)
    h1 = re.findall(r"<h1\b[^>]*>(.*?)</h1>", text, re.I | re.S)
    clean = lambda s: re.sub(r"<[^>]+>", " ", s).strip()
    tables = sorted(set(re.findall(r"\.from\([\"']([^\"']+)", text)))
    rpcs = sorted(set(re.findall(r"\.rpc\([\"']([^\"']+)", text)))
    scripts = sorted(set(re.findall(r"<script[^>]+src=[\"']([^\"']+)", text, re.I)))
    capabilities_hit = []
    for cap in capabilities:
        entrypoints = [str(x) for x in cap.get("entrypoints", [])]
        if path.name in entrypoints or path.as_posix() in entrypoints:
            capabilities_hit.append(cap["id"])

    domain_candidates = []
    haystack = norm(path.stem)
    for domain in domains:
        token = norm(domain["domain"])
        if token and (token == haystack or token in haystack or haystack in token):
            domain_candidates.append(domain)

    evidence = {
        "title": clean(title[0]) if title else "",
        "h1": [clean(x) for x in h1],
        "scripts": scripts,
        "supabase_tables": tables,
        "supabase_rpcs": rpcs,
        "capability_candidates": capabilities_hit,
        "domain_candidates": domain_candidates,
        "interactive_counts": {
            "buttons": len(re.findall(r"<button\b", text, re.I)),
            "forms": len(re.findall(r"<form\b", text, re.I)),
            "inputs": len(re.findall(r"<(?:input|textarea|select)\b", text, re.I)),
            "links": len(re.findall(r"<a\b", text, re.I)),
        },
        "media_counts": {
            "images": len(re.findall(r"<img\b", text, re.I)),
            "video": len(re.findall(r"<video\b", text, re.I)),
            "audio": len(re.findall(r"<audio\b", text, re.I)),
            "iframes": len(re.findall(r"<iframe\b", text, re.I)),
        },
    }

    missing = [
        field for field in REQUIRED
        if field not in {"page_id", "path", "data_sources", "capabilities", "evidence"}
    ]
    if not tables and not rpcs:
        missing.append("data_sources")
    missing = sorted(set(missing))
    tasks = [
        f"PAGE::{path.stem}::MISSING::{field.upper()}"
        for field in missing
    ]

    return {
        "page_id": path.stem,
        "path": path.as_posix(),
        "contract_state": "BOOTSTRAP_OPEN",
        "authoritative_contract_present": False,
        "evidence": evidence,
        "candidate_capabilities": capabilities_hit,
        "candidate_domains": domain_candidates,
        "missing_contract_fields": missing,
        "remediation_tasks": tasks,
        "truth_rule": "SOURCE_EVIDENCE_ONLY",
    }


def promote(rows: list[dict]) -> None:
    """Materialize only directly observed page evidence; never invent semantics."""
    existing = {}
    if CONTRACTS_OUT.is_file():
        try:
            old = json.loads(CONTRACTS_OUT.read_text(encoding="utf-8"))
            existing = {c.get("page_id"): c for c in old.get("contracts", [])}
        except Exception:
            existing = {}

    contracts = []
    tasks = []
    for row in rows:
        ev = row["evidence"]
        old = existing.get(row["page_id"], {})
        caps = row["candidate_capabilities"] or old.get("capabilities") or ["UNVERIFIED"]
        domains = row["candidate_domains"]
        domain = domains[0]["domain"] if domains else old.get("domain", "UNVERIFIED")
        role = domains[0]["primary_role"] if domains else old.get("primary_role", "UNVERIFIED")
        data = {
            "supabase_tables": ev["supabase_tables"],
            "supabase_rpcs": ev["supabase_rpcs"],
        } if ev["supabase_tables"] or ev["supabase_rpcs"] else "UNVERIFIED"
        page_id = row["page_id"]
        task_id = f"PAGE::{page_id}::REVIEW"
        contract = {
            "page_id": page_id,
            "path": row["path"],
            "contract_state": "EVIDENCE_CONTRACT",
            "authority": "REPOSITORY_SOURCE_EVIDENCE_ONLY",
            "workspace": old.get("workspace", "UNVERIFIED"),
            "domain": domain,
            "primary_role": role,
            "purpose": ev["title"] or (ev["h1"][0] if ev["h1"] else "UNVERIFIED"),
            "data_sources": data,
            "capabilities": caps,
            "tasks": {"state": "OPEN_TASK", "ids": [task_id]},
            "authorization": "UNVERIFIED",
            "truth_states": ["UNVERIFIED"],
            "asset_requirements": "UNVERIFIED",
            "events": "UNVERIFIED",
            "failure_paths": "UNVERIFIED",
            "accessibility": "UNVERIFIED",
            "responsive": "UNVERIFIED",
            "traceability": {
                "page_source": row["path"],
                "source_content_audited": True,
                "script_evidence": ev["scripts"],
                "data_evidence": data,
                "capability_registry_matches": row["candidate_capabilities"],
                "domain_candidates": domains,
            },
            "evidence": {
                "filesystem_present": True,
                "source_content_audited": True,
                "source_audited_at": "CI_RUNTIME",
                "method": "direct HTML source inspection",
                "interactive_evidence": ev["interactive_counts"],
                "media_evidence": ev["media_counts"],
            },
        }
        contracts.append(contract)
        tasks.append({
            "task_id": task_id,
            "task_type": "AUDIT",
            "page": page_id,
            "path": row["path"],
            "state": "OPEN",
            "role": role,
            "capability": caps,
            "authorization": "UNVERIFIED",
            "truth_state": "UNVERIFIED",
            "evidence_required": True,
            "evidence_status": "PENDING_SEMANTIC_AUTHORIZATION_TRUTH_AUDIT",
            "owner": "UNASSIGNED",
            "blocker": "Source evidence exists, but semantic role, authorization, production truth, assets, events, failure paths and accessibility remain unverified.",
            "next_action": "Review direct source evidence and populate only independently proven contract fields."
        })

    report = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "name": "Ω Page Contract Registry",
        "version": 4,
        "status": "SOURCE_EVIDENCE_BOOTSTRAP",
        "source_of_truth": "Repository source evidence plus canonical capability/domain registries; semantic gaps remain explicit UNVERIFIED.",
        "contract_policy": {
            "unknown_is_not_production_truth": True,
            "source_content_audited": True,
            "production_complete_requires_authorization_and_evidence": True,
        },
        "page_count": len(contracts),
        "contracts": contracts,
        "audit_summary": {
            "page_count": len(contracts),
            "source_audited_pages": len(contracts),
            "remaining_source_audit_pages": 0,
            "truth_and_authorization_still_unverified": True,
        },
    }
    CONTRACTS_OUT.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    task_report = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "name": "Ω Page Review Task Registry",
        "version": 2,
        "status": "OPEN_AUDIT_QUEUE",
        "principle": "EVERY_PAGE_HAS_AUDIT_WORK",
        "task_contract": "config/omega-task-contract.json",
        "task_count": len(tasks),
        "states": ["OPEN","READY","AUTHORIZED","RUNNING","VERIFYING","COMPLETED","FAILED","BLOCKED","CANCELLED"],
        "tasks": tasks,
    }
    TASKS_OUT.write_text(json.dumps(task_report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

def main() -> int:
    if "-h" in sys.argv[1:] or "--help" in sys.argv[1:]:
        print(__doc__.strip())
        return 0
    capabilities = load_capabilities()
    domains = load_domains()
    pages = sorted(ROOT.glob("*.html"))
    rows = [scan_page(p, capabilities, domains) for p in pages]
    if "--promote" in sys.argv[1:]:
        promote(rows)
    task_count = sum(len(r["remediation_tasks"]) for r in rows)
    report = {
        "version": 1,
        "generated_by": "scripts/omega-page-contract-bootstrap.py",
        "authority": "evidence-only; does not populate config/omega-page-contracts.json",
        "page_count": len(rows),
        "open_task_count": task_count,
        "pages": rows,
    }
    OUT.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"PAGES={len(rows)}")
    print(f"OPEN_TASKS={task_count}")
    print(f"CAPABILITY_CANDIDATES={sum(bool(r['candidate_capabilities']) for r in rows)}")
    print(f"DOMAIN_CANDIDATES={sum(bool(r['candidate_domains']) for r in rows)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
