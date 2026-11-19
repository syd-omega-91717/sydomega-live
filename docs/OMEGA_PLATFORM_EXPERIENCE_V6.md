# Ω SYD OMEGA 91717 — Platform Experience V6

**Status:** implementation specification and release contract  
**Scope:** all 242 canonical HTML routes, their page-world archetypes, shared visual surfaces and responsive states.

## Purpose

V6 turns the existing design assets and page-character manifest into a consistent, archetype-aware experience. It is additive: page routes, page-owned workflows, authorization, Supabase data contracts and the existing static runtime remain in place.

The system uses three existing sources of truth:

1. `config/omega-page-contracts.json` — canonical page inventory.
2. `nav.js` — canonical page-to-navigation-section mapping.
3. `config/page-character-manifest.json` — visual archetypes, motion, depth, density and interaction intent.

An exact `pageArchetypes` map now covers all 242 canonical pages. The explicit page map wins over district defaults; token rules are only a fallback. This avoids substring collisions such as treating `blockchain` or `maintenance` as AI pages merely because their names contain the letters `ai`.

## Eighteen-module visual coverage

Each module keeps its own page and workflow ownership while inheriting a primary visual archetype. Cross-cutting pages may expose secondary accents, but their permissions and business state never change because of the visual classification.

| # | Canonical module | Primary archetype | Visual treatment |
|---:|---|---|---|
| 1 | Platform Core | Command | Omega command surfaces, navigation, status and mission entry |
| 2 | Consultancy Hub | Commerce | Service catalog, expert profiles, booking and report surfaces |
| 3 | Gaming & Characters | Gaming | Arena, game cards, character art and world progression |
| 4 | Achievements | Gaming | Merit display cases, stage badges and verified reward states |
| 5 | Family & Tree Links | Community | Relationship graph, privacy-aware member cards and lineage |
| 6 | Media (Movies / Series / Demos) | Media | Poster-led discovery, cinematic scenes and viewing continuity |
| 7 | Blockchain / Crypto / NFT | Finance | Ledger, wallet, asset and chain-state visualization |
| 8 | Communication & Security | Community | Messaging, presence and collaboration; security controls retain system styling |
| 9 | Horoscope & Elements | Identity | Personal profile context, illustrated elements and chart surfaces |
| 10 | Media & News | Media | Editorial discovery, multimedia gallery and source context |
| 11 | Heredity & Heritage | Knowledge | Archive, artifacts, lineage records and provenance |
| 12 | Evaluation & Progress | Gaming | Nine-stage progression, learning milestones and verified progress |
| 13 | System Passport & Crypto Card | Identity | Credential framing, identity seal and private member details |
| 14 | Legal & Rights | Governance | Terms, contracts, rights and approval state |
| 15 | Gods, Planets & Elements | Identity | Illustrated profile-linked celestial and elemental collections |
| 16 | Asset Ownership & Investment Engine | Finance | Portfolio, allocation, holdings and transaction state |
| 17 | AI & System Intelligence | Intelligence | Agents, evidence, analytics and explainable intelligence |
| 18 | Level & Ownership Hierarchy | Governance | Role boundaries, owner controls and access hierarchy |

## Twelve visual archetypes

| Archetype | Visual direction | Primary experience |
|---|---|---|
| Command | Omega gold, orbital instrument panels | Orientation, missions, command and decisions |
| Identity | Warm gold, ceremonial glass and insignia | Profile, account, passport and personal identity |
| Intelligence | Cyan/violet observatory and evidence paths | Research, search, agents, analytics and graphs |
| Knowledge | Calm cyan/gold reading surfaces | Academy, library, learning and reference |
| Gaming | Violet/cyan arena depth | Games, missions, mastery, trophies and competition |
| Media | Violet cinematic framing with gold highlights | Films, series, trailers, worlds and creator media |
| Commerce | Gold/cyan exchange surfaces | Marketplace, offers, checkout and services |
| Creation | Cyan-lit forge and focused workspaces | Studio, editor, publishing and project creation |
| Community | Green/cyan constellation cues | Social, family, groups and collaboration |
| Governance | Restrained gold council surfaces | Decisions, approvals, compliance and audit |
| Finance | Gold/emerald data clarity | Wallet, ledger, budget, portfolio and investment |
| System | Cyan control-room surfaces with crimson risk states | Security, operations, maintenance and recovery |

