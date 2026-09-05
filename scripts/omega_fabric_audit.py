"""Deterministic structural gate for the Omega Intelligence Fabric."""
from pathlib import Path
import ast

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = [
    "core/intelligence_fabric/__init__.py",
    "core/intelligence_fabric/fabric.py",
    "core/intelligence_fabric/model_router.py",
    "core/intelligence_fabric/policy_firewall.py",
    "core/intelligence_fabric/proof_engine.py",
    "core/intelligence_fabric/skill_registry.py",
    "tests/test_intelligence_fabric.py",
]

for rel in REQUIRED:
    path = ROOT / rel
    if not path.is_file():
        raise SystemExit(f"FABRIC_AUDIT=FAIL missing {rel}")
    try:
        ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
    except SyntaxError as exc:
        raise SystemExit(f"FABRIC_AUDIT=FAIL syntax {rel}: {exc}") from exc

print(f"FABRIC_AUDIT=PASS files={len(REQUIRED)}")
