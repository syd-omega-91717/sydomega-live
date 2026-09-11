#!/usr/bin/env python3
"""Audit the repository's production-readiness evidence without changing files.

Usage:
  python3 scripts/production-evidence-audit.py
  python3 scripts/production-evidence-audit.py --json

The audit is intentionally source-only. It never contacts Vercel, Supabase,
GitHub Actions, or any other live service, and it never executes migrations or
deployments. Exit 0 means no blocking source invariant was found; exit 2 means
one or more blocking invariants failed.
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

REQUIRED_FILES = (
    "bg.js",
    "nav.js",
    "vercel.json",
    "scripts/vercel-build.sh",
    "scripts/ci-local.sh",
    "supabase/live-schema.json",
    "supabase/remote-migrations.json",
    "vendor/supabase-js.js",
)

FORBIDDEN_BUILD_MARKERS = (
    "next.config.",
    "vite.config.",
    "webpack.config.",
    "rollup.config.",
    "turbo.json",
)

SECRET_PATTERNS = (
    re.compile(r"sk-ant-api[0-9A-Za-z_-]{20,}"),
    re.compile(r"sk-[A-Za-z0-9_-]{20,}"),
    re.compile(r"AIza[0-9A-Za-z_-]{30,}"),
    re.compile(r"SUPABASE_SERVICE_ROLE", re.I),
    re.compile(r"SUPABASE_SERVICE_KEY", re.I),
)

SKIP_DIRS = {".git", "node_modules", "public", "coverage", ".cache"}
TEXT_SUFFIXES = {".html", ".js", ".json", ".md", ".py", ".sh", ".yml", ".yaml", ".toml", ".txt"}


def files():
    for path in ROOT.rglob("*"):
        if not path.is_file() or any(part in SKIP_DIRS for part in path.relative_to(ROOT).parts):
            continue
        if path.suffix.lower() in TEXT_SUFFIXES or path.name in {".gitignore", ".vercelignore"}:
            yield path


def rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except (UnicodeDecodeError, OSError):
        return ""


def check_required():
    missing = [path for path in REQUIRED_FILES if not (ROOT / path).is_file()]
    return {"name": "required-files", "status": "PASS" if not missing else "FAIL", "missing": missing}


def check_static_architecture():
    vercel = read_text(ROOT / "vercel.json")
    issues = []
    if '"installCommand"' in vercel and not re.search(r'"installCommand"\s*:\s*""', vercel):
        issues.append("vercel.json declares a non-empty installCommand")
    for marker in FORBIDDEN_BUILD_MARKERS:
        if (ROOT / marker).exists():
            issues.append(f"forbidden build marker exists: {marker}")
    return {"name": "static-architecture", "status": "PASS" if not issues else "FAIL", "issues": issues}


def check_secrets():
    hits = []
    for path in files():
        if path.name in {"check-secrets.sh", "production-evidence-audit.py"}:
            continue
        text = read_text(path)
        for pattern in SECRET_PATTERNS:
            if pattern.search(text):
                hits.append(rel(path))
                break
    hits = sorted(set(hits))
    return {"name": "tracked-secret-patterns", "status": "PASS" if not hits else "FAIL", "files": hits}


def check_generated_files():
    generated = {
        "OMEGA_SKILL_REGISTRY.md": "scripts/omega-registry.py",
        "EVIDENCE_MATRIX.md": "scripts/evidence-audit.py",
        "docs/capabilities/registry.json": "scripts/capability-audit.py",
        "supabase/live-schema.json": "live database snapshot",
        "public/": "scripts/vercel-build.sh",
    }
    present = sorted(name for name in generated if (ROOT / name).exists())
    return {"name": "generated-artifacts", "status": "INFO", "present": present, "generators": generated}


def check_runtime_surface():
    html = list(ROOT.glob("*.html"))
    scripts = list(ROOT.glob("omega-*.js"))
    bg_loaded = 0
    nav_refs = 0
    for path in html:
        text = read_text(path)
        if re.search(r'<script[^>]+src=["\']/bg\.js["\']', text):
            bg_loaded += 1
        if re.search(r'<script[^>]+src=["\']/nav\.js["\']', text):
            nav_refs += 1
    issues = []
    if not html:
        issues.append("no root HTML pages found")
    if not scripts:
        issues.append("no root omega-*.js modules found")
    if bg_loaded == 0:
        issues.append("no root HTML page directly references /bg.js; verify the loader contract")
    return {
        "name": "runtime-surface",
        "status": "PASS" if not issues else "WARN",
        "html_pages": len(html),
        "omega_modules": len(scripts),
        "pages_with_bg_reference": bg_loaded,
        "pages_with_direct_nav_reference": nav_refs,
        "issues": issues,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json", action="store_true", help="emit machine-readable JSON")
    args = parser.parse_args()

    checks = [
        check_required(),
        check_static_architecture(),
        check_secrets(),
        check_generated_files(),
        check_runtime_surface(),
    ]
    blocking = [c for c in checks if c["status"] == "FAIL"]
    result = {
        "audit": "production-evidence-audit",
        "root": str(ROOT),
        "blocking_failures": len(blocking),
        "checks": checks,
        "live_services_touched": False,
    }

    if args.json:
        print(json.dumps(result, indent=2, sort_keys=True))
    else:
        print("OMEGA PRODUCTION EVIDENCE AUDIT")
        for check in checks:
            suffix = ""
            if check["status"] == "FAIL":
                suffix = " " + json.dumps({k: v for k, v in check.items() if k not in {"name", "status"}}, sort_keys=True)
            print(f"{check['status']:4} {check['name']}{suffix}")
        print(f"BLOCKING_FAILURES={len(blocking)}")
        print("LIVE_SERVICES_TOUCHED=NO")

    return 2 if blocking else 0


if __name__ == "__main__":
    raise SystemExit(main())
