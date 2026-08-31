#!/usr/bin/env python3
"""Fail-closed repository integrity contract.

Checks required production surfaces and rejects tracked build artifacts,
credential files, duplicate workflow names, and malformed critical JSON.
"""
from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
errors = []

required = [
    ".github/workflows",
    "supabase/migrations",
    "vercel.json",
]
for item in required:
    if not (ROOT / item).exists():
        errors.append(f"required path missing: {item}")

# Credential/config artifacts that must never be committed.
for pattern in (".env", ".env.*", "*.pem", "*.key", ".credentials", ".credentials_rsaparams"):
    for path in ROOT.glob(pattern):
        if path.is_file():
            errors.append(f"forbidden credential artifact tracked at repository root: {path.name}")

# Critical JSON must parse.
for rel in ("vercel.json",):
    path = ROOT / rel
    if path.exists():
        try:
            json.loads(path.read_text(encoding="utf-8"))
        except Exception as exc:
            errors.append(f"invalid JSON in {rel}: {exc}")

# Duplicate workflow display names create ambiguous CI reporting.
names = {}
for path in sorted((ROOT / ".github" / "workflows").glob("*.y*ml")) if (ROOT / ".github" / "workflows").exists() else []:
    text = path.read_text(encoding="utf-8", errors="replace")
    first = next((line for line in text.splitlines() if line.strip().startswith("name:")), None)
    if first:
        name = first.split(":", 1)[1].strip().strip("'\"")
        if name in names:
            errors.append(f"duplicate workflow name '{name}': {names[name]} and {path.name}")
        names[name] = path.name

# Common generated dependency/build directories do not belong in this static repo.
for directory in ("node_modules", ".next", "dist", "build"):
    if (ROOT / directory).exists():
        errors.append(f"generated directory must not be committed: {directory}")

if errors:
    print("REPOSITORY INTEGRITY CONTRACT: FAIL")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)

print("REPOSITORY INTEGRITY CONTRACT: PASS")