The archetype is a visual context only. It does not grant permissions, rank, KYC state, achievements or financial authority.

## Transferable product principles

The reference ecosystem named in the project master prompt is translated into product principles, not copied screens or proprietary assets:

- **Google Search, YouTube, TikTok and Reddit:** intent-first discovery, readable search results, clear content context and useful continuation.
- **Apple and Google:** coherent system behavior, strong typography hierarchy, predictable navigation and accessible defaults.
- **Netflix, Disney and Pixar:** cinematic scene framing, poster-led discovery, media continuity and distinct art direction.
- **Epic Games, Unreal, PUBG, Riot, Steam, PlayStation, Xbox and Nintendo:** world-building, missions, session state, inventory, progression and meaningful rewards.
- **Stripe, PayPal, Visa and Mastercard:** transparent transaction steps, clear totals, trust cues and unambiguous success/failure states.
- **Amazon and Shopify:** product discovery, comparison, catalog clarity and low-friction checkout.
- **Discord, Slack, Zoom and LinkedIn:** identity, presence, collaboration context and communication hierarchy.
- **Notion, Linear, Atlassian, Figma and Canva:** focused workspaces, command/search entry points, progressive disclosure and clear creation/publishing flows.
- **OpenAI, Anthropic, DeepMind, Hugging Face and xAI:** assistant/agent identity, model transparency, evidence provenance and controllable tool execution.
- **Microsoft, AWS, Cloudflare, Vercel, GitHub, GitLab, Docker, Kubernetes, HashiCorp, Oracle and IBM:** operational observability, release state, governance and recoverable workflows.
- **NVIDIA, NASA, ESA and SpaceX:** data-rich telemetry, mission-control hierarchy, spatial context and scale cues.

## Complete source benchmark inventory

The project source prompt names the following organizations and applications. They are all included in the research inventory; the principles are adapted to SYD OMEGA rather than copied.

| Source grouping | Named references | Transferable design / product lesson |
|---|---|---|
| Technology | Google, Alphabet, Microsoft, Apple, Amazon, AWS, Meta, OpenAI, Anthropic, NVIDIA, Oracle, IBM, Cloudflare, GitHub, GitLab | Consistent product systems, discoverability, enterprise controls, reliability and clear system status |
| AI | DeepMind, OpenAI, Anthropic, xAI, Hugging Face | Agent identity, model transparency, source provenance, controllable tools and explainable results |
| Space & engineering | SpaceX, NASA, ESA | Mission-control hierarchy, telemetry, spatial orientation and high-signal status displays |
| Social | TikTok, YouTube, X, Reddit, Discord, LinkedIn | Discovery, feeds, creator identity, communities, professional identity and content context |
| Knowledge | Wikipedia, Stack Overflow, GitHub, Internet Archive | Searchable knowledge, citations, version history, contribution context and archival navigation |
| Entertainment | Disney, Netflix, Warner Bros., Pixar, Epic Games, Riot Games, Steam | Cinematic worlds, franchise continuity, strong visual identity, content discovery and collections |
| Gaming | Unity, Unreal Engine, PlayStation, Xbox, Nintendo | Responsive game surfaces, progression, controller-friendly interaction and coherent world systems |
| Finance | Stripe, PayPal, Visa, Mastercard | Transparent payments, transaction states, trust, receipts and error recovery |
| Commerce | Amazon, Shopify | Catalog hierarchy, product comparison, merchant context and checkout clarity |
| Communication | Slack, Zoom, Notion | Contextual messaging, presence, shared work and durable knowledge |
| Productivity | Atlassian, Linear, Figma, Canva | Focused workspaces, clear task states, collaboration, editing and publishing |
| Infrastructure | Docker, Kubernetes, HashiCorp, Vercel, Cloudflare | Operational visibility, deployment state, configuration clarity and recoverability |

