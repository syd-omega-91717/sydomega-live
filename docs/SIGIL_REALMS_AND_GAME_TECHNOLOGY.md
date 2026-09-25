# SYD OMEGA 91717 — Sigil Realms & Game Technology

## Implemented in this branch

- `omega-sigil-system.css`: reusable responsive sigil cards, gold/cyan/crimson visual language, keyboard focus states, and reduced-motion support.
- `omega-sigil-system.js`: 18 canonical realm entries, click/keyboard activation, concise descriptions, and a hidden-until-requested information panel.
- `realms.html`: dedicated launcher that preserves the existing shell (`omega-side`, `bg.js`, and the platform's shared footer behavior).
- `gateway.html`: entry link to the 18-realm launcher.

## UX contract

1. The sigil is the primary entry point.
2. The label is short and targeted.
3. The explanation is progressive disclosure, not permanent wall text.
4. Entering a realm uses the existing canonical page URL; no duplicate page is created.
5. Existing navigation, analytics, authentication, and footer behavior remain outside this component.
6. Every interactive sigil is keyboard accessible and respects `prefers-reduced-motion`.

## Integration path for the remaining pages

Use the same component contract on realm landing pages:

```html
<link rel="stylesheet" href="/omega-sigil-system.css">
<script src="/omega-sigil-system.js" defer></script>
<section data-omega-sigils></section>
```

Do not replace existing business logic. Add the visual launcher around canonical routes and migrate one domain at a time, validating links, permissions, loading states, and mobile layout after each migration.

## High-resolution gaming architecture

The web platform should remain the account, social, identity, commerce, telemetry, and discovery layer. High-fidelity games should be developed as a separate game client/service boundary rather than forcing a AAA renderer into the existing static HTML runtime.

Recommended boundary:

- **Game client:** Unreal Engine 5 for high-fidelity 3D, with platform identity handoff and short-lived session tokens.
- **World streaming:** World Partition and hierarchical level of detail for large environments.
- **Rendering:** Nanite for high-detail geometry where supported; Lumen for dynamic global illumination/reflections where performance targets permit.
- **Multiplayer:** authoritative server model, selective replication, server-side validation, and anti-cheat telemetry.
- **Platform services:** existing SYD OMEGA gateway, authentication, profile, achievements, inventory, payments, and audit records remain the system of record.
- **Web fallback:** browser-based 2D/3D previews, leaderboards, inventory, and social interactions; do not promise AAA gameplay inside the browser until a separate client is production-tested.

This is an architectural direction, not a claim that a game client, dedicated servers, anti-cheat, or production game assets already exist in this repository.
