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
SYSTEM = {
    "offline.html","404.html","healthz.html","agent.html","omega-visual-command.html",
    "pending.html","investor-dashboard.html","investor-gate.html",
    "verify-deployment.html","verify-modules.html","venture-pipeline.html",
    "frontend/platform/platform.html","root/audit-report.html",
    "root/dashboard/dashboard.html","root/portal.html",
    "web/templates/admin_console.html","web/templates/leaderboard.html",
    "web/templates/sovereign_health.html","web/templates/system_health.html",
}
# Diagnostic, health, fallback, template and gateway artifacts are valid
# production surfaces but do not share the member-page semantic shell. They
# still undergo the asset, title, viewport and runtime checks below.
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
            (r'<main\b[^>]*>|\bid=["\'](?:app|root|main)["\']|\brole=["\']main["\']|class=["\'][^"\']*(?:page-shell|content|container|shell|wrap)[^"\']*["\']',
             "content root"),
            (r"omega-unified-background\.css", "unified background"),
            (r"(?i)(?:src=[\"'][^\"']*/)?bg\.js", "global bg runtime"),
        ]
        for pattern, label in checks:
            if label == "content root" and rel in SYSTEM:
                continue
            if label == "unified background" and rel == "offline.html":
                continue
            if not re.search(pattern, text, re.I):
                failures.append(f"{rel}: missing {label}")

        # Navigation may be emitted by nav.js rather than literal <nav>.
        # Accept both canonical markup and the repository's runtime hooks.
        if rel not in SYSTEM and not re.search(
            r'<nav\b|omega-side|omega-nav|nav\.js|data-omega-nav|class=["\'][^"\']*(?:topbar|sidebar|navigation)[^"\']*["\']',
            text, re.I
        ):
            failures.append(f"{rel}: missing navigation/runtime shell hook")

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