The module specifications also name the following integration surfaces. These are product references, not claims that each provider is currently connected or that its API is active:

- **Social and identity:** Instagram, WhatsApp, X/Twitter, TikTok, LinkedIn, Telegram, Facebook, Snapchat, YouTube; Google, Facebook and Instagram OAuth.
- **Wallet and exchange references:** Binance, Coinbase, Trust Wallet, KuCoin, Gate and Bybit.
- **Hosting and delivery:** AWS, Render, Vercel, Netlify, Cloudflare and Namecheap.
- **AI and media services:** Anthropic/Claude, Gemini, Perplexity and YouTube.

The visual implementation keeps provider identity and external account state truthful: a logo, link or connector reference is not evidence of a live authorization, active API, verified account or successful transaction.

## External design-system research

Official guidance was reviewed to turn the named benchmark inventory into concrete, testable rules:

- **Apple Human Interface Guidelines:** purpose, user agency, privacy, familiarity, adaptability, clear hierarchy and the rule that delight must not obstruct the task. Layout guidance emphasizes adapting to text size, orientation, screen width and safe areas.
  - https://developer.apple.com/design/human-interface-guidelines/design-principles
  - https://developer.apple.com/design/human-interface-guidelines/layout
- **Google Material / Material 3 Expressive:** motion should communicate state and guide attention; expressive color, shape, size and containment must support the task rather than compete with it. Responsive navigation should adapt to available space instead of merely shrinking.
  - https://design.google/library/expressive-material-design-google-research
  - https://design.google/library/introducing-resizer
- **Microsoft Fluent 2:** shared tokens, standardized corners, platform-aware adaptation, clear information hierarchy and accessibility as a foundation.
  - https://fluent2.microsoft.design/accessibility
  - https://fluent2.microsoft.design/get-started/whatisnew
- **Atlassian Design System and GitHub Primer:** foundations, reusable components, workflow patterns, content rules and design tokens should be shared across product surfaces.
  - https://atlassian.design/resources/
  - https://primer.github.io/design/
- **Shopify Polaris:** use familiar page templates and reusable compositions for home, index, detail, settings, media cards, metrics, resource lists and setup guides; do not invent a different interaction for each module.
  - https://shopify.dev/docs/apps/design
  - https://shopify.dev/docs/api/app-home/latest/patterns
- **Stripe Payment Element:** keep payment fields localized and provider-managed while applying a controlled appearance layer for typography, color, borders and shadows.
  - https://docs.stripe.com/payments/mobile/embedded
- **Xbox Accessibility Guidelines:** cover text display, contrast, captions, input, UI navigation and focus, context, destructive actions, motion settings and photosensitivity in game-like surfaces.
  - https://learn.microsoft.com/en-us/xbox/accessibility/guidelines
- **Unreal Engine UMG:** use anchors, responsive scaling and safe zones for game-world UI rather than assuming a single fixed viewport.
  - https://dev.epicgames.com/documentation/unreal-engine/visual-design-and-layout-tools-for-umg-in-unreal-engine

The V6 implementation applies these principles to the project's own visual language: one token system, archetype-based variation, page-owned workflows, meaningful motion, responsive grid utilities, clear focus states and reduced-motion support. This is a principles-based benchmark, not a pixel-for-pixel reproduction of any third-party product.

## Visual source governance

The governed Visual Atlas records the source families and visual translation rules. Commercial/stock references remain mood references only; they are not copied, embedded, traced or served. Production art remains original or owner-supplied and appropriately licensed.

The recurring visual grammar is:

- Omega signet and concentric rings for identity, progression and portal framing.
- Obsidian/void environments with restrained gold authority cues.
- Cyan for intelligence, live/system state and evidence paths.
- Violet for cinematic and gaming worlds; green for positive community/finance state; crimson only for risk.
- Original cinematic compositions: environment scale, scene framing, lighting and atmosphere.
- Material and artifact styling is cosmetic only. Artwork never proves credentials, KYC, token ownership, balances, payment, achievements or rank.

