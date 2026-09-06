# Feature Ideas — sydomega-live

**Status: proposal only.** Nothing in this file is built, scheduled, or approved. Per
`CLAUDE.md` §9, no monetizable or legally-sensitive feature ships "live" without an explicit
gating decision first — every idea below that touches money, tokens, or new data collection is
flagged accordingly. This file exists so ideas aren't re-derived from scratch each session; pick
one, discuss scope, then it becomes a real task with its own plan.

Each idea below is grounded in something already true about this repo (verified directly in
this session, not assumed from the sibling `-_V18_SYDOMEGA91717` repo) rather than invented from
nothing — see the "Grounded in" line on each.

## 1. `member_events` read view (COMMAND / ORDER) — SHIPPED

**Grounded in:** `events.html:199` inserts into `public.member_events` (`sb.from('member_events')
.insert(payload)`, confirmed in this repo), but no page anywhere selected from it — same
write-only gap documented in the sibling repo's gap analysis and in `GAP_ANALYSIS.md`'s
silent-failure-write sweep. The table, RLS policy, and writer already existed; only the display
side was missing.

**Shipped:** the smallest possible scope — a read-only "RECENT MEMBER SUBMISSIONS" feed added
directly below the existing submission form on `events.html`'s SUBMIT tab (its own tab section,
not a new page or a `dashboard.html` addition, since the writer already lives here). One
`.from('member_events').select('title,event_date,format,event_type,description,created_at')
.order('created_at',{ascending:false}).limit(20)` call, rendered via a new `esc()` helper
matching the existing convention (`contracts.html`/`dashboard.html`/`approvals.html`/
`profile.html`) since `title`/`description`/`event_type`/`format` are member-writable text.
Refreshes after a successful submission and on page load. No new schema, no new RLS, no `nav.js`
change. Verified with a Node harness exercising the render function against real-shaped data
(including an XSS payload in `title`/`description`), an empty result, and a Supabase `.error`
result — escaping, empty-state copy, and error-state copy all confirmed correct;
`scripts/audit.py` reconfirmed 0 critical / 6 pre-existing unrelated warnings after the change.

## 2. Notification-triggering coverage audit → "what should notify" decision

**Grounded in:** `GAP_ANALYSIS.md` §2 — the notification-trigger SQL wires a handful of
access-lifecycle RPCs to insert a `notifications` row, but nothing else in the codebase inserts
one, even though `omega-notify.js` (the badge/panel UI) is loaded platform-wide and ready.

**Idea (needs a product decision before any code):** once the pending SQL is applied and
verified live, decide which additional server-side events should insert a `notifications` row.
Not proposing specific events here deliberately — that's a product call for a single-owner
platform with a small membership, not an engineering one.

## 3. `omega-guardian.js` gate() — either wire it or retire the badge

**Grounded in:** verified directly in this repo — `omega-guardian.js` exports a `gate` function
(`gate:gate` in its returned API, line 147) but a repo-wide grep for `OmegaGuardian.gate(` across
every `.html`/`.js` file returns zero call sites. The topbar risk-score badge implies active
protection that isn't happening, same finding as the sibling repo.

**Idea (needs an explicit decision, not a code fix):** pick a short list of genuinely
higher-stakes actions already in the codebase — e.g. `approvals.html`'s
`grant_permanent_access`/`revoke_member` calls — and wrap them in `OmegaGuardian.gate()` at an
agreed threshold. Which actions, what threshold, what the denial UX looks like is an
architecture decision, not something to guess at and ship. Removing the badge instead (if it's
staying unwired) is equally valid and is the owner's call.

## 4. Finance-page persistence: pick a lane

**Grounded in:** `CLAUDE.md` §8 — the same `localStorage`-only finance pages
(`wealth.html`/`wallet.html`/`treasury.html`/`revenue.html`/`investment.html`/`expenses.html`/
`budget.html`) exist here, while `income.html`/`ledger.html`/`portfolio.html` already persist
server-side.

**Idea (product decision first — not proposing to build this unprompted):** if the decision is
"sync across devices," extend the existing `user_assets`/`ledger`-style tables (owner-scoped
RLS, same `is_platform_owner()` pattern) rather than inventing new schema. Listed here only so
the "how" is pre-answered once the "whether" is decided.

## 5. `enterprise.html` pricing → actual Stripe wiring (money — needs legal/business sign-off)

**Grounded in:** verified directly in this repo — a grep for `stripe`/`checkout`/`subscribe` in
`enterprise.html` returns zero matches, confirming the same "pricing display, no purchase flow"
gap as the sibling repo, while `supabase/functions/checkout`/`stripe-webhook` already handle the
existing subscription flow.

**Idea:** if/when this becomes real, it's an extension of the existing Stripe integration (new
`price_id`s, reuse `checkout`/`stripe-webhook`, gate via `platform_settings`) rather than new
payment infrastructure. **Explicitly not proposing to build this** — `CLAUDE.md` requires
gating + sign-off before code for exactly this case.

## 6. Consolidate divergent `SECURITY DEFINER` function forks (schema hygiene, not a feature)

**Grounded in:** `GAP_ANALYSIS.md` §3.1 — this repo's own SQL bag has the same class of risk:
`CREATE OR REPLACE FUNCTION` silently overwrites on re-apply, and the flat `supabase/*.sql`
directory has no enforced application order.

**Idea:** the highest-leverage "improve current" item available once Supabase MCP access
exists — run a `pg_proc` verification query against the live database to find which side of any
divergent function definitions actually won, delete the stale copies, and extend
`scripts/audit.py` to flag divergent (not just duplicate) function definitions going forward.

## 7. Cross-device contribution heatmap for `task_completions` (COMMAND / ASCEND) — SHIPPED

**Shipped** (commit `af48efb`, "Add 90-day contribution heatmap to dashboard.html") — the
blueprint below was fully implemented as designed: `dashboard.html`'s `#l-personal` panel now has
a `.heatmap-wrap`/`#contribution-heatmap` section, `renderContributionHeatmap(rows)` buckets
`task_completions.completed_at` by day with the 4-stop gold intensity scale, and the fetch/render
call sits in the existing top-level IIFE next to the two aggregate counters, exactly as planned.
Confirmed directly in code (`dashboard.html:210-212,644-667,804`) — this entry was left
unmarked in a prior session; flagged and corrected here per `CLAUDE.md` §9's rule against letting
these tracking docs drift stale.

**Grounded in:** `dashboard.html:751,753` only ever shows two aggregate counts from
`public.task_completions` (`.select('id',{count:'exact',head:true})` for "today" and "this
week") — no historical/trend view exists anywhere. Separately, `habits.html` already has a
90-day GitHub-style heatmap (`renderHeatmap()`, ~line 467, `.heatmap-legend`/`.heatmap-container`
CSS already defined) — but it is 100% `localStorage`-only: `getHabits()`/`getLogs()` read/write
`localStorage.getItem(HABITS_KEY/LOGS_KEY)` and the file contains zero `sb.from`/`sb.rpc` calls
(confirmed by grep). It never reflects the platform's real, server-side, cross-device activity
ledger, and resets on a cleared browser or a new device. That real ledger is
`public.task_completions`, RLS'd to `user_id=auth.uid()` (`supabase/matrix_engine.sql:47-51`,
`chunk_05_migrations.sql:189-196`) — and this session's own fix
(`supabase/omega_complete_task_dedup_fix.sql`, `CLAUDE.md` §8) confirmed it is now actually
persisting correctly, with a working dedup guard, across all 5 real call sites
(`omega-matrix.js`, `omega-workflow.js` ×2, `omega-progress.js`, `publishing.html`). Before that
fix, the table silently never committed anything for anyone; now that it does, there is still no
page anywhere that shows a member their own history of it beyond the two dashboard counters.

**Idea:** a read-only 90-day contribution heatmap — reusing the exact visual pattern
`habits.html` already has (same cell grid, same 4-stop gold intensity legend) — but sourced from
`public.task_completions` instead of `localStorage`. One query:
`sb.from('task_completions').select('completed_at,axis,task_name').eq('user_id',
uid).gte('completed_at', ninetyDaysAgoISO)`, bucketed by day client-side, cell intensity by
completions-per-day. Read-only, no writes, no new RLS surface — it reads the same rows the
existing dashboard counters already read, just with a trend view instead of two numbers.

