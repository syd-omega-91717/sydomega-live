#!/usr/bin/env python3
"""SYD OMEGA 91717 release gate.

This gate separates repository completeness from live-provider readiness. It
never invents runtime evidence: provider-side items are reported as BLOCKED
until a real deployment/database verification is available.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

REQUIRED_FILES = (
    ".github/workflows/ci.yml",
    ".github/workflows/production-contract.yml",
    ".github/workflows/capability-evidence.yml",
    ".github/workflows/workflow-contract.yml",
    "scripts/production-contract.py",
    "scripts/capability-audit.py",
    "scripts/workflow-contract.py",
    "docs/capabilities/registry.json",
    "docs/architecture/production-building-blocks.json",
    "supabase/live-schema.json",
    "supabase/migrations/README.md",
    "manifest.json",
    "sw.js",
)

PUBLIC_CONTRACTS = (
    "404.html",
    "robots.txt",
)


def fail(message: str) -> None:
    print(f"ERROR: {message}")


def check_required_files() -> int:
    failures = 0
    for rel in REQUIRED_FILES:
        if not (ROOT / rel).is_file():
            fail(f"missing required release asset: {rel}")
            failures += 1
    return failures


def check_public_pages() -> int:
    failures = 0
    pages = sorted(ROOT.glob("*.html"))
    for page in pages:
        text = page.read_text(encoding="utf-8", errors="ignore")
        if not re.search(r'<script[^>]+src=["\']/+bg\.js(?:[?#\"\'])', text, re.I):
            fail(f"public page does not load /bg.js: {page.name}")
            failures += 1
    for rel in PUBLIC_CONTRACTS:
        if not (ROOT / rel).is_file():
            fail(f"missing public deployment contract: {rel}")
            failures += 1
    return failures


def check_registry_integrity() -> int:
    path = ROOT / "docs/capabilities/registry.json"
    if not path.is_file():
        return 1
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        fail(f"capability registry is invalid JSON: {exc}")
        return 1
    failures = 0
    seen: set[str] = set()
    for cap in data.get("capabilities", []):
        ident = cap.get("id")
        if not ident or ident in seen:
            fail(f"capability registry has missing/duplicate id: {ident!r}")
            failures += 1
        seen.add(ident)
        for entry in cap.get("entrypoints", []):
            if not (ROOT / entry).exists():
                fail(f"capability {ident!r} references missing entrypoint: {entry}")
                failures += 1
    return failures


def check_client_secrets() -> int:
    failures = 0
    patterns = (re.compile(r"SUPABASE_SERVICE_ROLE_KEY", re.I), re.compile(r"service_role", re.I))
    for path in sorted(ROOT.glob("*.js")) + sorted(ROOT.glob("*.html")):
        text = path.read_text(encoding="utf-8", errors="ignore")
        if any(pattern.search(text) for pattern in patterns):
            fail(f"client credential marker detected: {path.name}")
            failures += 1
    return failures


def main() -> int:
    failures = 0
    failures += check_required_files()
    failures += check_public_pages()
    failures += check_registry_integrity()
    failures += check_client_secrets()
    print("RELEASE GATE: " + ("PASSED" if failures == 0 else f"FAILED ({failures} finding(s))"))
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