## 252-document inventory and explicit exceptions

The repository-wide survey sees 252 HTML documents. The production estate is 242 canonical root routes plus 10 nested documents:

- **8 nested redirect stubs** — `frontend/platform/platform.html`, `root/audit-report.html`, `root/dashboard/dashboard.html`, `root/portal.html`, and four `web/templates/*.html` stubs. Each loads `/bg.js` and redirects to `/dashboard.html`; the dashboard receives the canonical Command archetype.
- **2 movie render-source templates** — `scripts/movies/episode.html` and `scripts/movies/scene.html`. They are deterministic frame-render sources, not production pages; the static build excludes `scripts/`. Their finished media pages use the Media archetype.

The V6 contract tests account for all 252 documents, verify the 242 canonical route map, verify the eight redirect stubs, and verify the two source-only templates remain outside the public artifact. No independent page skin or duplicate archetype registry is created for redirect aliases or render templates.

### Remaining source-survey remediation backlog

The 19 November source survey also records 183 documents without a source-level `h1`, 151 with fixed-width declarations, 120 with dense letter-spacing declarations and 20 with dense-text declarations. These are **not declared fixed by V6**. Some are intentional component dimensions or dynamically rendered titles; the counts are source-level flags, not proof that every page is visually broken.

The next remediation wave must inspect the actual page and viewport before changing it:

1. Promote or add one correct, visible page-level heading without duplicating an existing visual title.
2. Replace only genuinely viewport-breaking fixed widths with responsive constraints; preserve intentional artwork/card dimensions.
3. Normalize dense tracking and small labels against readable typography tokens.
4. Review the highest-impact 404, profile, dashboard, media, vault, family and gaming surfaces first, then close the remaining flagged pages with page-level evidence.

V6 does not use blanket CSS overrides or fabricate content to make the survey counts appear green.

## Runtime implementation

- `omega-page-world.js` publishes the page's exact archetype, visual intent, motion profile, depth, density and district as root data attributes.
- `omega-platform-experience-v6.css` reads those attributes and applies accent, ring, hero, media-frame, density and responsive styling.
- `bg.js` loads V6 after V5 as the final shared art-direction layer.
- Existing `omega-sculpture.js` remains the sole WebGL signet renderer. V6 adds no new renderer, external font, external library, polling loop or network dependency.
- Existing page-local layouts and business logic remain owners of their geometry and behavior.
- The responsive `.omega-grid-9` and `.omega-stage-9` utilities preserve the 9-column / 9-stage design language without forcing every existing page into a single grid.
- Existing command, identity, knowledge, gaming, media, commerce, creation, community, governance, finance and intelligence components receive archetype-aware borders, progress bars, scene frames and card depth.
- Card tilt is hover-only and subtle; touch layouts and reduced-motion preferences suppress the 3D transform.

## Release acceptance

A V6 release is accepted only when:

1. All 242 page contracts map to one of the 12 declared archetypes.
2. No page falls silently into a generic command skin; the explicit fallback is the system archetype.
3. The V6 stylesheet loads after V5 through the global runtime.
4. All archetypes have their own accent variables.
5. Reduced-motion, forced-colors and mobile rules remain explicit.
6. No content is hidden and no interaction is disabled by the new layer.
7. Existing page-contract, visual-atlas, accessibility, runtime and production smoke checks remain green.
8. Production verification reports the exact deployed commit on both domains before the release is called live.

## First visual QA set

Review at desktop, tablet and 375px mobile widths:

- `index.html`, `dashboard.html`, `world.html`
- `profile.html`, `passport.html`, `credentials.html`
- `intelligence.html`, `agents.html`, `evidence.html`
- `academy.html`, `gaming.html`, `leaderboard.html`
- `media.html`, `cinema.html`, `studio-library.html`
- `marketplace.html`, `checkout.html`, `finance.html`
- `social.html`, `family.html`, `governance.html`, `approvals.html`
- `investment.html`, `control-plane.html`, `maintenance.html`

These are a representative acceptance set, not a substitute for the 242-page contract sweep.
