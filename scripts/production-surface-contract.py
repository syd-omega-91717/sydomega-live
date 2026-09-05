#!/usr/bin/env python3
"""Fail-closed static production-surface contract for SYD OMEGA 91717.

Validates that the repository has the expected deployment surface without
contacting external services or exposing secrets.
"""
from pathlib import Path
import json
import re
import sys

# CLAUDE.md 8.4: "Ask a script what it does before reading it." That only works
# if asking is cheap and safe. This gate used to run its whole job on --help --
# a repo-wide scan, or in one case an O(n^2) page comparison that never
# returned -- so the cheapest way to learn what it did was to read it. The
# guard runs before any work, and must stay ahead of it.
if __name__ == "__main__" and ("--help" in sys.argv or "-h" in sys.argv):
    print(__doc__)
    raise SystemExit(0)

ROOT = Path(__file__).resolve().parents[1]
errors = []

vercel = ROOT / "vercel.json"
if not vercel.exists():
    errors.append("vercel.json is missing")
else:
    try:
        data = json.loads(vercel.read_text(encoding="utf-8"))
        if not isinstance(data, dict):
            errors.append("vercel.json is not a JSON object")
        else:
            for key in ("headers", "rewrites", "redirects"):
                if key in data and not isinstance(data[key], list):
                    errors.append(f"vercel.json.{key} must be an array")
    except Exception as exc:
        errors.append(f"vercel.json is invalid JSON: {exc}")

workflows = ROOT / ".github" / "workflows"
if not workflows.exists():
    errors.append(".github/workflows is missing")
else:
    workflow_files = list(workflows.glob("*.yml")) + list(workflows.glob("*.yaml"))
    workflow_text = "\n".join(
        p.read_text(encoding="utf-8", errors="replace") for p in workflow_files
    )
    # Accept both scalar and GitHub's array form of runs-on.
    self_hosted = re.compile(r"runs-on:\s*(?:[^\n]*\bself-hosted\b)", re.IGNORECASE)
    if not self_hosted.search(workflow_text):
        errors.append("no workflow declares the self-hosted runner path")
    if re.search(r"continue-on-error:\s*true\b", workflow_text, re.IGNORECASE):
        errors.append("critical workflow contains continue-on-error: true")

supabase = ROOT / "supabase"
if not supabase.exists():
    errors.append("supabase directory is missing")
else:
    migrations = supabase / "migrations"
    if not migrations.exists():
        errors.append("supabase/migrations is missing")

# Never allow obvious secret material to enter tracked text files.
secret_patterns = [
    re.compile(r"sk-[A-Za-z0-9_-]{20,}"),
    re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
]
for p in ROOT.rglob("*"):
    if not p.is_file() or ".git" in p.parts or p.suffix.lower() not in {".js", ".ts", ".py", ".yml", ".yaml", ".json", ".md", ".html"}:
        continue
    try:
        text = p.read_text(encoding="utf-8", errors="ignore")
    except OSError:
        continue
    for pattern in secret_patterns:
        if pattern.search(text):
            errors.append(f"possible secret material detected in {p.relative_to(ROOT)}")
            break

if errors:
    print("PRODUCTION SURFACE CONTRACT: FAIL")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)

print("PRODUCTION SURFACE CONTRACT: PASS")
