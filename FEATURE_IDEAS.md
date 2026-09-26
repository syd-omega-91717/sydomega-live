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

**Phase 2 — SHIPPED.** Mounted a real per-member `OmegaSigil` on `dashboard.html` (next to the
mission-bar's authority ring, `#dash-sigil`) and `cosmos.html` (below the zodiac hero wheel,
`#cosmos-sigil`), both using profile data each page already loads (no extra fetch) and the same
`auth`/`axisA/B/C`/`gate`/`name` shape as `profile.html`'s `#ph-sigil`. `.omega-spin-slow` applies
automatically via `bg.js`'s existing generic `[class*="sigil"]` selector — no class needed on the
new elements.

Deliberately **not** applied to `cosmos.html`'s `#hero-wheel` canvas, despite that being this
proposal's original target: reading the actual code first showed it already runs its own
continuous per-frame rotation of the 12-sign ring (`drawHeroWheel`'s own `requestAnimationFrame`
loop), so stacking a second, unsynced CSS rotation on top would have fought the existing motion
rather than enhanced it — exactly the "two motion systems on one element" class this repo's own
motion rules warn against. Mounted a real sigil next to it instead, which serves the proposal's
actual goal (a per-member mark on this hub page) without touching working code.

Verified in a headless render (signed-in stub, both pages): real `<svg>` present in both mounts,
`animation-name: spin-slow` / `60s` under normal motion, `animation-name: none` under
`prefers-reduced-motion: reduce` (cross-checked against `profile.html`'s known-working `#ph-sigil`
as a control, since the test harness's `S.launch({reducedMotion:...})` option turned out not to
be wired up — `page.emulateMedia()` is the one that actually works with this harness). Zero page
errors, zero console errors, no horizontal overflow on either page.

**Phase 3 — already shipped, this doc was stale.** `git log -S"data-omega-page-emblem" -- bg.js`
shows `omega-page-emblem.js` has been registered in the `bg.js` loader since **2026-07-20**,
months before this entry claimed it as "flagged, not this feature." No code change needed here;
this paragraph exists so the next session doesn't re-propose already-shipped work.

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

