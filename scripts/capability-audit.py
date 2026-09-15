#!/usr/bin/env python3
"""Validate and maintain the SYD OMEGA capability evidence registry."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

if __name__ == "__main__" and ("--help" in sys.argv or "-h" in sys.argv):
    print(__doc__)
    raise SystemExit(0)

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs/capabilities/registry.json"
STATUS_ORDER = ["STATIC", "LOCAL_ONLY", "PARTIAL", "BUILT", "CONNECTED", "PERSISTED", "SECURED", "TESTED", "DEPLOYED", "VERIFIED", "BROKEN", "UNREACHABLE"]
CONTRACT_KEYS = ("entrypoint", "data_contract", "authorization", "failure_path", "static_evidence", "live_verification")
_PLACEHOLDERS = ("tbd", "todo", "unknown", "?", "n/a?", "fixme", "xxx")


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def validate_entrypoints(capabilities: list[dict]) -> list[str]:
    """Reject registry drift when a declared shipped file no longer exists."""
    failures: list[str] = []
    for item in capabilities:
        ident = item.get("id", "<missing-id>")
        for entrypoint in item.get("entrypoints", []) or []:
            if not isinstance(entrypoint, str) or not entrypoint.strip():
                continue
            value = entrypoint.strip()
            if value.startswith(("http://", "https://", "none ")):
                continue
            # Registry entrypoints are repo-relative shipped files. Ignore prose
            # fragments, but enforce concrete file paths ending in a known web
            # or script extension so a renamed/deleted surface cannot silently
            # remain claimed as built.
            if not re.search(r"\.(?:html?|js|css|json|webmanifest)$", value, re.I):
                continue
            path = ROOT / value.lstrip("/")
            if not path.is_file() and not (ROOT / "public" / value.lstrip("/")).is_file():
                failures.append(f"{ident}: declared entrypoint is missing: {value}")
    return failures


def validate_registry() -> int:
    try:
        data = json.loads(read(OUT))
    except Exception as exc:
        print(f"REGISTRY INVALID: {exc}")
        return 1
    failures = []
    if data.get("name") != "SYD OMEGA 91717 Capability Registry":
        failures.append("invalid registry name")
    if data.get("status_order") != STATUS_ORDER:
        failures.append("status_order mismatch")
    capabilities = data.get("capabilities")
    if not isinstance(capabilities, list) or not capabilities:
        failures.append("capabilities must be a non-empty list")
        capabilities = []
    ids = set()
    for item in capabilities:
        ident = item.get("id") if isinstance(item, dict) else None
        if not ident or ident in ids:
            failures.append(f"duplicate/missing capability id: {ident!r}")
        ids.add(ident)
        if item.get("status") not in STATUS_ORDER:
            failures.append(f"{ident}: invalid status")
        confidence = item.get("confidence")
        if not isinstance(confidence, int) or not 0 <= confidence <= 100:
            failures.append(f"{ident}: confidence must be 0..100")
        contract = item.get("contract")
        if not isinstance(contract, dict):
            failures.append(f"{ident}: contract object is required (six keys: {', '.join(CONTRACT_KEYS)})")
        else:
            for key in CONTRACT_KEYS:
                val = contract.get(key)
                if not isinstance(val, str) or len(val.strip()) < 12:
                    failures.append(f"{ident}: contract.{key} must be a concrete sentence")
                elif val.strip().lower().rstrip(".") in _PLACEHOLDERS:
                    failures.append(f"{ident}: contract.{key} is a placeholder, not evidence")
            promoted = STATUS_ORDER.index(item.get("status", "STATIC")) >= STATUS_ORDER.index("BUILT") and item.get("status") not in ("BROKEN", "UNREACHABLE")
            if promoted and isinstance(contract.get("failure_path"), str) and contract["failure_path"].strip().upper().startswith(("GAP", "WEAK", "MISSING")):
                failures.append(f"{ident}: status {item.get('status')} but contract.failure_path starts with a gap marker - keep it PARTIAL until the failure path is real")
        if item.get("status") == "VERIFIED" and item.get("verified") is not True:
            failures.append(f"{ident}: VERIFIED requires verified=true")
        lv = (contract or {}).get("live_verification", "") if isinstance(contract, dict) else ""
        if item.get("verified") is True and "BLOCKED" in str(lv).upper():
            failures.append(f"{ident}: verified=true but live_verification is BLOCKED - no capability may be marked verified without evidence")
    failures.extend(validate_entrypoints(capabilities))
    if failures:
        print("CAPABILITY REGISTRY FAILED")
        for failure in failures:
            print(f"  - {failure}")
        return 1
    print(f"CAPABILITY REGISTRY PASSED: {len(capabilities)} capabilities")
    return 0


def source_audit() -> int:
    pages = sorted(ROOT.glob("*.html"))
    counts: dict[str, int] = {}
    missing_runtime = []
    for page in pages:
        src = read(page)
        if not re.search(r'<script[^>]+src=["\']?/+bg\.js(?:[?#"\'\s>]|$)', src, re.I):
            missing_runtime.append(page.name)
            continue
        score = 10
        if re.search(r'\b(?:supabase|@supabase)\b|\.(?:from|rpc)\s*\(', src, re.I): score += 25
        if re.search(r'localStorage|sessionStorage|indexedDB', src, re.I): score += 10
        if re.search(r'fetch\s*\(|XMLHttpRequest|WebSocket', src, re.I): score += 10
        if re.search(r'\.catch\s*\(|try\s*\{', src): score += 5
        if score >= 45: status = "CONNECTED"
        elif score >= 25: status = "PARTIAL"
        else: status = "BUILT"
        counts[status] = counts.get(status, 0) + 1
    print(f"SOURCE AUDIT: {len(pages)} HTML entry points")
    for status in sorted(counts): print(f"  {status}: {counts[status]}")
    if missing_runtime:
        print(f"MISSING /bg.js: {len(missing_runtime)}")
        for page in missing_runtime: print(f"  - {page}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(validate_registry() if "--check" in sys.argv else source_audit())
