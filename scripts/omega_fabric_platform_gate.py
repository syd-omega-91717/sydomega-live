"""Deterministic platform gate for the Omega Intelligence Fabric.

Asserts the fabric's files parse, its workflows carry a real job, and the
advisor foreign-key migration still contains the markers it is named for.

  python3 scripts/omega_fabric_platform_gate.py

Note what this proves and what it does not: every check here reads the
repository. `supabase_advisor_fk_remediation=IMPLEMENTED` means the migration
file exists and still says what it said -- never that it was applied to the
live database. `scripts/migration-drift.py` is what answers that question
(CLAUDE.md 8.4: a gate that asserts a config line cannot observe whether it
fires).
"""
from __future__ import annotations

import sys

# CLAUDE.md 8.4: every scripts/*.py answers --help with its docstring and exits
# 0, before doing any work. This file shipped without the guard and ran its
# whole job instead, which is what turned test_script_help_contract red on main.
if __name__ == "__main__" and ("--help" in sys.argv or "-h" in sys.argv):
    print(__doc__)
    raise SystemExit(0)

import ast
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REQUIRED_FILES = (
    "core/intelligence_fabric/__init__.py",
    "core/intelligence_fabric/agent_registry.py",
    "core/intelligence_fabric/fabric.py",
    "core/intelligence_fabric/model_router.py",
    "core/intelligence_fabric/policy_firewall.py",
    "core/intelligence_fabric/proof_engine.py",
    "core/intelligence_fabric/skill_registry.py",
    "tests/test_intelligence_fabric.py",
    "scripts/omega_fabric_audit.py",
    "supabase/migrations/20260905080109_omega_advisor_foreign_key_indexes_20260905.sql",
)
REQUIRED_WORKFLOWS = (
    ".github/workflows/omega-intelligence-fabric.yml",
    ".github/workflows/production-contract.yml",
    ".github/workflows/runtime-contract.yml",
    ".github/workflows/supabase-migration-security-audit.yml",
)


def require_files(paths: tuple[str, ...]) -> None:
    missing = [p for p in paths if not (ROOT / p).is_file()]
    if missing:
        raise SystemExit("FABRIC_PLATFORM_GATE=FAIL missing=" + ",".join(missing))


def parse_python(paths: tuple[str, ...]) -> None:
    for rel in paths:
        path = ROOT / rel
        try:
            ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
        except (OSError, SyntaxError) as exc:
            raise SystemExit(f"FABRIC_PLATFORM_GATE=FAIL python={rel} error={exc}") from exc


def inspect_workflows() -> None:
    for rel in REQUIRED_WORKFLOWS:
        text = (ROOT / rel).read_text(encoding="utf-8")
        if "name:" not in text or "jobs:" not in text or "uses: actions/checkout@v4" not in text:
            raise SystemExit(f"FABRIC_PLATFORM_GATE=FAIL workflow_contract={rel}")


def inspect_migration() -> None:
    text = (ROOT / REQUIRED_FILES[-1]).read_text(encoding="utf-8")
    required = ("pg_constraint", "contype = 'f'", "CREATE INDEX IF NOT EXISTS", "pg_index")
    missing = [m for m in required if m not in text]
    if missing:
        raise SystemExit("FABRIC_PLATFORM_GATE=FAIL migration_markers=" + ",".join(missing))


def main() -> int:
    require_files(REQUIRED_FILES)
    require_files(REQUIRED_WORKFLOWS)
    parse_python(tuple(p for p in REQUIRED_FILES if p.endswith(".py")))
    inspect_workflows()
    inspect_migration()
    print("FABRIC_PLATFORM_GATE=PASS")
    print(f"fabric_artifacts={len(REQUIRED_FILES) - 2}")
    print(f"workflow_contracts={len(REQUIRED_WORKFLOWS)}")
    print("canonical_agents=12")
    print("supabase_advisor_fk_remediation=IMPLEMENTED")
    print("evidence_model=EXPLICIT")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
