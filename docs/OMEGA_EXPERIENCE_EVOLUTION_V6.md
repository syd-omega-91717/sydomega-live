# Ω SYD OMEGA 91717 — Experience Evolution V6

**Status:** implementation on a feature branch; not production-approved until the exact-SHA checks and release verification pass.

## Objective

Make the existing 252-page static platform feel like one coherent sovereign digital environment while giving each product domain a distinct visual personality. Preserve the current static HTML/CSS/JavaScript, Supabase and Vercel/Cloudflare architecture. Do not replace the platform or create a competing page registry.

## Reference research translated into original principles

The uploaded project brief names the following reference families. The implementation borrows transferable product and design principles—not proprietary layouts, artwork, source code, brand marks or exact screen compositions.

| Reference family | Exact references named in the brief | Principles translated into Ω |
|---|---|---|
| Technology | Google, Alphabet, Microsoft, Apple, Amazon, AWS, Meta, OpenAI, Anthropic, NVIDIA, Oracle, IBM, Cloudflare, GitHub, GitLab | accessible interaction, consistent platform foundations, reliability, scale, security and disciplined product engineering |
| AI | DeepMind, OpenAI, Anthropic, xAI, Hugging Face | transparent capabilities, model/provenance context, evaluation state, human control and trustworthy assistant surfaces |
| Space & engineering | SpaceX, NASA, ESA | mission-control hierarchy, telemetry readability, instrument discipline, mission timelines and explicit operational state |
| Social | TikTok, YouTube, X, Reddit, Discord, LinkedIn | content hierarchy, identity, community context, feed controls, safety and meaningful engagement states |
| Knowledge | Wikipedia, Stack Overflow, GitHub, Internet Archive | provenance, structured knowledge, source visibility, durable navigation and dense information without visual clutter |
| Entertainment | Disney, Netflix, Warner Bros., Pixar, Epic Games, Riot Games, Steam | cinematic framing, visual storytelling, content discovery, franchise worlds and consistent art direction |
| Gaming | Unity, Unreal Engine, PlayStation, Xbox, Nintendo | spatial feedback, responsive input, readable HUDs, meaningful progression and performance-aware effects |
| Finance | Stripe, PayPal, Visa, Mastercard | trust cues, clear amounts, explicit confirmation, understandable errors and staged payment flows |
| Commerce | Amazon, Shopify | searchable discovery, useful filters, product comparison, transparent purchase and transaction states |
| Communication | Slack, Zoom, Notion | persistent workspaces, collaboration context, focused communication and predictable navigation |
| Productivity | Atlassian, Linear, Figma, Canva | workflow clarity, keyboard accessibility, reusable components, creation tools and consistent design primitives |
| Infrastructure | Docker, Kubernetes, HashiCorp, Vercel, Cloudflare | operational status, telemetry, deployment clarity, secure control surfaces and visible system state |

The source asks these organizations to be examined across engineering, scalability, maintainability, innovation, governance, security, automation, deployment, product thinking, UX, architecture, reliability, resilience, observability, documentation, QA, AI integration and operational excellence. This matrix maps those lenses into a shared Ω product language; it does not claim a full forensic audit of every competitor.

## Canonical page-world architecture

- `config/page-character-manifest.json` owns the 12 visual archetypes and the explicit `pageArchetypes` map for 242 root pages. Its fallback is the canonical `system` archetype.
- `omega-page-world.js` resolves the exact page archetype, publishes visual/motion/depth/density/interaction/emblem attributes and publishes the archetype's accent, secondary, glow and line tokens.
- `omega-platform-experience-v5.css` consumes those attributes and tokens. It differentiates page worlds without replacing page-specific background artwork or layouts.
- `omega-archetype-surfaces.js` may tune spacing and surface depth, but it must never hide generic `.card-content` on hover or by default. Page-owned progressive disclosure must use semantic controls such as `details/summary` or explicit `aria-expanded`.
- The Visual Page Survey scans 252 HTML documents: 242 root pages plus 10 nested surfaces. Unmapped nested surfaces use the canonical district/rule/system fallback rather than being left unstyled.

## Twelve visual signatures

