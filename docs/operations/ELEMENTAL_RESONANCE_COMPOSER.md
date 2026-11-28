# Elemental Resonance Composer

## Concept
A session-only creative studio on `elements.html`. Members select up to three canonical elements and compose an orbital constellation that can be exported as a scalable SVG.

## Canonical inputs
- Element names, ordinal, tier, domain and membership metadata come from `omega-elements.json`.
- Element colours come from the existing `OmegaRealm.palette` `core` values.
- The canonical registry is validated for nine elements; the composer does not copy the taxonomy into a second hard-coded list.

## User-created boundary
- A composition is labelled USER-CREATED and SESSION ONLY.
- It does not change element assignment, authority, class, gate state, achievements, profile, or progression.
- It does not write to Supabase or local storage.
- Duplicate selections are blocked; a composition contains one to three distinct elements.
- Export is a standalone SVG vector artifact. Export text is XML-escaped and colours are validated.

## Visual behavior
- The existing rotating 3D nine-element scene remains the canonical overview.
- The composer adds a CSS 3D orbital arrangement with two counter-rotating rings when a composition exists.
- Idle state is static; motion begins only after composing.
- `prefers-reduced-motion: reduce` disables orbit motion.
- Responsive layout preserves readable 12px minimum labels and keyboard-operable native controls.

## Verification
Static contracts are in `scripts/tests/test_elemental_resonance_composer.py`. Browser checks are required for selector interactions, duplicate handling, SVG download, and reduced-motion behavior.
