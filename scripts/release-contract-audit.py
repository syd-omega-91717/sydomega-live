#!/usr/bin/env python3
"""
Ω SYD OMEGA 91717 — non-conflict release contract audit.

This is intentionally additive and source-only. It does NOT replace the
runtime audit, browser smoke tests, Supabase verification, or Vercel logs.
It checks that the repository still obeys the present production concept
before a release is attempted.

Exit 1 = a release contract is violated.
Exit 0 = repository contract is intact; provider/runtime verification is still required.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
errors: list[str] = []
warnings: list[str] = []


def require_file(path: str) -> Path | None:
    p = ROOT / path
    if not p.is_file():
        errors.append(f"missing required file: {path}")
        return None
    return p


def read(path: str) -> str:
    p = ROOT / path
    return p.read_text(encoding="utf-8", errors="ignore") if p.is_file() else ""


def fail(message: str) -> None:
    errors.append(message)


# 1. Canonical guardrails must exist before production changes are trusted.
for required in (
    "docs/CANONICAL_PRESENT_CONCEPT.md",
    "docs/PRODUCTION_TRUTH_MATRIX.md",
    ".claude/skills/omega-platform/SKILL.md",
    ".claude/skills/present-concept-build/SKILL.md",
    "vercel.json",
    "scripts/vercel-build.sh",
    "scripts/audit.py",
):
    require_file(required)

# 2. Preserve the current delivery architecture.
vercel_text = read("vercel.json")
try:
    vercel = json.loads(vercel_text)
except json.JSONDecodeError as exc:
    fail(f"vercel.json is invalid JSON: {exc}")
    vercel = {}

if vercel.get("framework") is not None:
    fail("vercel.json framework changed: current canonical runtime is framework-free static delivery")
if vercel.get("outputDirectory") != "public":
    fail("vercel.json outputDirectory must remain public")
if vercel.get("buildCommand") != "bash scripts/vercel-build.sh":
    fail("vercel.json buildCommand no longer points to the canonical static build")
if vercel.get("git", {}).get("deploymentEnabled", {}).get("main") is not True:
    fail("main deployment is no longer explicitly enabled")

# 3. Security headers are release invariants, not optional decoration.
header_text = json.dumps(vercel.get("headers", []))
for header in (
    "X-Content-Type-Options",
    "X-Frame-Options",
    "Strict-Transport-Security",
    "Referrer-Policy",
    "Content-Security-Policy",
):
    if header not in header_text:
        fail(f"required security header missing from vercel.json: {header}")

# 4. Required front-door/health surface must remain present.
for required in ("index.html", "healthz.html", "bg.js", "nav.js"):
    require_file(required)

# 5. Canonical Supabase project reference must be consistent where it is
# explicitly hard-coded. Old project IDs are a known production failure mode.
canonical_supabase_host = "ydqhzvvoyufiiqvzcjns.supabase.co"
old_project_ids = {
    "qzvnnjvtxmkwzxxqkqzs",  # historical/obsolete project seen in earlier work
}
text_files = []
for pattern in ("*.html", "*.js", "*.css", "*.json", "*.yml", "*.yaml", "*.md", "*.sql", "*.sh"):
    text_files.extend(ROOT.rglob(pattern))
for path in text_files:
    if any(part in {".git", "node_modules", "public"} for part in path.parts):
        continue
    try:
        body = path.read_text(encoding="utf-8", errors="ignore")
    except OSError:
        continue
    for old in old_project_ids:
        if old in body:
            fail(f"obsolete Supabase project ID found in {path.relative_to(ROOT)}: {old}")

# 6. Never ship service-role credentials or common secret assignments in the
# browser surface. This is deliberately conservative: it reports suspicious
# source text rather than trying to prove absence of every possible secret.
web_extensions = {".html", ".js", ".css", ".json", ".webmanifest"}
secret_patterns = [
    re.compile(r"service_role", re.I),
    re.compile(r"SUPABASE_SERVICE_ROLE", re.I),
    re.compile(r"OPENAI_API_KEY\s*[:=]", re.I),
    re.compile(r"STRIPE_SECRET_KEY\s*[:=]", re.I),
]
for path in ROOT.rglob("*"):
    if path.suffix not in web_extensions or not path.is_file():
        continue
    if any(part in {".git", "node_modules", "tests", "scripts", "supabase", "docs"} for part in path.parts):
        continue
    try:
        body = path.read_text(encoding="utf-8", errors="ignore")
    except OSError:
        continue
    for pattern in secret_patterns:
        if pattern.search(body):
            fail(f"possible secret/service-role reference in shipped web file: {path.relative_to(ROOT)}")
            break

# 7. Prevent accidental framework/duplicate-frontend migration from silently
# becoming the new production runtime. React/Vite may exist in future, but the
# current release contract remains the existing static surface until a planned
# migration has its own evidence.
canonical = read("docs/CANONICAL_PRESENT_CONCEPT.md")
if "framework-free static architecture" not in canonical:
    fail("canonical present-concept guardrail no longer states the current static architecture")
if "Prefer additive, compatible changes over rewrites" not in canonical:
    fail("canonical guardrail lost the additive/non-destructive rule")

# 8. Report, rather than fail, known provider boundaries. This makes it harder
# to mistake source integrity for production verification.
truth = read("docs/PRODUCTION_TRUTH_MATRIX.md")
if "PRODUCTION-VERIFIED" not in truth:
    warnings.append("production truth matrix is missing the PRODUCTION-VERIFIED status vocabulary")
if "Current Vercel deployment succeeds." in truth and "[ ] Current Vercel deployment succeeds." not in truth:
    warnings.append("Vercel release gate appears to have been edited; inspect evidence before release")

print("Ω RELEASE CONTRACT AUDIT")
print("=========================")
print(f"repository: {ROOT}")
print("architecture: current framework-free static + Vercel + Supabase")
print(f"errors: {len(errors)}")
print(f"warnings: {len(warnings)}")

for message in errors:
    print(f"ERROR: {message}")
for message in warnings:
    print(f"WARN: {message}")

if errors:
    print("RELEASE_CONTRACT=FAIL")
    raise SystemExit(1)

print("RELEASE_CONTRACT=PASS")
print("NOTE: PASS means the repository contract is intact; it does not certify provider/runtime production behavior.")
