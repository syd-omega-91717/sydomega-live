for forbidden in ("permission", "entitlement"):
    # Reject executable authority derivation, not documentation that states the boundary.
    patterns = (
        "window." + forbidden,
        "get" + forbidden,
        "set" + forbidden,
        "if (" + forbidden,
        "if(" + forbidden,
    )
    assert not any(token in engine.lower() for token in patterns), (
        f"theme engine must not derive behavior from {forbidden} state"
    )

#!/usr/bin/env python3
"""Guard the Ω theme engine against duplicate palette writers and identity drift."""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
bg = (ROOT / "bg.js").read_text(encoding="utf-8")
engine = (ROOT / "omega-theme-elemental.js").read_text(encoding="utf-8")

if "--help" in sys.argv or "-h" in sys.argv:
    print(__doc__)
    raise SystemExit(0)

assert "/omega-theme-elemental.js" in bg, "canonical elemental theme engine is not loaded"
assert "/omega-theme-personalization.js" not in bg, "duplicate theme writer is still globally injected"

for token in ("--page-accent", "--page-soft", "--page-glow",
              "--theme-primary", "--theme-secondary", "--theme-accent", "--theme-glow"):
    assert token in engine, f"canonical theme token missing: {token}"

assert "window.__omegaProfile" in engine, "profile context not consulted"
assert "OmegaAuth" in engine, "auth profile fallback not consulted"
get_sign = engine[engine.index("function getSign()"):engine.index("function updateSeasonalTokens")]
assert "localStorage.getItem('omega_member_sign')" not in get_sign, "cached sign is being used as identity authority"

assert "permission" not in engine.lower()
assert "entitlement" not in engine.lower()

print("OMEGA THEME ENGINE CONTRACT: PASS")