| Archetype | Visual treatment | Primary product inspiration |
|---|---|---|
| Command | gold instrument surfaces, strong hierarchy, clear next actions | mission control, operating systems |
| Identity | ceremonial gold, credential and artifact framing | Apple identity patterns, premium digital passes |
| Intelligence | cyan analytical surfaces, holographic depth, data typography | AI observatories, research and developer tools |
| Knowledge | calm readable surfaces, controlled reading width | Wikipedia, Stack Overflow, Notion |
| Gaming | cyan arena contrast, restrained crimson, readable HUDs | Unreal, Unity, console ecosystems |
| Media | cinematic gold framing, controlled crimson, poster/video surfaces | Netflix, Disney, Pixar, YouTube |
| Commerce | gold transaction hierarchy, green success semantics | Shopify, Amazon |
| Creation | cyan/gold workspaces and tool surfaces | Figma, Canva, creator tools |
| Community | cyan/gold constellation cues, readable feed/thread hierarchy | Discord, Reddit, LinkedIn |
| Governance | deliberate gold/cyan decision and evidence surfaces | Atlassian, enterprise control planes |
| Finance | tabular numeric alignment, clear transaction states | Stripe, PayPal, Visa, Mastercard |
| System | crimson/cyan operational and telemetry surfaces | Cloudflare, Vercel, Kubernetes |

The palette is restricted to the Ω dark base and canonical accents: `#020206`, `#0A0A0F`, `#C9A84C`, `#E8C97A`, `#00E5FF`, `#8B0000`, and `#00FF88`. Accent colors are semantic, not decoration: success, warning, error and neutral states must still represent real system state.

## Implemented in this branch

1. The manifest now contains per-archetype `accent`, `secondary`, `glow` and `line` tokens; the JSON schema validates them.
2. The page-world membrane publishes all canonical `data-omega-*` attributes and the four CSS variables from the manifest. The membrane's role text is larger and its mobile actions have a 44px minimum touch target.
3. The global V6 layer styles all 12 visual signatures, all manifest density profiles, all motion profiles and the 3D/glass/holographic/orbital depth profiles.
4. The V6 layer does not replace page-specific background images, introduce a second renderer, or add perpetual motion. Reduced-motion, forced-colors and focus-visible behavior remain explicit.
5. Generic archetype surfaces no longer hide card information on hover or by default.
6. Regression tests cover all 242 explicit root-page archetypes, all 252 HTML surfaces, the 12 profile tokens, visual CSS, accessibility contracts and the content-disclosure rule.

## Survey findings and next remediation wave

The Visual Page Survey's static source scan reported:

- 183 pages with a missing visible/semantic level-one heading contract.
- 151 pages with one or more fixed-width declarations at or above 320px.
- 120 pages with one or more readability findings (dense letter spacing).
- 20 pages with a density finding.
- 0 duplicate document titles.
- Mean information-focus score: 98.4/100; minimum: 78/100.

These are source-survey findings, not proof that every flagged page is visually broken at runtime. They are not silently declared fixed by V6. The next remediation wave should address semantic page titles, responsive width constraints, typography/letter-spacing cleanup, then density reduction on the highest-count pages. The survey's highest-density review candidates include media, dashboard, academy, gaming, intelligence, vault and profile.

## Reference-media limitation

The uploaded project briefs available in this workstream are text documents, not embedded image/video files. This implementation follows their written cinematic/3D direction and the repository's existing sculpture and media runtimes. It does not claim pixel-level matching to reference pictures or videos that were not available to inspect. If the exact reference media is supplied to the project, the next visual acceptance pass can compare those compositions directly.

## Release acceptance

- All 242 explicit root-page mappings resolve to one of the 12 archetypes.
- All 252 HTML surfaces resolve to a valid archetype or the canonical fallback.
- No generic visual rule hides content or overrides page-specific image art.
- Reduced-motion, forced-colors, keyboard focus and mobile touch targets pass.
- No new framework, runtime dependency, CDN, WebGL context, API, database migration or permission change.
- CI, contracts, security checks, Vercel preview and exact-SHA production smoke must pass before the change is called live.
