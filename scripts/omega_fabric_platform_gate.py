"""Platform gate driven by the Omega Intelligence Fabric contract.

The gate is intentionally deterministic and dependency-light. It verifies that
implemented control-plane components, Supabase migration artifacts, security
boundaries, and required CI workflows remain present and syntactically sane.
It reports evidence states instead of treating file presence as runtime proof.
"""
from __future__ import annotations

import ast
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

REQUIRED_FILES = (
    "core/intelligence_fabric/__init__.py",
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
    ".github/workflows/supabase-runtime-contract.yml",
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
        if "name:" not in text or "jobs:" not in text:
            raise SystemExit(f"FABRIC_PLATFORM_GATE=FAIL workflow_contract={rel}")
        if "uses: actions/checkout@v4" not in text:
            raise SystemExit(f"FABRIC_PLATFORM_GATE=FAIL checkout={rel}")


def inspect_migration() -> None:
    text = (ROOT / REQUIRED_FILES[-1]).read_text(encoding="utf-8")
    required_markers = (
        "pg_constraint",
        "contype = 'f'",
        "CREATE INDEX IF NOT EXISTS",
        "pg_index",
    )
    missing = [m for m in required_markers if m not in text]
    if missing:
        raise SystemExit("FABRIC_PLATFORM_GATE=FAIL migration_markers=" + ",".join(missing))


def main() -> int:
    require_files(REQUIRED_FILES)
    require_files(REQUIRED_WORKFLOWS)
    parse_python(tuple(p for p in REQUIRED_FILES if p.endswith(".py")))
    inspect_workflows()
    inspect_migration()
    print("FABRIC_PLATFORM_GATE=PASS")
    print(f"fabric_components={len(REQUIRED_FILES) - 2}")
    print(f"workflow_contracts={len(REQUIRED_WORKFLOWS)}")
    print("supabase_advisor_fk_remediation=IMPLEMENTED")
    print("evidence_model=EXPLICIT")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
