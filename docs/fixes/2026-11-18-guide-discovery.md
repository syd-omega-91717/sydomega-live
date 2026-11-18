# Guide discovery enhancement

Date: 2026-11-18

## Change

- Search now indexes generated answers (including the live elements and lore legend), not only literal string answers.
- Added an announced result count, explicit empty-search guidance, a keyboard-focusable clear action, and expand/collapse-all controls.
- Kept native `details/summary` semantics and the existing textContent-only rendering boundary; no untrusted HTML is introduced.
- No API, database, route, dependency, or permission change.

## Verification required

- `python3 -m unittest scripts/tests/test_guide_discovery.py`
- Existing full contract suite and static contract gates.
- Browser review at 375px, 768px and desktop widths; keyboard-only and reduced-motion checks.

## Expected impact

Improves first-time member self-service, discoverability and accessibility without altering existing account or data flows.
