#!/usr/bin/env python3
"""Static release-quality contract for the framework-free SYD OMEGA web surface.

This is deliberately a repository/artifact gate. It does not claim to replace
real browser, accessibility, or performance testing against production.
"""

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

HTML_LANG_RE = re.compile(r"""<html\b[^>]*\blang\s*=\s*(?:"[^"]+"|'[^']+'|[^\s>]+)""", re.I)
VIEWPORT_RE = re.compile(r"""<meta\b[^>]*name\s*=\s*(?:"viewport"|'viewport'|viewport)""", re.I)
TITLE_RE = re.compile(r"""<title\b[^>]*>\s*[^<]+\s*</title>""", re.I | re.S)
ID_RE = re.compile(r"""\bid\s*=\s*["']([^"']+)["']""", re.I)
CONTROL_RE = re.compile(r"""<(img|input|button|select|textarea)\b([^>]*)>""", re.I | re.S)
BUTTON_RE = re.compile(r"""<button\b([^>]*)>(.*?)</button\s*>""", re.I | re.S)


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

    if not HTML_LANG_RE.search(data):
        errors.append(f"{label}: missing explicit <html lang=...>")

    if not VIEWPORT_RE.search(data):
        errors.append(f"{label}: missing viewport meta")

    if not TITLE_RE.search(data):
        errors.append(f"{label}: missing non-empty <title>")

    ids = ID_RE.findall(data)
    seen: set[str] = set()
    duplicates: set[str] = set()
    for value in ids:
        if value in seen:
            duplicates.add(value)
        seen.add(value)
    if duplicates:
        errors.append(f"{label}: duplicate IDs: {', '.join(sorted(duplicates)[:12])}")

    for tag, attrs in CONTROL_RE.findall(data):
        attrs_lower = attrs.lower()
        tag_lower = tag.lower()
        if tag_lower == "img" and not re.search(r"\balt\s*=", attrs, re.I):
            errors.append(f"{label}: <img> without alt attribute")
        if tag_lower in {"input", "select", "textarea"}:
            if not re.search(r"\baria-label\s*=|\bid\s*=|\bname\s*=", attrs_lower):
                warnings.append(f"{label}: form control lacks id/name/aria-label")

    for attrs, inner in BUTTON_RE.findall(data):
        if not re.search(r"\baria-label\s*=|\btitle\s*=", attrs, re.I):
            text = re.sub(r"<[^>]+>", "", inner).strip()
            if not text:
                warnings.append(f"{label}: button may have no accessible name")


def check_assets() -> None:
    for ext, limit in (("*.js", MAX_JS_BYTES), ("*.css", MAX_CSS_BYTES)):
        for path in SOURCE.rglob(ext):
            if path.stat().st_size > limit:
                errors.append(
                    f"{rel(path)}: {ext[1:].upper()} asset exceeds {limit} bytes ({path.stat().st_size})"
                )


def main() -> int:
    files = html_files()
    if not files:
        errors.append("No HTML release surface found")

    for path in files:
        check_html(path)
    check_assets()

    result = {
        "schemaVersion": "1.1.0",
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
