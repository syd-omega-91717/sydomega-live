# Ω SYD OMEGA 91717 — Universal Visual + Content Architecture

## Canonical page contract
Every member-facing content page follows one visual grammar:
**Header → Sigil Door → Short purpose → Live content → Optional More Info → Existing footer**

The sigil is not decoration. It is the page's visual representative and the user's entry/focus point.

### Rules
- Keep existing page-owned header/navigation and footer.
- Keep existing business logic and data bindings.
- Give each page one meaningful emblem derived from its domain.
- Keep the first explanation to a short operational sentence.
- Put long explanatory material behind a More Info control.
- Never collapse tables, forms, KPIs, controls, legal text, or primary data.
- Preserve keyboard access and prefers-reduced-motion.
- Do not create duplicate destinations merely for visual treatment.
- Reuse canonical routes and page metadata.

## Asset taxonomy
- **Door assets:** page emblem/sigil, title, domain axis and entry action.
- **Live assets:** charts, graphs, feeds, timers, tables, dashboards, progress rings, maps and records. These remain functional and data-driven.
- **Meaning assets:** long explanations, methodology, provenance and rules. These use progressive disclosure.
- **Identity assets:** member sigils, character cards, credentials, passports, genealogy and achievements.
- **World assets:** Cosmos, City, Matrix, Elements, Houses, factions, cinema, universe and other world-building surfaces.

## Existing systems
The repository already contains a page emblem catalog, page emblem renderer, emblem integration, unified UI, unified background and More Info systems. The universal layer composes those systems instead of creating a competing design framework.

## Visual direction
Use one restrained cinematic background: deep void, sparse grid, low-energy gold/cyan ambient light. Page-specific identity comes from the emblem, content surfaces and data — not a different background on every page.

## High-fidelity game boundary
The web platform remains the account, identity, social, discovery, commerce, achievement and telemetry layer.
For AAA/high-definition games, use a dedicated Unreal Engine 5 client and backend boundary:
- World Partition for large-world streaming.
- HLOD for distant world representation.
- Nanite Virtualized Geometry for high-detail geometry.
- Lumen for dynamic global illumination/reflections.
- Virtual Shadow Maps for high-resolution dynamic shadows.
- Authoritative multiplayer servers with server-side validation.
- Platform identity handoff using short-lived session credentials.
- Game inventory, achievements, progression and social state synchronized with the SYD OMEGA platform.

PUBG's current roadmap explicitly describes its move toward Unreal Engine 5 as a foundation for future expansion and visual upgrades. Epic's current UE5 documentation describes World Partition, HLOD, Nanite and Lumen as complementary technologies for large, detailed worlds. This is an inspiration and technology direction — not a claim that a production AAA game already exists in this repository.

## Implementation sequence
1. Universal page door — complete.
2. Universal progressive disclosure — complete.
3. Normalize remaining page-specific visual systems onto the unified background.
4. Audit every canonical HTML surface and classify its content.
5. Add or correct emblem mounts where absent.
6. Convert long explanatory blocks to compact + More Info without hiding operational content.
7. Validate every route and preserve page-owned functionality.
8. Build the dedicated game client/service boundary separately from the static web runtime.