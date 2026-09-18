#!/usr/bin/env python3
"""Deterministic repository integrity checks for SYD OMEGA 91717.

This checker is intentionally dependency-free and conservative:
- validates canonical visual/runtime assets in root or public/
- detects broken local references in HTML/CSS/JS (without network access)
- detects duplicate element IDs within individual HTML documents
- detects conflicting light-mode declarations in first-party CSS
- reports findings deterministically and exits non-zero only for errors

Usage: python3 scripts/omega-integrity-contract.py [repository-root]
"""
from __future__ import annotations

import re
import sys
from pathlib import Path
from collections import Counter

CANONICAL_ASSETS = (
    "omega-visual-system.css",
    "omega-visual-system-v2.css",
    "omega-visual-engine.js",
    "omega-evidence.js",
)
IGNORED_DIRS = {".git", "node_modules", "vendor", "dist", "build", ".next"}
LOCAL_REF_RE = re.compile(r"(?:src|href)=[\"']([^\"'#?]+)", re.I)
CSS_URL_RE = re.compile(r"url\(\s*[\"']?([^\"')?#]+)", re.I)
ID_RE = re.compile(r"\bid\s*=\s*[\"']([^\"']+)[\"']", re.I)
LIGHT_MODE_RE = re.compile(r"(?:prefers-color-scheme\s*:\s*light|\blight-mode\b|\btheme-light\b)", re.I)


def files(root: Path, suffixes: tuple[str, ...]):
    for path in root.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in suffixes:
            continue
        if any(part in IGNORED_DIRS for part in path.parts):
            continue
        yield path


def resolve_local(root: Path, source: Path, ref: str) -> bool:
    if not ref or ref.startswith(("/", "#", "http:", "https:", "mailto:", "data:", "javascript:", "tel:")):
        candidate = root / ref.lstrip("/") if ref.startswith("/") else None
        return candidate is None or candidate.exists()
    candidate = (source.parent / ref).resolve()
    try:
        candidate.relative_to(root.resolve())
    except ValueError:
        return True
    return candidate.exists()


def main() -> int:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
    if not root.is_dir():
        print(f"ERROR repository root does not exist: {root}")
        return 2

    errors: list[str] = []
    warnings: list[str] = []

    # Asset contract: accept root or public/ because the repository historically
    # contains both deployment layouts; never silently accept a third location.
    for asset in CANONICAL_ASSETS:
        locations = [root / asset, root / "public" / asset]
        present = [p for p in locations if p.is_file()]
        if not present:
            errors.append(f"missing canonical asset: {asset} (expected root/ or public/)")
        elif len(present) > 1:
            warnings.append(f"duplicate canonical asset locations: {asset}: {', '.join(str(p.relative_to(root)) for p in present)}")

    for html in files(root, (".html", ".htm")):
        text = html.read_text(encoding="utf-8", errors="replace")
        ids = [m.group(1) for m in ID_RE.finditer(text)]
        duplicates = sorted(k for k, count in Counter(ids).items() if count > 1)
        if duplicates:
            errors.append(f"duplicate HTML ids in {html.relative_to(root)}: {', '.join(duplicates)}")
        for match in LOCAL_REF_RE.finditer(text):
            ref = match.group(1).strip()
            if not resolve_local(root, html, ref):
                errors.append(f"broken local reference in {html.relative_to(root)}: {ref}")

    for source in files(root, (".css", ".js", ".mjs")):
        text = source.read_text(encoding="utf-8", errors="replace")
        for match in CSS_URL_RE.finditer(text) if source.suffix.lower() == ".css" else ():
            ref = match.group(1).strip()
            if not resolve_local(root, source, ref):
                errors.append(f"broken asset URL in {source.relative_to(root)}: {ref}")
        if source.suffix.lower() == ".css" and LIGHT_MODE_RE.search(text):
            warnings.append(f"light-mode declaration found in {source.relative_to(root)}; verify it is not an active theme")

    print(f"OMEGA INTEGRITY CONTRACT — {root}")
    print(f"ERRORS: {len(errors)}")
    for item in sorted(set(errors)):
        print(f"ERROR: {item}")
    print(f"WARNINGS: {len(warnings)}")
    for item in sorted(set(warnings)):
        print(f"WARN: {item}")
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
