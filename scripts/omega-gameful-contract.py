"""Validate the OMEGA gameful feature contract.

Every module must have a product purpose, a gameful role, live-state intent,
and an explicit simulation boundary. This is a design/governance gate, not
proof that a feature is implemented or live.
"""
import sys
from pathlib import Path

MODULES = {
    "Core": ("identity, navigation, platform control", "Home world / HUD"),
    "Consultancy": ("professional advisory work", "Missions / contracts"),
    "Gaming": ("games and competitions", "Arena"),
    "Achievements": ("verified progress", "Achievement tree"),
    "Family": ("heritage and lineage", "Dynasty map"),
    "Media": ("publish/discover content", "Broadcast network"),
    "Blockchain/NFT": ("digital ownership concepts", "Asset vault"),
    "Communication": ("member communication", "Comms channel"),
    "Horoscope": ("entertainment/personal reflection", "Cosmic map"),
    "News": ("current information discovery", "Intelligence feed"),
    "Heritage": ("preserve history/evidence", "Archive"),
    "Progress": ("measurable development", "Progression system"),
    "Credentials": ("proof of achievement/identity", "Inventory / loadout"),
    "Legal": ("terms, consent, governance", "Rules / safe zone"),
    "Elemental": ("thematic identity/visual system", "Avatar affinity"),
    "Investment": ("financial intelligence", "Strategy arena"),
    "Intelligence": ("search, analytics, AI", "Command center"),
    "Hierarchy": ("permissions and governance", "Faction/authority map"),
}

RUNTIME_FILES = ["world.html", "omega-world-engine.js", "omega-world-engine.css", "omega-legacy-constellation.js", "omega-world-progression.js"]
RUNTIME_FILES = ["world.html", "omega-world-engine.js", "omega-world-engine.css", "omega-legacy-constellation.js", "omega-world-progression.js", "omega-achievement-evidence-chain.js", "docs/OMEGA_ACHIEVEMENT_EVIDENCE_CHAIN.md"]
RUNTIME_FILES = ["world.html", "omega-world-engine.js", "omega-world-engine.css", "omega-legacy-constellation.js", "omega-world-progression.js", "omega-capability-provenance.js"]

REQUIRED = [
    "Why does it exist?",
    "Who uses it?",
    "What action does it enable?",
    "What data does it consume?",
    "What data does it create/change?",
    "Who is authorized?",
    "What is the failure state?",
    "What makes it live?",
    "What makes it gameful?",
    "What is simulated versus real?",
    "What evidence proves completion?",
    "What happens when animation/3D is disabled?",
]

def main() -> int:
    if "--help" in sys.argv or "-h" in sys.argv:
        print(__doc__.strip())
        return 0

    doc = Path("docs/OMEGA_FEATURE_PURPOSE_MATRIX.md")
    failures = []
    if not doc.exists():
        failures.append(f"missing {doc}")
    else:
        text = doc.read_text(encoding="utf-8")
        for name, (purpose, role) in MODULES.items():
            if f"| {name} | {purpose} | {role} |" not in text:
                failures.append(f"{name}: purpose/role row missing")
        for item in REQUIRED:
            if item not in text:
                failures.append(f"universal contract missing: {item}")
    for path in RUNTIME_FILES:
        if not Path(path).exists():
            failures.append(f"runtime surface missing: {path}")

    if failures:
        print("OMEGA GAMEFUL CONTRACT: FAIL")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print(f"OMEGA GAMEFUL CONTRACT: PASS ({len(MODULES)}/18 modules)")
    print(f"Universal feature questions: {len(REQUIRED)}/{len(REQUIRED)}")
    print(f"Runtime world surface: {len(RUNTIME_FILES)}/{len(RUNTIME_FILES)} files present")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
