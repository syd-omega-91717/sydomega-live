# Profile 3D Character Core

## Concept
The Profile Character tab now has a 3D member-specific core using the existing `OmegaSculpture` character scene. It reuses the platform's single WebGL renderer; it does not add another graphics engine.

## Data authority
- Reads the already-loaded member profile's saved `sign`.
- Resolves the element from the canonical same-origin `/omega-elements.json` `sign_element` map.
- Resolves the corresponding display palette key against the existing `OmegaRealm.palette`.
- Sets only `data-sculpt-element`, which the existing character scene reads live.
- Does not infer or set gate progress or mastery values. Those visual nodes remain neutral until verified sources are connected.

## Failure behavior
Missing sign, missing canonical mapping, missing palette or failed canonical JSON fetch leaves the core neutral and updates the visible status. The profile page continues to load; this visual binding is non-blocking.

## Verification
Static contracts are in `scripts/tests/test_profile_character_core_3d.py`. Browser checks are still required for the hidden Character tab becoming visible, the canvas resizing after tab activation, and the saved-sign colour on mobile and desktop.
