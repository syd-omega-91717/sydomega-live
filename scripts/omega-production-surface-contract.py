#!/usr/bin/env python3
"""Production surface contract for the Ω SYD OMEGA 91717 static artifact.

Run after scripts/vercel-build.sh. It verifies the actual public/ artifact,
not only source pages, so build-time normalization is part of the contract.
"""

from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
SYSTEM = {"offline.html"}  # offline remains a valid fallback page, but still gets the shell.

def fail(msg):
    print(f"OMEGA PRODUCTION SURFACE: FAIL — {msg}")
    return 1

def main():
    if "--help" in sys.argv or "-h" in sys.argv:
        print(__doc__.strip())
        return 0
    if not PUBLIC.is_dir():
        return fail("public/ does not exist; run scripts/vercel-build.sh first")

    pages = sorted(PUBLIC.rglob("*.html"))
    if not pages:
        return fail("no HTML pages in public/")

    required_assets = [
        "bg.js",
        "omega-unified-background.css",
        "omega-emblems-catalog.js",
        "omega-emblem-integration.js",
        "omega-content-sigil-system.js",
        "omega-sovereign-os.js",
    ]
    missing_assets = [p for p in required_assets if not (PUBLIC / p).is_file()]
    if missing_assets:
        return fail("missing runtime assets: " + ", ".join(missing_assets))

    failures = []
    for page in pages:
        text = page.read_text(encoding="utf-8", errors="replace")
        rel = page.relative_to(PUBLIC).as_posix()

        checks = [
            (r"<meta\s+[^>]*name=[\"']viewport[\"']", "viewport"),
            (r"<title\b[^>]*>\s*[^<]+\s*</title>", "title"),
            (r"<main\b[^>]*>", "main"),
            (r"omega-unified-background\.css", "unified background"),
            (r"(?i)(?:src=[\"'][^\"']*/)?bg\.js", "global bg runtime"),
        ]
        for pattern, label in checks:
            if not re.search(pattern, text, re.I):
                failures.append(f"{rel}: missing {label}")

        # Every shipped page must retain the canonical shell hooks unless it is
        # the deliberately minimal offline fallback.
        if page.name not in SYSTEM and not re.search(r"omega-side|omega-nav|<nav\b", text, re.I):
            failures.append(f"{rel}: missing navigation shell hook")

    if failures:
        print(f"OMEGA PRODUCTION SURFACE: FAIL — {len(failures)} finding(s)")
        for item in failures:
            print(" - " + item)
        return 1

    print(f"OMEGA PRODUCTION SURFACE: PASS — {len(pages)} HTML pages verified")
    print("shell=viewport,title,unified-background,bg-runtime")
    print("assets=" + ",".join(required_assets))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
