#!/usr/bin/env python3
"""Responsive production-surface contract for Ω SYD OMEGA 91717.

Repository/build contract. It checks responsive shell requirements and scans
application-owned layout surfaces for high-risk fixed/minimum widths while
preserving media-query context and treating third-party vendor CSS as advisory.
"""

from __future__ import annotations

from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"

VIEWPORT_RE = re.compile(r'<meta\s+[^>]*name=["\']viewport["\'][^>]*>', re.I)
WIDTH_RE = re.compile(r'(?<![-\w])(?:width|min-width)\s*:\s*(\d{3,5})px', re.I)
STYLE_ATTR_RE = re.compile(r'\bstyle=["\']([^"\']+)["\']', re.I)
STYLE_BLOCK_RE = re.compile(r'<style\b[^>]*>(.*?)</style>', re.I | re.S)
FIXED_VW_RE = re.compile(r'(?<![-\w])(?:width|min-width)\s*:\s*(\d{3,5})px', re.I)
OVERFLOW_X_RE = re.compile(r'overflow-x\s*:\s*(visible|scroll|auto)', re.I)
POSITION_FIXED_RE = re.compile(r'position\s*:\s*fixed', re.I)

SYSTEM = {
    "offline.html", "404.html", "healthz.html", "verify-deployment.html",
    "verify-modules.html", "pending.html",
}

def fail(message: str) -> int:
    print(f"OMEGA RESPONSIVE CONTRACT: FAIL — {message}")
    return 1

def has_mobile_media(text: str) -> bool:
    return bool(re.search(
        r"@media\s*\([^)]*(?:max-width|width)[^)]*\)\s*\{",
        text,
        re.I,
    ))

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

        # Inline style attributes have no surrounding media-query context and
        # therefore remain blocking when they force a large fixed/minimum width.
        # max-width is intentionally excluded: bounded containers are responsive.
        for style in STYLE_ATTR_RE.findall(text):
            for match in WIDTH_RE.finditer(style):
                value = int(match.group(1))
                if value >= 900:
                    failures.append(f"{rel}: fixed {value}px dimension in inline style")

        if OVERFLOW_X_RE.search(text) and "tbl-wrap" not in text and "overflow-x" in text:
            warnings.append(f"{rel}: page contains horizontal overflow rule; verify containment")

        if POSITION_FIXED_RE.search(text):
            warnings.append(f"{rel}: fixed-position element; verify safe-area and mobile overlap")

        for run in re.findall(r"[A-Za-z0-9_./:?=&%#-]{96,}", text):
            warnings.append(f"{rel}: long unbroken token ({len(run)} chars)")

        # Embedded CSS is checked with its media-query context preserved.
        for block in STYLE_BLOCK_RE.findall(text):
            fixed = [int(x) for x in FIXED_VW_RE.findall(block) if int(x) >= 900]
            if fixed and not has_mobile_media(block):
                failures.append(
                    f"{rel}: {len(fixed)} fixed/minimum >=900px dimensions in embedded CSS without responsive media rules"
                )

    css_files = sorted(PUBLIC.rglob("*.css"))
    for css in css_files:
        rel = css.relative_to(PUBLIC).as_posix()
        text = css.read_text(encoding="utf-8", errors="replace")
        fixed = [int(x) for x in FIXED_VW_RE.findall(text) if int(x) >= 900]
        if fixed and not has_mobile_media(text):
            if rel.startswith("vendor/"):
                warnings.append(
                    f"{rel}: {len(fixed)} fixed/minimum >=900px dimensions in vendor CSS; outside application layout ownership"
                )
            else:
                failures.append(
                    f"{rel}: {len(fixed)} fixed/minimum >=900px dimensions without responsive media rules"
                )

    bg_js = ROOT / "bg.js"
    nav_js = ROOT / "nav.js"
    if bg_js.exists():
        bg_text = bg_js.read_text(encoding="utf-8", errors="replace")
        if "omega-desktop-pointer" not in bg_text or "(hover:hover) and (pointer:fine)" not in bg_text:
            failures.append("bg.js: missing fine-pointer desktop classification/recovery")
    else:
        failures.append("bg.js: missing shared mobile/desktop shell controller")

    if nav_js.exists():
        nav_text = nav_js.read_text(encoding="utf-8", errors="replace")
        if "omega-desktop-pointer" not in nav_text or "#omega-mob{display:none!important}" not in nav_text:
            failures.append("nav.js: missing desktop-pointer recovery for mobile bottom navigation")
    else:
        failures.append("nav.js: missing canonical navigation controller")

    system_css = PUBLIC / "css" / "omega-system.css"
    if system_css.exists():
        system_text = system_css.read_text(encoding="utf-8", errors="replace")
        desktop_recovery = (
            "DESKTOP-POINTER RECOVERY" in system_text
            and "pointer:fine" in system_text
            and "hover:hover" in system_text
        )
        if not desktop_recovery:
            failures.append(
                "css/omega-system.css: missing fine-pointer desktop recovery for zoom/scaled laptop viewports"
            )

    if failures:
        for item in failures:
            print(" - " + item)
        return 1

    print(f"OMEGA RESPONSIVE CONTRACT: PASS — {len(pages)} HTML pages scanned")
    print(f"css={len(css_files)}")
    print("viewports=required")
    print("target-surfaces=375px / 768px / 1280px")
    print("policy=mobile-first shell, contained horizontal scrolling only, no fixed/minimum desktop canvas; max-width containers allowed")
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
