# Studio Franchise Orrery

**Date:** 2026-11-28

## Concept
A seven-world 3D orrery gives the Creative Universe a high-level navigation layer. The Omega core sits at the centre; the seven canonical franchise worlds occupy independently rotating orbital paths, with distinct materials, labels, and a small satellite for visual depth.

## Functional behaviour
- Each world node is raycast-selectable and links to its matching franchise dossier below.
- The franchise cards receive stable IDs from the canonical Roman numeral in the `FRANCHISES` array.
- A parallel keyboard-accessible link list is provided by the shared sculpture runtime.
- The existing 2D dossier grid remains the readable and low-resource fallback.
- Reduced-motion preferences stop continuous rotation and pulsing.

## Truth boundary
The orrery represents narrative IP topology only. Orbital proximity and motion do not imply production state, release status, chronology, ownership, or a real-world dependency. Production statuses continue to come from the Studios production registry and its evidence, not from this visualization.

## Architecture
- Uses the existing shared `omega-sculpture.js` renderer; no second WebGL context or new dependency.
- Procedural geometry and canvas labels; no external textures or fabricated member data.
- No database reads/writes, award minting, or changes to production records.
- Responsive frame sizing and the shared renderer's high-DPI, visibility, and reduced-motion handling are retained.

## Verification boundary
Static tests pin the seven canonical labels, card anchors, accessibility fallback, reduced-motion boundary, and no-production-telemetry contract. CI visual survey and physical-device GPU inspection remain required before production visual sign-off.
