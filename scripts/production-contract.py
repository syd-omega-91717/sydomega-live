#!/usr/bin/env python3
"""SYD OMEGA 91717 production contract gate.

Deterministic source contract for the static production deployment. Runtime
claims remain separate: architecture.html exposes executable browser probes,
while this gate verifies that the control-plane assets are shipped.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FAIL = 0


def error(path: Path, message: str) -> None:
    global FAIL
    FAIL += 1
    print(f"ERROR {path}: {message}")


def check_pages() -> None:
    pages = sorted(ROOT.glob("*.html"))
    if not pages:
        error(ROOT, "no production HTML pages found")
        return

    for page in pages:
        src = page.read_text(encoding="utf-8", errors="ignore")
        if not re.search(r'<script[^>]+src=["\']/+bg\.js(?:[?#\"\'])', src, re.I):
            error(page, "missing /bg.js runtime")

        ids = re.findall(r'\bid=["\']([^"\']+)["\']', src, re.I)
        seen: set[str] = set()
        for ident in ids:
            if ident in seen:
                error(page, f"duplicate id={ident!r}")
            seen.add(ident)

        refs = re.findall(r'\b(?:src|href)=["\'](/[^"\'#?]+)["\']', src, re.I)
        for ref in sorted(set(refs)):
            rel = ref.lstrip("/")
            if rel.startswith(("http://", "https://")):
                continue
            target = ROOT / rel
            if not target.exists():
                error(page, f"missing local asset {ref}")


def check_json() -> None:
    for path in sorted(ROOT.glob("*.json")):
        try:
            json.loads(path.read_text(encoding="utf-8"))
        except Exception as exc:
            error(path, f"invalid JSON: {exc}")


def check_client_credentials() -> None:
    patterns = (
        re.compile(r"service_role", re.I),
        re.compile(r"SUPABASE_SERVICE_ROLE_KEY", re.I),
    )
    for path in sorted(ROOT.glob("*.js")) + sorted(ROOT.glob("*.html")):
        text = path.read_text(encoding="utf-8", errors="ignore")
        for pattern in patterns:
            if pattern.search(text):
                error(path, f"client credential marker detected: {pattern.pattern}")


def check_architecture_control_plane() -> None:
    runtime = ROOT / "omega-architecture-runtime.js"
    dashboard = ROOT / "architecture.html"
    contract = ROOT / "docs" / "architecture" / "16-block-system.json"
    for path in (runtime, dashboard, contract):
        if not path.exists():
            error(path, "required 16-block control-plane asset is missing")
    if dashboard.exists():
        text = dashboard.read_text(encoding="utf-8", errors="ignore")
        if '/omega-architecture-runtime.js' not in text:
            error(dashboard, "does not load the architecture runtime")
    if runtime.exists():
        text = runtime.read_text(encoding="utf-8", errors="ignore")
        required = (
            'api-gateway', 'load-balancer', 'microservices', 'event-driven',
            'database', 'caching', 'data-partitioning', 'object-blob-storage',
            'message-queues', 'fault-tolerance', 'cdn', 'high-availability',
            'observability', 'security-identity', 'ai-llm-gateway', 'vector-search-rag',
        )
        for ident in required:
            if "set('" + ident + "'" not in text:
                error(runtime, f"missing runtime registration: {ident}")


def main() -> int:
    check_pages()
    check_json()
    check_client_credentials()
    check_architecture_control_plane()
    if FAIL:
        print(f"\nPRODUCTION CONTRACT FAILED: {FAIL} finding(s)")
        return 1
    print("PRODUCTION CONTRACT PASSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
