#!/usr/bin/env python3
"""Deterministic repository release-readiness gate for SYD OMEGA 91717."""
from __future__ import annotations

from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = [
    "vercel.json",
    "scripts/vercel-build.sh",
    "scripts/vercel-build-enhance.mjs",
    "scripts/repository_integrity_audit.py",
    "scripts/omega_enterprise_architecture_gate.py",
    "scripts/omega_fabric_audit.py",
    "scripts/omega_fabric_platform_gate.py",
    "assets/js/omega-runtime-observability.js",
    "docs/OMEGA_ARCHITECTURE_EVOLUTION.md",
]

def fail(msg: str) -> None:
    print(f"RELEASE_READINESS=FAIL: {msg}")
    sys.exit(1)

for rel in REQUIRED:
    p = ROOT / rel
    if not p.is_file() or not p.read_text(encoding="utf-8").strip():
        fail(f"missing or empty required file: {rel}")

try:
    cfg = json.loads((ROOT / "vercel.json").read_text(encoding="utf-8"))
except Exception as exc:
    fail(f"invalid vercel.json: {exc}")

if cfg.get("framework") is not None:
    fail("vercel framework must remain null for the current static architecture")
if cfg.get("outputDirectory") != "public":
    fail("vercel outputDirectory must be public")
if cfg.get("buildCommand") != "bash scripts/vercel-build.sh":
    fail("unexpected Vercel build command")
if cfg.get("installCommand") != "":
    fail("installCommand must remain empty")
if cfg.get("git", {}).get("deploymentEnabled", {}).get("*") is not False:
    fail("wildcard Git deployments must remain disabled")

print("RELEASE_READINESS=PASS")
print("architecture=static-html-css-js+supa​base")
print("artifact=public")
print("deployment=main-controlled")
print("external-production-verification=separate")
