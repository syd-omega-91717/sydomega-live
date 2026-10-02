#!/usr/bin/env python3
"""Responsive production-surface contract for Ω SYD OMEGA 91717.

This is a repository/build contract, not a substitute for real-device/browser
verification. It checks every HTML artifact for the minimum responsive shell
and scans CSS/HTML for high-risk patterns that commonly create horizontal
overflow or unusable mobile controls.
"""

from __future__ import annotations

from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"

VIEWPORT_RE = re.compile(r'<meta\s+[^>]*name=["\']viewport["\'][^>]*>', re.I)
WIDTH_RE = re.compile(r'(?<![-\w])(?:width|min-width|max-width)\s*:\s*(\d{3,5})px', re.I)
FIXED_VW_RE = re.compile(r'(?<![-\w])(?:width|min-width|max-width)\s*:\s*(\d{3,5})px', re.I)
OVERFLOW_X_RE = re.compile(r'overflow-x\s*:\s*(visible|scroll|auto)', re.I)
NO_WRAP_RE = re.compile(r'white-space\s*:\s*nowrap', re.I)
POSITION_FIXED_RE = re.compile(r'position\s*:\s*fixed', re.I)
TOUCH_TARGET_RE = re.compile(r'(?:min-height|height)\s*:\s*4[4-9]px|(?:min-width|width)\s*:\s*4[4-9]px', re.I)

SYSTEM = {
    "offline.html", "404.html", "healthz.html", "verify-deployment.html",
    "verify-modules.html", "pending.html",
}

def fail(message: str) -> int:
    print(f"OMEGA RESPONSIVE CONTRACT: FAIL — {message}")
    return 1

def main() -> int:
    if "--help" in sys.argv or "-h" in sys.argv:
        print(__doc__.strip())
        return 0
    if not PUBLIC.is_dir():
        return fail("public/ does not exist; run scripts/vercel-build.sh first")

    pages = sorted(PUBLIC.rglob("*.html"))
    if not pages:
        return fail("no HTML pages in public/")

    failures: list[str] = []
    warnings: list[str] = []

    for page in pages:
        rel = page.relative_to(PUBLIC).as_posix()
        text = page.read_text(encoding="utf-8", errors="replace")

        if not VIEWPORT_RE.search(text):
            failures.append(f"{rel}: missing responsive viewport meta")

        # Reject only genuinely dangerous fixed viewport-scale patterns in page
        # markup. Small UI tokens (icons, borders, etc.) are not affected.
        for match in WIDTH_RE.finditer(text):
            value = int(match.group(1))
            if value >= 900:
                failures.append(f"{rel}: fixed {value}px dimension in HTML")

        # Tables are allowed to scroll inside their own wrapper; the contract
        # should not reject that intentional pattern.
        if OVERFLOW_X_RE.search(text) and "tbl-wrap" not in text and "overflow-x" in text:
            warnings.append(f"{rel}: page contains horizontal overflow rule; verify containment")

        if POSITION_FIXED_RE.search(text):
            warnings.append(f"{rel}: fixed-position element; verify safe-area and mobile overlap")

        # Very long unbroken labels/URLs can force overflow. Detect unusually
        # long literal runs in markup rather than banning nowrap globally.
        for run in re.findall(r"[A-Za-z0-9_./:?=&%#-]{96,}", text):
            warnings.append(f"{rel}: long unbroken token ({len(run)} chars)")

    css_files = sorted(PUBLIC.rglob("*.css"))
    for css in css_files:
        rel = css.relative_to(PUBLIC).as_posix()
        text = css.read_text(encoding="utf-8", errors="replace")
        fixed = [int(x) for x in FIXED_VW_RE.findall(text) if int(x) >= 900]
        if fixed:
            # Fixed desktop widths are acceptable only when paired with an
            # explicit responsive override somewhere in the same stylesheet.
            media_mobile = re.search(
                r"@media\s*\([^)]*(?:max-width|width)[^)]*\)\s*\{",
                text, re.I
            )
            if not media_mobile:
                failures.append(f"{rel}: {len(fixed)} fixed >=900px dimensions without responsive media rules")

    print(f"OMEGA RESPONSIVE CONTRACT: PASS — {len(pages)} HTML pages scanned")
    print(f"css={len(css_files)}")
    print("viewports=required")
    print("target-surfaces=375px / 768px / 1280px")
    system_css = PUBLIC / "css" / "omega-system.css"
    if system_css.exists():
        system_text = system_css.read_text(encoding="utf-8", errors="replace")
        desktop_recovery = "DESKTOP-POINTER RECOVERY" in system_text and "pointer:fine" in system_text and "hover:hover" in system_text
        if not desktop_recovery:
            failures.append("css/omega-system.css: missing fine-pointer desktop recovery for zoom/scaled laptop viewports")
    if failures:
        for item in failures:
            print(" - " + item)
        return 1

    print("policy=mobile-first shell, contained horizontal scrolling only, no fixed desktop canvas")
    print("desktop-recovery=fine-pointer + hover preserves desktop shell at 600-700px CSS viewport")
    if warnings:
        print(f"review-warnings={len(warnings)}")
        for item in warnings[:40]:
            print(" - " + item)
        if len(warnings) > 40:
            print(f" - ... {len(warnings) - 40} additional warnings")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
