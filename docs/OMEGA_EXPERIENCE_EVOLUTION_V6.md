# Ω SYD OMEGA 91717 — Experience Evolution V6

**Status:** implementation proposal on a feature branch; production status is determined only by the exact-SHA release gate.

## Design intent

Make the existing platform feel like one coherent sovereign digital environment while giving each product domain its own visual character. The source of truth is `config/page-character-manifest.json`; the UI must not maintain a second page-to-archetype map.

## Inspiration translated into original product principles

The supplied master brief names technology, AI, aerospace, social, knowledge, entertainment, gaming, finance, commerce, communication, productivity and infrastructure platforms. The implementation borrows transferable principles, not protected layouts, code, artwork or brand marks.

| Reference family named in the brief | Principle adapted for Ω |
|---|---|
| Apple, Google, Microsoft | legibility, adaptive layouts, predictable interaction, clear focus and restrained material depth |
| Amazon, Shopify | searchable discovery, useful filters, product comparison, transparent purchase and transaction states |
| Meta, TikTok, YouTube, X, Reddit, Discord, LinkedIn | content hierarchy, identity, community context, feed controls, safety and clear engagement states |
| Wikipedia, Stack Overflow, GitHub, Internet Archive | provenance, structured knowledge, source visibility, durable navigation and dense information without visual clutter |
| Disney, Netflix, Warner Bros., Pixar, Epic Games | cinematic framing, visual storytelling, content discovery, strong art direction and coherent worlds |
| Unity, Unreal Engine, PlayStation, Xbox, Nintendo | readable spatial feedback, responsive input, meaningful progression and performance-aware effects |
| Stripe, PayPal, Visa, Mastercard | trust cues, clear amounts, explicit confirmation, understandable errors and staged payment flows |
| Slack, Zoom, Notion | persistent workspaces, collaboration context, focused communication and predictable navigation |
| Atlassian, Linear, Figma, Canva | workflow clarity, reusable components, creation tools, keyboard access and consistent design primitives |
| Docker, Kubernetes, HashiCorp, Vercel, Cloudflare | operational status, telemetry, deployment clarity, secure control surfaces and visible system state |
| OpenAI, Anthropic, DeepMind, xAI, Hugging Face, NVIDIA | transparent AI capability, model/provenance context, evaluation status and clear human control |
| SpaceX, NASA, ESA | mission-control hierarchy, telemetry readability, timeline context and disciplined instrument design |

## Implemented in this branch

1. `omega-page-world.js` now publishes the canonical manifest's archetype, visual, motion, depth, density, interaction and emblem profiles as `data-omega-*` attributes on the document root. It does not create a parallel registry.
2. `omega-platform-experience-v5.css` adds a manifest-driven visual layer: 12 distinct accent profiles, world-specific surface treatment, cinematic media framing, data typography, reading-width support and responsive/focus/reduced-motion/forced-colors rules.
3. `omega-archetype-surfaces.js` no longer hides generic `.card-content` on hover or by default. Visual archetypes may tune surface density, but pages own disclosure through semantic controls such as `details/summary` or explicit `aria-expanded` interactions. Essential content remains available to touch, keyboard and assistive-technology users.
4. No new framework, renderer, dependency, database migration, route, API or fabricated metric is introduced.

## Visual profiles

- Command: gold instrument surfaces and clear action hierarchy.
- Identity: ceremonial gold and artifact framing.
- Intelligence: cyan/purple analytical and holographic surfaces.
- Knowledge: calm readable surfaces and controlled reading width.
- Gaming: cyan arena contrast with restrained crimson.
- Media: cinematic gold framing with purple depth.
- Commerce: gold transaction hierarchy with green success semantics.
- Creation: cyan/gold workspace treatment.
- Community: purple/cyan social constellation cues.
- Governance: deliberate gold/cyan decision surfaces.
- Finance: tabular numeric alignment and trusted transaction cues.
- System: crimson/cyan operational and telemetry surfaces.

All profiles retain the Ω identity and dark-only base palette. Accent colors are semantic, not decoration: status colors must continue to represent actual state.

## Estate-wide survey baseline (2026-11-19)

The successful Visual Page Survey workflow scanned **252 HTML documents**: 242 root pages plus 10 nested surfaces. Its static source scan reported:

- 183 pages with a missing visible/semantic level-one heading contract.
- 151 pages with one or more fixed-width declarations at or above 320px.
- 120 pages with one or more readability findings (dense letter spacing).
- 20 pages with a density finding.
- 0 duplicate document titles.
- Focus score average 98.39/100; minimum 78/100.

These are source-survey findings, not proof that every flagged page is visually broken at runtime. They are also **not fixed by V6**. They become the next remediation wave: semantic page titles, responsive width constraints, typography/letter-spacing cleanup, then density reduction on the highest-count pages. The 404, profile, dashboard, media, vault, family and gaming surfaces are high-priority review candidates from the survey. The report is retained as the `omega-visual-page-survey` workflow artifact.

The uploaded project briefs are text files rather than embedded image/video assets. This implementation therefore follows their written cinematic/3D direction and the existing repository's sculpture and media runtimes; it does not claim pixel-matching against reference images that were not available to inspect in this session.

## Acceptance criteria

- All 12 archetypes are represented by the canonical manifest and receive root data attributes.
- Every page still uses the existing `bg.js`, navigation, layout, auth and page-specific behavior.
- No generic visual rule collapses or hides page content.
- Reduced-motion and forced-colors modes remain supported.
- Mobile actions retain accessible touch targets and focus visibility.
- No new WebGL context, external CDN, runtime dependency or unverified backend claim.
- CI, production surface verification, exact-SHA deployment and visual viewport acceptance must pass before declaring this work live.
