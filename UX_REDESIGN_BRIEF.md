# UX_REDESIGN_BRIEF.md — friend-feedback → action plan

Prompted by informal feedback from early testers ("friends") after using the live platform:
more user-friendly overall, text too small, navigation friction, clunky upload/download/
publish flows, platform feels inactive/thin on content, "build less, source proven patterns
more," and an overall ask to feel expansive/immersive ("a civilization, a planet, a galaxy")
rather than a small project. This document translates that into checkable criteria and a
phased plan, grounded in this repo's actual state — not generic advice. Companion reading:
`REPOSITORY_AUDIT.md`, `GAP_ANALYSIS.md`, `CAPABILITY_INVENTORY.md`, `FEATURE_IDEAS.md`,
`CLAUDE.md` §8 (known debt).

## 0. Priority zero — a lot of this feedback is already fixed, just not live

Before any new design work: **this branch (`claude/sydomega-redesign-brief-f731xr`) is 35
commits ahead of `main` and 0 behind, with no open pull request.** None of it is deployed.
Among those 35 commits are fixes that land directly on this feedback:

- `bg.js` never loaded `nav.js` — the sidebar was rendering empty on ~160 of 169 pages. This
  alone plausibly explains a meaningful share of "hard to navigate." Fixed, not live.
- 22 shared UI text sizes were as small as 7px; bumped to a 10–16px floor platform-wide, plus
  a 48-page sweep of page-local duplicate rules that shadowed the shared fix. Fixed, not live.
- Stored XSS in the owner's own admin panels (`approvals.html`, `profile.html`, `beacon.html`).
  Fixed, not live.
- New-member onboarding silently failed to save `sign`/`element`/`god`/`agent`/`token` (wrong
  column names) — every new member has seen a false "Welcome" toast while nothing saved. Fixed,
  not live.
