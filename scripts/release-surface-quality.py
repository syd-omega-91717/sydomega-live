#!/usr/bin/env python3
"""Static release-quality contract for the framework-free SYD OMEGA web surface.

This is deliberately a repository/artifact gate. It does not claim to replace
real browser, accessibility, or performance testing against production.
"""
"""Static release-quality contract for the framework-free SYD OMEGA web surface."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
SOURCE = PUBLIC if PUBLIC.exists() else ROOT

MAX_HTML_BYTES = 750_000
MAX_JS_BYTES = 1_500_000
MAX_CSS_BYTES = 750_000

errors: list[str] = []
warnings: list[str] = []
checked = 0

def html_files() -> list[Path]:
    return sorted(SOURCE.rglob("*.html"))

def rel(path: Path) -> str:
    return str(path.relative_to(ROOT))

def check_html(path: Path) -> None:
    global checked
    checked += 1
    data = path.read_text(encoding="utf-8", errors="replace")
    size = path.stat().st_size
    label = rel(path)

    if size > MAX_HTML_BYTES:
        errors.append(f"{label}: HTML exceeds {MAX_HTML_BYTES} bytes ({size})")

    if not re.search(r"<html\b[^>]*\blang\s*=\s*["'][^"']+["']", data, re.I):
        errors.append(f"{label}: missing explicit <html lang=...>")

    if not re.search(r"<meta\b[^>]*name\s*=\s*["']viewport["']", data, re.I):
        errors.append(f"{label}: missing viewport meta")

    if not re.search(r"<title\b[^>]*>\s*[^<]+\s*</title>", data, re.I | re.S):
        errors.append(f"{label}: missing non-empty <title>")

    ids = re.findall(r"\bid\s*=\s*["']([^"']+)["']", data, re.I)
    if not re.search(r'<html\b[^>]*\blang\s*=\s*["\'][^"\']+["\']', data, re.I):
        errors.append(f"{label}: missing explicit <html lang=...>")

    if not re.search(r'<meta\b[^>]*name\s*=\s*["\']viewport["\']', data, re.I):
        errors.append(f"{label}: missing viewport meta")

    if not re.search(r'<title\b[^>]*>\s*[^<]+\s*</title>', data, re.I | re.S):
        errors.append(f"{label}: missing non-empty <title>")

    ids = re.findall(r'\bid\s*=\s*["\']([^"\']+)["\']', data, re.I)
    seen: set[str] = set()
    duplicates: set[str] = set()
    for value in ids:
        if value in seen:
            duplicates.add(value)
        seen.add(value)
    if duplicates:
        errors.append(f"{label}: duplicate IDs: {', '.join(sorted(duplicates)[:12])}")

    for tag, attrs in re.findall(r"<(img|input|button|select|textarea)\b([^>]*)>", data, re.I | re.S):
        attrs_lower = attrs.lower()
        if tag.lower() == "img" and not re.search(r"\balt\s*=", attrs, re.I):
            errors.append(f"{label}: <img> without alt attribute")
        if tag.lower() in {"input", "select", "textarea"}:
            if not re.search(r"\baria-label\s*=|\bid\s*=|\bname\s*=", attrs_lower):
                warnings.append(f"{label}: form control lacks id/name/aria-label")
        if tag.lower() == "button" and not re.search(r"\baria-label\s*=|>[\s]*[^<\s][^<]*<", attrs + ">", re.I | re.S):
            warnings.append(f"{label}: button may have no accessible name")
    for tag, attrs in re.findall(r'<(img|input|select|textarea)\b([^>]*)>', data, re.I | re.S):
        if tag.lower() == "img" and not re.search(r'\balt\s*=', attrs, re.I):
            errors.append(f"{label}: <img> without alt attribute")
        if tag.lower() in {"input", "select", "textarea"}:
            if not re.search(r'\baria-label\s*=|\bid\s*=|\bname\s*=', attrs, re.I):
                warnings.append(f"{label}: form control lacks id/name/aria-label")

    for attrs, inner in re.findall(r'<button\b([^>]*)>(.*?)</button\s*>', data, re.I | re.S):
        if not re.search(r'\baria-label\s*=|\btitle\s*=', attrs, re.I):
            text = re.sub(r'<[^>]+>', '', inner).strip()
            if not text:
                warnings.append(f"{label}: button may have no accessible name")

def check_assets() -> None:
    for ext, limit in (("*.js", MAX_JS_BYTES), ("*.css", MAX_CSS_BYTES)):
        for path in SOURCE.rglob(ext):
            if path.stat().st_size > limit:
                errors.append(f"{rel(path)}: {ext[1:].upper()} asset exceeds {limit} bytes ({path.stat().st_size})")

def main() -> int:
    files = html_files()
    if not files:
        errors.append("No HTML release surface found")
    for path in files:
        check_html(path)
    check_assets()

    result = {
        "schemaVersion": "1.0.0",
        "contract": "omega-release-surface-quality",
        "sourceRoot": str(SOURCE.relative_to(ROOT)),
        "htmlFilesChecked": checked,
        "errors": errors,
        "warnings": warnings,
        "status": "FAIL" if errors else "PASS",
        "scope": {
            "staticArtifact": True,
            "browserRuntime": False,
            "productionPerformance": False,
            "productionAccessibility": False,
        },
    }
    print(json.dumps(result, indent=2))
    if errors:
        print("\nRELEASE SURFACE QUALITY: FAIL", file=sys.stderr)
        return 1
    print("\nRELEASE SURFACE QUALITY: PASS")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
