#!/usr/bin/env python3
"""SYD OMEGA 91717 production contract gate.

This gate is intentionally dependency-free and deterministic. It validates the
static deployment contract that must hold for every production build:

- every HTML page loads the platform runtime (bg.js)
- every local script/stylesheet/image reference resolves
- root JSON manifests are valid JSON
- client code contains no service-role credential marker
- duplicate HTML ids are rejected

The gate is source-only; it never assumes live Supabase state.
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

        # Validate local absolute asset references. External URLs, data URLs,
        # fragments and protocol-relative URLs are intentionally ignored.
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


def main() -> int:
    check_pages()
    check_json()
    check_client_credentials()
    if FAIL:
        print(f"\nPRODUCTION CONTRACT FAILED: {FAIL} finding(s)")
        return 1
    print("PRODUCTION CONTRACT PASSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
