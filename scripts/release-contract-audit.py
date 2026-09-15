#!/usr/bin/env python3
"""
Ω SYD OMEGA 91717 — non-conflict release contract audit.

Source/build-output release guard. It does not replace browser/runtime/provider
verification. It protects the current production architecture from accidental
rewrites, missing front-door assets, security-header regressions, stale
Supabase endpoints, and browser exposure of privileged credentials.

Exit 1 = repository contract violation.
Exit 0 = repository contract intact; provider/runtime verification remains required.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
errors: list[str] = []
warnings: list[str] = []


def require_file(path: str) -> None:
    if not (ROOT / path).is_file():
        errors.append(f"missing required file: {path}")


def read(path: str) -> str:
    p = ROOT / path
    return p.read_text(encoding="utf-8", errors="ignore") if p.is_file() else ""


# 1. Canonical guardrails must remain present.
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

# 2. Preserve the present Vercel/static architecture.
try:
    vercel = json.loads(read("vercel.json"))
except json.JSONDecodeError as exc:
    errors.append(f"vercel.json is invalid JSON: {exc}")
    vercel = {}

if vercel.get("framework") is not None:
    errors.append("vercel.json framework changed: current canonical runtime is framework-free static delivery")
if vercel.get("outputDirectory") != "public":
    errors.append("vercel.json outputDirectory must remain public")
if vercel.get("buildCommand") != "bash scripts/vercel-build.sh":
    errors.append("vercel.json buildCommand no longer points to the canonical static build")
if vercel.get("git", {}).get("deploymentEnabled", {}).get("main") is not True:
    errors.append("main deployment is no longer explicitly enabled")

# 3. Security headers are release invariants.
headers = json.dumps(vercel.get("headers", []))
for header in (
    "X-Content-Type-Options",
    "X-Frame-Options",
    "Strict-Transport-Security",
    "Referrer-Policy",
    "Content-Security-Policy",
):
    if header not in headers:
        errors.append(f"required security header missing from vercel.json: {header}")

# 4. Front-door/runtime owners must not disappear.
for required in ("index.html", "healthz.html", "bg.js", "nav.js"):
    require_file(required)

# 5. Detect Supabase endpoint drift in both source and generated web output.
# Documentation and tests are excluded because they intentionally record or
# exercise historical/fixture state. The public directory is deliberately
# included: it is the actual Vercel-delivered build output and must not drift.
canonical_host = "ydqhzvvoyufiiqvzcjns.supabase.co"
supabase_host_re = re.compile(r"https://([a-z0-9-]+\.supabase\.co)", re.I)
source_extensions = {".html", ".js", ".css", ".json", ".yml", ".yaml", ".sql", ".sh", ".ts", ".tsx"}
for path in ROOT.rglob("*"):
    if not path.is_file() or path.suffix.lower() not in source_extensions:
        continue
    if any(part in {".git", "node_modules", "docs", "tests"} for part in path.parts):
        continue
    try:
        body = path.read_text(encoding="utf-8", errors="ignore")
    except OSError:
        continue
    for host in supabase_host_re.findall(body):
        if host.lower() != canonical_host.lower():
            errors.append(f"non-canonical Supabase host in {path.relative_to(ROOT)}: {host}")
            break

# 6. Never ship privileged credentials in browser-delivered files.
web_extensions = {".html", ".js", ".css", ".json", ".webmanifest"}
secret_patterns = [
    re.compile(r"SUPABASE_SERVICE_ROLE", re.I),
    re.compile(r"STRIPE_SECRET_KEY\s*[:=]", re.I),
    re.compile(r"OPENAI_API_KEY\s*[:=]", re.I),
    re.compile(r"ANTHROPIC_API_KEY\s*[:=]", re.I),
    re.compile(r"GEMINI_API_KEY\s*[:=]", re.I),
]
for path in ROOT.rglob("*"):
    if not path.is_file() or path.suffix.lower() not in web_extensions:
        continue
    if any(part in {".git", "node_modules", "tests", "scripts", "supabase", "docs"} for part in path.parts):
        continue
    try:
        body = path.read_text(encoding="utf-8", errors="ignore")
    except OSError:
        continue
    for pattern in secret_patterns:
        if pattern.search(body):
            errors.append(f"possible privileged credential reference in shipped web file: {path.relative_to(ROOT)}")
            break

# 7. Ensure the canonical guardrail still protects the present concept.
canonical = read("docs/CANONICAL_PRESENT_CONCEPT.md")
for invariant in (
    "framework-free static architecture",
    "Prefer additive, compatible changes over rewrites",
    "Never claim a capability is production-ready",
):
    if invariant not in canonical:
        errors.append(f"canonical guardrail missing invariant: {invariant}")

truth = read("docs/PRODUCTION_TRUTH_MATRIX.md")
if "PRODUCTION-VERIFIED" not in truth:
    warnings.append("production truth matrix is missing the PRODUCTION-VERIFIED vocabulary")

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
print("NOTE: PASS means source/build-output contracts are intact; it does not certify live provider/runtime behavior.")
