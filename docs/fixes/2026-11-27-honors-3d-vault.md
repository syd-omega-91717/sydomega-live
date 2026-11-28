# Evidence-backed 3D Honors Vault

## Visual implementation
- Three concentric orbital collections: 12 trophy slots, 12 medal slots, and 12 certificate slots.
- Procedural Three.js geometry; the collections rotate independently around the Omega core.
- Earned nodes glow only when their number exists in the authenticated member's persisted collection.
- A failed or unavailable read leaves all nodes UNKNOWN; it never converts missing data into LOCKED or EARNED.
- The existing 2D vault remains the readable and accessible fallback.
- Reduced-motion preference stops continuous rotation and pulse animation.

## Data authority
- Authenticated, member-scoped reads from public.trophies, public.medals, and public.certificates.
- The owner role no longer substitutes the catalogue 1–12 for persisted award rows. Current owner records are still rendered from the actual rows.
- Source artwork and catalogue definitions are not earned records.
- The scene does not mint awards, modify progression, write user_assets, or grant credentials.

## Verification boundary
Static tests cover mount, data binding, owner evidence, unknown-state handling, and reduced-motion behavior. Real GPU/mobile/browser inspection remains required before production promotion.
