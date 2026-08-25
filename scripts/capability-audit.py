#!/usr/bin/env python3
"""Build a deterministic source-level capability inventory for SYD OMEGA.

The audit deliberately reports evidence instead of pretending source presence
means production readiness. It inventories HTML entry points, runtime loading,
local persistence markers, Supabase calls, and obvious failure markers.
"""
from __future__ import annotations

import json
import re
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs/capabilities/registry.json"


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def classify(src: str, page: Path) -> tuple[str, int, list[str]]:
    evidence: list[str] = []
    score = 0
    if re.search(r'<script[^>]+src=["\']/+bg\.js(?:[?#"\'])', src, re.I):
        score += 10
        evidence.append("platform_runtime:bg.js")
    else:
        return "UNREACHABLE", 0, ["missing_platform_runtime:bg.js"]
    if re.search(r'\b(?:supabase|@supabase)\b', src, re.I) or re.search(r'\.(?:from|rpc)\s*\(', src):
        score += 25
        evidence.append("supabase_client_usage")
    if re.search(r'localStorage|sessionStorage|indexedDB', src, re.I):
        score += 10
        evidence.append("client_persistence")
    if re.search(r'fetch\s*\(|XMLHttpRequest|WebSocket', src, re.I):
        score += 10
        evidence.append("network_runtime")
    if re.search(r'form|button|input|textarea|select', src, re.I):
        score += 10
        evidence.append("interactive_ui")
    if re.search(r'\.catch\s*\(|try\s*\{', src):
        score += 5
        evidence.append("error_handling")
    if re.search(r'data-i18n|i18n\.js', src, re.I):
        score += 5
        evidence.append("internationalization")
    if re.search(r'wallet_balances|transactions', src, re.I):
        evidence.append("known_high_risk_domain")
    if re.search(r'TODO|FIXME|throw new Error|not implemented', src, re.I):
        score -= 10
        evidence.append("incomplete_marker")
    if score >= 55:
        status = "CONNECTED"
    elif score >= 35:
        status = "PARTIAL"
    else:
        status = "BUILT"
    return status, max(0, min(100, score)), evidence


def main() -> int:
    pages = sorted(ROOT.glob("*.html"))
    capabilities = []
    for page in pages:
        src = read(page)
        status, confidence, evidence = classify(src, page)
        capabilities.append({
            "id": page.stem,
            "name": page.stem.replace("-", " ").replace("_", " ").title(),
            "entrypoint": page.name,
            "status": status,
            "confidence": confidence,
            "evidence": evidence,
            "verified": False,
            "production_gate": "source-audit-only",
        })
    payload = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "name": "SYD OMEGA 91717 Capability Registry",
        "version": 1,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "status_order": ["STATIC", "LOCAL_ONLY", "PARTIAL", "BUILT", "CONNECTED", "PERSISTED", "SECURED", "TESTED", "DEPLOYED", "VERIFIED", "BROKEN", "UNREACHABLE"],
        "confidence_scale": "0-100",
        "source_of_truth": "source-controlled evidence; live verification is required before VERIFIED",
        "capabilities": capabilities,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    counts: dict[str, int] = {}
    for item in capabilities:
        counts[item["status"]] = counts.get(item["status"], 0) + 1
    print(f"CAPABILITY AUDIT: {len(capabilities)} HTML entry points")
    for key in sorted(counts):
        print(f"  {key}: {counts[key]}")
    print(f"WROTE {OUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
