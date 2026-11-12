# Platform simplification plan (2026-11-05)

Goal: fewer places to go, less text, easier to surf. This is a plan with measurements, not a change.
Nothing here deletes a page. Approve a target in section 3 and it is done in reversible steps.

## 1. What is measured

| | now |
|---|---|
| HTML pages | 236 (224 in the nav, 12 not) |
| Sidebar | 15 sections, 249 entries: 107 visible, 142 folded into search |
| Pages offered under two sections | 6 (`income`, `payments`, `ledger`, `subscriptions` under VAULT and INVEST; `life`; `horoscope`) |
| Visible words | 78,504 across all pages, median page 280 |
| Exact on-page repeats left | about 971 words sitewide (after #1164) |

Two findings that change the plan:

- **Pages are modules, not duplicates.** `omega-single-page-workspaces.js` already opens 15 hub pages as workspaces
  and loads their sub-pages (`character`, `kyc`, `wallet`, `heritage` ...) as embedded modules. Deleting a standalone
  page breaks the hub that embeds it. "Fewer pages" means inlining content, not removing files.
- **The overlap is between hubs.** The same pages are offered by VAULT and INVEST, and the identity documents
  (`character`, `identity`, `passport`, `kyc`, `credentials`, `heritage`, `bloodline`, `membership`) appear under
  PROFILE, ARCHIVE and ORDER.

## 2. What usage data says, and does not

Vercel Analytics, Oct 5 to 19 only (production moved to Cloudflare on 2026-10-18; nothing is recorded since):
about 500 page views, 3 to 9 visitors a day. Most-opened: `dashboard` (45 visitors), `account`, `gateway` (13 each),
`cosmos`, `gaming` (9), `profile`, `vault`, `honors`, `matrix`, `media`, `academy`. About 170 of the 236 pages had no
view at all.

That is enough to say which pages members open first. It is **not** enough to delete a page: two weeks, a handful of
people, and the owner's own testing mixed in (one visitor made 149 views of `/pending`). The evidence class in
`EVIDENCE_MATRIX.md` is also the wrong lever: it marks `guide`, `world`, `missions` and `leaderboard` STATIC
(they persist nothing), and they are core navigation.

**Gap:** there is no usage data now. Turning on Cloudflare Web Analytics for the `sydomega` Pages project fixes it
and costs nothing in the code.

## 3. Existing navigation baseline (implemented 2026-11-05)

The first navigation pass grouped the 15 canonical sections into 8 doors. This was navigation-only; every page and URL remained in place.

| New section | Merges | Why |
|---|---|---|
| COMMAND | command | unchanged: the way in |
| ME | identity, archive, life | one place for who you are, your documents and your daily life |
| GROW | ascend, achieve, arena | learning, levels, games |
| WORLD | cosmos, media | the lore and the creative universe |
| ORDER | order | family, hall, city |
| MONEY | vault, invest, services | one money section instead of three |
| INTEL | intel | research and graph tools |
| GOVERN | govern | platform and admin, owner-facing |

Visible entries per section drop from about 7 to about 6, and the 6 double-listings disappear.

## 4. Steps, each its own PR and reversible

1. **Nav only. DONE 2026-11-05** (`docs/fixes/2026-11-05-nav-eight-doors.md`): the dock, tooltips and phone drawer group the
   15 sections into 8 doors; the sections themselves, the hubs and every page are unchanged. Labels keep the existing
   names because they are translated per key.
2. **Hub trims.** Same trick as #1164 on the heaviest hubs: state a status once, keep real per-item facts.
3. **Retire for real**, only with Cloudflare analytics and at least 30 days of data: pages with no views, no inbound
   link and nothing embedding them become redirects, then are removed.

## 5. Remaining decisions and constraints

- The 8-door baseline is superseded as the member-facing taxonomy by the owner-approved seven-destination model in §6. The 15 canonical workspaces remain intact.
- Should the platform navigator page (a concept catalogue, see #1165) stay?
- Enable Cloudflare Web Analytics (a dashboard switch): without it step 3 cannot happen honestly.


## 6. Owner-approved direction — seven member-facing destinations (2026-11-12)

**Decision:** simplify the first navigation layer to seven plain-language destinations. Keep the 15 canonical workspaces, every page, every existing URL, route alias, data source, and permission boundary. This is a navigation projection, not a platform rewrite or page-deletion exercise.

| Destination | Existing workspace sections | Member-facing job |
|---|---|---|
| **HOME** | COMMAND + LIFE | See the dashboard, activity, notifications, missions, personal routines and next actions |
| **DISCOVER** | INTEL + SERVICES | Find intelligence, AI tools, research, news, knowledge, consultancy and services |
| **UNIVERSE** | ASCEND + COSMOS + ACHIEVE + MEDIA | Explore learning, games, worlds, characters, media and progression |
| **FINANCE** | VAULT + INVEST | Work with wallet, assets, blockchain, portfolio, treasury, investments and payments |
| **COMMUNITY** | ORDER + selected social, contact, feed and heritage routes | Reach family, people, social activity, communication and heritage |
| **IDENTITY** | IDENTITY + ARCHIVE | Manage profile, security, credentials, passport, membership and identity records |
| **COMMAND** | GOVERN + ARENA + selected system/evidence routes | Access governance, approvals, agent operations, audit/evidence and owner controls |

### Navigation implementation contract

1. The seven destination labels and order above are the only primary navigation groups.
2. The 15 canonical workspaces remain available beneath those groups and in the searchable full-page launcher.
3. Curate no more than seven quick links per destination in the desktop dock and mobile drawer. The mobile drawer must use the same curated list; it must not expand into a 100-plus-link list.
4. Remove the redundant “MORE SECTIONS” toggle when all seven destinations are visible. Keep one clearly named **ALL PAGES** action that opens the searchable full-page launcher.
5. Add page-level group overrides for routes whose current internal section does not match the member's mental model (for example social/contact/feed/heritage routes under COMMUNITY, world routes under UNIVERSE, and system evidence/agent operations under COMMAND). Overrides affect navigation placement only; they must not silently change the canonical `PS` / `OmegaAxis` page identity or authorization.
6. Owner-only entries remain owner-only. Do not widen a route's visibility or server authorization to make the navigation appear complete. If the entire COMMAND destination cannot be shown safely to every role, filter its entries using existing owner state and fail closed.
7. Keep all deep links, bookmarks, inbound links, route aliases, and page files. No route deletion, redirects, or backend changes belong in this navigation change.

### Required verification before merge

- Exactly seven primary destination groups appear on desktop and mobile, in the approved order.
- All 15 canonical workspaces map to one destination; every existing navigation entry remains reachable exactly once through the destination groups or full launcher.
- All page-level overrides resolve to existing routes and do not create duplicate placements.
- All seven labels exist in the English source and every supported locale.
- The active destination is correct for representative pages in every workspace.
- Owner-only links remain hidden for non-owners; route-level authorization is unchanged.
- No inert “MORE” controls, dead links, duplicate labels, or unreachable pages.
- Keyboard navigation, focus visibility, screen-reader labels, and 390px / 768px / 1280px layouts are verified.
- Run the blocking contract suite and inspect a Cloudflare Pages preview before merge. A passing static contract is not a substitute for rendered browser review.

### Page and visual quality standard

Every member-facing page must have a verified job, not just a title or decorative card wall:

- One visible H1 and a one-sentence explanation of what the page lets the member do.
- One primary action, with secondary actions kept subordinate.
- A real source for each displayed value, with the platform's truthful state label: LIVE, CALCULATED, SIMULATED, USER-CREATED, LORE, or UNAVAILABLE.
- Explicit loading, empty, error, and permission-denied states.
- A clear next step or contextual link to the next relevant page.
- Responsive layout, readable type, accessible controls and meaningful keyboard focus.
- Real visual assets or data visualizations where they add information; no invented metrics, balances, achievements, or activity.

Use the current dark Omega palette and Ω identity. Prefer a strong page title, one purposeful hero visual, a small number of useful first-view cards, and progressive disclosure for secondary detail. Do not add 3D, fixed overlays, animation, or decorative canvases unless they improve the task.

### First hub redesign order

1. **Dashboard:** first-view hierarchy and action focus; the static survey flags 161 card-like nodes and 29 section headers.
2. **Media:** catalogue navigation and filtering; the static survey flags 190 card-like nodes and 17 section headers. Do not merge the two competing film/series canons until the owner resolves the source conflict.
3. **Profile:** reduce the 85-card / 42-section presentation into coherent identity, security, credentials and membership areas.
4. **Academy and Gaming:** verify the rendered data state; the static source survey cannot tell whether their content appears after JavaScript loads.
5. **Vault:** clarify financial data provenance, loading/empty states and the separation between wallet, portfolio, investment and payments.

These counts are static-source triage signals, not rendered viewport measurements. A zero static-word count does not prove a page is empty; browser verification is mandatory before content is rewritten.

### Consolidation and retirement rules

- Merge only when two pages have the same audience, job, data, actions and permission boundary. Preserve old URLs as compatible entry points.
- The latest consolidation report's candidate list contains stale contradictions (including a meditation route already described as merged, and conflicting descriptions of the Movies page). Reconcile those records before acting on them.
- Do not retire pages using the old Oct 5–19 Vercel Analytics sample. The repository records that production moved to Cloudflare and current usage data has been absent since the cutover. Enable Cloudflare Web Analytics and collect at least 30 days before retirement decisions.
- Do not pursue broad lazy-loading or module removal as the first simplification step. The existing complexity analysis records prior regressions from premature deferral and a relatively small estimated safe saving. Measure actual runtime dependencies and user-facing performance first.

### Source and production guardrails

- The 999-point source blueprint is not a verified 999-item implementation backlog; its source register records 399 numbered entries, 391 distinct identifiers and 8 duplicate identifiers. Classification is not implementation.
- The alternative React/Express/microservices scaffolds in older prompts do not override the current static/Supabase architecture.
- The current production cutover record identifies Cloudflare Pages as production and Vercel promotion as postponed. Supabase remains the application data/auth backend. Do not change providers as part of UX simplification.
- Any credential-like values found in source documents must be rotated if active and removed from durable project documentation. Never paste them into code, prompts or reports.