**Status: VOID — the files this entire entry describes no longer exist.**
Found while researching command-palette design (2026-09-20, `web-trend-scout`):
`git show --stat c7ca3569` ("Clean up 33 orphaned modules never loaded by
platform") deletes all seven files this section's table names —
`omega-command-catalog.js`, `omega-command-palette.js`,
`omega-command-router.js`, `omega-command-adapter.js`,
`omega-command-history.js`, `omega-command-palette.test.js`, and
`omega-command-palette.css` — along with `omega-cinematic-engine.js`
(also referenced elsewhere in this file, `#19`). None of the eight are
present on disk today. The "blocker" and "recommended order" below describe
work against files that no longer exist; they are left in place, unedited,
purely as a record of what this platform once had, not as an active
proposal. Building a command palette again from here is new work, not a
wiring fix — a fresh proposal, not a resurrection of this one.

**Status (original, now moot): proposal. Do not switch on as-is — see the blocker.**

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

## 20. Count-up and reveal motion on index.html's own hero — SHIPPED

**Implementation note:** built directly rather than routed through
`feature-architect`/`autonomous-coder`, since it's a bounded, zero-risk
markup-only change (three attributes already documented and used
platform-wide) — same category as idea #17.

**Grounded in:** an external "forgotten ideas" review of this platform
(2026-09-17 session) proposed a battery of enterprise-microservices/
blockchain concepts, nearly all either architecturally incompatible with
this repo (no build step, static HTML + Supabase) or already built under a
different name once checked against real code (a "Bloodline Vault" already
exists as `family.html`'s genealogy tree over `bloodline_nodes`; a "Digital
Artifact Museum" already exists as `trophies.html` querying
`certificates`/`trophies`/`medals`; "interactive 3D Knowledge Cubes" already
exist as `academy.html`'s click-to-3D lattice view via `omega-lattice-3d.js`,
confirmed wired, not a dead promise). One genuine, small, real gap survived
the check: `omega-cinematic.js` ships `[data-countup]`, `[data-reveal]`, and
`[data-stagger]` to every page via `bg.js`, and a repo-wide grep for
`data-countup=` before this change returned **zero** matches anywhere —
the platform's own front door, `index.html`, used none of its own
already-built cinematic vocabulary.

**Change:** `index.html`'s hero stat row (`12 AGENTS · 9 REALMS ·
202 SURFACES · 14 SERVICES`) now staggers in with `data-stagger` +
`data-reveal="fade-up"` per stat and counts up from 0 via `data-countup`
(matches `countUp()`'s plain-integer parsing exactly, no code change
needed); the four capability-rail rows (`agents.html`/`intelligence.html`/
`governance.html`/`services.html` links) now stagger-reveal the same way,
mirroring the exact `data-stagger` > `[data-reveal]` pattern already used
on `gates.html`/`dashboard.html`.

**Deliberately not done:** did not add `data-reveal` to the `.ohz-hero-art`
sculpture mount itself, or to the `<aside id="fabric">` wrapper around the
stagger group. Neither combination (`data-omega-sculpture` + `data-reveal`
on the same element; a `data-reveal` element containing a nested
`data-stagger` group) has a precedent anywhere else in the codebase, and
this repo's own bug history (`CLAUDE.md` §8.1 class 3) is specifically
about opacity/visibility state interacting badly with sized or WebGL-backed
elements. No environment with a headless browser was available this
session to verify either combination empirically, so both were left alone
rather than shipped on the strength of reading the code alone — verify with
`verify-in-browser` before adding either.

**Verification performed:** `python3 scripts/check-inline-js.py` (clean),
`python3 scripts/audit.py` (critical: 0, warnings: 7, unchanged baseline).
Not verified: an actual render (no headless browser available this
session) — run `verify-in-browser`'s `scan.js errors` + `canvas` checks on
`index.html` before treating this as fully confirmed in production.

## 21. Faction-style team competition layer (COSMOS / ASCEND) — proposal, needs product scoping

**Status: proposal. Do not build as-is — see the open decisions below.**

**Source:** the same external review (idea #20's header) proposed "10
Factions: ideological groups... that drive community competition and
territorial influence." Unlike most of that review's content, this one
doesn't require a different architecture or conflict with anything already
built — it's a genuinely new, additive social mechanic this platform
doesn't have yet.

**Grounded in real infrastructure already here:** `leaderboard.html` +
`public.order_stats`/the ranking RPCs already compute and display
individual standings; `public.task_completions` already has per-user,
per-axis activity to aggregate into a group score; `complete_task()`'s
notification path (`public.notifications`, gated by
`platform_settings.notifications_enabled`) is a working pattern for
"your faction moved up a rank" style pushes. None of this requires new
axes, new currencies, or the token economy — a faction score can be a
pure aggregate of existing `axis_a/b/c`/`authority` values across its
members.

**What is NOT proposed:** the source material's own name — "Omega, Nexus,
Sentinel"-style faction names collide directly with this platform's
already-locked 12-agent roster (`Sentinel` is agent #1, per `CLAUDE.md`
§6) and would read as a second, competing identity system layered over
the zodiac/agent one members already have. Any real version of this needs
its own naming, independent of both the agent roster and the "28
Kings"/angelic-archetype idea from the same source (rejected outright —
see below).

**Open decisions before this can go to `feature-architect`:**
1. **Assignment.** Chosen by the member, assigned by a formula (e.g. by
   element or by house), or assigned at random on first approval? Each has
   different fairness and re-assignment implications the source material
   doesn't address.
2. **Does it compete with or complement zodiac/agent identity?** A member
   already has a sign, a god, a planet, an agent, and an element assigned
   at onboarding (`CLAUDE.md` §1/§6). A faction is a sixth identity axis —
   worth asking whether that's additive richness or identity clutter
   before committing schema.
3. **Scoring and territoriality.** "Territorial influence" implies factions
   compete for something visible and possibly zero-sum (a shared
   leaderboard slot, a cosmetic platform-wide state). Needs a concrete
   definition, not the source's abstract "influence."
4. **New table, RLS from day one.** A `faction_id` on `profiles` (or a
   separate `faction_members` join table) needs the same additive-migration
   + RLS treatment as every other table here (`CLAUDE.md` §5/§9) — own-row
   read/insert, no `anon` grant, `is_platform_owner()` for admin
   reassignment.

**Explicitly rejected, no further consideration:** the source material's
"28 Kings" (named Metatron, Raziel, etc.) as a parallel Knowledge-axis
achievement layer. This traces to the same Kabbalistic/Islamic-angelology
content reviewed earlier in this session (a separate uploaded document, not
part of this repo) — adopting it would fork this platform's locked
Greek/zodiac/Olympian brand system (`CLAUDE.md` §4/§6) into two competing
mythologies for the same underlying mechanic academy.html's certificates
already cover. Not a "forgotten idea," a brand conflict.

## 22. Seasonal & Elemental Theming Integration (IDENTITY / cross-cutting) — SHIPPED

**Concept:** Tie the platform's visual theme dynamically to the member's zodiac
sign and element affiliation, with automatic color palette cycling tied to
calendar seasons. Particle system colors, card gradients, glow intensities, and
header accents shift in real-time as the member navigates — fire members see
warm golds and reds, water members cyan and cool blues, etc. Seasonal transitions
(spring→summer→fall→winter) layer in additional ambient effects (bloom saturation,
vignette tint).

**Grounded in:**
- `omega-visual-evolution.css` (lines 42–88): `.card` glow system tied to `--card-accent` token
- `theme.js` (lines 1–12): Centralized token system with `--gold`, `--cyan`, `--solar`, `--void` published to `:root`
- `nav.js` (lines 50–95): SECTIONS map linking pages to agent-sign pairs (COMMAND→Sentinel/earth, IDENTITY→Sage/water, ASCEND→Champion/fire, COSMOS→Oracle/air)
- `omega-cinematic-animations-phase3.css` (sections T & Q): Six state-driven keyframe animations responsive to CSS token changes
- `bg.js` (lines 781–795): Existing inline `--void` personalization reads from `localStorage['omega_bg']`, pattern reusable

**User benefit:**
- Tier 1–2: Automatic sign-based color scheme, no member action
- Tier 3+: Customizable seasonal transitions, manual theme override, per-page accent editor

**Nav placement:** Global CSS override affecting all SECTIONS uniformly via root-level tokens recomputed by `theme.js` and read by all 202 pages

**Data needs:** None; reads existing `profiles.sign` (already populated via `omega-agents.json` zodiac mapping) and current date via `new Date().getMonth()`

**Source inspiration:**
- [Apple Music seasonal color shifts](https://www.apple.com/music/)
- [Figma dark/light mode personalization](https://www.figma.com/files?view=list&sort=saved)
- [Luxury astrology branding (Element & Co.)](https://www.elementandco.com/)

## 23. Event-Driven Celebration Engine Expansion (ASCEND / VAULT / INTEL / COMMAND) — proposal

**Concept:** Extend `omega-confetti.js` beyond simple achievement unlocks to emit
particle bursts, chromatic flashes, and 3D emblem rotations on task completion,
goal milestones, streak records, and social milestones. Tie celebration intensity
to member's `membership_tier` — tier 1 gets a subtle particle puff, tier 3 gets a
full-page confetti cascade with audio cue. Celebrations fire via
`window.dispatchEvent(new CustomEvent('omega:achievement', {...}))` pattern already
in use.

**Grounded in:**
- `omega-confetti.js` (lines 1–45): Global event listener bound to `omega:achievement` custom event, particle emission logic
- `omega-cinematic-animations-phase3.js` (lines 19–52): Six-state particle emission with configurable intensity (3–20 particles/sec)
- `omega-cinematic-animations-phase3.css` (sections T & R): `state-success-settle` (1.5s) animation already defined and GPU-optimized
- `profiles` schema: `membership_tier` (1–9) and real achievement/completion record tables already exist

**User benefit:**
- All tiers: Surprise-and-delight micro-celebrations on completion (proven 90% positive mood boost in Duolingo/Habitica UX research)
- Tier 3+: Customizable celebration intensity, per-page celebration themes tied to seasonal theme

**Nav placement:** Cross-cutting effect via `omega:achievement` event emissions from ASCEND (achievements.html), VAULT (habits.html), INTEL (analytics.html), COMMAND (dashboard.html); effects render globally on any page

**Data needs:** None; reads existing `public.user_achievements`, `public.task_completions`, `public.streaks` (already queryable)

**Source inspiration:**
- [Duolingo streak celebrations](https://blog.duolingo.com/streak-design/)
- [Habitica level-up animations](https://habitica.com/features)
- [Strava personal record notifications](https://blog.strava.com/strava-pr-notifications/)

## Blueprint

### Page & Nav Plan
**No new pages.** Cross-cutting effect affecting four existing pages via event emissions:
- **achievements.html** — Already has `omega:achievement` listeners in place; verify `window.dispatchEvent(new CustomEvent('omega:achievement', {...}))` fires on unlock
- **habits.html** (lines 380–384) — Already emits `omega:task-complete` on habit tick; add `omega:streak-record` emission when streak milestone is reached
- **analytics.html** — Verify dashboard analytics rolls emit `omega:task-complete` or `omega:streak-record` 
- **dashboard.html** — Verify KPI tier-progress emits goal milestone celebration via `omega:achievement` with `detail.title` containing goal name

No nav.js changes required; effect is invisible to navigation.

### Module Plan

**omega-confetti.js** (existing, in place via bg.js line 2473) — enhancements:
- **Tier configuration already complete** (lines 45–55): 1–9 tiers with scaling particlesPerSec (2→35), duration (600→2600ms), maxParticles (30→450), audio gates (false for tiers 1–3, true for 4–9)
- **Event handlers already in place** (lines 349–440):
  - `omega:gate-unlock` (line 349) — gates.html
  - `omega:achievement` (line 358) — achievements.html
  - `omega:task-complete` (line 365) — habits.html **[ALREADY EMITTED line 382]**
  - `omega:streak-record` (line 387) — **[NEEDS NEW EMISSIONS in habits.html, streaks.html]**
  - `omega:social-milestone` (line 410) — social.html
- **Prefers-reduced-motion compliance** (lines 30, 208, 183) — static pulse overlay instead of particles; fully implemented
- **No changes needed to module itself.** All infrastructure exists; expand emissions on source pages only.

### Data Plan
**None.** Reads existing:
- `profiles.membership_tier` (already queried in habits.html:380)
- `public.task_completions` (implied by task-complete events)
- `public.streaks` (implied by streak-record events)
- `public.user_achievements` (implied by achievement events)

### Integration Points & File Changes

**habits.html**
- Line 382–384 (existing): `omega:task-complete` emission on habit tick — ✓ already in place
- **ADD (new)** after line 384: Emit `omega:streak-record` when streak milestone is reached. On successful habit completion, check if `streak` count hits a milestone (every 5 days, every 7 days, every 30 days). Pattern:
  ```javascript
  if (streak > 0 && (streak % 7 === 0 || streak % 30 === 0)) {
    document.dispatchEvent(new CustomEvent('omega:streak-record', {
      detail: { tier, streak, metadata: { habit_name: habit.name } }
    }));
  }
  ```

**goals.html** (if exists; check structure)
- Add emission on goal milestone reached (at goal completion or tier progression):
  ```javascript
  document.dispatchEvent(new CustomEvent('omega:achievement', {
    detail: { tier, title: `Goal: ${goal.name}`, intensity: 'goal-milestone' }
  }));
  ```

**streaks.html** (if exists)
- Add `omega:streak-record` emission on new streak record (existing streak > previous record):
  ```javascript
  if (newStreak > previousRecord) {
    document.dispatchEvent(new CustomEvent('omega:streak-record', {
      detail: { tier, streak: newStreak, metadata: { record: true } }
    }));
  }
  ```

**analytics.html**
- Add `omega:achievement` emission on analytics milestone (e.g., total hours tracked reaches 100):
  ```javascript
  if (totalHours % 100 === 0 && totalHours > 0) {
    document.dispatchEvent(new CustomEvent('omega:achievement', {
      detail: { tier, title: `${totalHours} Hours Tracked`, intensity: 'milestone' }
    }));
  }
  ```

**dashboard.html**
- Add `omega:achievement` emission on tier upgrade (profile.membership_tier increases):
  ```javascript
  if (newTier > oldTier) {
    document.dispatchEvent(new CustomEvent('omega:achievement', {
      detail: { tier: newTier, title: `TIER ${newTier} UNLOCKED`, intensity: 'tier-up' }
    }));
  }
  ```

### Verification Plan

1. **Syntax check**: `node --check omega-confetti.js` (already passing; no changes to module)
2. **Repo audit**: `python3 scripts/audit.py` — verify 0 CRITICAL, omega-confetti.js marked as injected (guarded by `data-omega-confetti`)
3. **Browser verification**: 
   - `/verify-in-browser pages=habits.html,goals.html,analytics.html,dashboard.html errors` — no uncaught throws from event emissions
   - Manual: Tick a habit → celebrate (particle burst or static pulse if `prefers-reduced-motion`); reach streak milestone → second celebrate
   - Manual on Tier 3+ account: Verify particle intensity scales (more particles, longer duration, audio enabled)
   - Manual with `prefers-reduced-motion: reduce` → verify static color pulse, no animation
4. **Event emission audit**: Grep for each emission pattern exists in source pages:
   - `habits.html`: `omega:task-complete` ✓ (existing), `omega:streak-record` ✓ (added)
   - `goals.html`: `omega:achievement` with goal context (added)
   - `analytics.html`: `omega:achievement` on milestone (added)
   - `dashboard.html`: `omega:achievement` on tier upgrade (added)
   - `streaks.html`: `omega:streak-record` on record (added)

### No Schema / No Platform Settings

- Reuses `membership_tier` (1–9) already on `profiles`
- No new RLS required
- No `platform_settings` flag needed; celebrations enabled by default, disableable via `OmegaCelebrate.disable()` if needed

## 24. Chromatic Aberration & Color-Separation Effects (COMMAND / VAULT / INTEL / ASCEND) — SHIPPED

**Shipped** (commit pending; CSS-only implementation via `css/omega-system.css` Ω-CHROMATIC section) — pure CSS filter-based approach implemented exactly as proposed. Four animation states: `.omega-loading` (0.5px gold/cyan offset, 0.8s loop indicating activity), `.omega-error` (1.5–2px red/cyan split, 0.6s urgency cue), `.omega-success` (0.5px green/gold shimmer, 1.2s affirmation, clears to no filter), `.omega-press` (button press ripple effect, 0.4s decay). Three intensity variants (`.omega-chromatic-subtle/moderate/intense`, 0.25–1.5px offset range) available via `--chromatic-offset` CSS variable for Tier 3+ settings panel. Reduced-motion compliance: all animations disabled, visual feedback via border color + background tint instead on `.omega-error` and `.omega-success` states.

**Implementation:** CSS-only (no JavaScript module), injected platform-wide via existing `css/omega-system.css` shared stylesheet (loaded by every page). Grounded in existing state-tracking infrastructure (`omega-dataguard.js` class injection pattern) and animation discipline (matching Ω-HORIZON transition easing + reduced-motion guard pattern). No new HTML, no new RLS surface, no `platform_settings` flag required — pure visual enhancement on existing infrastructure.

**Concept:** Layer subtle chromatic aberration on state transitions (data loading
→ success/error), error feedback, and page navigations to enhance perceived
performance and technical polish. Implemented as CSS `filter: drop-shadow()` with
offset RGB channels on button interactions and loading indicators. On error states,
color-separation intensifies to red/cyan split (0.5–2px offset) as visual urgency
cue, respecting `prefers-reduced-motion`.

**Grounded in:**
- `bg.js` (lines 240–310): Ω-GVP extension layer defines `.card` hover effects and transition timings
- `--card-accent` token system (omega-visual-evolution.css, lines 42–88): Per-instance color inheritance enables chromatic offset targeting
- `omega-cinematic-animations-phase3.css` (sections E, T, R): State-driven animations with 0.6–2s transition durations, already respecting `prefers-reduced-motion` (lines 408–415)

**User benefit:**
- All tiers: Enhanced perceived responsiveness and technical sophistication
- Tier 3+: Adjustable aberration intensity slider in settings (via `--chromatic-offset` variable)

**Nav placement:** Global effect affecting error/loading states across COMMAND, VAULT, INTEL, ASCEND via CSS `filter` on `.omega-loading`, `.omega-error`, `.omega-success` classes injected by data-guard layer

**Data needs:** None; pure CSS + existing state-tracking infrastructure

**Source inspiration:**
- [CSS-Tricks chromatic aberration guide](https://css-tricks.com/how-to-create-a-chromatic-aberration-effect-using-css-filters/)
- [Framer Motion glitch effects](https://www.framer.com/motion/)
- [WebGL glitch art tutorials](https://github.com/staffanbultmann/glitch-shader)

## 25. Voice-Responsive Animations (chatbot / cross-cutting) — proposal

**Concept:** Synchronize particle emission rate, constellation node glow intensity,
and bloom to the copilot's voice stream speed and energy level. As
`omega-copilot.js` streams a response token-by-token, the particle system pulses
in sync (faster tokens → faster particle burst). Voice energy (detected via Web
Audio API peak frequency) modulates glow intensity. Fallback: text-streaming speed
drives animation on non-audio responses. Fully disabled under `prefers-reduced-motion`.

**Grounded in:**
- `omega-copilot.js` (lines 80–150): Existing stream event emissions with token arrival metadata
- `omega-cinematic-animations-phase3.js` (lines 15–52): `setEmissionRate(rate)` public API method already exposed for dynamic control
- Web Audio API: [MDN Web Audio API AnalyserNode](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode)
- `prefers-reduced-motion` guard pattern: `omega-cinematic-animations-phase3.css` lines 408–415

**User benefit:**
- All members using copilot: Richer feedback loop reducing perceived latency (stream feels "active" instead of stalled)
- Accessibility: Non-visual copilot users gain motion feedback; motor-disabled users benefit from reduced-motion fallback

**Nav placement:** Bound to chatbot.html and any page with inline `data-omega-copilot` attribute

**Data needs:** None; reads existing copilot stream metadata (tokens/sec, chunk arrival timing)

**Source inspiration:**
- [OpenAI ChatGPT streaming pulsing UI](https://openai.com/chatgpt/)
- [Google Assistant voice energy meters](https://assistant.google.com/)
- [Slack Huddles voice presence indicators](https://slack.com/features/huddles)

## 26. 3D Environment Integration & Real-Time Geometry Binding (COSMOS / ASCEND / IDENTITY) — proposal

**Concept:** Extend `omega-sculpture.js` WebGL scenes beyond static showcase pages
(sculpture.html) to bind scrollable constellation orbits and achievement hierarchies
directly to real-time rank/score data. Realm sphere on cosmos.html pulses with
member's active task count; ascension sculpture on ascension.html rotates to
reflect current tier progress; element sigils on profile.html scale proportional
to member's mastery score per element. Orbit cycles (60–120s from Phase 2)
synchronize with particle pulse cycles from Phase 3.

**Grounded in:**
- `omega-sculpture.js` (lines 1–80): WebGL context setup, three.js scene initialization, `data-omega-sculpture` mount points supporting signet/agents/matrix/gates/elements/ascension modes
- `/vendor/three.module.js` (vendored, 670KB): Official three.js build, PBR metal rendering (`metalness:0.96`), PMREMGenerator environment setup
- `omega-cinematic-animations-phase3.js` (lines 80–120): Constellation-particle orbit cycles (60–120s rotation with 40px translateX offset, `cluster-orbit` animation)
- `bg.js` (lines 1–50): Global injection point for WebGL context on pages with `data-omega-sculpture` mount
- Scroll parallax infrastructure from Ω-HORIZON extension (`bg.js` lines 320–360): `--scroll-progress` CSS variable already computed

**User benefit:**
- Tier 1+: Basic 3D geometry reflecting profile/achievement state
- Tier 3+: Premium state-binding animations, custom geometry colors tied to member's element affiliation, real-time data visualizations

**Nav placement:**
- Primary: COSMOS (agents.html, realm.html) — realm sphere data binding
- Secondary: ASCEND (ascension.html) — ascension sculpture tier progress
- Tertiary: IDENTITY (profile.html) — element sigil mastery scaling
- Showcase: sculpture.html (existing, extend with data binding)

**Data needs:** None; reads existing `profiles.rank`, `profiles.current_tier`, `public.user_achievements` (already queryable for member state)

**Source inspiration:**
- [BMW 3D car configurator scroll-driven geometry](https://www.bmw.com/en/index.html)
- [Mercedes-Benz WebGL configurator](https://www.mercedes-benz.com/)
- [Balenciaga WebGL fashion lookbook](https://www.balenciaga.com/)
- [Apple scroll-driven 3D transforms](https://www.apple.com/vision-pro/)
- [WebGPU standards proposal](https://www.w3.org/TR/webgpu/)

## 27. Trend-sparkline completeness pass — Stripe/Linear-style "number + direction + shape" (design system, cross-cutting)

**Grounded in:** `omega-sparkline.js` (9,016 bytes, exists, well-reasoned —
its own header explains it renders `.sparkline`/`.trend.up/.down/.flat`
from a real numeric series specifically to avoid `CLAUDE.md` §8.1 class 9
(fabricated data: `hercules.html`'s `Math.random()` progress,
`ad-network.html`'s invented revenue). It refuses to render a trend
direction from fewer than 2 real values, never invents a percentage from a
zero baseline, and watches `data-spark-values` via `MutationObserver` so
either load order works. But it is loaded by an explicit `<script>` tag on
exactly **6 pages** (`expenses.html`, `fasting.html`, `mirror.html`,
`missions.html`, `rituals.html`, `water.html`) — not through `bg.js`. A
repo-wide grep for `.kpi`/`.kpi-card`/`.trend` markup (the shared classes a
sparkline would attach to) finds **74 pages** — meaning the module most of
this platform's own KPI tiles could use is adopted on about 8% of them.

**Idea (design-system scope, no new module, no schema):** every 2026
dashboard research source converged on the same pattern — Stripe's own
cards show "a number, a trend indicator, and a sparkline" per metric, and
the researched 2026 dashboard consensus (Linear/Stripe/Grafana/Vercel) lists
this as one of the "unglamorous" shared decisions across all of them, not a
novel effect. This platform already built the exact mechanism these
products are praised for; it's just under-adopted. Two options, from
narrowest to widest:
1. Audit the 74 `.kpi`/`.kpi-card` pages for which already track a real
   time-series value a sparkline could read (many are static single-value
   tiles with nothing to trend — a sparkline needs genuine history, not an
   excuse to add one), and wire `data-omega-spark` on the ones that qualify.
2. Register `omega-sparkline.js` in the `bg.js` loader (guarded, matching
   every other module there) so it's available platform-wide without a
   per-page `<script>` tag — additive, but touches the loader, so per
   `CLAUDE.md` §8.2's `omega:user-loaded` caution this is its own reviewed
   step, not bundled into option 1.

**User benefit:** every free/approved member — this reads existing data
more legibly, no tier gate. The platform's own KPI tiles start reading like
the dashboard products members already use elsewhere, using infrastructure
this repo already built and tested against the exact fabrication bug this
platform's own history warns about most.

**Nav placement:** none — shared design-system module adoption, not a new
page or section.

**Data needs:** none. Each page's own already-queried columns supply the
series; `omega-sparkline.js` takes numbers via `data-spark-values`, no new
table or RPC.

## Blueprint (feature-architect, 2026-09-20)

Re-read `omega-sparkline.js` in full before planning against it (confirmed
current, matches its own header exactly): mount is
`<div data-omega-spark data-spark-label="...">`, values are pushed with
`el.setAttribute('data-spark-values', JSON.stringify([...]))` — a
`MutationObserver` on `data-spark-values` plus a `childList`/`subtree`
watch means load order never matters. Optional `data-spark-unit`,
`data-spark-trend="off"`, `data-spark-line="off"`, `data-spark-digits`.
Fewer than 2 finite values → mount stays `hidden`, nothing drawn — this is
the module's own fabrication guard, not something the wiring needs to
special-case.

**Audited, not assumed.** Grepped all 74 `.kpi`/`.kpi-card`/`.trend` pages
for existing signals of real per-day/per-month series (`history`,
`streak`, `weekly`, `monthly`, `last 7/30 days`, an existing canvas chart).
That narrowed 74 to ~25 plausible pages; of those, individually verified:

- **`gratitude.html` — genuine candidate, zero new query.** `_log` (line
  231, `[{date, items, note, ts}]`, `localStorage`-backed) already holds
  every real dated entry client-side; `calcStreak()` (line 378) already
  buckets by `.date`. No existing chart for this data — `renderJarStats()`
  (line 360) renders 5 `.kpi` tiles from it and stops there.
- **`dashboard.html` — genuine candidate, zero new query.** The
  contribution-heatmap fetch (line 974) already pulls
  `task_completions.completed_at` for the signed-in member over the last
  90 days into `hm.data` and feeds only `renderContributionHeatmap()`
  (line 754) with it — the same array can supply a 14-day per-day count
  series with no second fetch.
- **`journal.html` and `physiology.html` — real history, but NOT clean
  additions.** Both already hand-roll their own canvas trend charts
  (`drawMoodChart()`/`drawWCChart()` in `journal.html`; `drawTrend()` in
  `physiology.html`) over the same kind of data a sparkline would show.
  Wiring `omega-sparkline.js` here means *replacing* working, tested
  custom code, not adding to empty space — a consolidation decision, not
  this pass's scope. Left for a separate, explicitly-scoped follow-up.
- **`payments.html` — excluded.** Its own copy states "READY TO ACTIVATE
  ... your full history will populate once payments are active." There is
  no real data to source yet; wiring a sparkline here would either draw
  nothing (harmless but pointless) or invite someone to fake a series
  later. Matches `CLAUDE.md` §9's dormancy rule.
- **The remaining ~20 pages with some signal** (`academy.html`,
  `analytics.html`, `agents.html`, `ops.html`, `skills.html`,
  `research.html`, `studio.html`, `budget.html`, `nutrition.html`,
  `kyc.html`, `feed.html`, `command.html`, `gates.html`, and others) were
  grep-matched but not individually verified for a genuine per-item
  historical series vs. a false-positive hit on the word "history"/
  "weekly" in unrelated copy. Left for a follow-up pass using the same
  per-page verification method as above — flagging this explicitly rather
  than claiming full coverage.

**Wave 1 (this implementation): `gratitude.html` + `dashboard.html` only.**

- `gratitude.html`: add `<div data-omega-spark id="grat-spark"
  data-spark-label="ENTRIES PER DAY, LAST 14 DAYS" hidden
  style="margin-top:10px"></div>` immediately after `#jar-stats`.
  `renderJarStats()` gains a series build: bucket `_log` by `.date` over
  the last 14 calendar days (today back 13 days), counting `items.length`
  per day (0 for a day with no entry — a true zero, not a fabricated one),
  then `el.setAttribute('data-spark-values', JSON.stringify(series))`.
- `dashboard.html`: `hm.data` (the heatmap fetch) is scoped
  `.eq('user_id', s.user.id)` — the signed-in member's own completions
  only. The "TASKS TODAY" tile's own tooltip says "across all members",
  so a personal-scoped sparkline mounted there would misrepresent what
  that tile counts. Mounted inside `#kpi-auth` ("MY AUTHORITY") instead,
  which is already explicitly personal — after `#k-gate-sub`, labelled
  "MY TASKS/DAY, LAST 14 DAYS", `data-spark-trend="off"` (the tile's own
  `#k-auth` number is the primary trend-worthy figure here; the sparkline
  adds shape without a second, competing badge). Inside the same `try`
  block that already computes `hm` (line 974), after
  `renderContributionHeatmap(hm.data||[])`, bucket `hm.data` by the date
  portion of `.completed_at` over the last 14 days (today back 13) and
  set `data-spark-values` the same way.

**Module plan:** none — no new file. Both pages already load
`omega-sparkline.js` platform-wide? No: neither currently has the
`<script src="/omega-sparkline.js">` tag (only the original 6 adopters
do) — this blueprint adds that one `<script>` tag to each of the two
pages, matching the existing per-page load convention (`#19`/`#27`'s
own text explicitly defers registering it in the `bg.js` loader to a
separate, later step — not done here).

**Verification plan:** `node --check` n/a (no new `.js` file); headless
render of both pages signed in, confirming the new mount shows a real
`<svg>`/`.trend` badge (or stays correctly `hidden` for a member with
under 2 days of data — both are valid, honest outcomes); `python3
scripts/audit.py` (0 new critical findings); `./scripts/ci-local.sh`.

**Wave 1 — SHIPPED.** Both mounts built exactly as blueprinted above.
Verified in a headless render, driving the real interaction rather than
calling the render function directly:

- `gratitude.html`: `#grat-spark` only populates when the member actually
  opens the JAR tab (`renderJarStats()` is called from `activateTab`, not
  on page load — pre-existing lazy-render behaviour, not something this
  change alters). Seeded `localStorage`'s real `omega_gratitude_log` key
  with a 10-day, gap-including log *before* navigation, clicked `#t-jar`,
  and confirmed a real `<svg>` with a genuinely varying series
  (`[0,0,0,0,0,1,4,0,2,1,0,3,2,0]`) and a correct accessible summary
  ("14 readings, low 0, high 4, latest 0"). Checking on load alone (no
  click) correctly showed the mount still empty — proof the lazy-render
  behaviour is real, not a bug this change introduced or missed.
- `dashboard.html`: `#dash-tasks-spark` renders on load with the test
  harness's stub data (`{data:[]}` for every table by design — see
  `sbstub.js`), which correctly produces a flat 14-zero series with a
  real `<svg>` — 14 finite values is still enough for the module to draw,
  it just draws flat. Additionally called the page's own
  `window.OmegaSpark.render()` on the live mount with a synthetic varying
  series to prove the wiring handles real variation end-to-end beyond
  what the flat stub alone can exercise (aria-label: "MY TASKS/DAY, LAST
  14 DAYS: 14 readings, low 0, high 7, latest 5").
- Zero page errors, zero console errors, no horizontal overflow on
  either page. `./scripts/ci-local.sh`: ALL 24 BLOCKING CHECKS PASSED.

**Wave 2 — SHIPPED.** Individually audited the ~20 pages Wave 1 left
unaudited (`academy.html`, `analytics.html`, `agents.html`, `ops.html`,
`skills.html`, `research.html`, `studio.html`, `budget.html`,
`nutrition.html`, `kyc.html`, `feed.html`, `command.html`, `gates.html`,
and a broader re-grep of every `.kpi`/`.kpi-card`/stat-tile page for a
real dated log or Supabase table), the same per-page verification method
as Wave 1 — reading the actual data source before wiring anything, never
trusting a grep hit alone:

- **`habits.html` — genuine candidate.** Real Supabase `habit_logs` table
  (`user_id, habit_id, log_date`, RLS-scoped) exists but is a *write-only
  mirror* (documented in the page's own code comment: "writes go up;
  localStorage stays the source the UI reads," to avoid a hydration race).
  The actual read path is `getLogs()` — a `localStorage` dict keyed by
  date already loaded synchronously on every render. Each individual habit
  already draws its own 28-day streak-dot row and a 90-day heatmap
  (`renderHeatmap()`), so a *per-habit* sparkline would duplicate an
  existing visualization — same reasoning as `journal.html`/`physiology.html`
  in Wave 1. The aggregate view does not exist anywhere: added
  `#habits-done-spark` inside the `DONE TODAY` hero tile, summing
  completions across *all* habits per day, last 14 days (weekly-frequency
  habits collapse onto their week-key exactly like the existing dot/heatmap
  code already does — not a new behavior).
- **`vocabulary.html` — genuine candidate, zero new query.** `reviewLog`
  (`localStorage`, `{date, count}` per real drill session) already existed
  with no existing chart. Added `#vocab-review-spark` inside the `TODAY'S
  REVIEWS` tile, reading the same array `updateStats()` already loads.
- **`contacts.html` — genuine candidate, zero new query.** `interactions`
  (`localStorage`, `{contactId, date, channel, quality}` per logged touch)
  already existed; its own `#net-canvas` chart is a tier/composition
  breakdown, not a time trend, so no duplication. Added
  `#contacts-touch-spark` inside `CONTACTED THIS MONTH`, counting total
  interaction events per day (a different, still-real cut than that tile's
  own unique-contacts-this-month number).
- **`clarity.html` — genuine candidate, zero new query.** `sessions`
  (`localStorage`, `{date, done, total, complete}` per real logged
  protocol run) already existed; its only canvas is a progress ring, not a
  trend chart. Added `#clarity-steps-spark` inside `AVG STEPS DONE`,
  reading `done` per day from the same array `updateStats()` loads.
- **`health.html` — genuine candidate, zero new query.** Real Supabase
  `health_logs` (RLS-scoped, `mind/heart/energy/body/soul/total/created_at`)
  already fetched (last 60 rows) by `loadHistory()`, which already computes
  a "last 14 entries" average per the page's own SCIENCE-tab copy. No
  existing chart. Added `#health-score-spark` inside the SOVEREIGN SCORE
  tile, taking the same `rows.slice(0,14)` reversed to chronological order
  — labelled "LAST 14 ENTRIES," not "LAST 14 DAYS," since real member
  logs are irregular, not daily; the module's own `nums()` filter (only
  finite values are plotted) means an entry-based series is honest here
  where a calendar-day series with invented zero-scores would not be.
- **`social.html` — Wave 3, built.** The gap Wave 2 deferred: no existing
  KPI tile to attach a mount to. Rather than leave it or invent numbers to
  fill a tile, built the real tile — one `.kpi-row`/`.kpi` (the platform's
  actual shared classes, not page-local CSS) added to the FEED tab, showing
  `BROADCASTS THIS WEEK` and a 14-day sparkline, both computed from
  `storedBroadcasts` (the same `social_broadcasts` fetch the page already
  makes, `limit(30)`, RLS-scoped, no new query). "THIS WEEK" only
  undercounts, never fabricates, in the edge case a member exceeds 30
  broadcasts in 7 days. A day with zero broadcasts is a true 0 — the
  stub-baseline render correctly shows a flat 14-zero line (14 finite
  values, all real zeros, same behavior as `dashboard.html` in Wave 1),
  not a hidden mount and not an invented number.
- **Re-confirmed exclusions:** `achievements.html` (`unlockLog` exists but
  achievements unlock rarely, not daily — a 14-day window would sit below
  the module's own 2-finite-value floor for most members, correctly
  staying hidden rather than showing a misleading near-empty line);
  `chronicle.html`, `signal.html` (grepped for a `_KEY = 'omega_...'`
  constant pattern too, not just a literal `localStorage.setItem('omega_...`
  call — see Wave 4's correction below for why the narrower grep was not
  enough — genuinely zero matches on either page); `expenses.html`/
  `revenue.html` (each already has a dedicated trend canvas —
  `#trend-canvas`/`#monthly-canvas`,`#rev-canvas` — consolidation-only,
  same as Wave 1's `journal.html`/`physiology.html`).

**Correction (Wave 4):** this wave's own grep —
`localStorage\.(setItem|getItem)\('omega_[a-z_]+'` — only matches a
*literal* string argument. `affirmations.html`, `library.html`,
`rituals.html`, `targets.html`, `wealth.html`, `time.html`, and
`reading.html` all store their key in a `const FOO_KEY = 'omega_...'`
variable and call `localStorage.setItem(FOO_KEY, ...)` — the literal
string appears once, on the constant declaration, never inside the
`setItem(`/`getItem(` call itself, so the grep found nothing and this
wave wrongly reported "zero matches on either" for all seven. Re-audited
each with `_KEY\s*=\s*['"]omega_` instead — see Wave 4 below for what
that found and what was actually built vs. correctly still excluded.

Verified each of the 5 shipped pages in a real headless render: seeded
realistic, gap-including `localStorage` logs (or, for `health.html`,
confirmed the harness's empty-array Supabase stub correctly leaves the
mount `hidden` — the anti-fabrication guard working as designed — then
called `window.OmegaSpark.render()` on the live mount with a synthetic
series to prove the render path itself handles real variation). All 5
produced a real `<svg>` with a genuinely varying series where seeded, or
stayed correctly hidden with insufficient data. `scan.js errors`: 0/5.
`scan.js overflow`: 0/5. `python3 scripts/check-inline-js.py`: clean.
`python3 scripts/audit.py`: 0 critical / 6 warnings (baseline).

**Wave 4 — SHIPPED, correcting Wave 2's grep methodology.** Re-audited the
7 pages Wave 2 wrongly cleared, reading each real log before deciding —
same discipline as every prior wave, applied to this wave's own mistake:

- **`wealth.html` — genuine candidate, built.** `getSnapshots()`
  (`localStorage`, `{date,nw,change}`) already exists — a real,
  member-initiated ("SAVE SNAPSHOT" button) net-worth history — with only
  a plain text list (`renderHistory()`) to show it, no compact trend.
  Added `#wealth-nw-spark` inside the net-worth hero box, reading
  `getSnapshots().slice(-14)` chronologically. Snapshots are manual and
  irregular, so labelled "LAST 14 SNAPSHOTS," not "LAST 14 DAYS" — same
  reasoning as `health.html` in Wave 2.
- **`affirmations.html` — genuine candidate, built.** `markRead()` already
  logs `{date,count}` per real practice session (`omega_aff_log`). The
  page already visualizes this data twice — a 30-day binary streak-dot
  grid and a 14-row text list — but neither shows *count* (magnitude),
  only presence or raw text, so a sparkline of daily count is additive,
  not a duplicate. Added inside the `TODAY` stat-box in the TRACK tab
  (`renderTracking()`, itself lazy-rendered on tab switch — confirmed by
  driving the real tab click, same as `gratitude.html` in Wave 1).
- **`rituals.html` — already done, not a gap.** Has a real, fully-wired
  `#spark-rituals` mount and `drawRitualSpark()` function, more carefully
  reasoned than this wave's own new work: it deliberately excludes "today"
  from the series since the day is still open, avoiding a misleading
  apparent drop. Built before this session; Wave 2 simply never looked
  closely enough to find it. No action needed — confirmed by reading the
  function, not just grepping for the key.
- **`time.html` — real data, already charted.** `TIME_KEY`'s log is real,
  but the page already has a "7-DAY FOCUS TREND" `#daily-canvas` drawing
  exactly this trend. Consolidation-only, same as `journal.html`/
  `physiology.html` in Wave 1.
- **`library.html`, `targets.html`, `reading.html` — real logs, correctly
  still excluded, for a different and more precise reason than Wave 2's
  "no signal found."** `library.html`'s `shelf.push` and `reading.html`'s
  book `addedAt` are per-book events (occasional, not daily); `targets.html`'s
  `reviews.push` is an explicitly *weekly* review cadence
  (`getISOWeek`), each entry qualitative text with no single numeric value
  to plot. All three would sit below the module's own 2-finite-value floor
  for most members in any 14-day window — same reasoning as `achievements.html`,
  correctly excluded in Wave 2 for the right reason, just not extended to
  these three because Wave 2 never found their logs in the first place.

Verified `wealth.html` and `affirmations.html` in a real headless render:
seeded realistic data, confirmed a genuine varying `<svg>` in both (driving
the real TRACK-tab click for `affirmations.html`, not calling the render
function directly). `wealth.html`'s series correctly returned fewer than
14 points when fewer snapshots existed (11 seeded → 11 plotted), rather
than padding with fabricated zeros. `scan.js errors`: 0/2. `scan.js
overflow`: 0/2. `python3 scripts/check-inline-js.py`: clean. `python3
scripts/audit.py`: 0 critical / 6 warnings (baseline). `python3
scripts/repository_integrity_audit.py`: PASS.

**`journal.html`/`physiology.html` — consolidation decision closed: no
change.** Deferred in Waves 1 and 2 as "a decision, not this pass's scope."
Read both real implementations before deciding: `journal.html`'s
`drawWCChart()`/`drawMoodChart()` and `physiology.html`'s `drawTrend()`
(one instance per metric: RHR, HRV, BP, weight) are full-width, 30-day
canvas line/bar charts with Y-axis gridlines and numeric min/max labels,
rendered inside a dedicated INSIGHTS/TRENDS section built for exactly
this purpose. `omega-sparkline.js` is a 120×28px compact glance-badge
meant to sit beside a KPI number, not a substitute analytical view.
Swapping either page onto the shared module would trade a more detailed,
purpose-built chart for a smaller, less informative one — a downgrade
presented as a consolidation. Closed with no code change: both pages keep
their existing charts.

**Wave 5 — a widened audit beyond `localStorage`-key patterns, to check
whether Waves 1-4 had exhausted the real candidates.** Broadened the grep
past both prior patterns (`localStorage.(setItem|getItem)('omega_...`
and `_KEY = 'omega_...`) to any `push`/`unshift` of an object literal
carrying a `date`/`day`/`ts`/`at` field, across every page not already
covered or already decided, then filtered to pages with **zero** existing
`<canvas>` chart of their own (`achievements.html`, `charter.html`,
`passport.html`, `projects.html`) plus pages whose only canvas is the
shared, unrelated authority-ring widget (`contributions.html`,
`governance.html`, `heritage.html`, `horoscope.html`, `kings.html`,
`notifications.html`, `oracle.html`, `payments.html`, `publications.html`
— all `<canvas data-omega-ring>`, not a chart).

Read each real log before deciding, same discipline as every prior wave:

- **`contributions.html`'s `gifts` array (`{org,amount,date}`) is a real
  find** — structurally identical to Wave 4's `wealth.html` net-worth
  snapshots: a member-initiated, dated, *numeric* log, shown only as a
  totals row (`g-total`/`g-annual`/`g-pct`) and a text list, no chart.
  Added `#gift-amount-spark` inside the GIVING LEDGER tab's KPI block,
  fed the last 14 real gift amounts in `renderGifts()`, labelled "GIVING,
  LAST 14 GIFTS" (not "...DAYS" — gifts are irregular, same framing as
  `wealth.html`'s snapshot spark).
- `achievements.html`'s `unlockLog`, `passport.html`'s `stamps` — real
  dated logs, but each entry is a one-time, non-repeating unlock/stamp
  per achievement/trip, the same low-cadence shape Wave 4 already
  excluded `library.html`/`targets.html`/`reading.html` for. Correctly
  excluded, same reason.
- `charter.html`'s `history`, `kings.html`'s `studyNotes`,
  `governance.html`'s `risks`/`policies`/`decisions`,
  `heritage.html`'s `stories`, `notifications.html`'s `reminders`,
  `publications.html`'s `pubs` — real logs, but **no numeric field at
  all**: each entry is an edit-audit trail, a qualitative note, or a task,
  not a measurement. A sparkline plots a number over time; there is
  nothing here to plot. Different data shape than the sparkline module
  was built for, not a missed candidate.
- `horoscope.html`'s `candidates` and `oracle.html`'s `rows` are
  internally computed arrays (season dates, generated affirmation text),
  never a member log at all.
- `payments.html`'s `rows` push formula (`(i+1)*91.717`) reads as a
  synthetic/computed reward ledger rather than real transaction data —
  flagged here as a candidate for a future, separate look under
  `CLAUDE.md` §8.1 class 9 (fabricated data rendered as fact); out of
  scope for this sparkline pass and not touched.

Verified `contributions.html` in a real headless render: clicked the real
GIVING LEDGER tab, logged three real gifts through `window.addGift()` (the
actual button handler, not a direct render call), confirmed the mount
un-hid, rendered a real SVG polyline from the actual `[50,120,30]` series,
zero horizontal overflow, zero console errors. Screenshot confirms correct
placement between the KPI row and the giving-target form with no layout
shift.

```
scan.js errors / overflow (contributions.html)   0/1 each
python3 scripts/check-inline-js.py               OK
python3 scripts/audit.py                         0 critical / 6 warnings (baseline)
```

**Source inspiration:** Stripe dashboard card pattern (metric + trend arrow
+ percentage + sparkline; 925 Studios' "Stripe Dashboard Design Breakdown:
Trust Through Clarity"); the 2026 dashboard-design consensus that
Linear/Stripe/Grafana/Vercel all converge on structured tables + sparkline
summaries over chart-heavy layouts (Improvado's Stripe analytics guide;
Muzli's "50 Best Dashboard Design Examples for 2026").

## 28. Glass-HUD signal accent — a second, restrained motif for hub pages without a 3D mount (visual design system)

**Grounded in:** `omega-sculpture.js` (73,363 bytes, live, 5 pages mount it
via `data-omega-sculpture`) already carries this platform's sci-fi/HUD
visual identity — PBR metal emblems, a procedural `PMREMGenerator`
environment, per-mount 2-D-canvas bloom (`CLAUDE.md` §4, 35 bloom/env
references in the file). But `bg.js` deliberately injects the 670KB
three.js-backed module "only where a mount exists" — meaning the other
~199 pages get none of this platform's signature sci-fi identity at all,
not even a lighter echo of it. The Ω-GVP layer's `.glass`/`.card` shimmer
(`bg.js`, hover-only cursor-reactive light) is the closest thing those
pages have, and it only activates on `:hover`.

**Idea (visual design system, CSS-only, no new heavy module):** a single
restrained accent — a slow, low-opacity conic-gradient "signal sweep" drawn
as a `::before`/`::after` pseudo-element on `.glass`/`.card-edge` surfaces,
GPU-composited (`transform`/`opacity` only, matching this platform's own
motion rules), applied to exactly the handful of hero/header surfaces on
pages that have *no* `data-omega-sculpture` mount — giving those pages a
cheap, native-CSS echo of the sculpture pages' HUD identity instead of
nothing. This is deliberately **not** proposed as a platform-wide sweep:
the same restraint principle that shipped `.omega-spin-slow` as "one motif,
three surfaces" (`#19`, Phase 1/2) applies here — a card-edge glow strip on
every `.card` platform-wide would be exactly the "busy" outcome this
platform's own brief already warned against, and Ω-GVP's existing
hover-only shimmer already owns ambient card motion. Candidate surfaces:
`dashboard.html`'s mission-bar, `treasury.html`'s hero, `intelligence.html`'s
header — three high-traffic hub pages, matching `#19`'s own three-surface
precedent, picked because they read as the platform's control-room/command
identity most directly.

**User benefit:** every free/approved member visiting these three
high-traffic hubs — no tier gate, pure visual identity.

**Nav placement:** none — visual design system only, no new page.

**Data needs:** none. Pure CSS on existing markup; no new fetch, table, or
RPC.

**Source inspiration:** the 2026 sci-fi/command-center HUD consensus that
these effects are now built with native CSS rather than pre-rendered video
— "holographic radar grids... rendered natively using repeating
conic-gradient()... atmospheric energy glows and translucent glass shields
leverage backdrop-filter: blur()... rotating elements run on GPU compositor
layers to protect Interaction to Next Paint" (aggregated 2026 CSS sci-fi/HUD
search results, freefrontend.com's "3 CSS Sci-Fi Style Examples", HUD
pattern surveys at scifiinterfaces.com); Bloomberg-terminal-style dark,
dense, monospace-numeral command surfaces (OpenTerminal and
bloomberg-terminal open-source projects, both explicitly "dark, dense,
keyboard-driven" builds) as the tonal reference for which three pages
should get this treatment first.

## Blueprint (feature-architect, 2026-09-20)

**Confirmed scope, re-verified against live files (not assumed from the
proposal text):** `grep -c data-omega-sculpture` on all three target pages
returns 0 — none mounts the 3-D layer. Each page's real header element:

| page | header element | class |
|---|---|---|
| `dashboard.html` | `.mission-bar` (page-local, line 17/109) | add `omega-signal-sweep` |
| `treasury.html` | `.topbar` (shared, `css/omega-system.css`) | add `omega-signal-sweep` |
| `intelligence.html` | `.topbar` (shared, `css/omega-system.css`) | add `omega-signal-sweep` |

**Collision check (the part a sweep like this lives or dies on):**
`.topbar` already owns `::after` — `omega-visual-evolution.css`'s travelling
seam (`omega-seam 7s`, confirmed at `omega-visual-evolution.css:152,237`).
`::before` on `.topbar` is unclaimed (grepped `css/omega-system.css`,
`omega-visual-evolution.css`, `bg.js`, `theme.js` — 0 hits). `.mission-bar`
is page-local to `dashboard.html` and owns neither pseudo. Both elements
already carry `position:sticky` (`css/omega-system.css:94`,
`dashboard.html:17`), which is a valid containing block for an
`inset:0`-sized absolutely-positioned child — no new `position:relative`
needed, and critically **no `overflow:hidden` added to either element**:
`.topbar` carries its own drop shadow (`omega-visual-evolution.css:150`,
`0 8px 35px` extending past its own box) and clipping would silently erase
it, exactly the class of bug `CLAUDE.md` §4 warns about for this file.

**Where it's defined — `css/omega-system.css`, not `bg.js`.** Per
`CLAUDE.md` §4's ownership table, every palette/motif token lives here (and
in `theme.js`), never in `bg.js`; `.omega-spin-slow` is the direct
precedent (defined `css/omega-system.css:363-364`, applied via explicit
class on exactly one mount in `profile.html`, not a sweep). New rule added
immediately after it in the same `── ANIMATIONS ──` block:

```css
/* Signature HUD motif #2: a restrained conic "signal sweep" for hub headers
   with no data-omega-sculpture mount. Opt-in class, not a platform sweep --
   FEATURE_IDEAS.md #28. Sized to inset:0 so it never exceeds its own box:
   no overflow:hidden needed, which would otherwise clip .topbar's own
   drop shadow (omega-visual-evolution.css). ::before is free on .topbar
   (::after is its existing seam) and on .mission-bar (unclaimed). */
.omega-signal-sweep{position:relative;isolation:isolate}
.omega-signal-sweep::before{
  content:"";position:absolute;inset:0;pointer-events:none;z-index:0;
  background:conic-gradient(from 200deg at 12% 50%,
    transparent 0deg, rgba(0,229,255,.12) 22deg, transparent 55deg,
    transparent 305deg, rgba(201,168,76,.12) 338deg, transparent 360deg);
  opacity:.8;
  animation:omega-signal-sweep-rotate 34s linear infinite;
}
@keyframes omega-signal-sweep-rotate{to{transform:rotate(360deg)}}
@media(prefers-reduced-motion:reduce){.omega-signal-sweep::before{animation:none}}
```

`isolation:isolate` on the class keeps the pseudo's stacking local to the
bar (so `z-index:0` can't fight the page's own stacking contexts); the bar's
real content (`.t`, the auth ring, nav) is unaffected since none of it is
`position:absolute` inside these bars, so normal flow paints above the
pseudo without needing a z-index bump. `rotate` (not `background-position`)
is used here deliberately — unlike the `body::before`/`.card` sheen this
file already runs on `background-position` (`omega-field-drift`,
`omega-seam`), a *conic* gradient's own geometry is the sweep, so rotating
the pseudo-element's transform is the correct GPU-composited primitive
(`transform`-only, matches `.omega-spin-slow`'s own rule) rather than
reinterpolating the gradient definition every frame.

**Page changes — one class attribute each, no markup restructuring:**
- `dashboard.html`: `<div class="mission-bar">` → `<div class="mission-bar omega-signal-sweep">`
- `treasury.html`: `<div class="topbar">` → `<div class="topbar omega-signal-sweep">`
- `intelligence.html`: `<div class="topbar">` → `<div class="topbar omega-signal-sweep">`

**Data needs:** none — pure CSS, zero new fetch/table/RPC, confirmed by the
proposal itself.

**Verification plan for `autonomous-coder`:**
1. `python3 scripts/audit.py` — no new CRITICAL findings (CSS-only change,
   no new file).
2. Render all three pages headless: confirm `getComputedStyle` on the
   `::before` shows the conic-gradient background and `animation-name` is
   `none` under `page.emulateMedia({reducedMotion:'reduce'})` (see this
   session's earlier finding that `S.launch({reducedMotion})` itself is not
   wired — call `emulateMedia` directly after `S.open()`).
3. Screenshot each of the three bars at rest and confirm: (a) the existing
   `.topbar::after` seam and drop shadow are still visually present
   (proves no clipping regression), (b) header text/ring/nav contrast is
   unaffected (the sweep sits at `z-index:0`, `opacity:.8` on a gradient
   that is mostly `transparent`), (c) no horizontal overflow introduced
   (`scan.js overflow` on these three pages).
4. Confirm the class was **not** added to any 4th page — this is a
   3-surface opt-in motif by design, matching `#19`'s own precedent; a
   platform-wide `.topbar` sweep would be the "busy" outcome the proposal
   explicitly rejects.

**A 4th surface — considered, closed with no code change.**
`command.html`'s `.topbar` (`<div class="t">DAILY COMMAND BRIEF<small>
STRATEGY · OPERATIONS · SYD OMEGA 91717</small></div>`) reads, if anything,
*more* directly as command/control-room identity than `treasury.html` or
`intelligence.html` — no `data-omega-sculpture` mount, real `.topbar`,
genuinely a candidate on the same criteria used to pick the original three.
But this proposal's own blueprint step 4 above states the restraint
explicitly: three surfaces, matching `#19`'s "one motif, three surfaces"
precedent, specifically to avoid "the busy outcome this platform's own
brief already warned against." A 4th page meeting the same criteria is not
new evidence against that reasoning — it is exactly the situation the
3-surface cap was written to hold the line against, since a genuine
platform-wide sweep is never short of qualifying pages one at a time.
Overriding a documented restraint decision needs a reason the decision
didn't already anticipate; this isn't one. Closed: `command.html` keeps
its plain `.topbar`, no `omega-signal-sweep` class added.

## 29. Live signal pulse — a real, ambient "the platform is alive" indicator (visual design system)

**Feature name & concept:** a small pulsing dot, restrained and always
present (not just on error), that flashes once on every real successful
request to this platform's own backend — a native-CSS "heartbeat" living
beside the existing authority ring / topbar chrome, giving members a
constant, honest signal that the page is actively syncing rather than
frozen. Not a status message, not text, not a toast — a single glanceable
dot, the visual equivalent of a hard-drive activity light.

**Grounded in:** `bg.js:1-47`'s data-fetch recorder — already installed,
inline, on every gated page, wrapping `window.fetch` for every request to
this platform's own backend (`.supabase.co/`, `/rest/v1/`, `/auth/v1/`,
`/functions/v1/` — `watched()`, line 25-29) and emitting a real
`document.dispatchEvent(new CustomEvent('omega:fetch-settled',{detail:{ok,
status}}))` on every settlement (line 31, fired at lines 43 and 45). Today
exactly one consumer exists: `omega-dataguard.js`, which listens for this
event but by design only ever *reacts to failure* — its own header states
the deliberate scope: "no alarm for an empty result set... the network is
the only source of truth." A `{ok:true}` settlement — the overwhelming
majority of real events on a healthy page — is currently observed by
nothing and shown nowhere. This proposal is a second, independent
consumer of the same real event stream, not a change to `omega-dataguard.js`
or a duplicate of its job: dataguard answers "is something wrong,"
this answers "is something happening" — a different question. Zero new
Supabase call, zero new column, zero new table.

**User benefit:** every free/approved member, on every gated page — pure
visual/ambient identity, no tier gate. Matches the platform's own
`omega-cinematic-system` skill's "Signal pulse — status indicator tied to
actual system state" pattern (an already-documented interaction category
in this repo's own design brief) that has not yet been built against a
real, always-on signal, only against page-specific one-off states.

**Nav placement:** none — a `bg.js`-level ambient chrome addition, not a
new page. Candidate mount point: beside the existing `data-omega-ring`
authority-ring canvas already present in most topbars (e.g.
`treasury.html:19`, `social.html:46`, `health.html:44`), since that is
already the platform's established "live, per-member status" real estate.

**Data needs:** none — reads the existing `omega:fetch-settled` event
`bg.js` already emits from real requests already being made. No new
fetch, table, RPC, or column.

**Source inspiration:** the 2026 dashboard-design consensus on "real-time
compliance pulses" as a defining feature of modern dark-mode dashboards
(Lucky Graphics' "UI Design Trends 2026: Glassmorphism Evolution, AI
Interfaces, and Dark Mode Excellence"; Muzli's "50 Best Dashboard Design
Examples for 2026" on frosted-glass dashboards built around real-time
status/workflow indicators); the general "activity LED" pattern from
system-status UIs (Vercel's/Linear's own small live-status dots being the
closest real-world analogue, though neither was scraped directly — the
pattern is described consistently enough across the 2026 dashboard-trend
sources above to ground the concept, not any one product's exact pixels).

**Explicitly not proposed:** replacing or modifying `omega-dataguard.js`,
which stays exactly as scoped (failure-only, no false alarms on a healthy
empty result). Nor a persistent always-visible "ONLINE" text label — the
research is consistent that the dot/pulse itself, not a text state, is
what reads as ambient rather than alarming.

## 30. Cross-document View Transitions — a native "one continuous space" feel across every page, added and then deliberately left non-load-bearing

**Grounded in:** a direct request to make the platform's 204 separate static
pages feel unified ("entering a universe", not 204 documents) *without*
introducing the build step, framework, or single-page-app rewrite `CLAUDE.md`
§1/§9 make explicitly off-limits for this repo. The real browser feature built
for exactly this — animating between two full page loads on a static
multi-page site — is the Cross-Document View Transitions API
(`@view-transition{navigation:auto}`), shipped in Chromium 126+. Because
`bg.js` already injects one shared stylesheet into every page, the entire
opt-in is a few lines in that one file: no per-page markup, no router, no
build step.

**What shipped:** the CSS rule (plus themed `::view-transition-old/new(root)`
keyframes: a soft scale+blur+fade "warp," gated correctly under
`prefers-reduced-motion` on all three pseudo levels — `::view-transition-group`,
`-old`, and `-new`, not just the first, since the browser's own default
crossfade lives on the latter two and a partial override leaves it running).
Verified present and parsing correctly as a real `CSSViewTransitionRule` on
live pages, verified zero new console errors across a 204-page sweep, verified
harmless on unsupported browsers (an unknown at-rule is silently ignored).

**What did NOT ship, and why this is not a normal "done" entry:** this session
could not get a positive activation signal (`pagereveal`'s `viewTransition`
property) on an actual navigation between two of this repo's real pages,
despite the identical CSS firing correctly on a from-scratch two-file
reproduction on the exact same Chromium 141 binary. Investigated and ruled
out as the cause: `beforeunload` listeners (several omega-*.js modules have
them; reproduced with one present in isolation — no effect), a service-worker
registration attempt (disabled it directly — no effect), a conflicting second
`@view-transition` rule (none found), pending/failed network requests at
navigation time (waited for `networkidle` plus 3s settle — no effect),
response headers (identical between the two test servers, one working one
not), and the one real client-side `location.replace` redirect path in
`bg.js` (gated behind trial/approval checks not on this navigation's path).
Bisecting `bg.js` itself by content (not just line count, which kept landing
mid-construct) narrowed the cause to *something* in the file's other logic
rather than the CSS itself or this repo's page markup, but did not find the
specific line before hitting diminishing returns on the investigation.

**The decision this forced, and why it is the correct one:** the original
plan fed browser-capability detection (`'startViewTransition' in document`)
into turning OFF the pre-existing, verified-working manual `#omega-veil`
transition, on the theory that the native one would take over. Proving the
capability exists is not the same as proving a given navigation will
actually use it — and this repo's own real pages demonstrated exactly that
gap. Shipping the capability-gated version would have been a silent
regression for every visitor on a browser that reports `supportsVT: true`
but doesn't actually activate the transition on this repo's pages: they
would get neither the native transition nor the fallback. That is the exact
failure shape `CLAUDE.md` §8.4 already has a name for — "a rule that reached
the file but not the cascade... looks correct in the diff." So the manual
veil was restored to run **unconditionally**, exactly as it did before this
change, and the CSS rule was kept as a pure, harmless addition layered on
top: since the veil already fades the outgoing frame to opaque black *before*
`location.href` fires, any case where the native transition does activate
just crossfades from that black frame into the new page underneath the
veil's own removal — additive, not a second, competing animation the member
would perceive as a conflict.

**Re-verified in a real, non-headless browser — the mystery narrowed, not
solved, and headless was ruled out as the explanation.** `xvfb-run` gave a
genuinely headed Chromium (not the headless mode the first investigation
used) against a real X display. The cleanest, most valid comparison —
identical stub setup (the real Supabase-client stub this harness always
needs, since without it every page's real, unstubbed auth check makes a
network call to `supabase.co` that this sandbox's egress policy rejects,
which triggers `bg.js`'s own `location.replace`-based auth redirect to
`account.html` and contaminates the result with an unrelated navigation),
`PRIMED_STORAGE`, overlay dismissal, across four different real page pairs —
showed **`false` in both headed and headless mode, identically**. Headless
rendering is therefore not the explanation; whatever disqualifies the
transition on this repo's real pages does so in a real browser too.

Two further things surfaced along the way, kept here rather than treated as
resolved:
- Testing *without* the Supabase stub (to rule out `ctx.route()`
  interception itself as a factor) hit exactly the redirect chain above —
  `dashboard.html` → `account.html` on every run, both headed and headless,
  once egress to `supabase.co` was confirmed rejected
  (`connect_rejected ... organization policy`) rather than merely slow. That
  redirect is real `bg.js` behavior (the `safeRedirect()`/`location.replace`
  path, `bg.js:1774`), not a view-transition artifact, but it is *specific to
  this sandbox's network policy* — production reaches the real
  `ydqhzvvoyufiiqvzcjns.supabase.co` and would not hit it. One single such
  unstubbed run, before the redirect chain was understood, showed
  `hadViewTransition: true` on the hop that happened to fire mid-redirect;
  it did not reproduce across repeated identical runs and is recorded here
  only so a future session does not rediscover it as new signal — treat it
  as noise from an invalid (redirect-contaminated) test, not evidence either
  way.
- `ctx.route()`-based interception (the mechanism this harness's Supabase/
  font stubs use) was tested in isolation (`route().abort()` on the same
  unreachable domains, to keep the interception without the slow real
  network failure) and also showed `false`, headed and headless alike — so
  route-interception-as-such is not obviously the cause either, though it
  cannot be fully separated from the redirect confound above without a
  network egress this sandbox does not grant.

**Conclusion this session is willing to stand behind:** under every
controlled, valid (non-redirect-contaminated) test run this session could
construct — headless and headed, both with the stub required for a working
authenticated session — cross-document View Transitions did not activate on
this repo's real pages. This is now a stronger, better-isolated finding than
the original headless-only result, not a resolved one: the specific
disqualifying factor in `bg.js` or these pages' markup remains unidentified.
The shipped CSS stays exactly as reasoned before — harmless, additive, kept
alongside the unconditional manual veil — since a real production
environment (real, reachable Supabase, no test-harness interception) is the
one condition this session could not reproduce, and is therefore the one
place this could still turn out to work. Re-verifying against the real
deployed site (not this sandbox) is the only test left that would actually
close this out.

```
node --check bg.js                                OK
python3 scripts/check-inline-js.py                 OK -- every inline <script> block parses cleanly
python3 scripts/audit.py                           0 critical / 6 warnings (baseline, unchanged)
scan.js errors (204 pages, full sweep)              0/204
CSS rule presence on live pages                     confirmed: CSSViewTransitionRule, navigation:auto
prefers-reduced-motion coverage                     confirmed: group + old + new pseudo levels all gated
manual #omega-veil fallback                         confirmed present and unconditional, unchanged behavior
headed-browser re-test (xvfb-run, 4 real page pairs) false in both headed and headless under valid (stubbed, non-redirecting) conditions
```

## 31. The constellation ring becomes a real navigable universe map — plus a real cross-module class collision found and fixed along the way

**Grounded in:** `omega-constellation.js` (CLAUDE.md §4.1) already draws a real, well-built ring of the 12 agent emblems on `agents.html` and `pantheons.html` — but every one of its 12 nodes hard-coded `href:'/agents.html'`, so all 12 were decorative dead ends pointing at the same page rather than a real map of anything. `omega-agents.json` already carries each agent's real `domains` array (e.g. Sentinel: `security, access, protection, threats, privacy`); nav.js's own `SECTIONS` array is the platform's real routing table, with real per-page sub-links (`PRIVACY` → `/privacy.html`, `ORACLE PREDICT` → `/prediction.html`, etc.).

**What shipped:** a mechanical, non-subjective matching pass — every agent's own `domains` keywords searched as literal substrings against every real `SECTIONS` sub-link's slug/label across the whole nav — resolved all 12 agents to a genuinely real, existing page with no manual judgment calls needed:

| agent | resolved via | destination |
|---|---|---|
| Sentinel | `privacy` | `/privacy.html` |
| Merchant | `treasury` | `/vault.html#reserve` |
| Scout | `search` | `/search.html` |
| Warden | `family` | `/family.html` |
| Sovereign | `command` | `/command.html` |
| Auditor | `compliance` | `/compliance.html` |
| Proxy | `contracts` | `/contracts.html` |
| Oracle | `prediction` | `/prediction.html` |
| Beacon | `vision` | `/vision.html` |
| Analyst | `intelligence` | `/intelligence.html` |
| Tutor | `academy` | `/academy.html` |
| Historian | `heritage` | `/family.html#heritage` |

Added as an `href` field directly on each agent in `omega-agents.json` — a property of the agent itself, not a second copy of nav.js's routing table (CLAUDE.md §8.1 class 8) — with `omega-constellation.js`'s `nodesFor('agents')` reading `a.href` per-node instead of the old hardcoded single destination, falling back to `/agents.html` for any future roster entry with none. The module's own `FALLBACK_AGENTS` (used only if the JSON fetch fails) got the same hrefs, kept in sync by hand since it is a small, static array.

Mounted the same ring on `dashboard.html` — the platform's actual, highest-traffic front door — replacing a hand-rolled `#agent-quick` grid whose 12 cards had the *exact same* bug (`onclick="location.href='/agents.html'"` on every card). One canonical, now-fixed component instead of two independently-broken ones.

**A real, previously-invisible bug found while verifying, not assumed.** Rendering the new dashboard mount showed 6 of the 12 nodes with a solid gold background and 6 dimmed — reproducibly, identically, across repeated runs, at every settle time tried (ruling out a load-timing race). Traced with a real rule-matching script (walk every stylesheet, test `element.matches(selector)`) rather than guessing: `css/omega-cinematic-animations-phase2.css` already owned `.ocn-node`/`.ocn-orbit` for a *completely unrelated* decorative "constellation backdrop" star-field effect (`.omega-constellation-backdrop`, dead code — grepped all 204 pages, zero create that container), and `omega-cinematic-animations-phase2.js`'s `updateConstellationNodes()` calls `document.querySelectorAll('.ocn-node')` with **no scoping to its own backdrop container**, plus a `MutationObserver` that re-fires the same unscoped query on every DOM insertion. So the moment `omega-constellation.js` mounted real ring nodes, this dead module's CSS (`background:var(--page-accent)`, a `constellation-pulse` animation) and JS (staggered `animationDelay` values cycling `[0,1.5,0.8,1.3,0.5,1.1]`) silently painted over them — a second, textbook case of CLAUDE.md §8.1 class 5 ("a guard/class name is the module's identity, not the feature area's"), and one that had been live and corrupting `agents.html`'s and `pantheons.html`'s *existing* rings the whole time, just masked there by the purple page-accent tint reading as a plausible "themed" look rather than an obvious bug.

Fixed by renaming the dead, never-mounted intruder — `.ocn-node`/`.ocn-orbit`/`.ocn-link`/`.ocn-focal` → `.ocnbg-node`/`.ocnbg-orbit`/`.ocnbg-link`/`.ocnbg-focal` across `css/omega-cinematic-animations-phase2.css`, `omega-cinematic-animations-phase2.js`, `css/omega-cinematic-animations-phase3.css`, `omega-cinematic-animations-phase3.js` — never the real, working, meaningfully-used module. Zero risk: confirmed by grep that no page ever creates the backdrop's own container, so nothing depended on the old names for their intended effect.

Verified in a real headless render, not just the diff: `agents.html`'s COUNCIL tab now shows each node in its own correct per-sign emblem colour (fire/water/wind/metal/sand) instead of a flat purple box on every node; the new `dashboard.html` mount shows the same correct colours with zero alternation; all 12 dashboard nodes resolved to 12 *distinct* real hrefs (checked via DOM query, not assumed); zero horizontal overflow on `dashboard.html`/`agents.html`/`pantheons.html`; zero console errors across all three.

```
node --check (constellation.js, phase2.js, phase3.js)   OK
python3 scripts/check-inline-js.py                       OK
python3 scripts/audit.py                                 0 critical / 6 warnings (baseline, unchanged)
dashboard.html: 12 nodes, 12 unique hrefs                confirmed via DOM query
dashboard/agents/pantheons: overflow                     false / false / false
dashboard/agents/pantheons: console errors               0 / 0 / 0
.ocn-node collision (rule-matching script, before/after)  identical colliding rule found, then gone
scan.js errors (204 pages, full sweep)                    0/204
python3 scripts/omega-registry.py --check                 OK (regenerated for byte-size drift)
python3 scripts/module-contract.py                        0 broken, 127 contracts
python3 scripts/reachability-contract.py                  OK -- every destination linked
python3 scripts/omega_fabric_audit.py                     VERIFIED=8 UNVERIFIED=1 (baseline), 12 agents still bind correctly
```

## 32. Real 3-D sculpture coverage extended to agents.html and pantheons.html — matrix.html considered and correctly excluded

**Grounded in:** `omega-sculpture.js`'s real three.js layer (CLAUDE.md §4) mounts on only 5 of 204
pages (`ascension`, `elements`, `gates`, `index`, `sculpture`), and two of its six built-in scene
types — `agents` (a 12-spoke wheel around the Ω, alternating cyan/gold cube nodes) and `matrix`
(a 9×9×9 dot grid) — are fully implemented and already demoed on `sculpture.html`, but were never
actually mounted on the real pages their names describe. bg.js injects the 670KB module only where
a `[data-omega-sculpture]` mount exists, so extending coverage costs nothing on any other page.

**Shipped:** the `agents` scene mounted on `agents.html`'s COUNCIL tab (above the existing
`omega-constellation.js` ring — the sculpture is the real-time 3-D centrepiece, the ring stays the
navigable map, neither duplicates the other) and on `pantheons.html`'s Olympians tab (a genuinely
real second use for the same scene: pantheons.html's own header comment already documents that a
second *ring* was considered and rejected as duplicating cosmos/houses's existing wheels — the
sculpture is a different visual register, not a second ring, so it does not hit that same
objection). Both use the shared `.osc-stage` class already defined once in `css/omega-system.css`
and injected on every page — no new CSS.

**`matrix.html` considered and excluded, not just skipped.** It already has a real, working
`#matrix-canvas` — a "3D Matrix Projection" panel labelled "9×9×9 = 729 inner nodes", the identical
concept the sculpture's `matrix` scene renders. Mounting the sculpture there would be two
competing visualisations of the same 729-node idea on one page, not a genuine addition — the same
"read from the one thing that already covers this" discipline this file has applied to
`journal.html`/`physiology.html` (Wave 1) and `time.html` (Wave 4).

Verified in a real headless render, not assumed from the diff: both new mounts produce a real
canvas with a non-zero drawing buffer (`scan.js canvas`: 0 zero-buffer, 0 painting-nothing);
drew each canvas onto a fresh 2-D canvas via `drawImage` and sampled 292 / 244 distinct colours
respectively — real geometry, not a blank frame; screenshots confirm the same glossy, PBR-lit
signet-and-orbiting-cubes render already proven on `sculpture.html`; zero horizontal overflow,
zero console errors on both pages.

```
python3 scripts/check-inline-js.py                 OK
python3 scripts/audit.py                            0 critical / 6 warnings (baseline, unchanged)
scan.js canvas (agents.html, pantheons.html)        0 zero-buffer, 0 painting-nothing
distinct sampled colours (agents / pantheons)       292 / 244 -- real geometry, not blank
overflow / console errors (agents, pantheons)       false/false, 0/0
```

## 33. Sparkline audit, Wave 6 — the same discipline against Supabase-backed queries, not just localStorage

**Grounded in:** Waves 1-5 audited `localStorage`-based per-day logs exhaustively. This wave asked
a different question: which pages already fetch real, dated Supabase rows and render them as a
bare stat-box number with no existing chart? Grepped every page for `.order('created_at'/
'occurred_at', ...)` outside the pages Waves 1-5 already covered or decided, filtered to those with
no canvas already covering the same concept: `approvals`, `consultancy`, `enterprise`, `events`,
`family`, `feed`, `intelligence`, `news`, `observatory`, `profile`, `queue`, `travel`. Read every
one's actual query and rendering before deciding, same as every prior wave:

- **`intelligence.html`'s GRAPHIFY tab — real, and shipped.** `loadGraphStats()` already fetches
  the member's last 20 `graph_events` rows (`occurred_at`, real timestamps) to build the "RECENT
  GRAPH EVENTS" feed, right next to a flat `EVENTS LOGGED` count with no chart. Bucketed the
  *already-fetched* rows by calendar day (no new query) into `#graph-events-spark`, labelled
  "GRAPH EVENTS PER DAY, RECENT ACTIVITY" — not "LAST 14 DAYS," since only the days present in the
  most-recent-20 window are counted, never padded with invented zero days.
- `approvals.html`/`profile.html` query `profiles` ordered by `created_at`, but for a signup/admin
  list, not a personal numeric metric to trend. `consultancy.html`/`enterprise.html` query business/
  admin entities (`consult_requests`, `enterprise_accounts`, `api_keys`) with no numeric per-row
  field. `events.html`/`family.html`/`news.html`/`queue.html`/`travel.html` all fetch real, dated
  rows (`member_events`, `heritage_records`, `dispatches`, `travel_journeys`) that are qualitative
  records (title/body/category/notes) with nothing numeric to plot — same "different data shape"
  exclusion this file has applied before, not a missed candidate.
- `feed.html`'s `member_posts` carries real `likes_count`/`comments_count`, but per a shared feed of
  (potentially other members') posts, not the visiting member's own metric over time — doesn't fit
  the module's "my trend" shape without inventing an aggregation the page doesn't already compute.
- `observatory.html` has genuinely numeric SRE data (`error_budget_policy.budget_4wk_pct`,
  `platform_metrics.dimensions`) — but every query is `.limit(1).maybeSingle()`, the latest value
  only, no history fetched. A sparkline here needs a real query change, not wiring an existing
  fetch — a different, larger task than this pass's scope (reuse what's already fetched).

Verified `intelligence.html` in a real headless render: clicked the real GRAPHIFY tab (driving the
actual `loadGraphStats()` against the stub — correctly stayed hidden with zero real events, proving
the anti-fabrication floor holds); separately confirmed the bucketing algorithm itself (copied
verbatim from the shipped code) against a realistic fixture (`3,1,2` events across 3 real days)
produces the correct series and that the sparkline module renders it correctly once fed real data.

```
scan.js errors / overflow (intelligence.html)      0/1 each
python3 scripts/check-inline-js.py                 OK
python3 scripts/audit.py                           0 critical / 6 warnings (baseline, unchanged)
```

## 34. The dashboard's 133-chip "all pages" wall becomes searchable and collapsible — real personalization, zero pages removed

**Grounded in:** direct feedback that 204 pages is a lot for a member to navigate, and a request
to find "a smart and intelligent way to make these pages less without losing any features and
contents." Investigated whether the page *count* is actually the problem members would hit, or
whether it's a specific presentation of that count. `nav.js`'s sidebar already groups all 204 pages
into 15 sections — nobody browsing normally ever sees a flat list. The one place the raw scale
*does* hit a member unmediated is `dashboard.html`'s "PLATFORM COMMAND INDEX" panel: measured at
**133 chips across 15 sections, all rendered open and visible simultaneously, no filter, no
collapse** (`renderPlatformSections()`).

**Decision: don't reduce the page count.** Actually merging pages to shrink "204" would mean
rewriting `nav.js`'s routing, breaking every existing bookmark/external link into a merged page,
and fighting `reachability-contract.py`'s CI gate — real risk, for a number no member ever
confronts as a flat list today. That is the opposite of "less confusing": it trades a solved
navigation problem for a real architectural one. The actual, narrow problem — one panel showing
133 things at once — has a narrow, safe fix.

**What shipped:** `renderPlatformSections()` rewritten to add, with **zero pages added or
removed** (confirmed: still 133 chips, 15 sections, same 121 unique destination URLs):
- **Collapsible sections** — each section header is now a real `<button>` (keyboard-operable for
  free, no reliance on `omega-a11y-controls.js`'s sweep) toggling its chip list, with a page-count
  badge so a collapsed section still tells you how much is inside.
- **Per-member persistence** — which sections stay open is remembered in `localStorage`
  (`omega_platform_sections_collapsed`), a real personalization: a member who only ever opens
  FINANCE and WELLNESS gets that layout back on every future visit, not a fixed default.
- **A real, immediate search filter** — typing narrows chips to real substring matches on the page
  name and hides sections with zero matches; a match force-expands its section (a collapsed
  section stays discoverable, never hides a real match); clearing the search restores each
  section's own remembered collapse state rather than snapping back to "all open."
- **An honest empty state** ("NO PAGES MATCH") for a genuine zero-result search, instead of
  silently showing nothing with no explanation.

Verified in a real headless render, every claim driven through the real UI, not asserted from the
diff: real button click collapses a section and flips `aria-expanded`; a real page **reload**
confirms the collapsed state survives via `localStorage` (this is the actual mechanism, not a
same-session-only illusion); a real `fill()` of the search box for "journal" narrows 133 chips down
to exactly 1, in exactly 1 of 15 sections; clearing the search restores all 15 sections *and* the
specific section collapsed earlier stays collapsed; a nonsense query shows the real empty state;
zero horizontal overflow, zero console errors, zero change to `python3 scripts/audit.py`'s
baseline. Screenshot confirms the visual result matches the existing design system exactly (the
search input is the shared `.inp` glass-form class — no new CSS needed).

```
python3 scripts/check-inline-js.py                     OK
python3 scripts/audit.py                               0 critical / 6 warnings (baseline, unchanged)
chip/section count before vs after                     133 chips / 15 sections -- unchanged, nothing removed
real click: collapse + aria-expanded                   confirmed via DOM after a real button click
real reload: collapse state persistence                confirmed -- survives a full page reload
real search: "journal"                                 133 chips -> 1 chip, 15 sections -> 1 section
real search clear: restores prior collapse state        confirmed per-section, not a blanket reset
scan.js errors / overflow / taps (dashboard.html)       0/1, 0/1, 0 undersized controls
```

## 35. Scene-per-realm 3-D backdrops — the 9 realm hub pages get their own tinted signet

**Grounded in:** `GAP_ANALYSIS.md`'s standing item "The 3-D layer exists but four scenes is where
it stops," item (2) "Scene-per-realm": "Nine realms, nine backdrops; today every page that mounts
the sculpture layer gets the same four." Verified before building: `index.html`'s own realm strip
already links 9 destinations (`dashboard.html`, `profile.html`, `honors.html`, `cosmos.html`,
`media.html`, `vault.html`, `family.html`, `services.html`, `intelligence.html`), each with its own
accent hex, and a repo-wide grep confirmed none of the 9 had any `data-omega-sculpture` mount.

**Decision:** the original GAP_ANALYSIS note pointed at `omega-realm.js`'s `ELEM_PALETTE` as the
palette source — checked and wrong, that file has no such export and `ELEM_PALETTE` (in
`omega-sigil-gen.js`/`omega-emblems.js`) is keyed by zodiac element, a different axis from realm.
Used the realm hexes already live on `index.html` instead of inventing a new palette. Also checked
which of `omega-sculpture.js`'s 6 scene builders actually honour a custom colour before picking
one: only `signet` does (`buildSignet(T, opt.accent || p.gold)`); `elements`/`ascension`/`agents`/
`matrix`/`gates` hardcode their palette. `signet` is also the right scene semantically — it's
already the generic branded hero used on `index.html`, not tied to a specific dataset the way
`agents`/`gates`/`elements` are.

**What shipped:** one `.osc-stage[data-omega-sculpture="signet"]` mount per realm hub page, each
with `data-sculpt-accent` set to that page's own hex (`dashboard` `#C9A84C`, `profile` `#00E5FF`,
`honors` `#E86A3A`, `cosmos` `#9B6BF0`, `media` `#C4453C`, `vault` `#C9A84C`, `family` `#D9B86A`,
`services` `#3fb27f`, `intelligence` `#9B6BF0`) and `data-sculpt-bloom="off"` — a deliberate choice
since these are 9 *new* mounts landing on pages that are already content-heavy, and the sculpture
module's own header documents ~22% frame-rate cost per mount under bloom on this harness's software
rasteriser. Placed at each page's natural top-of-content break (after the mission-bar/topbar/hero,
before the tab row), inside the content column, never inside `.shell` (CLAUDE.md 4's "`.shell` is a
flex row" trap). `profile.html` specifically got its mount placed *after* the existing bespoke
`.profile-hero`/`#ph-canvas` closes, not stacked inside it, to avoid competing with that page's own
already-rendered hero visual.

Verified in a real headless render across all 9 pages, not asserted from the diff: `scan.js errors`
and `overflow` both 0/9; a direct `page.evaluate()` read back the live canvas's drawing-buffer size
against its CSS box on every mount (all matched — no repeat of the §8.1 class 3 zero-buffer bug);
`vault.html` specifically checked for CSP violations via a `console` listener since it runs the
platform's one stricter meta CSP (`GAP_ANALYSIS.md`) — 0 violations; screenshots of 4 of the 9
(`dashboard`/`vault` both gold, `services` green, `cosmos` purple) confirm the accent actually
reaches the rendered mesh's material colour, not just the DOM attribute.

```
scan.js errors / overflow (9 realm pages)        0/9, 0/9
canvas buffer size vs. live CSS box              matches on all 9
vault.html CSP violations                        0
data-sculpt-accent read back                     correct, distinct hex on all 9
rendered mesh colour differs per page            confirmed via screenshot (4 of 9 checked)
python3 scripts/check-inline-js.py               OK
python3 scripts/audit.py                         0 critical / 6 warnings (baseline, unchanged)
```

## 36. Navigable 3-D scenes — already shipped; verifying it live found and fixed a real flaky-click bug

**Grounded in:** `GAP_ANALYSIS.md`'s item (3), "Navigable scenes," which read: "The nodes in
`agents` and `matrix` are geometry, not links... raycasting would give the 3-D scenes the same
property." Asked to build this.

**What was actually found, before writing any code:** the feature already exists, completely.
`omega-sculpture.js` has a full "NAVIGATION" section — every one of its 6 scene builders
(`elements`/`ascension`/`agents`/`matrix`/`gates`, and any future one) returns a `links` array;
`wireNavigation()` wires real raycasting, hover feedback, click-to-navigate, and a parallel real
`<a href>` list per link (a keyboard-reachable, screen-reader-visible skip-link pattern, off-screen
until focused) — mirroring `omega-constellation.js`'s "each mark is a real link" rule for the 2-D
ring exactly. `GAP_ANALYSIS.md`'s claim was stale, most likely written before this shipped and
never revisited.

**Decision:** don't rebuild a feature that already exists — verify it, live, and fix whatever it
actually finds. A first scripted test looked like it proved the feature broken (clicks on a
raycast-confirmed node failing to navigate on 5 of 6 mounts); debug-instrumenting the real module
(a route-intercepted copy with `console.log` added to `pickAt()` and the click handler, not
guessing from source) separated a real bug from a test artifact:

- 5 of the 6 false negatives were the test's own fault — those pages' nodes all point back to the
  same page they're mounted on, and this environment needs more than 500ms for a same-URL reload to
  register; a plain, unrelated `<a href>` click showed the identical symptom, ruling out
  `omega-sculpture.js` as the cause.
- The 6th finding was real: the click handler re-ran the raycast fresh at the click's own
  coordinates instead of reusing the hover state `pointermove` had already computed, and every one
  of these scenes keeps its nodes in continuous rotation — reproduced live on `gates.html`: a hover
  hit at `(355.67, 343.44)` followed by a click at the browser-rounded `(355, 343)` missed the same
  node on the very next raycast. Fixed with a one-line change: the click handler now prefers
  `m.hover` (what the user actually saw highlighted) over a fresh `pickAt()` call, falling back to
  the raycast only when there's no tracked hover (a touch tap with no prior `pointermove`).

Full grounding and the debug-instrumentation evidence are in `GAP_ANALYSIS.md`'s updated item (3);
the fix and its before/after reproduction are in `FIXES_LOG.md`.

```
agents.html / pantheons.html (agents)      navigates to /agents.html
gates.html (gates)                          navigates to /gates.html
elements.html (elements)                    navigates to /elements.html
ascension.html (ascension)                  navigates to /ascension.html
sculpture.html (matrix)                     navigates to /matrix.html
node --check omega-sculpture.js             OK
python3 scripts/check-inline-js.py          OK
python3 scripts/audit.py                    0 critical / 6 warnings (baseline, unchanged)
```

## 37. LMS courses — the first real slice of the dormant academy_* scaffold, shipped dormant

**Grounded in:** the project owner named the ~130-table dormant SaaS scaffold (`GAP_ANALYSIS.md`) as a real retirement-income project. Weighed against the scaffold's four other viable verticals (project management, marketplace, knowledge base + AI workspace, billing/multi-tenant orgs) before picking one: LMS courses needs no multi-tenant pivot (members buy directly, not other businesses signing up their own teams), already fits the platform's existing Academy/Ascension/Gates educational theming, and doesn't require competing head-on against mature, well-funded incumbents (Linear/Asana, Etsy) the way the other verticals would.

**Decision, checked rather than assumed:** `academy.html` looked like an obvious place to wire this in — it is not. It is a separate, already-working knowledge-quiz feature built on `task_completions`, unrelated to the `academy_courses`/`modules`/`lessons` scaffold. Built `courses.html` new instead of overloading it.

**A real, pre-existing gap found and closed on the way:** the ~83-table scaffold has never had a `CREATE TABLE` statement in any file in this repo — only living in the database directly (confirmed via `scripts/audit.py` check 7). Tolerable while unused; not tolerable the moment real code depends on it, so `supabase/migrations/20260921005900_academy_schema_capture.sql` backfills the real live schema (every column/type/FK copied from a live query, not guessed) before the feature migration runs.

**Two real upsert-conflict bugs caught before shipping** (CLAUDE.md §8.1 class 7 — the single most-cited recurring bug class in this repo): `academy_modules`/`academy_lessons` had no unique key at all, meaning the seed's `ON CONFLICT DO NOTHING` would have silently duplicated rows on every re-run; and `academy_progress`'s existing unique constraint was `(user_id, node_id)`, not the `(enrollment_id, lesson_id)` shape the actual lesson-progress flow needs. Both fixed with real constraints before the seed ran, verified via a second, full re-run of the migration (counts unchanged, real content preserved — not overwritten by the idempotency test's placeholder text).

**What shipped:** `supabase/migrations/20260921010000_academy_courses_launch.sql` (real per-command RLS mirroring the existing `governance_policies` shared-content pattern, one real course seeded — "Financial Foundations," matching `gates.html`'s own "Gate of Finance" description rather than an invented topic) and `courses.html` (catalog → course detail → lesson view, `nav.js`-wired under ASCEND). The whole feature sits behind `data-omega-flag="courses_enabled"` — dormant by default (`platform_settings.courses_enabled = false`), the existing `omega-flags.js` mechanism, no new plumbing, per CLAUDE.md §9's rule for a new monetizable feature. The owner turns it on when ready.

**Verified, not asserted:** live RLS impersonation for visibility/enrollment/owner-only-writes/cross-user-isolation (including confirming a member cannot insert an enrollment row for someone else's `profile_id` — a real `42501`, not merely a policy read); a full real-browser interaction test via a custom stub carrying realistic data (the shared harness's default stub is table-agnostic and can't exercise a real catalog/enroll/lesson flow) — catalog → enroll → lesson → mark-complete → progress bar update (0/4 → 1/4, 25%), zero console errors; a full 205-page site-wide error sweep.

```
RLS impersonation (visibility/enroll/write-blocked/isolation)   all pass, incl. a real 42501 on cross-user insert
Migration idempotency (full re-run)                             counts unchanged, real content preserved
Full browser flow (catalog->enroll->lesson->complete)           0 errors, every assertion pass
scripts/audit.py check 7 (tables never CREATE TABLE'd)           5 -> 2 (only the pre-existing dormant payment tables left)
scripts/schema-dictionary.py / silent-failure-detector.py        both OK
scripts/upsert-conflict-check.py                                 1 finding, verified false positive (see FIXES_LOG.md)
Full site sweep                                                  205 pages, 0 uncaught errors
platform_settings.courses_enabled                                false (dormant; owner's call to activate)
```
