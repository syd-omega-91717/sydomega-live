#!/usr/bin/env python3
"""Fail-closed static production-surface contract for SYD OMEGA 91717.

Validates that the repository has the expected deployment surface without
contacting external services or exposing secrets.
"""
from pathlib import Path
import json
import re
import sys

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
    workflow_text = "\n".join(
        p.read_text(encoding="utf-8", errors="replace")
        for p in workflows.glob("*.y*ml")
    )
    if not re.search(r"runs-on:\s*[^\n]*self-hosted", workflow_text):
        errors.append("no workflow declares the self-hosted runner path")
    if "continue-on-error: true" in workflow_text:
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
