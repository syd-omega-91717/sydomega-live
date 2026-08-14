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
The `#l-platform` owner-admin KPI row (`adm-pending`/`adm-accounts`/`adm-threats`) now also has a
"SESSION COST (EST.)" card (`FEATURE_IDEAS.md` #12) showing `OmegaFinOps.summary().total_usd` —
`omega-finops.js` turned out to already be actively running platform-wide (intercepting Supabase
queries, estimating AI/DB/edge cost, writing real rows to `public.platform_metrics` on
`beforeunload` when a session's estimate exceeds $0.001), just with no UI anywhere. Population is
inside the same `if(pr.is_owner)` block as the other admin counts (matches
`platform_metrics`'s own RLS, which already restricts `SELECT` to the owner) and the card's own
tooltip states explicitly that this is an estimate, not real billing, matching the module's own
header comment. ✅ Verified in headless Chromium with both an owner and non-owner fake profile:
non-owner leaves the card at its `--` placeholder (gating confirmed, not just present), owner gets
a real `$X.XXXX` value from the live module. No new table/RPC/`platform_settings` flag — reads an
already-running module's in-memory summary, no new query.
`#l-overview`'s main KPI row also now has an "ONLINE NOW" card reading `public.member_presence`
(`is_online=true`, 90s recency window) — see `CLAUDE.md` §8 for the real bug this depended on:
`omega-presence.js`'s writes to this table had two column-name mismatches
(`session_started`/`dedication_today` vs. the live schema's `session_started_at`/no such column)
and had never once succeeded. Fixed the writer, then added this reader since the table's own RLS
already grants every member `SELECT` (by design — "Inspired by Discord's presence system," the
module's own header comment). ✅ Verified with a schema-validating mock that emulates PostgREST's
real unknown-column rejection (not just "didn't throw") — confirmed the pre-fix code fails this
check with exactly the two bad keys, the post-fix code passes with all six keys matching.
`omega-onboard.js` (the "SELECT YOUR ZODIAC SIGN" first-visit overlay, platform-wide, appears on
any page a new member's `omega:populated` fires on) had the same bug class one level worse — see
`CLAUDE.md` §8: three of its four `profiles.update()` field names (`olympian`/`agent_name`/
`token_affinity`) didn't match the real columns (`god`/`agent`/`token`), so the update always
failed and the overlay re-appeared on every visit, while the confirm handler showed a false
success toast regardless (no `.error` check — now added). Fixed both the field names and the
missing error check. ✅ Verified by actually clicking through the onboarding UI in headless
Chromium against the schema-validating mock: pre-fix code produces the four wrong keys, post-fix
code produces the five correct ones with the right values (cross-checked against `ZODIAC_MAP`).

### IDENTITY — member profile, verification
`profile.html`, `passport.html`, `kyc.html`, `settings.html` ✅ (background-color sync
silent-failure fixed this session), `character.html`, `agents.html` (12-agent roster
display), `factions.html`, `pantheons.html`, `houses.html`.
`profile.html` now also mounts the platform-wide-loaded-but-previously-unused
`omega-sigil-gen.js` (`FEATURE_IDEAS.md` #10 — a `#ph-sigil` div, `window.OmegaSigil.mount()`
called directly rather than via the shared `omega:user-loaded` event; see the "Flagged, not
proposed" note in `FEATURE_IDEAS.md` for why that event's platform-wide activation was
deliberately avoided) and a "PASSPORT PDF" download button wired to `omega-passport.js`
(`FEATURE_IDEAS.md` #11 — no JS needed, the module's click listener + `window.__omegaProfile`
were already there). In the process, found (not fixed, since it's in the dormant auto-mount path
these two features intentionally bypass) that `omega-sigil-gen.js`'s own handler reads
`profile.zodiac_sign`, a column that doesn't exist on `public.profiles` (the real column is
`element`) — the direct-call implementation here uses the correct column. ✅ Rendered end-to-end
in headless Chromium: sigil mounts as a real SVG (screenshotted), passport button click completes
a full mocked-jsPDF generation with no errors. No new table/RPC/`platform_settings` flag.
`profile.html`'s AUTHORITY INDEX label also now carries a `data-canon="mechanic"` badge
(`FEATURE_IDEAS.md` #13, same `omega-canon-badge.js` system as `agents.html`'s `lore` badge
under COSMOS above) — unambiguous since the index is a real computed value that gates real
standing. ✅ Verified in headless Chromium alongside the `agents.html` check.

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
`agents.html`'s "SOVEREIGN AGENTS" heading now carries a `data-canon="lore"` label
(`FEATURE_IDEAS.md` #13), rendered by `omega-canon-badge.js` — a platform-wide-loaded,
already-auto-mounting honesty-label system (`[data-canon]` scan on `DOMContentLoaded` + two
retries, zero wiring needed) that had zero `data-canon=` usage anywhere before this. Classification
cites `CLAUDE.md` §6 directly ("UI/UX personality system... not a technical multi-agent runtime")
rather than a fresh content judgment call. ✅ Verified in headless Chromium: badge mounts with the
correct label/title text, no errors.
`chronicle.html`'s full 7-era timeline (`FEATURE_IDEAS.md` #14) now carries the same
`data-canon` labels, one per era, after an actual read-through of all 445 lines rather than a
guess: Eras I–V (`void-age` through `emergence-age`) → `lore`; Era VI "APEX AGE · NOW" and the
"Beyond Apex" future grid → `fiction` (both describe unachieved aspirational milestones despite
the "NOW" framing). Era V's token-minting event card was flagged, not fixed — same present-tense
overclaim category already given "PLANNED · NOT YET ACTIVE" treatment on
`sovereign-covenant.html`/`system_manifest.json`, left for a dedicated follow-up rather than
force-fit into a `lore`/`fiction` badge that doesn't actually address the overclaim. ✅ Verified
in headless Chromium with a dedicated test (`verify_chronicle_canon.js`): all 7 spans mount into
real `.ocb` badges with the exact expected kind/label, zero page errors.

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
invented — see `REPOSITORY_AUDIT.md` §1 methodology note).

**Backend-call audit status:** every `omega-*.js` module containing a `.from()`/`.rpc()` call
has now been checked column-by-column against the live schema across this session and the one
before it (grep for `.from\('[a-z_]+'\)\|.rpc\('[a-z_]+'` to re-enumerate the list if new
modules are added). 5 real bugs found and fixed this way: `omega-presence.js`, `omega-onboard.js`
(prior round), `omega-workflow.js`, `omega-export.js`, `omega-realtime.js` (this round) — all
✅-marked below with a `CLAUDE.md` §8 pointer. Every other backend-calling module
(`omega-capability`, `omega-experiment`, `omega-intelligence`, `omega-memory`, `omega-user`,
`omega-telemetry`, `omega-sovereign-os`, `omega-chrono`, `omega-tier-gate`, `omega-shell`,
`omega-share`, `omega-policy`, `omega-metrics`, `omega-membership`, `omega-hero-wire`,
`omega-gate`, `omega-finops`, `omega-feedback`, `omega-emblems`, `omega-backdrop`,
`omega-genesis`, plus `omega-matrix`/`omega-progress`/`omega-recommend`/`omega-chart`/
`omega-live`/`omega-notify` from the prior round) was checked and found to already match the
live schema exactly — not re-verified below, individually, to avoid this file ballooning, but
confirmed via the same grep-every-column-against-`supabase/*.sql` method as the ones that were
broken. Modules with zero `.from()`/`.rpc()` calls (pure UI/visual/utility — particles,
geometry, tooltip, confetti, keyboard shortcuts, etc.) are out of scope for this bug class
entirely, since they have no schema to drift against.

**Auth / access / identity:** `omega-gate.js` (element/matrix-position locking),
`omega-tier-gate.js` (companion to `omega-gate`), `omega-guardian.js` (Zero Trust continuous
auth), `omega-user.js` (loads current user's profile), `omega-onboard.js` (first-time
zodiac/element selection), `omega-appearance.js` (member view personalization),
`omega-protect.js` (anti-DevTools/copy protection).

**AI / copilot:** `omega-copilot.js` (context-aware assistant, every page), `omega-ai.js`
(GraphRAG-inspired), `omega-intelligence.js` (autonomous AI layer), `omega-memory.js`
(persistent queryable AI memory), `omega-recommend.js` (interest-signal recommendations).

**Notifications / realtime / presence:** `omega-notify.js` (badge/toast/panel — populate path
fixed this session), `omega-realtime.js` ✅ (live Supabase subscriptions — the bottom-bar live
ticker's `activity_feed.member_name` select referenced a nonexistent column and has always
stayed on its placeholder text, fixed this session, `CLAUDE.md` §8), `omega-presence.js`
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
`omega-workers.js` (background consumer fleet), `omega-workflow.js` ✅ (multi-step
orchestration — a `sovereign_events.created_at` column bug in its `report_generate` workflow
fixed this session, `CLAUDE.md` §8; the whole 8-workflow engine has no external caller anywhere
in the repo today, flagged not fixed — `FEATURE_IDEAS.md`), `omega-policy.js` (business-rule
externalization), `omega-experiment.js` (A/B testing, feature flags).

**Compliance / privacy / ops:** `omega-export.js` ✅ (GDPR Art. 20 — 4 of its 6 exported
datasets referenced nonexistent columns and have always exported empty, fixed this session,
`CLAUDE.md` §8), `omega-a11y.js` (WCAG AA),
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

## 3. Edge Functions (`supabase/functions/`, Deno/TypeScript, 7 total — all read in full
and audited this session; see `CLAUDE.md` §8 for the 2 findings)

| Function | Purpose |
|---|---|
| `checkout` | Stripe checkout session creation — real payment integration. ✅ Audited, clean. A fully orphaned duplicate `checkout/stripe-webhook/index.ts` (nested inside this function's own directory, not a valid deploy target, zero references anywhere else in the repo) was found and removed this session. |
| `stripe-webhook` | Stripe webhook handler — real payment integration. ✅ Audited, clean — `apply_subscription` call matches the live 5-arg signature exactly. |
| `concierge` | Calls the Anthropic API server-side, backs `omega-copilot.js`/`chatbot.html`. ✅ Audited, clean — `ai_memory` insert and `recall_ai_context` RPC call both match the live schema. |
| `notify-access` | Access/approval notification dispatch. ✅ Audited, clean — no DB calls, pure webhook-payload → email. |
| `intel-feed` | News/intelligence feed backend (real usage confirmed: `news.html`). ✅ Audited, clean — no DB calls, pure external API fetch (Hacker News). |
| `rankings` | Leaderboard ranking computation (real usage confirmed: `leaderboard.html` tier 1). ✅ Audited, clean — profile select matches live schema. |
| `snapshot-leaderboard` | Daily cron job populating `leaderboard_snapshots` (`leaderboard.html` tier-2 fallback; also the table `omega-chart.js`'s Authority History chart reads, per the fix in a prior session). ⚠️✅ Its upsert payload referenced 4 columns (`display_name`, `sign`, `tier`, `is_owner`) that didn't exist on the table — the cron has silently written 0 rows on every run since deployment, with `{ok:true}` masking the failure. Fixed this session by adding the missing columns (`supabase/omega_leaderboard_snapshots_columns_fix.sql`), verified against a real scratch PostgreSQL 16 instance. Not yet applied live. |

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

- **104 tables**, all RLS-enabled (CI-enforced), 403 policies (398 + 5 from this session's RLS
  scoping fix), across 114 loose SQL files (+ 92 files in the ordered `supabase/migrations/`
  copy).
- **RLS policy-correctness audit (this session):** every `FOR INSERT`/`UPDATE`/`ALL` policy
  checked against whether its table has a user-identity column that should scope it — CI's RLS
  check only confirms presence, not correctness. 5 gaps found and fixed
  (`supabase/omega_rls_scoping_fix.sql`, `CLAUDE.md` §8): `capability_kpi_log`/`policy_eval_log`
  (owner-only-read tables with wide-open unscoped INSERT), `threat_events`/`telemetry_events`
  (INSERT allowed impersonating another member's `user_id`), and the `storage.objects` "uploads"
  bucket read policy (no owner-bypass, silently blocking a KYC-review feature that was never
  built). Verified against a real scratch PostgreSQL 16 instance with 7 functional tests
  simulating member/owner sessions (impersonation blocked, legitimate self-scoped writes still
  work, owner can now read KYC uploads) — not just read by eye. Not yet applied live.
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
