# Capability Inventory — sydomega-live

**Date:** 2026-08-10. **Companion documents:** [`REPOSITORY_AUDIT.md`](./REPOSITORY_AUDIT.md)
(technical/security state), [`GAP_ANALYSIS.md`](./GAP_ANALYSIS.md) (what's missing).

This is an inventory of what actually exists in the repository today, organized by the site's
own navigation taxonomy (`nav.js`'s 14 sections) rather than by aspiration. **Status markers**
are only applied where a specific finding backs them up (cited); an unmarked page has not been
individually verified in this pass and should be read as "present and reachable," not
"confirmed working."

- ✅ **Live** — confirmed reading/writing real Supabase tables or RPCs (cited)
- 💾 **Client-only** — confirmed persisting to `localStorage` only, no server sync (cited)
- ⚠️ **Known gap** — confirmed broken or incomplete (cited, cross-ref `GAP_ANALYSIS.md`)
- *(no marker)* — present and reachable from navigation; backend status not individually
  audited in this pass

## 1. Page inventory, by navigation domain (14 sections, `nav.js`)

### COMMAND — entry point, search, alerts
`dashboard.html`, `beacon.html`, `search.html`, `notifications.html` ⚠️ (populate path fixed
this session — see `GAP_ANALYSIS.md` §2.1, but not yet applied live), `chatbot.html` (AI
concierge — see §3 Edge Functions), `matrix.html`, `points.html`, `command.html`.
`dashboard.html`'s `#l-personal` tab now also renders a 90-day contribution heatmap
(`renderContributionHeatmap()`, added this session per `FEATURE_IDEAS.md` #7) reading
`public.task_completions` scoped to the signed-in member's own rows (`eq('user_id', s.user.id)`)
— read-only, no new table/RPC/`platform_settings` flag, no `nav.js` change (page already
reachable). ✅ Rendered end-to-end in headless Chromium against the actual committed
`dashboard.html` (no modified copy) — this environment cannot reach either the real Supabase
project or the `esm.sh` CDN the page imports `@supabase/supabase-js` from (outbound proxy
returns 403 on both), so the harness intercepts that one import and answers with a small local
stand-in implementing just the client surface bg.js/dashboard.html's own unmodified auth-guard
and query code already call — no real project, credentials, or member data involved. Confirmed:
the approval guard lifts, the PERSONAL tab's own `setTab('personal')` renders the panel, all 90
day-cells render with the correct 4-stop intensity legend and correct per-day bucketing against
fabricated `task_completions` rows (verified against exact expected date keys, not just "didn't
crash"), and the section is visually positioned exactly where the blueprint specified (between
the Life Wheel/Quick Actions block and the Personal Tools grid) — screenshotted for confirmation.
Test harness is scratch tooling, not committed to the repo. Still open: verification against the
*real* production Supabase project/schema and a real authenticated login, which this environment
cannot do.

### IDENTITY — member profile, verification
`profile.html`, `passport.html`, `kyc.html`, `settings.html` ✅ (background-color sync
silent-failure fixed this session), `character.html`, `agents.html` (12-agent roster
display), `factions.html`, `pantheons.html`, `houses.html`.

### ASCEND — progression, learning
`honors.html` (ascension map + record), `matrix.html` ("The 729"), `academy.html`,
`gaming.html`, `trophies.html`, `exam.html`, `contributions.html`, `evolution.html`.
`trophies.html` and `honors.html` now also have a "SHARE CARD" button
(`tr-share-card-btn`/`hn-share-card-btn`, added this session per `FEATURE_IDEAS.md` #8) wired to
the same platform-wide `omega-share-card.js` engine `profile.html` already used — previously
loaded on every page but only ever invoked from `profile.html`. `honors.html`'s own profile query
was widened from a 4-field select (`axis_a,axis_b,axis_c,is_owner`) to `select('*')` so the card
has the full field set (`display_name`, `element`, `sign`, `god`, `agent`, `trophies_earned`,
etc.) the engine actually reads — `trophies.html` already fetched `select('*')` for its own
header, so no change needed there. ✅ Rendered end-to-end in headless Chromium (same harness
approach as the contribution heatmap above — the blocked `esm.sh` import intercepted with a
local stand-in, everything else real/unmodified): both buttons render, both click handlers fire
`OmegaShareCard.showModal(pr)` with the full profile object, no page errors. No new
table/RPC/`platform_settings` flag, no `nav.js` change (both pages already reachable).
`trophies.html` also now dispatches the real `omega:achievement` window event
(`FEATURE_IDEAS.md` #9) when a member's earned trophy/medal/certificate count increases since
their last visit (tracked via a new `omega_trophy_celebrate_seen_v1` localStorage key, member's
own device only — not a new table) — `omega-confetti.js` has listened for this event
platform-wide since it was written, but nothing ever dispatched it before this. First-ever visit
only seeds the baseline silently (no confetti wall for pre-existing unlocks); the platform owner
is excluded (every item always shows "earned" for them, so there's no meaningful "new" moment).
✅ Verified end-to-end in headless Chromium across two simulated visits: visit 1 (fresh device)
fires zero events and correctly seeds state; visit 2 (one new trophy) fires exactly one real
`omega:achievement` event with the correct name looked up from the page's own `TROPHY_DATA` array
— confirmed by listening for the actual dispatched event, not by stubbing the confetti engine.
No new table/RPC/`platform_settings` flag.

### COSMOS — zodiac/element brand system
`cosmos.html`, `horoscope.html`, `agents.html`, `elements.html`, `pantheons.html`,
`houses.html`, `matrix.html` (triads), `kings.html`, `graph.html` ⚠️✅ (linked from
`dashboard.html`, not in `nav.js`'s `PS` map, same as `queue.html` — D3 constellation graph;
the member-node tooltip's attempted self-escaping of `display_name` was a no-op due to reading
the wrong DOM property back, a real stored-XSS reachable by any approved member against any
other viewer; fixed this session, see `GAP_ANALYSIS.md` §4.9).

### UNIVERSE / MEDIA — content, social feed
`cinema.html`, `universe.html`, `media.html`, `hall.html`, `city.html`, `series.html`,
`trailers.html`, `feed.html` (stored-XSS-hardened this session — see
`REPOSITORY_AUDIT.md` §3), `social.html` ✅ (writes `public.social_connections`, error-checked
this session — `GAP_ANALYSIS.md` §2.3), `news.html`.

### VAULT / INVEST — finance, holdings, payments
`vault.html` ⚠️✅ (NFT grid queries `public.user_assets` — table now exists as of a prior
session but is not yet populated by anything, see `GAP_ANALYSIS.md` §2.2; separately, its
Audit Log panel's `access_audit_log()` RPC call read the response in the wrong shape and had
shown fabricated demo entries as if real for every caller — fixed this session, see
`GAP_ANALYSIS.md` §4.8), `treasury.html` 💾,
`wallet.html` 💾, `blockchain.html` ✅ (`my_points_balance()` RPC response-shape bug fixed this
session — points balance always showed "Ω NaN", see `GAP_ANALYSIS.md` §2),
`payments.html`/`subscriptions.html` ✅ (real Stripe
integration, `supabase/functions/checkout` + `stripe-webhook`), `marketplace.html`,
`portfolio.html` ⚠️ (same `user_assets` gap as `vault.html`), `income.html` ✅ (persists
server-side per `CLAUDE.md` §8), `ledger.html` ✅ (persists server-side), `investment.html` 💾,
`revenue.html` 💾, `expenses.html` 💾, `budget.html` 💾, `wealth.html` 💾, `sigil.html`,
`sovereign-covenant.html` (token-economy page; dormant-token disclaimers already live, gated
on `platform_settings.tokens_enabled = false`), `advertising.html` (error-checked ad
submission per earlier session fix).

The 💾-marked pages are a deliberate, documented split: `CLAUDE.md` §8 records the decision
(made this session) to keep them client-side-only rather than migrate to server schema, given
the sensitivity of financial data and this repo's own history of real RLS bugs. All 7 now load
`omega-local-backup.js` (new this session — dependency-free, no network calls, export/import
of the page's own `localStorage` keys to/from a JSON file) with an "EXPORT BACKUP"/"IMPORT
BACKUP" control, mitigating the main downside (data loss on cleared storage or device switch)
without taking on server-side storage of sensitive data.

### ORDER — family, governance-flavored social structure
`family.html` (silent-failure writes fixed this session — `REPOSITORY_AUDIT.md` §6.3),
`bloodline.html`, `heritage.html`, `hall.html`, `sovereigns.html` ⚠️✅ (public leaderboard —
stored XSS on `profiles.sign`, visible to every approved member, fixed this session — the
widest-blast-radius XSS found so far), `factions.html`,
`city.html`, `approvals.html` ⚠️✅ (owner's member-approval console — stored-XSS fixed a prior
session; its five RPCs now populate `public.notifications`, not yet applied live; separately,
its "Audit Log" tab's `access_audit_log()` call misread the RPC's response shape and always
showed "NO AUDIT ENTRIES" even when real rows existed — fixed this session, see
`GAP_ANALYSIS.md` §4.8; also this session — its error-monitor panel had the identical
`error_summary()` response-shape bug plus unescaped output reachable by unauthenticated
callers, and its contracts/reservations review queues rendered `media_reservations.title`
(member-writable) raw via `.innerHTML` unlike every other field on the page — all fixed, see
`GAP_ANALYSIS.md` §1/§2), `interface-omni.html`.

### SERVICES — consulting, commissions, wellness, events
`services.html`, `consultancy.html` ⚠️ (booking form was completely non-functional — table
missing 3 columns the form sends; fixed in code this session, not yet applied live),
`contracts.html`, `publishing.html`, `studio.html`,
`marketing.html` ✅ (owner campaign-approval silent-failure write fixed this session),
`news.html`, `social.html`, `events.html` (RSVP write-result checked per
earlier session fix), `travel.html` ✅ (progress-credit ordering bug fixed this session),
`health.html`.

### INTEL / ARENA — AI, research, automation, governance
`research.html`, `prediction.html`, `intelligence.html`, `automation.html` (workflow-toggle
write-result checked per earlier fix), `compliance.html`, `charter.html`, `governance.html`,
`observatory.html`, `enterprise.html` ⚠️ (pricing display for $199/$999/$4,999 tiers with
**zero Stripe/checkout wiring** — confirmed by direct inspection; see `GAP_ANALYSIS.md` §3.2),
`roadmap.html`, `lab.html`, `design-system.html`, `ecosystem.html`, `knowledge.html`,
`sovereign-ai.html`, `privacy.html`, `queue.html` ⚠️✅ (linked from `dashboard.html`, not in
`nav.js`'s `PS` map — the "PLATFORM DISPATCH LOG" panel queried nonexistent columns and
lacked escaping on the member-writable ones it should have used; both fixed this session,
see `GAP_ANALYSIS.md` §4.7).

### ACHIEVE / ARCHIVE — gamification records
`achievements.html`, `leaderboard.html`, `gates.html`, `grades.html`, `levels.html`,
`phases.html`, `ascension.html`, `kings.html`, `triads.html`, `grid.html`, `credentials.html`,
`membership.html`, `analytics.html` ✅ (chart now points at the correct
`leaderboard_snapshots` table as of this session — was querying a nonexistent
`authority_snapshots` table).

## 2. Backend module inventory (93 `omega-*.js` files on disk, 88 injected by `bg.js`)

Grouped by function, one line each, extracted from each file's own header comment (not
invented — see `REPOSITORY_AUDIT.md` §1 methodology note):

**Auth / access / identity:** `omega-gate.js` (element/matrix-position locking),
`omega-tier-gate.js` (companion to `omega-gate`), `omega-guardian.js` (Zero Trust continuous
auth), `omega-user.js` (loads current user's profile), `omega-onboard.js` (first-time
zodiac/element selection), `omega-appearance.js` (member view personalization),
`omega-protect.js` (anti-DevTools/copy protection).

**AI / copilot:** `omega-copilot.js` (context-aware assistant, every page), `omega-ai.js`
(GraphRAG-inspired), `omega-intelligence.js` (autonomous AI layer), `omega-memory.js`
(persistent queryable AI memory), `omega-recommend.js` (interest-signal recommendations).

**Notifications / realtime / presence:** `omega-notify.js` (badge/toast/panel — populate path
fixed this session), `omega-realtime.js` (live Supabase subscriptions), `omega-presence.js`
(real-time member presence), `omega-event-bus.js` (platform-wide event architecture).

**Charts / visualization / 3D:** `omega-chart.js` (chart rendering — table-name bug fixed this
session), `omega-lattice.js` / `omega-lattice-3d.js` (sovereign lattice grid), `omega-9d.js`
(9-pass visual engine), `omega-particles.js` (tsParticles integration), `omega-ring.js`
(cinematic SVG), `omega-geometry.js`, `omega-genesis.js` (per-element atmosphere),
`omega-element-motif.js` (9 animated canvas motifs), `omega-backdrop.js`, `omega-ambient.js`
(Web Audio procedural soundscapes).

**Progress / gamification:** `omega-progress.js`, `omega-streak-freeze.js` (grace-day
mechanic), `omega-sdt.js` (self-determination-theory-based design), `omega-page-emblem.js`,
`omega-emblem-panel.js`, `omega-emblems.js` (12 zodiac emblems), `omega-sigil-gen.js`
(procedural SVG sigil generation).

**Platform infrastructure:** `omega-sovereign-os.js` ("central nervous system"),
`omega-shell.js` (async region shell), `omega-state.js`, `omega-ui.js` (UI unification),
`omega-components.js`, `omega-capability.js`, `omega-actions.js`, `omega-live.js` ✅
(dormant stored-XSS in its activity-feed ticker fixed this session),
`omega-workers.js` (background consumer fleet), `omega-workflow.js` (multi-step
orchestration), `omega-policy.js` (business-rule externalization), `omega-experiment.js`
(A/B testing, feature flags).

**Compliance / privacy / ops:** `omega-export.js` (GDPR Art. 20), `omega-a11y.js` (WCAG AA),
`omega-legal.js` (copyright badge), `omega-finops.js` (cost measurement), `omega-metrics.js`
(Core Web Vitals), `omega-telemetry.js`, `omega-threat.js`, `omega-oss.js` (OSS integration
scouting), `omega-pml.js` (page-maturity checklist).

**Media / UX utilities:** `omega-music.js`, `omega-voice.js` (voice commands + TTS),
`omega-search.js`, `omega-tooltip.js` (Tippy-based), `omega-tour.js`, `omega-keyboard.js`
(GitHub/VS Code/Figma-style shortcuts), `omega-menu.js`, `omega-controls.js` (language
selector), `omega-deemoji.js`, `omega-confetti.js`, `omega-share.js` / `omega-share-card.js`,
`omega-qr.js`, `omega-passport.js` (jsPDF export), `omega-feedback.js`.

**Canon / content system:** `omega-canon.js` / `omega-canon-badge.js` (lore/content-source
labeling), `omega-sign-codex.js`, `omega-content.js`, `omega-animated.js`, `omega-cinematic.js`.

**PWA / registration:** `omega-pwa.js`, `omega-sw-register.js`.

**Trial / chrono:** `omega-chrono.js`, `omega-chronometer.js`, `omega-matrix.js`.

**Misc:** `omega-membership.js`, `omega-hero-wire.js`, `omega-demo-video.js`,
`omega-realm.js`.

## 3. Edge Functions (`supabase/functions/`, Deno/TypeScript, 7 total)

| Function | Purpose |
|---|---|
| `checkout` | Stripe checkout session creation — real payment integration |
| `stripe-webhook` | Stripe webhook handler — real payment integration |
| `concierge` | Calls the Anthropic API server-side, backs `omega-copilot.js`/`chatbot.html` |
| `notify-access` | Access/approval notification dispatch |
| `intel-feed` | News/intelligence feed backend |
| `rankings` | Leaderboard ranking computation |
| `snapshot-leaderboard` | Populates `leaderboard_snapshots` (the table `omega-chart.js`'s
| | Authority History chart reads, per the fix in this session) |

## 4. The 12-agent brand/persona system (`omega-agents.json`)

Per `CLAUDE.md` §6: **this is an information-architecture/UX personality system, not a
technical multi-agent runtime.** Twelve personas, each mapped to a zodiac sign, element,
Greek god, and domain:

| Agent | Sign | Domain |
|---|---|---|
| Sentinel | Aries | Security Guardian |
| Merchant | Taurus | Commerce Steward |
| Scout | Gemini | Discovery Agent |
| Warden | Cancer | Guardian of the Inner Circle |
| Sovereign | Leo | Master Control |
| Auditor | Virgo | Validator of Truth |
| Proxy | Libra | Diplomat & Executor |
| Oracle | Scorpio | Seer of What Comes |
| Beacon | Sagittarius | Herald of the Threshold |
| Analyst | Capricorn | Intelligence Engine |
| Tutor | Aquarius | Illuminator of Craft |
| Historian | Pisces | Keeper of Memory |

## 5. Backend capability summary

- **104 tables**, all RLS-enabled (CI-enforced), 398 policies, across 111 loose SQL files
  (+ 92 files in the ordered `supabase/migrations/` copy).
- **Feature flags** (`public.platform_settings`): `tokens_enabled` (false — Ω token economy
  dormant), `payments_enabled` (flag exists; live Stripe integration code exists
  independently in `supabase/functions/checkout`/`stripe-webhook`).
- **Auth:** Supabase Auth + `public.is_platform_owner()` for owner-elevated access;
  9.1717-minute sovereign trial mechanic (`trial_length()`, `approve_member`,
  `grant_permanent_access`, `reject_member`, `revoke_member`, `extend_trial`) is real,
  implemented, and — as of a prior session — notifies the affected member on every one of those
  five events (`GRANT`, not yet applied live). **This session found and fixed a critical gap:**
  `supabase/trial_access.sql`'s copies of `grant_permanent_access`/`grant_trial_access`/
  `expire_trial` had no caller check at all — a full self-approval / cross-member data-wipe
  bypass — while 7 other copies of the same functions elsewhere in the SQL bag were already
  guarded. Fixed and validated against a live local PostgreSQL 16 instance; see
  `GAP_ANALYSIS.md` §0. Separately, `is_platform_owner()` itself — the function this whole
  bullet's "owner-elevated access" model rests on — has two genuinely different
  implementations (checks `platform_owners` table vs. `profiles.is_owner` column) across 11
  files; not yet resolved which is live, see `GAP_ANALYSIS.md` §3.1.
