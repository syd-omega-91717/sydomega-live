# Ω SYD OMEGA 91717 — Canonical Theme Engine

## Change

bg.js previously injected both omega-theme-elemental.js and omega-theme-personalization.js.

That created two independent palette writers with different:
- element vocabularies;
- profile lookup behavior;
- cache behavior;
- CSS token namespaces;
- initialization timing.

The platform now has one global writer: omega-theme-elemental.js.

## Authority

Theme selection is cosmetic. The engine resolves the member's sign from runtime profile/auth context first. A cached localStorage value is not an identity authority.

The engine writes:
- canonical elemental tokens: --page-accent, --page-soft, --page-glow;
- compatibility tokens: --theme-primary, --theme-secondary, --theme-accent, --theme-glow.

This lets existing surfaces continue working while eliminating competing writers.

## Safety

Theme state cannot grant:
- RBAC permissions;
- subscriptions;
- achievements;
- credentials;
- ownership;
- financial state.

omega-theme-personalization.js remains in the repository as historical compatibility/reference code but is no longer globally injected by bg.js.

## Verification

Run:
python3 scripts/tests/test_theme_engine.py

The contract fails if a second global theme writer is reintroduced.
