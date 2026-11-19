# Ω SYD OMEGA 91717 — Experience Evolution V6

**Status:** implementation proposal on a feature branch; production status is determined only by the exact-SHA release gate.

## Design intent

Make the existing platform feel like one coherent sovereign digital environment while giving each product domain its own visual character. The visual profile source is `config/page-character-manifest.json`. Existing page assignments come from `config/page-world-actions.json` and `config/omega-world-manifest.json` plus its overrides. One resolver combines these canonical sources; the UI must not maintain a second page-to-archetype map.

## Inspiration translated into original product principles

The supplied master brief names technology, AI, aerospace, social, knowledge, entertainment, gaming, finance, commerce, communication, productivity and infrastructure platforms. The implementation borrows transferable principles, not protected layouts, code, artwork or brand marks.

| Reference family named in the brief | Exact references from the brief | Principle adapted for Ω |
|---|---|---|
| Technology | Google, Alphabet, Microsoft, Apple, Amazon, AWS, Meta, OpenAI, Anthropic, NVIDIA, Oracle, IBM, Cloudflare, GitHub, GitLab | coherent platform foundations, reliability, accessible interaction, security, scale and disciplined product engineering |
| AI | DeepMind, OpenAI, Anthropic, xAI, Hugging Face | transparent capability, model/provenance context, human control, evaluation state and trustworthy assistant surfaces |
| Space & engineering | SpaceX, NASA, ESA | mission-control hierarchy, telemetry readability, instrument discipline, mission timelines and clear operational state |
| Social platforms | TikTok, YouTube, X, Reddit, Discord, LinkedIn | content hierarchy, identity, community context, feed controls, safety and meaningful engagement states |
| Knowledge platforms | Wikipedia, Stack Overflow, GitHub, Internet Archive | provenance, structured knowledge, source visibility, durable navigation and dense information without visual clutter |
| Entertainment | Disney, Netflix, Warner Bros., Pixar, Epic Games, Riot Games, Steam | cinematic framing, visual storytelling, content discovery, franchise worlds and consistent art direction |
| Gaming | Unity, Unreal Engine, PlayStation, Xbox, Nintendo | spatial feedback, responsive input, readable HUDs, meaningful progression and performance-aware effects |
| Finance | Stripe, PayPal, Visa, Mastercard | trust cues, clear amounts, explicit confirmation, understandable errors and staged payment flows |
| Commerce | Amazon, Shopify | searchable discovery, useful filters, product comparison, transparent purchase and transaction states |
| Communication | Slack, Zoom, Notion | persistent workspaces, collaboration context, focused communication and predictable navigation |
| Productivity | Atlassian, Linear, Figma, Canva | workflow clarity, keyboard accessibility, reusable components, creation tools and consistent design primitives |
| Infrastructure | Docker, Kubernetes, HashiCorp, Vercel, Cloudflare | operational status, telemetry, deployment clarity, secure control surfaces and visible system state |

The brief asks these organizations to be examined across **engineering, scalability, maintainability, innovation, governance, security, automation, deployment, product thinking, user experience, system architecture, reliability, resilience, observability, documentation, quality assurance, AI integration and operational excellence**. The table above translates those lenses into a visual/product system; it does not claim that each company has been exhaustively audited or that its proprietary implementation is reproduced.

The intended Ω emotional signatures remain distinctive: the chatbot should feel like an oracle, the leaderboard like an ascent, the passport like a crafted artifact, and the 9×9×9 structure should be perceptible through navigation and interaction—not through decorative clutter.

## Complete page-to-world resolution

The resolver uses existing canonical data in this order:

1. An exact route override (a `=`-prefixed token) in `page-character-manifest.json`.
2. A non-default archetype already assigned to the page in `page-world-actions.json`.
3. The first matching broad visual rule in `page-character-manifest.json`.
4. A valid district archetype from the world manifest.
5. The page action's `command` archetype when no more specific rule applies.
6. The valid `command` archetype as the final fallback.

The visual audit enumerated all **252 HTML documents**: 242 root pages and 10 nested surfaces. With exact route overrides, curated action archetypes and collision-safe fallback rules, every document resolves to one of the 12 supported archetypes; no route is left unassigned. Current resolution counts across all 252 HTML documents:

| Archetype | Root pages |
|---|---:|
| Intelligence | 55 |
| Knowledge | 39 |
| Command | 42 |
| Gaming | 23 |
| Media | 16 |
| Community | 16 |
| Finance | 12 |
| System | 13 |
| Commerce | 10 |
| Identity | 9 |
| Creation | 9 |
| Governance | 8 |
| **Total** | **252** |

The broad `ai` substring was removed from the intelligence rule because it incorrectly matched words such as `trailers` and `maintenance`. The narrower `ai-` token and explicit route rules avoid those collisions.

## Implemented in this branch

1. `omega-page-world.js` now publishes the canonical manifest's archetype, visual, motion, depth, density, interaction and emblem profiles as `data-omega-*` attributes on the document root. It does not create a parallel registry.
2. `omega-platform-experience-v5.css` consumes those manifest tokens and adds 12 distinct visual profiles, world-specific surface treatment, cinematic media framing, all density and motion profiles, data typography, reading-width support and responsive/focus/reduced-motion/forced-colors rules.
3. `omega-archetype-surfaces.js` no longer hides generic `.card-content` on hover or by default. Visual archetypes may tune surface density, but pages own disclosure through semantic controls such as `details/summary` or explicit `aria-expanded` interactions. Essential content remains available to touch, keyboard and assistive-technology users.
4. No new framework, renderer, dependency, database migration, route, API or fabricated metric is introduced.

## Visual profiles

- Command: gold instrument surfaces and clear action hierarchy.
- Identity: ceremonial gold and artifact framing.
- Intelligence: cyan/gold analytical and holographic surfaces.
- Knowledge: calm readable surfaces and controlled reading width.
- Gaming: cyan arena contrast with restrained crimson.
- Media: cinematic gold framing with controlled crimson.
- Commerce: gold transaction hierarchy with green success semantics.
- Creation: cyan/gold workspace treatment.
- Community: cyan/gold social constellation cues.
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