- The zodiac→god→agent mapping (the platform's entire "12 agents" identity system) was wrong
  for 9 of 12 signs in the live onboarding table, including a duplicate god and a god outside
  the actual 12-agent roster. Fixed, not live.
- The four systems most responsible for a platform *feeling* alive — the activity ticker, the
  notification badge, member presence ("online now"), and leaderboard snapshots — were all
  silently no-oping on wrong column names. All fixed at the code level; the SQL side needs the
  Supabase MCP connector (currently unauthorized in this session — see §7) or manual application
  via the Supabase SQL editor.
- The Stripe webhook and the task-completion RPC (habits, publishing, axis/authority progress)
  were both silently failing on every call — no payment ever activated a subscription, no task
  completion ever recorded. Fixed; SQL applied and verified live per `CLAUDE.md` §8.

**Recommendation:** open a PR for this branch, get it reviewed and merged to `main`, confirm
Vercel deploys `main` to production, and apply the still-pending `supabase/*_fix.sql` files.
This is the highest-leverage, lowest-risk action available — it's already-reasoned-through work
sitting idle, not a new project.

## 1. Feedback → recommendation

| Feedback | Concrete recommendation |
|---|---|
| "More user-friendly overall" | Every primary action gives visible feedback (loading → success/error, never silent — this repo has a documented history of silent-failure writes, §8); every destructive action confirms; every empty state explains *why* it's empty and what to do next, not just "no data." |
| "Text too small" | Partially fixed already (§0). Finish the residual instances (still ~1×7px, 1×7.5px, 2×8px, 4×9px in `bg.js`'s inline one-off styles — trial timer, genesis screen, toast — not yet swept), then move to a real `--fs-*` type-scale token set so this can't silently regress page-by-page again. |
| "Navigation friction" | A navigation/IA audit already exists in this branch (`REPOSITORY_AUDIT.md` §9): 64 of 169 pages (38%) have zero sidebar entry, 3 pages have no discovery path anywhere (one, `maintenance.html`, isn't even in search), and the mobile drawer covers only 9 of 15 desktop sections. A remediation is drafted and ready to implement — see §6. |
| "Upload/download/publish smoother" | Two distinct surfaces, both worth addressing: (a) *member-facing* — file/document uploads (KYC, avatar), the finance-pages backup export/import already built (`omega-local-backup.js`), unstyled raw `<input>`/`<button>` elements now get a shared glass skin but haven't been audited for actual drag-and-drop or progress-state UX; (b) *owner-facing* — shipping a new feature already has a 4-stage pipeline (`web-trend-scout → feature-architect → autonomous-coder → subscriber-portal`, `.claude/skills/README.md`) that's under-used relative to how much of this feedback assumes ad hoc, from-scratch building. |
| "Feels inactive, needs real content/data" | See §0 — the mechanisms that make a platform feel alive (presence, ticker, notifications, leaderboard) are already built and mostly already fixed; they're just not deployed or populated. This is a deployment/seeding gap, not a missing-feature gap. |
| "Source standard features from trusted sources instead of building from scratch" | Use the existing `web-trend-scout` skill for this exactly — it researches real external platforms/APIs and writes a grounded, evidence-cited proposal before any code is written. See §4 for the categories worth scouting first. |
| "Elevate visual design — emblematic, cinematic, animated" | The brand system (`bg.js`'s design tokens + the Ω-GVP glass layer + `omega-cinematic*.js` / `omega-motion.js` / `omega-emblems.js`, all loaded platform-wide) is more capable than what's currently visible. Motion is now plentiful (`@keyframes` in 52 files) but has no *signature* motif; `omega-cinematic-engine.js` and `omega-page-emblem.js` exist but aren't in the `bg.js` loader. See §3, §5, and `FEATURE_IDEAS.md` #19. |
| "Feel like a civilization/planet/galaxy, not a small project" | See §5 — the six things that actually separate "small project" from "living world" already have real infrastructure in this schema; most of the gap is activation and content depth, not architecture. |

## 2. Checkable criteria

**User-friendly**
- Every `.from()/.rpc()` write in the client checks `.error` and surfaces it — not silently
  swallowed (this repo has fixed a long list of exactly this bug class; keep it from
  regressing — grep for `.catch(function(){})`/unchecked awaits before shipping new writes).
- Every async action shows a loading state, then success or a specific error — never a toast
  that always says success regardless of outcome (the onboarding bug in §0 was exactly this).
- Primary actions reachable in ≤2 clicks from `dashboard.html`.

**Readable**
- No shared or page-local text below 10px; inputs at 16px+ (avoids iOS auto-zoom, already
  fixed for the shared `.inp` class — verify no page-local override regresses it).
- Body copy line length ~60–80 characters; WCAG AA contrast (4.5:1) against `--void`/`--void2`.
- Letter-spacing on the mono/caps UI-chrome tier stays ≤2px so it doesn't fight the larger
  glyph sizes just added.

**Navigable**
- 100% of non-exempt pages present in `nav.js`'s sidebar (currently 62%).
- 0 pages with zero discovery path (currently 1: `maintenance.html`).
- Mobile drawer section parity with desktop (currently 9/15).
- Every page reachable from Ctrl+K search (`omega-search.js`).

**Alive**
- Presence, ticker, and notification badge reflect real state within one 30-second sync cycle,
  visible without a manual refresh.
- A returning member sees something changed since their last visit (new notification, ticker
  item, leaderboard delta, dispatch).
- The 12-agent/zodiac personalization actually reaches the member (onboarding fix in §0 is the
  precondition for this).

## 3. Visual direction: emblematic, cinematic, animated — without the generic-AI look

The palette is already distinctive and worth keeping exactly as-is (`--void:#0A0A0F`,
`--void2:#020206`, `--gold:#C9A84C`, `--solar:#E2C86D`, `--cyan:#00E5FF`, `--crim:#8B0000`,
`--purple:#9B6BF0`) — the brief here is *use what exists more*, not replace it:

- **Motion is now plentiful but unsignatured.** This bullet originally read "7 keyframes and
  3 `rotate()` calls across ~250 pages"; a current grep finds `@keyframes` in 52 files / 117
  distinct names, so the system is no longer untapped — it is *uncoordinated*. The ask is now
  one **signature motion motif** — a slow orbital rotation (a `spin-slow`-class ring/glyph) —
  used deliberately in 2–3 high-visit
  places (a member's zodiac/element emblem on `profile.html` and `dashboard.html`, the
  `cosmos.html` hero) rather than scattering animation across every card. Restraint here is
  what reads as cinematic instead of busy.
- **Surface the sigil-generation system that already exists.** `omega-sigil-gen.js` can
  generate a per-member emblem but isn't prominently used anywhere central. A rotating,
  glowing per-member sigil on the dashboard/profile header is a concrete, buildable version of
  "emblematic."
- **The glass shimmer + glow-edge layer (Ω-GVP, `CLAUDE.md` §4.1) is hover-only by design** —
  correct for not fighting per-instance borders, but it means the "alive" feeling only shows up
  on interaction. Consider one ambient, ever-present motion cue per page (the noise overlay is
  already one; a slow parallax or a subtle particle drift on hero sections would be another) so
  the page doesn't read as static until touched.
- **Avoid**: generic AI-page tropes this project doesn't need — it already has a real,
  specific palette and typographic identity (Cinzel Decorative / Rajdhani / Courier Prime, once
  the font-loading bug in §0 ships), so resist defaulting to a purple-gradient hero or a
  centered-everything layout when extending it.

## 4. "Source from trusted internet sources" — what to scout first

Categories of standard platform features/content this kind of member platform typically has,
worth running through `web-trend-scout` before building any from scratch (in priority order):

1. **Onboarding/tour** — a short guided first-run beyond the zodiac-selection step (once that
   step actually saves, per §0).
2. **Notification center UX patterns** — the table and badge exist; the *triggers* (which
   server events create a notification row) are still undecided (`CLAUDE.md` §8) — this is
   exactly a "look at how established platforms structure this" question.
3. **Empty-state content** — copy + simple illustration patterns for the many pages that will
   read as sparse until real content accumulates.
4. **Search UX** — `omega-search.js`/Ctrl+K already exists; compare against established
   command-palette patterns for keyboard nav, recent-searches, and result grouping.
5. **Accessibility statement / help / FAQ** — standard, low-effort, currently absent.
6. Validate anything sourced against this repo's real constraints before proposing it: no
   build step, Supabase + RLS only, must go through the existing
   `feature-architect → autonomous-coder → subscriber-portal` pipeline so nothing ships live
   without a human decision (`CLAUDE.md` §9).

## 5. The civilization/planet/galaxy ambition

What actually separates a "small project" feeling from a "living world" feeling, concretely:

1. **Persistence & memory** — your history is visibly still there (streaks, task history,
   authority progression). *Already schema'd*; was broken by the `complete_task` bug in §0.
2. **Visible other people** — even asynchronous social presence (who's online, recent activity,
   rankings). *Already schema'd* (`member_presence`, `activity_feed`, `leaderboard_snapshots`);
   all three were silently broken, all three are fixed pending deploy.
3. **Systemic interdependence** — an action in one place visibly moves something elsewhere
   (complete a task → axis moves → authority moves → leaderboard rank moves). *This loop
   already exists end-to-end in the schema*; it was non-functional until the fixes in §0.
4. **Internally consistent lore** — the 12-agent/zodiac/element/god system. *Already built*, and
   this session found and fixed real internal contradictions (wrong gods, a duplicate, a
   non-canonical name, Virgo's element and token colliding with the owner's).
5. **Scale cues** — visible counts, rankings, a sense of population. *Already built*
   (`leaderboard.html`, `rankings` edge function) but was writing zero rows (§0).
6. **Change over time** — something is different each time you return (notifications,
   dispatches, ticker). *Already built*, same deploy gap as above.

**The reframe:** this platform is not architecturally a "small project" pretending to be a
galaxy — it already has the schema and the modules for all six pillars. The gap your friends
are feeling is mostly an **activation and content-depth gap**, not a missing-systems gap. That
changes the plan from "design a galaxy" to "turn the galaxy on, then populate it" —
incrementally, phase by phase (§6), not as one large rebuild.

## 6. Prioritized action plan

**Phase 0 — this week, near-zero risk, mostly already done**
- Open a PR for this branch; get it reviewed and merged to `main`; confirm the Vercel
  production deploy picks it up.
- Apply the pending `supabase/*_fix.sql` files (notifications, member_presence, leaderboard
  columns, RLS scoping fix, advertisements insert policy) — needs Supabase access (§7).
- Implement the already-drafted `nav.js` remediation (`REPOSITORY_AUDIT.md` §9): fold the 61
  dashboard/intelligence-only pages into the sidebar, add the 3 orphaned pages (especially
  `maintenance.html`, currently undiscoverable anywhere), sync the mobile drawer to all 15
  sections.

**Phase 1 — 1–2 weeks**
- Finish the residual small-text instances in `bg.js`'s inline one-off styles.
- Decide and implement the server-side triggers that populate `notifications` (which events
  fire one) — currently the single biggest remaining reason the platform will still feel quiet
  even after Phase 0 ships.
- End-to-end QA of the onboarding flow for real (not just the schema-mock verification already
  done) to confirm the identity-system fixes hold up.

**Phase 2 — 2–4 weeks**
- Ship the signature motion/sigil treatment from §3 on `profile.html`, `dashboard.html`,
  `cosmos.html` — scoped and grounded as `FEATURE_IDEAS.md` #19 (needs a Linux/harness-capable
  session for the mandatory browser verification, and explicit go-ahead for the `bg.js` touch).
- Audit and polish upload/download flows: styled file inputs with real progress/success states,
  extend the backup export/import pattern already proven on the 7 finance pages to other
  data-heavy pages if useful.
- Run `web-trend-scout` against the categories in §4 and turn the strongest 1–2 proposals into
  blueprints via `feature-architect`.

**Phase 3 — ongoing**
- Broaden i18n coverage beyond the sidebar (currently only the 15 section labels).
- Close the remaining mobile-specific gaps.
- Add real content depth across the 12-agent/house system so each feels populated, not just
  correctly labeled.

## 7. Open decisions / blockers

- **Supabase MCP connector is unauthorized in this session** — needed to verify live schema
  state and apply pending `*_fix.sql` files. The user needs to authorize it via `claude mcp` or
  `/mcp` in an interactive session, or apply the fix files manually via the Supabase SQL editor.
- **No PR exists yet for this 35-commit branch.** Recommend opening one now so the Phase 0 work
  can be reviewed and merged rather than continuing to accumulate unreleased fixes.
- **Confirm interpretation of "upload/download/deploy smoother"** — this document addressed
  both the member-facing (file uploads/exports) and owner-facing (feature-shipping pipeline)
  readings; confirm which mattered more to the feedback if the emphasis should shift.
- **Go-ahead needed to implement the `nav.js` sidebar fix** — it's fully specified and
  low-risk, but touches a file loaded on every page; flagged for explicit approval per this
  repo's own convention (`CLAUDE.md` §9) rather than started unprompted.
