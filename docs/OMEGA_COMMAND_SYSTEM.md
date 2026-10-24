# Ω Command System

The global command palette is the canonical quick-navigation surface across the static page estate. It provides one predictable way to reach workspace hubs and specialist pages without exposing the physical repository structure.

## Interaction

- `Cmd/Ctrl + K` opens the global navigation palette when `nav.js` is loaded.
- Search matches page labels, workspace names, and route paths; pinned and recent destinations are device-local preferences, not server truth.
- Arrow keys move the active result; Enter opens it; Escape closes the palette; focus returns to the element that opened it.
- The search input exposes combobox/listbox semantics, expanded state, and the active option for assistive technology.
- The shared keyboard engine defers to the navigation palette whenever it is mounted. Its legacy search handler is only a fallback on surfaces without the palette, preventing competing overlays from claiming the same chord.

## Safety

The palette is navigation, not an authorization boundary. Hiding owner-only destinations improves discoverability but does not authorize server operations. Privileged actions must be enforced by authenticated server-side handlers with input validation, audit logging, and rate limiting.

## Integration contract

- Canonical navigation and palette: `nav.js`
- Shared keyboard shortcuts and fallback: `omega-keyboard.js`
- Keyboard/ARIA regression guard: `scripts/tests/test_keyboard_palette_ownership.py`
- CI contract suite: `scripts/contract-suite.py`