**User benefit:** every approved member sees their own real activity trend (academy, gaming,
publishing, workflow/dedication tasks — whatever they've actually earned) persist across
devices, instead of two same-page counters that reset conceptually with no history. No
`membership_tier` gating needed — same access level as the existing dashboard counts (a member's
own rows only).

**Nav placement:** `command` (next to `dashboard.html`, where the two counts already live) is
the natural fit — same data, just a trend view. `ascend`/`contributions` (`nav.js`'s `PS` map
already routes `contributions` there) is the secondary candidate if the owner would rather it
live on `contributions.html` instead.

**Data needs:** none. Reads the existing, already-RLS'd `public.task_completions` table only. No
new table, no new RPC, no `platform_settings` flag — this isn't monetizable or legally
sensitive, it's a read-only visualization of data a member already generated.

**Source inspiration:** the GitHub-style contribution-graph pattern and its specific rationale in
habit/streak products — a heatmap shows *trend* ("how have I been doing lately") rather than a
streak counter's all-or-nothing *status* ("how am I doing today"), so one missed day reads as one
pale cell instead of a reset-to-zero shock:
- [GitHub-style habit tracker: why it works — init.Habits](https://inithabits.com/blog/github-style-habit-tracker)
- [Habit Tracker Widget: 7 Best Home Screen Apps (2026) — HabitBox Blog](https://habitbox.app/blog/habit-tracker-widget)
- [habit-tracker · GitHub Topics](https://github.com/topics/habit-tracker)

### Blueprint (feature-architect)

**Re-verified before designing:** `dashboard.html:751,753` still show only the two aggregate
counters; `habits.html`'s heatmap is still `localStorage`-only; `task_completions` RLS confirmed
directly this pass — `supabase/matrix_engine.sql:47-51` (`CREATE POLICY "members see own tasks"
ON public.task_completions FOR SELECT USING (user_id=auth.uid())`) and
`chunk_05_migrations.sql:189-196` both grant members read access to their own rows only, no
`is_platform_owner()` elevation needed for this read.

**Page plan — extend `dashboard.html`, no new page, no `nav.js` change.** It's already reachable
and already has the right tab: the `#l-personal` layer-panel ("PERSONAL OS · SOVEREIGN
SELF-SYSTEM", `dashboard.html:167`) is exactly where a member's own historical activity belongs,
next to the existing `personal-kpis` row and Life Wheel — not `#l-overview`, whose `k-tasks` KPI
is a platform-wide "today" count, not a personal one. Insert a new section between the two-col
Life-Wheel/Quick-Actions block (closes `dashboard.html:201`) and the "PERSONAL TOOL GRID"
`sechead` (`dashboard.html:204`):

```html
<div class="sechead" style="margin-top:16px">SOVEREIGN ACTIVITY &middot; 90-DAY CONTRIBUTION HEATMAP</div>
<div class="heatmap-wrap"><div id="contribution-heatmap"></div></div>
```

**CSS plan — page-local, matching the existing per-page convention, not a bg.js addition.**
`habits.html`, `missions.html`, and `ops.html` each already define their *own* page-local
`.heatmap*` CSS independently (confirmed by grep — no shared heatmap component exists in bg.js's
stylesheet today). Adding a fourth page-local copy to `dashboard.html`'s existing inline
`<style>` block matches that established pattern exactly; promoting it into bg.js's shared block
now would be a bigger, unrelated change (redesigning 3 other pages' already-working heatmaps to
match) that's out of scope for this feature. Copy `habits.html`'s exact cell size (9px), 4-stop
gold intensity scale, and `.heatmap-legend`/`.heatmap-legend-dot` class shapes verbatim for
visual consistency across the platform.

**Script plan — inline in `dashboard.html`, no new `omega-*.js` module.** The logic is
~25 lines, single-page, and CLAUDE.md §3 already notes this repo's default is inline `<script>`
per page (no shared component system) — a module is only warranted for cross-page/deferred-load
logic, which this isn't. Add, inside the existing top-level `async` IIFE, immediately after the
existing "Live counts" `task_completions` try/catch (`dashboard.html:~751-756`, same IIFE that
already has `s.user.id` and `pr` in scope):

```js
try{
  var ninetyAgo=new Date(Date.now()-90*864e5).toISOString();
  var hm=await sb.from('task_completions').select('completed_at').eq('user_id',s.user.id).gte('completed_at',ninetyAgo);
  renderContributionHeatmap(hm.data||[]);
}catch(e){}
```

...and a new top-level function `renderContributionHeatmap(rows)`: bucket `rows` by
`completed_at.slice(0,10)` into a day&rarr;count map, build 90 cells oldest&rarr;newest (reusing
`habits.html`'s exact 4-stop intensity thresholds), append the legend, inject into
`#contribution-heatmap`. `completed_at` is a server-set timestamp, not member-writable text, so
no `esc()`/escaping concern — nothing here renders member-controlled string content.

**Data plan:** none. No new table, RPC, or `platform_settings` flag — read-only, scoped
`eq('user_id', s.user.id)`, against the already-RLS'd table. Not monetizable, not
legally-sensitive; no gating decision needed.

**Verification plan:**
- `python3 scripts/audit.py` — must show 0 new CRITICAL (no new page/module/table, so none
  expected).
- No new standalone `.js` file exists to run `node --check` against — the new code is an inline
  `<script>` addition to an existing page, which is outside the syntax check's file selection
  (root `.js` files only) and CI check 1's scope. As a substitute, extract the new script body to
  a scratch `.js` file and run `node --check` on that copy before/after insertion as a manual
  syntax sanity check.
- No new `src=`/`href=` added — broken-asset check is unaffected.
- Full interactive verification (real login, click PERSONAL tab, confirm the heatmap renders
  against live data) requires an authenticated Supabase session this environment doesn't have —
  state that limitation plainly rather than claim it was clicked through, per `CLAUDE.md` §9's
  evidence-cited-claims rule.

## 8. Expose the already-built share-card engine on achievement pages (ASCEND / ACHIEVE) — SHIPPED

**Shipped** (commit `0e63010`, "Expose share-card engine on trophies.html and honors.html") —
both target pages now have the "&#8679; SHARE CARD" button calling `OmegaShareCard.showModal()`
with the profile object each page already fetches, exactly as proposed (`trophies.html:51,159`,
`honors.html:599,866`). Confirmed directly in code; flagged and corrected here for the same
reason as #7 above.

**Grounded in:** `omega-share-card.js` (loaded platform-wide by `bg.js:1524-1525`, every page,
via the standard `data-omega-sharecard` guard) is a fully built, working canvas card generator —
`OmegaShareCard.render()`/`.download()`/`.share()`/`.createCard()`/`.showModal(profile)`, a
1200×630 PNG with authority index, axis values, tier, and gate, downloadable and Web-Share-API
shareable (`omega-share-card.js:1-19`). A repo-wide grep confirms it is wired to exactly **one**
of ~250 pages: `profile.html:430,2349` (`ph-share-card-btn` &rarr;
`window.OmegaShareCard.showModal(pr)`). `trophies.html:152` already fetches the exact object
shape the engine needs (`sb.from('profiles').select('*').eq('id',uid).maybeSingle()`) for its own
header — same for `honors.html:859` (`select('axis_a,axis_b,axis_c,is_owner')`, the specific
subset `OmegaShareCard`'s `calcAuth()` actually reads). Neither page uses the engine that's
already loaded on them and already has the data in scope.

**Idea:** add the same "&#8679; SHARE CARD" button `profile.html` already has to `trophies.html`
and `honors.html`, calling `OmegaShareCard.showModal(pr)` with the profile object each page
already fetches — no new fetch, no new engine code, copy-paste of an existing, working, one-page
pattern onto two more. `achievements.html` is a plausible third candidate but wasn't confirmed
grounded this pass (no `sb.from('profiles')` call found there in a first grep — would need
checking what profile data, if any, that page already has in scope before including it in a
blueprint).

**User benefit:** every approved member gets a "share your progress" moment on the pages where
that progress is actually being celebrated (trophy vault, honors/ascension record) instead of
only on their static profile page — the natural place someone would want to post a card is right
after seeing a new trophy or gate, not on a separate settings-adjacent page. No `membership_tier`
gating needed — matches `profile.html`'s existing button, which isn't tier-gated either.

**Nav placement:** no new nav entry — both target pages already exist and are reachable
(`ascend`/`achieve` per `nav.js`'s existing `PS` map for `trophies`/`honors`).

**Data needs:** none. No new table, RPC, or `platform_settings` flag — reuses an existing
platform-wide-loaded module and each page's own existing profile fetch.

**Source inspiration:** shareable achievement/milestone cards are a well-established 2026
gamification pattern specifically *because* the moment of achievement (not a static profile) is
when sharing motivation is highest — loss-aversion/streak research shows achievement visibility
and social sharing compound with milestone mechanics rather than substituting for them:
- [Streaks & Milestones: Habit-Forming Gamification (2026) — AppStorys](https://appstorys.com/blog-Streaks-Milestones-Habit-Gamification)
- [Apps That Use Streaks: 10 Real Examples Analysed (2026) — Trophy.so](https://trophy.so/blog/streaks-feature-gamification-examples)
- [Streaks and Milestones for Gamification in Mobile Apps — Plotline](https://www.plotline.so/blog/streaks-for-gamification-in-mobile-apps)

## 9. Wire the already-built (and already-listening) celebration engine to real new-trophy data (ASCEND) — SHIPPED

**Shipped** (commit `2377b69`, "Wire omega:achievement celebration event to real trophy data") —
`trophies.html` now compares the current earned trophy/medal/cert count against a `localStorage`
last-seen count and dispatches `omega:achievement` with the newly-earned item's real name
(`trophies.html:175,188,192,196`), exactly as proposed. Confirmed directly in code; flagged and
corrected here for the same reason as #7 above.

**Grounded in:** `omega-confetti.js` (loaded platform-wide by `bg.js`, every page, via the
standard `data-omega-confetti` guard) is a fully built canvas celebration engine —
`OmegaCelebration.burst()`/`.gate()`/`.milestone()`/`.apex()` — that also **auto-triggers itself**
by listening for three custom DOM events: `omega:gate-unlock`, `omega:achievement`,
`omega:apex` (`omega-confetti.js:1-14`, its own header comment documents this explicitly). A
repo-wide grep for those three event names across every `.js` and `.html` file returns **zero**
matches outside the listener itself — nothing anywhere in the codebase ever dispatches them, and
no page calls the direct API either. This is the same class of gap `CLAUDE.md` §8 already
documents for `OmegaGuardian.gate()` ("defined but never called by any page or module") — except
here the fix is a pure cosmetic wiring job with no security/architecture decision attached, since
nothing is being gated, only celebrated.

`trophies.html` already fetches real, RLS-scoped, per-member earned-trophy data every page load
(`trophies.html:157-159`: `sb.from('trophies').select('trophy_num,earned_at').eq('user_id',uid)`,
same for `medals`/`certificates`) and already has a name lookup table for each
(`TROPHY_DATA`/`MEDAL_DATA`/`CERT_DATA`, `trophies.html:98-116`, e.g. `{n:1,name:'THE GENESIS
MARK',...}`). Nothing currently compares this against what the member saw on their *previous*
visit, so a newly earned trophy looks identical to one earned months ago — no celebratory moment
at all, despite the engine for exactly that moment already sitting loaded on the page.

**Idea:** on `trophies.html`, after the existing trophy/medal/cert fetch, compare the current
earned count against a single `localStorage` key holding the last-seen count (same "compare
against last-seen state" pattern this repo already uses elsewhere, e.g.
`omega_demo_watched_at`/`habits.html`'s streak-freeze reconciliation) — if it increased, look up
the newly-earned item's name from the existing `TROPHY_DATA`/`MEDAL_DATA`/`CERT_DATA` arrays and
`dispatchEvent(new CustomEvent('omega:achievement',{detail:{title:name}}))`. Zero new engine
code — the celebration engine already handles the event, already respects
`prefers-reduced-motion` (`omega-confetti.js`'s own header comment), already has its canvas layer
built. This is purely: detect the moment, fire the event that already does something.

**User benefit:** every approved member gets an actual celebratory moment (confetti burst +
banner) the first time they see a newly earned trophy/medal/certificate, instead of a page that
looks the same whether they just unlocked something or not — directly matches this repo's own
"Sovereign celebration engine" framing for the feature it already built but never turned on. No
`membership_tier` gating needed.

**Nav placement:** no new nav entry — `trophies.html` already exists and is reachable
(`ascend`/`achieve` per `nav.js`'s existing `PS` map).

**Data needs:** none. No new table, RPC, or `platform_settings` flag — reads the same
already-fetched `trophies`/`medals`/`certificates` rows the page already queries every load, adds
one `localStorage` comparison, dispatches an event the platform-wide engine is already listening
for.

**Source inspiration:** celebratory micro-interactions on real achievement moments (not trivial
actions) are a well-established, low-risk UX pattern precisely because they're selective and
short — the same principle `omega-confetti.js`'s own design already follows
(`prefers-reduced-motion` respect, distinct `.milestone()` vs `.apex()` intensity tiers for
different achievement sizes):
- [Juicy UI: Why the Smallest Interactions Make the Biggest Difference](https://medium.com/@mezoistvan/juicy-ui-why-the-smallest-interactions-make-the-biggest-difference-5cb5a5ffc752)
- [The Best Gamification UI Libraries (2026) — Trophy.so](https://trophy.so/blog/gamification-ui-libraries)
- [Microinteractions UI Best Practices: A 2026 Guide](https://createbytes.com/insights/microinteractions-ui-best-practices)

## 10. Mount the already-built sigil generator on profile.html (IDENTITY) — SHIPPED

**Shipped** — confirmed directly in code: `profile.html:432` has `<div id="ph-sigil"
data-sigil-mount>`, and `profile.html:2359-2364` calls `window.OmegaSigil.mount(el,{...})` from a
`mountSigil()` function with a retry guard (`if(!window.OmegaSigil){setTimeout(mountSigil,300);
return;}`) exactly as proposed — bypassing the shared `omega:user-loaded` event, not dispatching
it platform-wide. Flagged and corrected here because `CAPABILITY_INVENTORY.md` already documented
this as shipped but this file's own status marker was never updated to match, the same doc-drift
`CLAUDE.md` §9 warns against.

**Grounded in:** `omega-sigil-gen.js` (loaded platform-wide, `window.OmegaSigil.generate/mount/download`)
is a working, deterministic, purely-client-side procedural SVG generator from a member's own
element/axis/gate data — confirmed zero `OmegaSigil.` call sites anywhere. Its own auto-mount
handler (`omega-sigil-gen.js:189-205`) only fires on the `omega:user-loaded` custom event, which
a repo-wide grep confirms is dispatched from exactly **one** page (`chronicle.html:439`) despite
eight modules platform-wide listening for it.

**Idea (scoped narrower than "just fire the missing event"):** call
`window.OmegaSigil.mount(el, opts)` directly from `profile.html`'s own existing profile-fetch
flow, computing `opts` the same way the module's own dormant handler already would — bypassing
the shared `omega:user-loaded` event entirely. **Deliberately not** proposing to dispatch that
event platform-wide or even on this one page: investigating the other seven listeners found that
`omega-ambient.js` and `omega-realm.js` both have independent `window.__omegaProfile` polling
fallbacks that self-activate regardless of the event (meaning ambient audio autoplay is likely
already silently attempted on every page today via that path, separately from this event), while
others (`omega-music.js`'s topbar button injection, `omega-workers.js`'s worker bus) are
purely event-dependent and untested in combination. Firing the event to fix one module would also
activate six unrelated, only-partially-audited subsystems at once, on the file CI already flags
as this platform's single point of failure if it breaks. That's a real, separate, larger
question — see the "Flagged, not proposed" note below — this idea intentionally avoids it.

**Data needs:** none. Reads `pr` (already fetched), zero new calls.

**Security check performed:** `generateSigil()`'s only use of member-writable text
(`display_name`) is `.charAt(0)` (exactly one character) placed in an SVG `<text>` node — not an
attribute-injection context, and sigils only ever render the viewer's own profile, never another
member's. Not exploitable; no fix needed.

## 11. Wire the already-built passport PDF download on profile.html (IDENTITY) — SHIPPED

**Shipped** — confirmed directly in code: `profile.html:431` has `<button
data-passport-download>&#8595; PASSPORT PDF</button>` next to the share-card button, exactly as
proposed — no JS added, the module's existing global click listener handles it. Same doc-drift
correction as #10 above.

**Grounded in:** `omega-passport.js` (loaded platform-wide, jsPDF via esm.sh, MIT) generates a
downloadable PDF from `window.__omegaProfile` on any click of `[data-passport-download]` — that
click listener is registered unconditionally at module load (`omega-passport.js:150-152`), not
gated behind any event. A repo-wide grep for `data-passport-download` returns zero matches — the
button was never placed on any page. The module's own auto-inject logic
(`omega-passport.js:154-165`) specifically targets `#char-my-name`/`[data-identity-card]`
(clearly built for `character.html`), but `character.html` has neither element and never
dispatches `omega:user-loaded` either — so even its intended page has never actually shown this
button.

**Idea:** add one `<button data-passport-download>` to `profile.html`, next to the share-card
button. No JS to write — the module's existing global click listener + `window.__omegaProfile`
(already populated platform-wide by `omega-user.js`) do the rest.

**Data needs:** none.

## 12. Owner-only FinOps cost summary on dashboard.html (COMMAND, owner-gated) — SHIPPED

**Shipped** — confirmed directly in code: `dashboard.html:852-853`, inside the existing
`if(pr.is_owner)` admin block, `if(window.OmegaFinOps){try{sid('adm-finops-cost','$'+window.
OmegaFinOps.summary().total_usd.toFixed(4));}catch(e){}}` — reads the module's in-memory summary
exactly as proposed, no historical `platform_metrics` aggregation added. Same doc-drift correction
as #10/#11 above.

**Grounded in:** `omega-finops.js` is not dormant — it is **already actively running** on every
page for every member: it patches `window.__omegaSb.from().select()` to count DB reads, estimates
AI token costs from concierge calls, and on `beforeunload` **writes a real row** to
`public.platform_metrics` if the session's estimated cost exceeds $0.001
(`omega-finops.js:140-148`). Confirmed `platform_metrics` exists (`supabase/omega_telemetry.sql`)
with RLS already correctly scoped: any authenticated member can INSERT their own session's
estimate, but only the owner can SELECT (`"owner reads metrics"` policy,
`omega_telemetry.sql:74-75`) — so this data has been silently accumulating, owner-readable-only,
with zero UI anywhere to see it (`OmegaFinOps.` has zero call sites outside the module itself).

**Idea:** add a small card to `dashboard.html`'s existing `if(pr.is_owner)` admin block (the same
one already populating `adm-pending`/`adm-accounts`/`adm-threats`, `dashboard.html:~789-810`)
showing `OmegaFinOps.summary()` — total estimated session cost, top cost driver, and the module's
own built-in recommendations. Must be labeled clearly as an **estimate** (the module's own header
comment says so explicitly: "Cost Model (estimated, adjust with real billing data)") — never
presented as real billing, to avoid misleading the owner. Owner-only placement matches the
existing RLS boundary exactly, not a new judgment call.

**Data needs:** none — reads the already-running module's in-memory summary for the current
session, doesn't query `platform_metrics` historically (that would be a separate, bigger
aggregation feature).

## 13. Seed the already-built (and already auto-mounting) honesty-label system (platform-wide) — SHIPPED

**Shipped** — confirmed directly in code: `profile.html:429` has `AUTHORITY INDEX <span
data-canon="mechanic"></span>`, and `agents.html:49` has `SOVEREIGN AGENTS <span
data-canon="lore"></span>` — both exactly the two placements proposed, no `fiction` example added
in this pass (left to #14, which shipped separately). Same doc-drift correction as #10-#12 above.

**Grounded in:** `omega-canon-badge.js` (loaded platform-wide) is a small, fully self-contained
system that auto-mounts on every page (`DOMContentLoaded` + two retry timers, no event/wiring
needed at all) and scans for `[data-canon="mechanic|lore|fiction"]` elements, replacing them with
a styled, honest label distinguishing three real content categories — its own header comment
defines them precisely: `mechanic` = "computed from your real account data, actually affects your
standing"; `lore` = "real, consistent content... but decorative, does not gate or compute
anything"; `fiction` = "narrative worldbuilding... not a representation of your account, the
future, or anything factual." A repo-wide grep for `data-canon=` returns zero matches — nobody
has ever given this system anything to label, despite it being ready and auto-mounting on every
page today.

**Idea (scoped to two unambiguous placements, not a platform-wide sweep):**
- `profile.html`'s AUTHORITY INDEX label &rarr; `data-canon="mechanic"`. Unambiguous: it's
  `√(A³+B³+C³)×φ/e` computed directly from `axis_a/b/c`, and it gates real things (subject to
  `CLAUDE.md` §5's `is_platform_owner()`/RLS model, not decorative in any sense).
- `agents.html`'s "SOVEREIGN AGENTS · 12 AGENTS" heading &rarr; `data-canon="lore"`. Also
  unambiguous — `CLAUDE.md` §6 already states this exact classification as established fact:
  "the platform's UI/UX personality system... not a technical multi-agent runtime." This isn't my
  own content judgment call, it's citing the repo's own canonical documentation.

**Deliberately not included this pass:** a `fiction` example. `chronicle.html` has real
candidates (e.g. its "APEX AGE" section's forward-looking milestone/cinema entries, clearly
speculative future narrative per the module's own definition) — but that page mixes origin-myth
content (past, closer to `lore`) with speculative-future content (closer to `fiction`) across
what looks like many timeline entries, and tagging one card while leaving visually-identical
neighboring cards untagged would read as more arbitrary than helpful. Classifying the *whole*
timeline properly is a real, well-scoped follow-up (see idea #14 candidate below) — not something
to guess at card-by-card in this pass.

**Data needs:** none. Pure presentational HTML attribute + the module's own existing auto-mount.
No JS to write, no `nav.js` change, no schema/RPC/flag.

## 14. Classify chronicle.html's full timeline for canon-badge — SHIPPED

Extended #13's honesty-label seeding to `chronicle.html`'s 7-era timeline, after an actual
read-through of all 6 named eras plus the "Beyond Apex" future grid (445 lines total), not a
guess:

- **`void-age`, `primal-age`, `sovereign-age`, `olympian-age`, `emergence-age`** (Eras I–V) →
  `data-canon="lore"`. All five are mythic/historical narrative framing — cosmogenesis, the first
  sovereign beings, the AUTH-formula "discovery" myth, the Olympian patrons, and the platform's
  own 2024 launch — none of it is live-computed by the chronicle page itself (matching
  `omega-canon-badge.js`'s own `lore` definition: "real, consistent content... but decorative,"
  not "does this describe something real" — Era III's AUTH formula and gate thresholds ARE real
  platform mechanics, but they're computed and already tagged `mechanic` elsewhere
  (`profile.html`'s AUTHORITY INDEX, seeded in #13) — this page is the origin myth *of* that
  mechanic, not the mechanic itself, so `lore` is correct here, not `mechanic`).
- **`apex-age`** (Era VI, "2025–2026 · NOW") → `data-canon="fiction"`. Despite the "NOW" label,
  both events in this era are unachieved aspirational milestones (Sovereign Cinema entering
  production, the platform "reaching 91,717 active members") — matches `fiction`'s own definition
  ("not a representation of your account, your future, or anything factual... predictive") more
  than `lore`'s "real, consistent content."
  **future** (`"BEYOND APEX · FORTHCOMING"`, 2027+) → `data-canon="fiction"`, unambiguous — the
  section's own CSS already renders a "COMING" ribbon on every card.

**Flagged but deliberately not fixed here** (out of scope for a badge-classification pass, same
"flag rather than force" discipline as the rest of this file): Era V's "The Sovereign Token
(OMGX) Is Minted" event card (`chronicle.html`, 2024 · EMERGENCE PHASE II) states in the past
tense that OMC/OMGX tokens "launch" with fixed supplies — but `CLAUDE.md` §8 already documents
the token economy as explicitly dormant (`platform_settings.tokens_enabled=false`, no tokens ever
issued), and `sovereign-covenant.html`/`system_manifest.json` already received explicit
"PLANNED · NOT YET ACTIVE" disclaimer treatment for the identical overclaim. This one card is the
same category of issue and deserves the same disclaimer treatment in a future session — a
`data-canon` badge alone doesn't fit (it's not future-speculation like `fiction`, and calling it
`lore` doesn't flag the factual overclaim), so it was left as `lore` along with the rest of its
era rather than mislabeled to force a fit.

**Verification:** one span per era (`<span data-canon="...">` next to each `.era-badge`/
`.era-period` pair, matching the existing per-page pattern from #13), no JS written — the
pre-existing `omega-canon-badge.js` auto-mount (already loaded platform-wide via `bg.js`) picks
these up automatically. Confirmed via a dedicated Playwright test
(`verify_chronicle_canon.js`, scratch/not committed) asserting all 7 `[data-canon]` spans under
their respective `#<era-id>` mount into a real `.ocb` badge with the exact expected `lore`/
`fiction` kind and label text, zero page errors — PASS. `node --check bg.js`/`omega-canon-badge.js`
clean; `scripts/audit.py` reconfirmed 0 critical / 6 pre-existing warnings (all unrelated —
`transactions`/`wallet_balances` missing tables, diverging RPC bodies, oversized committed
assets) on both repos after sync. Byte-identical diff confirmed between
`-_V18_SYDOMEGA91717/chronicle.html` and `sydomega-live/chronicle.html`.

## 15. Surface the already-built `member_posts` table on `feed.html`'s mislabeled "POSTS" tab (MEDIA) — SHIPPED

**Shipped** — implemented as a new, separate "MEMBER POSTS" tab (`feed.html`'s 5th tab,
`#tab-member-posts`), deliberately not touching the existing "POSTS" tab (which correctly reads
`publications`, per its own already-fixed bug in `CLAUDE.md` §8), exactly per this idea's own
"scoped narrower" note. Read: `loadMemberPosts()` selects
`post_type,title,body,tags,likes_count,comments_count,created_at` from `member_posts` where
`status='published'`, ordered newest-first, limit 20 — matches the proposal's own SQL exactly.
Write: a minimal compose form (title/body/post_type dropdown limited to the table's real 6 CHECK
values) inserting `{user_id,post_type,title,body}` — `status` is left unset so the table's own
`DEFAULT 'published'` applies, matching the RLS model (`FOR ALL USING(user_id=auth.uid())`).
Every rendered field (`title`/`body`/`tags`) goes through a per-page `esc()` helper matching the
established convention (`contracts.html`, `dashboard.html`, etc.) — member-writable text, same
stored-XSS class already fixed platform-wide per `CLAUDE.md` §8. The insert path checks `.error`
before showing "POSTED" (never a false success, per this repo's own most-repeated bug-class
rule) and shows "POST FAILED" on a genuine failure instead.

**Verified in headless Chromium** (not just read from source) against a schema-shaped mock
Supabase client: tab renders and switches correctly (5 tabs total); 2 seeded `member_posts` rows
render, including one with a `<script>alert(1)</script>` payload in `body` — confirmed it renders
escaped (`&lt;script&gt;`) with zero unescaped `<script>` tags reaching the DOM; empty-body submit
is rejected client-side with no insert call; a successful insert clears the form and shows
"POSTED"; a forced insert failure shows "POST FAILED — TRY AGAIN," not a false success. Zero page
errors. `node --check` on the extracted module script and `scripts/audit.py` (0 critical / 6
pre-existing warnings, unchanged) both clean. Reactions (`likes_count` increment) intentionally
left out, matching the original idea's own scoping note — a small follow-up, not a blocker.

**Grounded in:** `supabase/platform_expansion.sql:99-122` defines `public.member_posts` — a fully
built, RLS'd table for structured member updates (`post_type` CHECK-constrained to
`'text','achievement','milestone','question','insight','announcement'`, plus `title`, `body`,
`tags text[]`, `track_id`, `likes_count`, `comments_count`, `is_pinned`, `status`). RLS is already
correct: `FOR SELECT USING(status='published' OR user_id=auth.uid())`,
`FOR ALL USING(user_id=auth.uid())` for the owner-of-row write policy. A repo-wide grep for
`member_posts` across every `.html`/`.js` file returns **zero matches outside the SQL file that
defines it** — no page reads it, no page writes to it. It is a completely unused table, same
"built but never surfaced" shape as `omega-sigil-gen.js`/`omega-passport.js` (#10, #11 above), just
schema instead of a JS module.

`feed.html` already has a tab literally named for this: `<button onclick="setTab('posts')">POSTS`
(`feed.html:44`) and `<div class="sechead">SOVEREIGN POSTS &middot; MEMBER PUBLICATIONS</div>`
(`feed.html:60`) — but its `loadPosts()` function (`feed.html:160-172`) queries
`sb.from('publications').select('title,created_at,kind')`, a different, real table (the
write-up/report catalog covered by the `feed.html` `author_name` bug fix in `CLAUDE.md` §8). The
tab has never shown a `member_posts` row — the table it's actually named after has no path in.

**Idea:** point a *new* section (or a genuinely new sub-tab, to avoid conflating with
`publications`, which already has a real, separate consumer) at `member_posts`: a simple
`sb.from('member_posts').select('post_type,title,body,tags,likes_count,comments_count,created_at')
.eq('status','published').order('created_at',{ascending:false}).limit(20)` read, plus a minimal
compose form (`title`/`body`/`post_type` dropdown limited to the table's own CHECK values,
`.insert({...,user_id:s.user.id})`). `feed.html`'s own copy (`feed.html:78`) already states this
platform's explicit design philosophy — "The activity feed is not social media... Activity is the
proof of sovereignty, not the performance of it" — which is exactly why `member_posts`' `post_type`
values (`achievement`/`milestone`/`insight`/`question`, not free-form chat) are the right fit here,
not a generic social wall: a member posting "just crossed Gate 4" or "here's what worked for Axis
B this month" *is* proof-of-sovereignty content, matching the page's own stated intent, unlike an
open-ended status-update feed.

**User benefit:** every approved member gets a real, first-party (not scraped/embedded)
outlet for milestone/achievement/insight posts, on a page and tab that already promise this exact
thing but currently deliver something else. No `membership_tier` gating — same access level as
the rest of `feed.html`, which isn't tier-gated today.

**Nav placement:** none new — `feed.html` is already reachable (`nav.js`'s `PS` map already routes
`feed:'media'`, and the `media` section already lists `['feed','ACTIVITY FEED','/feed.html']`).

**Data needs:** none. `member_posts` table + RLS already exist and are already correct; this is
purely the missing read/write UI on an existing, unused table. Reactions (`likes_count`) would
need a small increment RPC (`SECURITY DEFINER`, same pattern as the rest of this schema) if
"like a post" is wanted beyond just displaying the count — not included in this pass; flag as a
small follow-up, not a blocker.

**Source inspiration:** structured milestone/achievement posting (vs. free-form chat) as the
higher-signal pattern for small, private, non-anonymous communities — Circle and Mighty Networks
both center their 2026 product positioning on a central activity feed of member-authored updates
with reactions, distinct from an open social wall:
- [14 Best Community Platforms Compared (2026 Guide) — Circle Blog](https://circle.so/blog/best-community-platforms)
- [12 Best Online Community Platforms in 2026 (Pros and Cons)](https://www.positioniseverything.net/12-best-online-community-platforms-in-2026-pros-and-cons/)
- [Circle vs Mighty Networks: Which Community Platform Is Better? (2026) — Ruzuku](https://www.ruzuku.com/learn/articles/circle-vs-mighty-networks/)

## 16. Weekly activity digest — in-app notification + email (COMMAND, needs an explicit opt-in decision)

**Grounded in:** three separate, already-working pieces of infrastructure this platform has, none
of which are currently combined into a proactive recap:
- `public.notifications` is now a real table with correct RLS (`supabase/omega_notifications_fix.sql`,
  applied and verified live per `CLAUDE.md` §8) — but "nothing in the codebase currently inserts a
  notification row," per that same fix file's own comment. It's ready to receive one.
- `RESEND_API_KEY` is a live, working Supabase secret already sending real email from an Edge
  Function today: `supabase/functions/notify-access/index.ts` emails the owner on every new access
  request via `https://api.resend.com/emails` — a real, working, copy-pasteable pattern for a
  second transactional email, not a new integration.
- `supabase/functions/snapshot-leaderboard/index.ts:5` ("Meant to run on a daily schedule (e.g.
  Supabase cron at 00:05 UTC)") establishes pg_cron-triggered Edge Functions as an existing pattern
  on this platform, and `supabase/functions/concierge/index.ts:117` already calls the Anthropic API
  server-side (`model: "claude-haiku-4-5-20251001"`, key from `ANTHROPIC_API_KEY`) — reusable for a
  short natural-language summary instead of a template-only email.
- `public.task_completions` (dedup-fixed and confirmed committing per `CLAUDE.md` §8) has real,
  per-member, per-week activity data ready to summarize — no new tracking needed.

**Idea:** a new, cron-scheduled Edge Function (e.g. `weekly-digest`, mirroring
`snapshot-leaderboard`'s cron pattern) that, once a week, for each opted-in member: queries their
`task_completions` rows from the past 7 days, optionally calls the same Anthropic model
`concierge` already uses for a 1-2 sentence natural-language recap ("You advanced Axis B three
times this week, mostly through Academy — Gate 5 is 2 tasks away"), inserts one
`public.notifications` row (in-app, using the columns `omega_notifications_fix.sql` already
defines: `user_id, notification_type, message, content`), and sends the same recap via Resend
using `notify-access`'s existing `from`/`escHtml` pattern.

**User benefit:** every opted-in approved member gets a proactive, personalized "here's what you
did this week" recap instead of having to visit the dashboard to reconstruct it themselves —
matches the 2026 proactive-AI-assistant pattern (recaps/digests generated *for* the user, not
just answering when asked) already shaping products like Reclaim.ai, Lindy, and Motion. No
`membership_tier` gating — a benefit already available to every approved member, not a paid tier
distinction.

**Nav placement:** no new page. Surfaces through the existing `notifications`/`omega-notify.js`
badge-and-panel widget (already loaded platform-wide) and email — `command` section, next to
`beacon`/`notifications` (`nav.js`'s existing `command` section already lists both).

**Data needs — flag before any code, per `CLAUDE.md` §9:** this is the one idea in this file that
touches new personal-data handling (sending a member's own activity summary to their own email
via a third party, Resend) — it doesn't touch money or tokens, but per this file's own standing
rule, needs an explicit default-off opt-in, not an assumed-on rollout. Concretely: add a
`profiles.digest_opt_in boolean DEFAULT false` column (new schema, additive, matches this schema's
existing idempotent-migration convention) and only email/notify members who have explicitly
enabled it from `settings.html`/`profile.html`. Until that decision is made, this stays exactly
where idea #2 in this file already sits ("decide which server-side events should insert a
notification row") — this is a concrete instance of that same open decision, not a bypass of it.

**Source inspiration:** proactive, digest-generating AI assistant UX as a defined 2026 product
category, distinct from purely reactive chat assistants:
- [Proactive AI Assistants: ChatGPT Schedules Reminders, Recurring Tasks, and Web Monitoring — Trend Hunter](https://www.trendhunter.com/trends/proactive-ai-assistants)
- [Best Proactive AI Assistants in 2026 — Lifestack](https://lifestack.ai/blog/proactive-ai-assistant)
- [20 Best AI Assistant Apps for 2026 — Reclaim](https://reclaim.ai/blog/ai-assistant-apps)

## 17. Extend the already-built skeleton-shimmer loading system's reach via `data-loading` (design system, platform-wide) — SHIPPED

**Implementation note:** built directly rather than routed through `feature-architect`/
`autonomous-coder`, since it's a bounded, zero-risk markup-only change (no JS/SQL/nav changes) —
same category of work as the `.card` design-system sweep in `CLAUDE.md` §4.1, not a new feature
needing a blueprint. Applied to 36 confirmed-safe containers across 25 pages: for each, verified
via grep (not assumed) that the exact same element id is reassigned via `.innerHTML=`/
`.textContent=` elsewhere in that page's own JS (directly or through a `var x=getElementById(...)`
alias) before touching it — `bg.js`'s `applySkel()` only arms the shimmer on an element with **zero**
existing children/text, so simply adding `data-loading` next to the static "LOADING X…" placeholder
text (the literal reading of the original proposal above) would have been a no-op: the check
`el.children.length||(el.textContent||'').trim()` would still see the placeholder text and skip it.
Caught this before shipping by re-reading `bg.js`'s actual guard clause, not just assuming the
attribute alone was sufficient. Fixed by adding `data-loading` to the outer container **and**
removing its static placeholder text, so it starts empty (satisfying the guard) and gets filled by
the page's own existing fetch/render logic exactly as before — visually, "LOADING X…" text is
replaced by the gold shimmer sweep instead.

**Follow-up (same session): the remaining 22 small-label instances, done.** These sit directly on
the id'd element itself (e.g. `matrix.html`'s `#stat-a-sub`, `profile.html`'s several `#sg-*-sub`
fields) rather than wrapping a dedicated container, and were initially left alone because
`applySkel()` forces `min-height:40px` on anything under 8px tall — correct for a content block,
wrong for a small text label. Measured real layout in headless Chromium (forcing `body.omega-approved`
and, where needed, `#app.style.display` — several pages use the "page-shell" pattern from
`CLAUDE.md` §3, where `#app`'s `display:none` is set by the page's own inline style/boot JS, not
just the injected CSS guard, so unlocking one doesn't unlock the other) before touching anything,
rather than guessing from markup alone.

That measurement caught a real bug in `bg.js` itself: `applySkel()`'s `offsetHeight<8` check always
runs at `DOMContentLoaded`, which is *before* the approval guard ever reveals `#app`/`.shell`/
`main.main` — so every `[data-loading]` element reads `offsetHeight:0` at check time regardless of
its real size, and the `40px` fallback fires unconditionally, every time, for every element, not
just short ones. This was already true for the 36 containers in the first pass (harmless there,
since 40px is a reasonable size for a content block) but would have been a real, guaranteed defect
for small labels — not a "maybe," confirmed by direct measurement before and after. Fixed the root
cause in `bg.js` (`if(!el.style.minHeight&&el.offsetHeight<8)el.style.minHeight='40px'`) so an
element that already specifies its own `min-height` inline keeps it; only elements with no
declared size fall back to the 40px default — exactly the original 36 containers' behavior,
unchanged.

Applied to all 20 elements where the id sits directly on the text (not a wrapper): 6 keep the
default no-override treatment (confirmed via measurement or real inline padding that they clear a
reasonable size on their own — `analytics.html #task-rows`, `beacon.html #h-sub`,
`profile.html #ph-name`/`#membership-card`/`#membership-card-portfolio`); 14 get an explicit
`min-height` sized to their own font-size/original content height (9–15px) so they render as a
compact label-sized shimmer instead of a 40px bar — `command.html #wxDesc`; `matrix.html`
`#stat-a/b/c-sub`; `profile.html` `#sg-auth/coord/tier/grade/member-sub`, `#cm-sign`, `#cm-role`,
`#port-auth`; `pulse.html #fng-lbl`; `rune.html #sigil-user-label`. One of those 14,
`matrix.html #badge-status`, needed an extra fix beyond the height override: it's a `<span>`
(inline by default), and `min-height` has no effect on non-replaced inline elements per the CSS
spec — confirmed by testing the override alone and seeing it silently ignored, not assumed. Added
`display:inline-block` alongside the `min-height` so the override actually applies.

**Left alone, confirmed unsuitable, not a compromise:** `budget.html #b-tb-meta` and
`offline.html #cache-count` — both are `<span>`s embedded mid-sentence in running text (e.g.
"CACHED_PAGES: [LABEL]"), with no padding and no block context. Measured directly: emptied, both
collapse to `width:0` as well as `height:0` — a shimmer needs a real box to sweep across, and an
inline run with zero width has none regardless of any height fix. A skeleton box appearing
mid-sentence would look stranger than the plain text swap these already do; left as-is.

Verified: measured real rendered dimensions in headless Chromium for every element before deciding
its treatment (not inferred from markup), confirmed the `bg.js` fix produces the intended sizes for
every element that could be fully rendered in this sandbox (11 of 20 — the rest sit behind inactive
tabs or page-specific init unrelated to this fix, same structural pattern as the ones that did
render, so high confidence without full sandbox coverage), confirmed the original 36-container fix
is unaffected (`feed.html #feed-list` still resolves to `min-height:40px`), `node --check` on every
touched file including `bg.js`, and `scripts/audit.py` (0 critical / 6 pre-existing warnings, no
regressions).

Verified: `node --check`-equivalent syntax validation on all 21 touched files' inline `<script>`
blocks (0 failures); `scripts/audit.py` reconfirmed 0 critical / 6 pre-existing warnings (asset/
link-integrity check unaffected, since no `src=`/`href=` was touched); a real headless-Chromium
run against `feed.html` confirmed `#feed-list` actually gains the `omega-skel` class and
`min-height:40px` ~500ms after `DOMContentLoaded` — not just inspected in source, the shimmer
mechanism was confirmed to actually arm.

**Grounded in:** `bg.js` already ships a complete, platform-wide skeleton-loading system (search
`OMEGA LOADING` in `bg.js`) — a `.omega-skel` class with a gold shimmer sweep
(`@keyframes omega-shimmer`), auto-applied by a `MutationObserver`-driven scanner that watches a
specific selector list and removes the skeleton state the moment real content lands (or after a
4-second cap): `var sel='#asset-tbody,#agent-log,#franchise-grid,[data-loading],.kpi-val';`. This
is real, already loaded on every page, and already respects `prefers-reduced-motion` — not a
proposal to build a new mechanism, only to widen what it reaches.

Its reach today is narrow: 3 hardcoded IDs, a `.kpi-val` class, and anything explicitly marked
`[data-loading]`. A repo-wide check found **38 pages** contain a plain-text "LOADING…" placeholder
(e.g. `feed.html:52` — `<div style="...">LOADING ACTIVITY&hellip;</div>`, inside
`#feed-list`; `agents.html:89` — `<div style="...">LOADING AGENTS&hellip;</div>`) with **zero**
`data-loading` attribute anywhere in the file — confirmed by grepping every `.html` page for both
strings and diffing the two sets (pages containing "LOADING" text vs. pages containing
`data-loading` at all: 38 pages have the former with none of the latter). Every one of these
placeholders renders as static text for however long the fetch takes, invisible to a system this
platform already built and is already paying the (small, `MutationObserver`-based) runtime cost
for platform-wide, on every page, whether or not any element on that page opts in.

**Idea:** add the `data-loading` attribute to these existing placeholder containers (e.g.
`feed.html:51`'s `<div class="glass" id="feed-list">` and `feed.html:60`'s `<div id="posts-list">`,
`agents.html`'s equivalent container, and the other 36 pages' matching containers) so the
already-built shimmer treatment reaches them, replacing static "LOADING X…" text with the same
gold shimmer sweep the platform already uses in the 4 places that already carry the attribute or
match the hardcoded IDs. Purely additive markup — the JS scanner, the CSS, and the
`prefers-reduced-motion` handling are all already correct and already shipped; nothing about the
mechanism itself needs to change.

**User benefit:** every visitor sees the platform's own already-designed loading treatment
consistently, instead of 38 pages quietly falling back to plain text — visual consistency, not a
new capability. No `membership_tier` gating — applies identically regardless of tier.

**Nav placement:** none — a design-system consistency fix across existing pages' existing
elements, not a new page or nav entry.

**Data needs:** none. Zero JS/CSS/SQL changes — the shimmer engine, its styles, and its
reduced-motion handling already exist in `bg.js` and are already loaded on every page; this is
purely adding one HTML attribute to existing elements on 38 already-existing pages.

**Source inspiration:** skeleton screens (structured shimmer placeholders that preview a UI's
shape) over spinners or plain loading text remain the established, still-current 2026 pattern
specifically for dashboard/list loading states because they eliminate layout shift and reduce
perceived wait time — the same rationale `bg.js`'s own `.omega-skel` implementation already
follows, just not applied everywhere it could be:
- [Skeleton loading screen design — How to improve perceived performance — LogRocket](https://blog.logrocket.com/ux-design/skeleton-loading-screen-design/)
- [Skeleton Screens vs Loading Spinners: Which Improves Perceived Performance? — The Hangline](https://www.thehangline.com/skeleton-screens-vs-loading-spinners-which-improves-perceived-performance/)
- [Dashboard Design Patterns for Modern Web Apps 2026](https://artofstyleframe.com/blog/dashboard-design-patterns-web-apps/) — notes skeleton loading states as one of the recurring "unglamorous decisions" shared by 2026's best dashboard designs (Linear, Stripe, Grafana, Vercel), alongside shipping both color themes from day one, matching this platform's own dark-first, glassmorphism design system.

## 18. Document the 4 real skills with the PURPOSE/INPUT/OUTPUT/SAFETY table (docs only, no new pipeline) — SHIPPED

**Grounded in:** a taxonomy exercise (`OMEGA_TAXONOMY.md` §8, added this session) proposed a
formal "command registry" — every command defined by PURPOSE/INPUT/OUTPUT/AGENT/TOOLS/
PERMISSIONS/SAFETY/EVALUATION/LOGGING/VERSION fields — modeled on generic slash-command systems.
Confirmed via grep that no such slash-command system exists anywhere in this repo (no
`.claude/commands/`, no custom command definitions). What this repo actually has, serving the
same purpose, is the real 4-skill pipeline already documented in `.claude/skills/README.md`
(`web-trend-scout` → `feature-architect` → `autonomous-coder` → `subscriber-portal`).

**Implementation (docs-only, shipped as commit `73a1f51`):**
Expanded `.claude/skills/README.md`'s existing one-line-per-skill summary into a comprehensive
PURPOSE/INPUT/OUTPUT/SAFETY/GATING table format, sourced entirely from each skill's own
`SKILL.md`. Added a "Detailed skill instructions" section with links to the full `SKILL.md` files
for reference. This is a pure readability improvement to existing, accurate documentation — not a
new subsystem, not a new command surface, and not a change to what any skill actually does. The
table makes the 4-skill feature pipeline immediately scannable while keeping authoritative details
in the SKILL.md files.

## 19. Signature cinematic / emblem visual tier — one motif, three high-traffic surfaces (design system) — PHASE 1 SHIPPED

**Grounded in:** infrastructure that already exists and already loads on all 179 pages via
`bg.js`, plus `UX_REDESIGN_BRIEF.md` §3 ("emblematic, cinematic, animated — without the
generic-AI look"), which asked for exactly this and scoped it to restraint:

- `omega-cinematic.js` (page-transition curtain, `[data-reveal]`, `[data-countup]`,
  `[data-stagger]`, `[data-scan]`), `omega-motion.js` (WAAPI entrance / roll-up / tilt /
  press), `omega-emblems.js` and `omega-emblem-panel.js` are all in the `bg.js` loader today.
- `omega-cinematic-engine.js` (fixed 2.5D HUD: vignette, scanlines, corner ticks, parallax
  particle canvas) and `omega-page-emblem.js` (per-page mark derived from the page's
  lattice/axis/glyph) exist but are **not** in the `bg.js` loader — they only run where a page
  carries an explicit `<script>` tag or a `data-page-emblem` element.
- `omega-sigil-gen.js` generates a deterministic per-member SVG sigil and auto-mounts on
  `[data-sigil]` on `omega:user-loaded`, but that event is not dispatched platform-wide (see
  the "Flagged, not proposed" note on `omega:user-loaded` — this proposal does **not** depend
  on that; it mounts the sigil explicitly on the two pages named below).
- The brief's "only 7 `@keyframes` / 3 `rotate()` across the platform" figure is now **stale** —
  a current grep finds `@keyframes` in 52 files / 117 distinct names. The motion *system* is no
  longer untapped; what's still missing is a single deliberate, repeated **signature** motif
  rather than 117 unrelated one-offs.

**Idea (design-system scope, no new page, no schema, no money/data):** define one signature
motion motif — a slow orbital rotation (`--omega-spin-slow`, ~60s, `prefers-reduced-motion`
→ static) as a shared class in `bg.js`'s injected stylesheet — and apply it deliberately in
**three** places only:

1. `profile.html` header — the member's own rotating, glowing `omega-sigil-gen.js` sigil.
2. `dashboard.html` — the same sigil, smaller, beside the standing readout.
3. `cosmos.html` hero — the existing emblem ring, given the signature spin.

Optionally, as a separate reviewable step: register `omega-page-emblem.js` in the `bg.js`
loader (guarded `data-omega-page-emblem`, no-op where no `data-page-emblem` element exists) so
the ~40 flat service pages the module was built for actually get their derived mark.

**User benefit:** the platform reads as one designed world rather than a set of pages, and the
"alive" feeling stops being hover-only (Ω-GVP shimmer is `:hover` by design, `CLAUDE.md` §4.1).
Restraint — one motif, three surfaces — is what reads as cinematic instead of busy; scattering
animation across every card is explicitly what the brief warns against.

**Nav placement:** none — this is shared design-system CSS + two explicit mounts.

**Phase 1 — SHIPPED.** The `.omega-spin-slow` shared class was added to `bg.js`'s injected
stylesheet, immediately after the (previously dead) `@keyframes spin-slow` it reuses:
`.omega-spin-slow{animation:spin-slow 60s linear infinite;transform-origin:50% 50%;will-change:transform}`
plus `@media (prefers-reduced-motion: reduce){.omega-spin-slow{animation:none}}`. Applied to
`#ph-sigil` on `profile.html` (the already-mounted `OmegaSigil` SVG, FEATURE_IDEAS #10).

Verified with headless system Chrome (`playwright-core`, `channel:'chrome'`, reusing the repo's
own `sbstub.js` — the Windows recipe is now in `verify-in-browser/SKILL.md`) across 10 pages,
normal and reduced motion:
- `profile.html`: sigil present, renders as `<svg>`, computed `animation-name: spin-slow`,
  `animation-duration: 60s`; under `prefers-reduced-motion: reduce` → `animation-name: none`.
- All 10 pages: HTTP 200, no horizontal overflow, **no new console errors** vs. the pre-existing
  platform-wide `applyStyles` throw (blocked CDN, documented in `verify-in-browser`).
- `node --check bg.js`, `check-inline-js.py`, `audit.py` (0 critical), `production-contract.py`
  all pass.

**Phase 2 — not yet done (own PR):** the same class on `dashboard.html` and the `cosmos.html`
hero emblem; both need their own explicit mount point since neither carries a `[data-sigil]`
element today.

**Phase 3 — flagged, not this feature:** registering `omega-page-emblem.js` in the `bg.js`
loader for the ~40 flat pages. Additive but touches the loader; do it as its own reviewed step.

**Source inspiration:** `UX_REDESIGN_BRIEF.md` §3 and §5 (this repo's own friend-feedback →
action plan); `omega-sigil-gen.js` / `omega-cinematic-engine.js` / `omega-page-emblem.js`
(this repo's own already-built modules).

## Flagged, not proposed — need explicit scoping/sign-off before any code

- **`omega-recommend.js`'s "surfacing" half doesn't exist in code at all.** The signal-*recording*
  half genuinely works (`record_interest_signal`'s live signature matches exactly what the module
  calls — verified, not assumed) and has been silently collecting real interest-graph data this
  whole time. But there is no function anywhere that *reads* `interest_signals` back or renders
  "recommended content" — building that is a real, unscoped product feature (where does it show?
  what does "related content" mean for this platform's page taxonomy?), not a wiring fix.
- **Dispatching `omega:user-loaded` platform-wide from `bg.js`** would retroactively activate
  seven previously near-dormant modules at once (ambient audio, particle backgrounds, a topbar
  music-toggle injector, an event bus, a "realm" auto-mount, a worker-bus boot, and the sigil
  mount above) across all ~250 pages simultaneously, in `bg.js` — the file this repo's own CI
  comments already call the platform's single point of failure. Two of the seven already
  self-activate via independent `__omegaProfile` polling regardless of the event (so are likely
  already partially live today); the rest are genuinely dormant and untested in combination. This
  is a real, valuable, well-grounded finding — but activating six audited-only-in-isolation
  subsystems at once on the highest-blast-radius file in the repo is an explicit product/ops
  decision, not something to do as a quiet wiring fix.
- **`omega-workflow.js`'s entire 8-workflow orchestration engine has no external caller anywhere
  in the codebase — confirmed by grep, not assumed.** `window.OmegaWorkflow.run(...)` is called
  exactly once in the whole repo: internally, by `omega-workflow.js` itself, from the
  `task_complete` workflow's own `check_gate` step (to chain into `gate_unlock` on a threshold
  cross). But nothing anywhere ever calls `run('task_complete', ...)` or `run('onboarding', ...)`
  or `run('dedication_award', ...)` or `run('report_generate', ...)`, and the only thing that
  dispatches the `omega:task_complete` DOM event (which would trigger the `task_complete`
  workflow) is the workflow's own `emit_events` step — i.e. the trigger for the chain is only
  ever emitted *by* the chain, after it's already run. Net effect: every one of this module's 8
  named workflows (`ONBOARDING`, `GATE_UNLOCK`, `TRIAL_GRANT`, `TASK_COMPLETE`,
  `APPROVAL_FLOW`, `DEDICATION_AWARD`, `DATA_EXPORT`, `REPORT_GENERATE` per the file's own header
  — only 5 are actually implemented as step chains) is currently unreachable in production. This
  isn't a wiring bug to quietly fix — real task completion, onboarding, and dedication-award
  paths already exist and work through other call sites (`omega-matrix.js`, `omega-progress.js`,
  `publishing.html`, `omega-onboard.js` — all separately audited/fixed this session and prior
  sessions); deciding whether `omega-workflow.js` should *replace* those call sites, run
  *alongside* them, or stay purely available-but-unused as an API surface for future features is
  an architecture decision, not something to force through by wiring up a `dispatchEvent` call
  somewhere. (One real, narrow bug found and fixed inside this dormant module regardless — see
  `CLAUDE.md` §8 — since it needs to be correct whenever it does get wired up.)
- **`map.html`'s member world map has no location data to plot — building it is a privacy
  decision, not a bug fix.** `initMap()` requires `profiles.lat`/`lon`/`country`/`gate`, none of
  which exist anywhere in the schema (confirmed via a full schema-dictionary scan built from
  every `CREATE TABLE`/`ALTER TABLE` in `supabase/*.sql`, `CLAUDE.md` §8) — not a naming
  mismatch like the other bugs found this session, there is no member-location data collected
  anywhere on this platform at all. The page currently only ever plots 5 hardcoded city markers
  (London/NY/Tokyo/Dubai/Sydney) and silently skips every real member. Building this needs an
  explicit product decision on collection method (member-entered city/country field vs.
  IP-geolocation), consent flow, and whether `is_public` already gates it or a new opt-in is
  needed — left undone, matching this file's own rule against inventing new data collection.
- **`publications` has no path from `status='draft'` to any other value — publishing.html's
  own "commit" flow never sets `status`, so it always defaults to `'draft'`, and there is no
  owner-review UI anywhere in the codebase to change it.** Confirmed via grep: only 3 pages
  touch `publications` (`feed.html`, `publishing.html`, `studio.html`), and none of them ever
  write or update `status`. `feed.html`'s platform-wide "recent publications" feed was fixed
  this session for its column-name bug (`CLAUDE.md` §8), but even with that fixed, `publications`
  also has no RLS policy letting a member read anyone else's rows at all (only "own rows" and
  "owner reads all" policies exist) — so a genuine cross-member publications feed needs both an
  RLS policy addition (e.g. `status = 'published' OR user_id = auth.uid()`) *and* a real
  publish/review workflow that doesn't exist yet. Left undone — deciding what "published" means
  here (self-publish vs. owner-reviewed, matching the `dispatches`/`advertisements` approval
  patterns elsewhere in this schema) is a product decision, not a column-name fix.

## Explicitly not proposed here

Anything involving the Ω token economy, `wallet_balances`, or `transactions` — both are already
correctly identified as dormant-by-design pending a legal/business decision, and adding "ideas"
for token features here would work against that decision being made deliberately rather than by
engineering momentum.

---

## Ω-PALETTE — a complete command palette the platform already owns

**Status: proposal. Do not switch on as-is — see the blocker.**

Found 2026-09-06 by `audit.py` check 2's orphan list (`FIXES_LOG.md` 110). Seven
files, one of them a test, that **nothing loads**:

| file | bytes | role |
|---|---|---|
| `omega-command-catalog.js` | 5,294 | 99 commands in 9 groups (EMAIL/WRITE/THINK/LEARN/PLAN/BRAINSTORM/MEETINGS/CAREER/CONTENT) |
| `omega-command-palette.js` | 2,179 | Cmd/Ctrl+K overlay, `role="dialog"`, `aria-modal`, Escape to close |
| `omega-command-router.js` | 1,691 | intent dispatch with a privilege deny-list |
| `omega-command-adapter.js` | 1,113 | |
| `omega-command-history.js` | 825 | exports `OmegaCommandHistory` |
| `omega-command-palette.test.js` | 741 | someone tested this |
| `omega-command-palette.css` | — | flagged by the new check 2b |

### Why it is safe

- The catalog is **static repo-authored data** — hardcoded group and description
  maps, no user input — so the palette's `innerHTML` render carries no
  stored-XSS vector (§8.1's first failure class, the one `grill-me-codex`
  exists for).
- The router refuses privilege by default:
  `restricted=/^(DEPLOY|DELETE|ADMIN|TRANSFER|PAY|WITHDRAW|ROTATE|MIGRATE)/i`
  returns `authorization_required` unless a handler was registered with
  `meta.authorized`. Its own header: *"routes intents; never grants authority."*
- Unknown commands emit `omega:command_unhandled` — a no-op, not a throw.

### The blocker, and why this is a proposal rather than a commit

**No handlers are registered anywhere.** Every one of the 99 commands would
open, search, click, and do nothing. The commands are AI intents (`ELI10`,
`STEELMAN`, `PREMORTEM`, `TLDR`) whose natural executor is
`supabase/functions/concierge`, which is deployed but **dormant** pending
`ANTHROPIC_API_KEY`.

Shipping it now would surface 99 capabilities that do not exist — §8.1 class 9,
the pattern that produced `hercules.html`'s `Math.random()` progress and
`ad-network.html`'s fabricated revenue. §9's rule applies: gate it behind
`public.platform_settings` and keep member-facing copy in future tense.

### Recommended order

1. Set `ANTHROPIC_API_KEY` (owner) so the concierge can execute.
2. Register handlers — start with navigation-only commands, which need no AI
   and work today.
3. Make the unhandled path visibly honest ("not yet connected"), never silent.
4. Add a `platform_settings` flag, wire through `omega-flags.js` /
   `data-omega-flag`, and expose via `bg.js` only once the flag is on.

Wiring it is roughly a day's work and would give the platform a genuine
power-user surface it has already paid for.
