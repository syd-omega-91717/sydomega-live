# Gap Analysis — sydomega-live

**Date:** 2026-08-10. **Companion documents:** [`REPOSITORY_AUDIT.md`](./REPOSITORY_AUDIT.md),
[`CAPABILITY_INVENTORY.md`](./CAPABILITY_INVENTORY.md).

Every item below is either a **confirmed, fixed-in-code gap still pending an owner action**
(applying SQL to a live database — which sessions *can* now do: live Supabase access was
first exercised on 2026-09-05, and seven declared-but-never-applied tables were applied and
verified that day, so "pending an owner action" no longer means "impossible here"), a **confirmed, still-open gap**, or a **product decision deliberately
left undone**. Nothing here is speculative; each cites the evidence. Priority follows this
project's own established convention (security/data-integrity first).


---

## S. Standing open items (moved out of `CLAUDE.md` §8.2, 2026-09-05)

Nothing below is a bug masquerading as done. Each has an explicit reason it is
open, recorded in `FIXES_LOG.md`:

- **`service_role` holds only what deployed server code needs** (opened 2026-09-26,
  `FIXES_LOG.md`, "Backend privileges"). Since `20260903015535`, `service_role` has had
  no default privilege on public tables. Granted since: `platform_settings` SELECT,
  `get_platform_flag` EXECUTE, the two graph-ingest RPCs, and
  `apply_subscription_event`. **Before turning `autonomous_agents_enabled` on**, grant
  what the orchestrators write, or they fail at their first write:
  - `autonomous_decisions` INSERT (all three);
  - `member_feature_flags` INSERT, UPDATE (product-orchestrator upserts).

  **Before deploying** `checkout`, `rankings`, `snapshot-leaderboard`, `weekly-digest` or
  `graphify-ai-query`, grant each one the table operations it uses. A small script
  mapping `supabase/functions/*` `.from()` calls to table grants would make this a gate
  rather than a checklist.
- **`find_contradictions` does not exist** (opened 2026-09-26).
  `graphify-ai-query/index.ts:252` calls it and only logs a warning when it fails, so the
  anomaly report's contradiction list is always empty. The function is not deployed, so
  no member sees it yet.

- **The concept art and the canon disagree in three places now** (opened
  2026-09-13; `FIXES_LOG.md` 139, 141). Not a bug — a **decision the owner has
  not made yet**, and every visual built from the art rather than the data
  inherits it:
  | subject | the concept art | the repository's canon |
  |---|---|---|
  | gates | "NINE GATES" | **12** (`tracks[].gate`, `gate_names`, `gate_thresholds`; `gates.html` "12 gates") |
  | elements | 6, Greek/Egyptian gods (Enki, Geb, Vayu, Thoth, Ptah) | **9** in 3 tiers (FIRE WATER WIND METAL SAND / SOUL SPACE VOID / THE NINTH) — none of those god names appears anywhere |
  | ascension | "9 STAGES" (Initiate, Seeker, Apprentice, Adept, Expert, Master, Sovereign, Legend, Omega) | **12 tiers** (Initiate … Ascendant), which `tierUnlocks()` actually grants against |
  Every 3-D scene reads the **canon**, via its owning module, so the art is
  never the source of a figure a member sees. If the owner decides the art is
  right, the canon files change and the scenes follow with no code edit. If the
  canon is right, the art is a mood board and should stop being read as a spec.
  **Until that is settled, treat any count in the art as unverified.** Two
  smaller seams inside the canon itself: the ninth element is `THE NINTH` in
  `omega-elements.json` and `'The All'` in `ELEM_PALETTE`; and three different
  twelve-gate name sets exist (see the entry above).

- ~~**Two divergent sets of twelve gate names**~~ **CLOSED 2026-09-21 — resolved as
  two real, coexisting systems, not one that drifted.** Owner asked directly:
  `tracks[].gate` (Gate of Ignition · Abundance · Discourse · …) confirmed as the
  canonical name for the **zodiac-track** gate, one per sign. Investigating
  before touching anything found this was already the live, consistent reality
  — `omega-canon.js`'s `api.gate(n)` reads `tracks[n-1].gate` directly, and
  `omega-sculpture.js`'s `gates` scene reads it through that one API — so
  nothing needed to change there.

  `gates.html` ("AUTHORITY GATES" in `nav.js`) is a **different, real feature**,
  not a second name for the same thing: a sequential authority-threshold
  achievement ladder (Awareness → Discipline → Knowledge → … → Apex), each with
  its own `domain` (MIND/BODY/WEALTH/…) and progression copy, and its `auth`
  values are already the canonical `gate_thresholds` array verbatim (`0, 2.32,
  4.64, … 27.84`). Renaming its titles to the zodiac names would have discarded
  that real domain/threshold/description content to force a label match onto a
  page that isn't describing the same thing — asked, and explicitly declined.
  **Left as-is, both sources unchanged**, this entry closed as "two systems,
  not a conflict."

  One genuinely dead vocabulary found along the way, not fixed because there is
  nothing to fix: `omega-canon.json`'s `gate_names` (INITIATE · ACOLYTE · … ·
  APEX) is referenced nowhere in any `.js`/`.html` file except a single code
  comment in `omega-sculpture.js` — orphaned data, not a third competing name in
  active use.

- **The 3-D layer exists but four scenes is where it stops** (opened 2026-09-13;
  `FIXES_LOG.md` 138). `omega-sculpture.js` gives the platform real-time geometry
  for the first time — `signet`, `agents`, `matrix`, `gates` — mounted with one
  attribute and carried by the already-vendored three.js. What is deliberately
  **not** built yet, in rough order of value:
  **(1) The Sovereign Ident.** A three-second cinematic title on first visit,
  the way a film studio opens a picture: the signet forms out of the lattice,
  the wordmark sets, the page resolves behind it. This is the single most
  "movie" thing the platform could have and it is a *product* decision, not a
  technical one — a forced intro on every load is hostile, so it wants
  first-visit-only, skippable, off under reduced motion, and remembered. Not
  shipped without that call being made.
  **(2) Scene-per-realm — SHIPPED 2026-09-20.** Nine realms, nine backdrops. The
  original note here ("palettes already exist in `omega-realm.js`'s `ELEM_PALETTE`")
  was wrong on the file — `ELEM_PALETTE` lives in `omega-sigil-gen.js`/`omega-emblems.js`
  and is keyed by zodiac element, a different axis from realm. The real per-realm
  accents were already rendered on `index.html`'s own realm strip (one hex per
  `nav.js` SECTIONS entry), so those are what got used, not an invented palette.
  Of the 6 scene builders in `omega-sculpture.js`, only `signet` actually honours
  `opt.accent` (`buildSignet(T, opt.accent || p.gold)`); `elements`/`ascension`/
  `agents`/`matrix`/`gates` hardcode `p.gold`/`p.solar`/`p.cyan` — a real, useful
  scoping finding, not a bug, since `signet` is exactly the generic branded mark
  the 9 realm hub pages needed. Added one `.osc-stage[data-omega-sculpture=signet]`
  mount with `data-sculpt-accent` set to that page's own realm hex, `data-sculpt-bloom="off"`
  (these are 9 new mounts on already content-heavy pages, so the ~22%-per-mount
  bloom cost noted in item (4) below was skipped by default), to `dashboard.html`,
  `profile.html`, `honors.html`, `cosmos.html`, `media.html`, `vault.html`,
  `family.html`, `services.html`, `intelligence.html` — the 9 pages `index.html`'s
  own realm strip links to, none of which had any sculpture mount before. Verified
  in a real headless render on all 9: 0 uncaught errors, 0 horizontal overflow,
  drawing buffer matches the live box size on every mount (no §8.1 class 3 zero-buffer
  repeat), and — checked specifically since `vault.html` runs the platform's one
  stricter meta CSP (`GAP_ANALYSIS.md`, "`vault.html` runs a second, stricter CSP")
  — **0 CSP violations** there either. Screenshots of 4 of the 9 (`dashboard`,
  `vault`, `services`, `cosmos`) confirm visibly distinct accent colours actually
  reach the rendered mesh, not just the DOM attribute.
  **(3) Navigable scenes — WAS ALREADY SHIPPED, this note was stale, and a real
  bug was found and fixed checking it (2026-09-21).** This item claimed "the
  nodes in `agents` and `matrix` are geometry, not links" — false. Reading
  `omega-sculpture.js` end to end (not just the scene builders) found a
  complete, already-built "NAVIGATION" section: every one of the 6 scene
  builders (`elements`, `ascension`, `agents`, `matrix`, `gates`, and by
  extension any future one) returns `{scene, camera, links, update}`, where
  `links` is `[{object, href, label}]`; `wireNavigation()` wires real raycasting
  (`pickAt()`), hover feedback (`setHover()` scales and lights the node,
  changes the cursor, shows a caption), click-to-navigate, AND a parallel real
  `<a href>` list per link (`linkList()`) — off-screen until focused, in the DOM
  whether or not WebGL ever starts — exactly matching `omega-constellation.js`'s
  "each mark is a real link" rule for the 2-D ring. This was evidently built in
  an earlier session and never reflected here.

  Verified live rather than trusted from the diff, because a first pass looked
  broken: clicking a raycast-confirmed node (cursor visibly `pointer`) did not
  navigate on 5 of 6 mounts (`agents.html`, `pantheons.html`, `gates.html`,
  `elements.html`, `ascension.html`) in a scripted test. Two causes, one real
  and one not:
  - **Not a bug:** the destination for every node in `agents`/`gates`/`elements`/
    `ascension` is the *same page the scene is already mounted on* (documented
    in-file: `agents.html` "carries no per-agent anchor" so all 12 nodes point
    to `/agents.html`), and this environment's page loads run slower than a
    500ms test wait — a `framenavigated` event for the reload genuinely fires,
    just later. Re-tested with a 2.5s wait: all 5 navigate correctly.
  - **A real bug, found and fixed:** the click handler re-ran `pickAt()` fresh
    at the click event's own `clientX`/`clientY` instead of reusing the hover
    state `pointermove` had already computed. Every scene here keeps its nodes
    in continuous motion, so a click's coordinates can differ from the
    triggering `pointermove`'s by sub-pixel rounding alone — reproduced live on
    `gates.html` with debug instrumentation: a hover hit at `(355.67, 343.44)`
    followed immediately by a click at the browser-rounded `(355, 343)` missed
    the same node on the very next raycast (`hits: 1` → `hits: 0`), so
    `window.location.href` was never set. Fixed in `omega-sculpture.js`'s
    `wireNavigation()`: the click handler now uses `m.hover || pickAt(...)` —
    the tracked hover first (what the user actually saw as clickable), falling
    back to a fresh raycast only when there is no tracked hover (a touch tap
    with no prior `pointermove`). Re-verified after the fix: all 6 mounts
    (`agents.html`, `pantheons.html`, `gates.html`, `elements.html`,
    `ascension.html`, `sculpture.html`'s `matrix`) navigate correctly on a real
    raycast-confirmed click, evidence in `FIXES_LOG.md`.
  **(4) Post-processing — SHIPPED, and not with `EffectComposer`**
  (2026-09-13; `FIXES_LOG.md` 143). That class was rejected on structure, not
  convenience: it owns render targets sized to the renderer, while this engine
  shares ONE context across mounts rendered into viewport sub-rects, so it
  would need resizing per mount per frame and would bleed between neighbours
  at every rect edge. The glow is composited in each mount's own 2-D canvas
  instead, where the source rect IS that mount. **Still open:** the remaining
  cost is one full-resolution composite per mount per frame (−22.5% frame rate
  on `index.html`'s hero under this harness's *software* rasteriser; GPU is not
  measurable here). Moving that composite to a stacked quarter-res canvas with
  `mix-blend-mode: plus-lighter` would hand it to the browser's compositor and
  remove the per-frame 2-D fill entirely — costed, not attempted.
  `data-sculpt-bloom="off"` is the per-mount opt-out meanwhile.
  **(5) A procedural environment map — SHIPPED** (2026-09-13; `FIXES_LOG.md`
  142). It was never cosmetic: at `metalness: 0.96` a PBR metal has no diffuse
  term, so with no environment the primary emblem was rendering at mean
  luminance 40–58/255. `PMREMGenerator` turned out to be **already exported by
  the vendored bundle** (`Oa as PMREMGenerator`; the file is minified, so a
  `class` grep returns 0 and proves nothing), so this cost no new file, no
  binary asset and no CSP question. **Still open:** the room is one fixed
  three-panel studio shared by every scene — pairing it with (2) so each realm
  reflects its own palette is the next real step.
  **(6) Filmic tone mapping — SHIPPED 2026-09-21.** `_renderer.toneMapping` was
  never set (defaulting to `NoToneMapping`), the wrong pairing for the HDR-range
  values (5)'s environment map produces on a `metalness:0.96` material — every
  AAA engine (Unreal, Unity) defaults to a filmic curve for exactly this reason.
  Added `T.ACESFilmicToneMapping` + `toneMappingExposure:1.1`; confirmed present
  in the vendored bundle by grepping the literal exported name, not a class
  declaration. Verified with a real `git show HEAD` before/after render on
  `sculpture.html`'s 11 live mounts: 0 errors both, luminance 164.2→162.3, lit%
  82.8→79.2 (a real, directionally-correct highlight rolloff — `FIXES_LOG.md`).
  Antialiasing and one `InstancedMesh` (the matrix scene's 729 nodes) were
  already present, confirmed by reading the file rather than assumed.
  **(7) What AAA battle-royale-scale engines (Unreal, the class PUBG ships on)
  actually do, checked against what this stack can use — researched
  2026-09-21, nothing further shipped.** The real techniques are PBR
  materials (already the whole `metalness:0.96` approach here), image-based
  lighting via a pre-filtered environment map (item 5, shipped), a filmic
  tone-mapping curve (item 6, shipped), aggressive MIP/texture streaming
  prioritising on-screen "hero" assets, and master-material-plus-instance
  reuse to cut shader recompiles. The streaming and instancing techniques
  assume a baked-asset pipeline (imported meshes/textures, a build step, a
  runtime asset loader) this repo does not have and should not add (§9 — no
  build step is load-bearing); the platform's actual analogue already exists
  in a different, correct-for-this-stack form: ONE shared WebGL context
  blitted per mount (never per-scene contexts) and one `InstancedMesh` for
  the matrix scene's 729 nodes are the same "reuse, don't duplicate GPU
  state" idea a build-based engine solves with material instancing. Nanite/
  Lumen-class techniques (virtualized geometry, real-time GI) have no
  meaningful analogue for a handful of procedural low-poly signet meshes and
  were not pursued. No further 3-D work follows from this pass; it exists so
  a future session does not re-research the same question.

- **RETRACTED 2026-09-13, the same day it was opened: the sidebar labels do NOT
  overlap.** This entry claimed 107 overlapping label pairs on every page. That
  number was a measurement artifact, twice over, and the correction is the useful
  part: (1) the probe counted every leaf text node in `#omega-side` with **no
  visibility filter**, and each `.on-icon` contains an `.on-tip` flyout at
  **`opacity:0`** whose contents still have layout boxes — filtering for visibility
  took 107 → **1**; (2) that last pair was `.on-lbl` "MEDIA" (rect 849–861) against
  `.on-logout` (854–886), but `.on-sections` is `overflow-y:auto` and clips at 850,
  so the label's *rect* crosses while the label never paints — `elementFromPoint`
  sampled down the whole LOG OUT box returns no `.on-lbl` at any point: **0** real
  overlaps. §8.1 class 10 says *DOM presence is not visibility*; the other half of
  the same rule is that **a rect is not paint** — an `opacity:0` element and an
  overflow-clipped one both keep their geometry. Ask `elementFromPoint`, or look at
  a viewport screenshot — note `page.screenshot({clip})` uses PAGE coordinates, so a
  clip computed from `getBoundingClientRect` on sticky chrome captures the wrong
  region and produced a third wrong answer before this was settled.
  **What is true and stays open:** `.on-sections` is scroll-clipped at every viewport
  height below ~1400px (scrollHeight 737 vs clientHeight 725 at 900px; 702 vs 525 at
  700px), so several nav sections sit below the fold behind a scroll. That is the
  declared `overflow-y:auto` behaviour rather than a defect, but it does mean the
  lower sections are effectively undiscoverable on a laptop — an information-
  architecture question for the owner, not a layout bug to fix.
- ~~**`supabase/live-schema.json` is older than three applied migrations**~~
  **CLOSED 2026-09-13** — regenerated from live (`FIXES_LOG.md` 151). It was stale by
  **six relations and one column set**: the phase-5 tables `agent_experiments`,
  `agent_performance_metrics`, `autonomous_decisions`, `autonomous_insights`,
  `member_agent_interactions`, `member_feature_flags` (all from
  `20260911222734_phase5_autonomous_agents.sql`), plus `ai_memory`, which live carries
  `content` and `expires_at` on and the snapshot did not. **Five of the six are read by
  shipped client code** (`autonomous-insights.html`, `omega-feature-gates.js`,
  `omega-autonomous-onboarding.js`), so `schema-dictionary.py` had been checking those
  pages against the SQL bag alone — exactly the false-negative direction §8.4 warns
  about. 217 → **223** relations, 1852 → **1938** columns, `_captured` 2026-09-05 →
  2026-09-13; every one of the 223 column lists hash-verified against live.
- ~~**`matrix.html` promises 3-D and draws 2-D**~~ **WITHDRAWN 2026-09-13, same day
  it was opened.** The panel is titled *3D Matrix Projection* and uses a `'2d'`
  context, which I recorded as a false claim. It is not: a **projection** of a 3-D
  matrix onto a plane is exactly what an isometric projection is, and the title is
  honest. No i18n key needed changing. **But looking properly found a real bug in the
  same canvas** — it drew `Math.random() > .97` as the member's own lattice, re-rolled
  every frame, in `--cyan` directly above the real coordinate readout (§8.1 class 9).
  Fixed and verified in `FIXES_LOG.md` 154: the lit nodes now come from
  `profiles.axis_a/b/c` (`tailCyan [27,27,27,27,27,27]` against the old
  `[19,17,26,17,17,17]`), nothing is lit before the data arrives, and two further
  defects in the reduced-motion still frame were found and fixed on the way.
- **There is no safe platform-wide restyle of the metric tiles** (established
  2026-09-13, measured — recorded so the next session does not re-derive it and
  ship the sweep). The estate renders **295 metric tiles on 94 pages** under **21
  distinct page-local class names**, and only 32 carry the shared `--kc` accent —
  which reads like a large, easy unification. It is not. Per-property collision
  measurement on all 295:

  ```
  ::before already paints          46      already has border-top > 0     259
  ::after  already paints         211      already has a box-shadow       231
  has an inline style=            245      value colour set by the page   284
  SAFE for an accent hairline      36  of 295
  ```

  The tiles are not monochrome and not unstyled — **284 of 295 already have the
  page setting the value colour**, and 259 already own a top border. An accent,
  hairline or pseudo added centrally would collide on ~88% of them, and the type
  scale (13 distinct value font-sizes, 12px–40px) cannot be normalised without
  `!important`, which CLAUDE.md §9 forbids for defeating the cascade. Any real
  unification here is a per-page migration, not a sweep.
- **`nexus.html` shows a member with no graph data a black rectangle** (opened
  2026-09-14; `FIXES_LOG.md` 156). Its canvas could never paint at all until now —
  a zero drawing buffer, §8.1 class 3, fixed and verified (`0x642` → `1084x590`).
  But with the harness stub the page renders `rafFrames 907`, `arcs 0`,
  `statCards ["0","0","—"]`: the loop runs correctly over an empty graph. That is
  honest and it is also a poor first impression. The page needs a real empty state
  — what the nexus is, and what populates it — rather than an unexplained void.
  Not built here: it is a content and copy decision, not a sizing bug.
- **`omega-music.js` and `omega-ambient.js` are injected on all 202 pages and cannot
  be reached from any of them — for three separate reasons** (opened 2026-09-13,
  **re-diagnosed 2026-09-14**; `FIXES_LOG.md` 150, **164**).

  The original diagnosis here was *"its documented trigger is `[data-music-toggle]`,
  and grep returns no matches — zero pages"*. **That is true of page markup and is not
  the blocker.** `omega-music.js:230-234` **creates its own toggle**: given a
  `.topbar` and no existing one, it builds the button and sets the attribute itself.
  A grep over pages cannot see a module that self-mounts. The three real blockers,
  each measured in a render:

  1. **The mount is gated on an event nothing dispatches.** Both modules hang their
     auto-injection on `omega:user-loaded` (`window`), while `omega-user.js:233` —
     which owns the profile and runs on every page — dispatches `omega:populated`
     (`document`). Instrumented before page load, `omega:user-loaded` fires on
     `chronicle.html` **and on no other page**; even there it loses the race, since
     the page's inline dispatch runs before `bg.js`'s deferred listeners attach.
     Eight modules listen for it: music, ambient, passport, sigil-gen, realm,
     particles, workers, event-bus.
  2. **The mount target is wrong on tabbed pages.** Dispatching the event
     (prototyped, then A/B'd against a pinned `HEAD`) mounts both toggles — and they
     render **0x0 and un-clickable**. `omega-music.js:232` takes
     `document.querySelector('.topbar')`, the *first* match, which on
     `profile.html` sits inside `#tab-passport.tab-panel` at `display:none`.
     **85 pages** carry more than one `topbar` mention alongside tab panels.
  3. **The audio engine is a runtime CDN import.** `omega-music.js:88` does
     `import('https://esm.sh/tone@14.9.17')`; Tone is not in `/vendor/`, §4 forbids
     runtime CDN imports outright, and `window.Tone` measures `undefined` —
     which is what the observed `TypeError: T.start is not a function` is. Its two
     callers (`:190`, `:208`) still have **no `.catch()`**.

  **Still the owner's call, but now a decidable one.** Fixing (1) alone is a
  regression: two invisible dead buttons on the 174 pages that have a topbar, one of
  which throws. Wanting the feature means all three — dispatch the event from
  `omega-user.js`, mount into the *visible* topbar, and vendor Tone (≈350KB) with the
  missing `.catch()`. Not wanting it means dropping both modules from `bg.js`, two
  lines. The `omega-user.js` dispatch was written, measured and **reverted
  byte-for-byte** rather than shipped alone.
- ~~**`omega-emblems-catalog.js:578` calls an API nothing implements**~~
  **CLOSED 2026-09-13** — the call and its `DOMContentLoaded` listener were deleted
  (`FIXES_LOG.md` 153). Implementing it was ruled out on evidence, not preference: the
  shapes do not meet. `all()` returns `EMBLEMS` keyed by **page filename**, while the
  sidebar is built from `nav.js`'s **15 section entries**, each with its own `icon`
  glyph and `col`; there is no mapping between them, and the sidebar already has a
  complete icon vocabulary. The catalog's real consumer is per-page —
  `omega-emblem-integration.js` calls `OmegaEmblems.get(pageFilename)`. Verified by
  **arming the mine**: publishing `window.OmegaNav` via `addInitScript` threw
  `TypeError: window.OmegaNav.updateEmblems is not a function` on **4 of 5** pages
  against the pinned pre-fix file and on **0 of 5** after. The reasoning is left in
  the file where the code was, so it is not re-added.
- ~~**`graph.html` and `map.html` throw on every load**~~ **CLOSED** — `494ad666`
  vendored both libraries (`vendor/d3.min.js`, `vendor/leaflet.js` + `leaflet.css`)
  and both pages already load them via `loadUMD('/vendor/...')`, same-origin, not a
  CDN. Re-verified this session: a full-estate headless render (204 pages, this
  session) reports `pages with uncaught errors or rejections: 0`, and
  `node scripts/verify-runtime.js --pages graph.html,map.html` reports `PASS`. The
  `verify-in-browser` skill's own gotcha list still called these two (plus
  `realm.html`) "blocked CDN" throws — corrected there too; all three render clean.
- ~~**Dispatch moderation bypass**~~ **CLOSED 2026-09-26** (migration `20260926095955`, applied live). The
  earlier reading was wrong about the shape: member posts on the Wire are *meant* to be public
  (`dispatches.is_published` defaults `true`), but `published_dispatches()` — the official "SOVEREIGN
  DISPATCHES" feed — returned every published row, so any member post also rendered as an official
  dispatch. The feed now returns only author-less rows, which only `post_dispatch()` (owner-only) writes.
  The same migration fixed `post_dispatch()` (22P02 for the owner: bigint id into a uuid) and
  `set_dispatch_published()` (uuid signature on a bigint id). See `FIXES_LOG.md`.
- **No MFA, and no way to enrol** (2026-09-26). 0 verified `auth.mfa_factors`, owners included.
  **In progress (dormant):**
  - The `omega-mfa.js` enrol/verify/remove UI plus `stepUp()` ships in Settings behind
    `mfa_enrolment_enabled`, which fails closed. The flag row does not exist yet.
  - Owner enforcement (AAL2 inside `private.is_platform_owner()`, behind `owner_mfa_required`) is
    **applied live and dormant** (`20260926102544`; both flags seeded `false`, verified unchanged results).
  - Decision record: `docs/decisions/owner-mfa/`.
  - Phase 2 is done (`20260926102450`). Of the 24 direct owner checks, the only caller-authority
    bypass was `private.omega_is_owner()`'s `profiles.is_owner` fallback, now removed. The other 23 are
    row guards, statistics or triggers. What remains is owner action: turn on the enrolment UI, enrol
    both owners on two devices, then set `owner_mfa_required`.
- **Cross-user RLS isolation proven on 17/17 populated private tables; 46 tables unprovable** (no foreign rows
  exist). A seeded two-member fixture test would close that; see `FIXES_LOG.md` enterprise audit entry.
- **Member KYC submission cannot save** (2026-09-26; `FIXES_LOG.md`, profile-grant drift entry).
  `profile.html` writes `kyc_status`/`kyc_doc_path`/`kyc_submitted_at` directly; members hold no
  UPDATE on them, and must not (a member could set their own verdict). Needs a `submit_kyc(p_doc_path)`
  SECURITY DEFINER RPC that sets only `kyc_status='submitted'` for `auth.uid()` — high-risk, so
  `grill-me-codex` first. Separately, `security-definer-audit.py` reads the reference SQL bag and
  reports owner-checked `private.*` functions as unguarded; it should read `migrations/`.
- **CSP: third-party code CDNs removed; `'unsafe-inline'` is the remaining gap** (2026-09-26;
  `FIXES_LOG.md`, security-hardening pass 4). The last seven runtime CDN loads (lucide,
  dayjs + relativeTime, highlight.js, qrcode-generator, Shepherd JS/CSS, Tone.js) are
  vendored, so `vercel.json` and `vault.html`'s meta CSP now name no `esm.sh`/`unpkg.com`/
  `cdn.jsdelivr.net`, and `form-action 'self'` is added. `security-headers-contract.py`
  blocks any code CDN in script/style/font/default-src. **Still open:** `script-src
  'unsafe-inline'` stays because 164 pages carry 1,355 inline `on*=` handlers and 354
  inline `<script>` blocks. Removing it is a page-by-page migration (handlers →
  `addEventListener`, blocks → files or hashes), best done behind
  `Content-Security-Policy-Report-Only` first.
  **Progress (2026-09-26):** batch 1 done — `csp-inline-ratchet.py` (blocking, in the contract
  suite) now holds every file at or below `scripts/csp-inline-baseline.json`; the 5 shared
  modules that emitted handlers on every page, and `approvals.html`, are at 0 and verified
  under a strict `script-src 'self'`. Remaining: 1,323 handlers / 348 blocks across 199 files;
  `dashboard.html` (83 handlers, 3 blocks) is the largest single page.
- **`vault.html` runs a second, stricter CSP than the rest of the platform, and
  four of its divergences are still live** (opened 2026-09-13; `FIXES_LOG.md`
  137). `vault.html:5` is the **only** page in the repo carrying a
  `Content-Security-Policy` `<meta>`; every other page is governed solely by
  the single `vercel.json` header. Both apply and the **intersection** wins.
  The `script-src` half of that divergence was refusing four platform
  libraries outright (tippy, popper, marked, fuse) and is now fixed by
  vendoring them — `/vendor/` is `'self'`, so it satisfies the strict meta
  *and* the header without weakening either. **Still divergent, deliberately
  left alone:** `img-src` loses `https:` (only `'self'`, `data:`, `blob:` and
  Supabase load), `font-src` loses `data:`, `media-src` and `worker-src` lose
  `blob:` (both absent from the meta, so they fall back to a `default-src`
  without it), and `connect-src` loses `https:`/`wss:` (Supabase only).
  Measured at **0 CSP violations** on vault after the vendoring, so none of
  these breaks anything today — but each is a trap for the next change to that
  page: a `blob:` object URL, a `data:` font, a canvas exported to an image, or
  a fetch to any non-Supabase origin will fail there and nowhere else.
  **Open rather than fixed because the divergence is in the *safe* direction.**
  Quietly loosening the CSP on the page that holds financial data, to match a
  policy that is merely more permissive, is an owner's security decision and
  not one to make as a side effect of a graphics fix. The two real options are
  (a) tighten `vercel.json` toward vault's policy platform-wide, or (b) drop
  the meta and accept the header — and (a) is the one worth costing out, since
  after this change nothing on the platform still needs `unpkg.com`, and
  `cdn.jsdelivr.net` is needed only by the lazily-loaded `dayjs`/`hljs` pair.

- **The bottom chrome stack was coordinated by hand-tuned pixel offsets — now
  measured** (opened and closed 2026-09-05; `FIXES_LOG.md` entries 87-88). Five
  modules anchor fixed bars and buttons to the bottom of the viewport, and the
  only coordination between them was hardcoded constants: `bottom:102px` for
  `#omega-controls-dock`, `bottom:66px` for `#omega-ticker-strip`,
  `bottom:224px` for `#osh-btn`, plus the four-rung desktop ladder in `bg.js`
  (`36 / 98 / 146 / 228`, each `!important`). Every one of them was correct at
  the viewport it was measured at and wrong elsewhere, and none had been
  measured against `#omega-consent`, whose height is 80, 102 or 134 depending
  on how its copy wraps.

  > **RE-OPENED AND RE-CLOSED, 2026-09-14 (`FIXES_LOG.md` 160).** Everything
  > below was true when written and then silently stopped being true:
  > `ed9eb76b` rewrote `bg.js`'s single-line injected stylesheet (202 insertions,
  > **1** deletion — that one line WAS the stylesheet) and took the module's only
  > injection with it. Nothing loaded `omega-bottom-stack.js` for eight days;
  > every consumer reads its properties with a `0px` fallback, so nothing errored
  > and the collision below returned in full — re-measured at 6 overlaps on
  > 1280x800 and 7 on 420x760, `#omega-mob` buried entirely again. Restored, plus
  > three corrections the restoration exposed: the module published the
  > furniture's reach instead of `0` at rest (lifting every float 94px on every
  > page, permanently); `#omega-voice-btn` and `#ofb-btn` were never rungs; and
  > the `#omega-cap-badge` rung had drifted a third time (228 → **238**) because
  > `#omega-ded-widget` grew 74px → 84px. Below 420px wide the lift does not fit
  > at all (`#cp-btn` measured at top **-32** and **-59** on 375x667 and 360x640),
  > so the module now sets `data-omega-transient` on `<html>` and the mobile
  > floats step aside instead of over. 0 collisions at every viewport, banner up
  > and down, with the resting layout byte-for-byte unchanged.
  >
  > **The standing risk this leaves open:** a module whose only wiring is one
  > line inside a multi-thousand-character JS string has no diff granularity, and
  > `audit.py` reports its loss as a WARNING among fourteen others. The gate that
  > would have caught this in a day does not exist.

  `omega-bottom-stack.js` now publishes two measured values —
  `--omega-chrome-bottom` (the persistent furniture) and
  `--omega-transient-bottom` (furniture plus whatever banner is up). The
  consent and install banners clear the furniture with the first; the `bg.js`
  ladder and the share button's mobile rung step over the banners with the
  second, keeping their measured internal spacing exactly and returning to it
  when the banner is dismissed. Verified at 1280x800, 1024x600, 900x700 and
  420x760: zero overlap, consent fully on screen with both buttons reachable
  at every one, and `verify-runtime.js` reports zero fixed-chrome occlusions
  across all 13 capability entrypoints. Proven by control, not by the count
  falling: re-pinning the consent bar to `bottom:0` reproduces nine occluded
  language-dock controls.

  **What remains open is deliberate**, and it is the reason the ladder was not
  replaced outright: those `!important` rungs exist because three of the four
  floating controls set their position through inline `style.cssText`, which
  beats any stylesheet rule. Rewriting them to be measured rather than
  laddered means changing how those modules position themselves, which is a
  larger change than this one and has no defect driving it.

- **61 unindexed foreign keys, left unindexed on purpose** (measured 2026-09-05,
  `FIXES_LOG.md` entry 91). Of the 45 `public` tables carrying one, **43 hold zero rows**;
  only `ai_agents` (12) and `architecture_tasks` (16) have any data. Adding the indexes
  would convert one INFO advisory into 61 entries under `unused_index`, cost every write,
  and buy nothing measurable at that size. Revisit when a table crosses a few thousand
  rows. The genuinely actionable half of the same advisor output — 7 RLS policies
  re-evaluating `auth.uid()` per row, and 29 structurally redundant indexes — was fixed.

- **`public.signal_saves` is a live table for a feature that was never built**
  (2026-09-05, `FIXES_LOG.md` entry 90). Applied live with RLS scoped to
  `auth.uid() = user_id`, a `GRANT` to `authenticated`, a `UNIQUE (user_id,
  url)` index and a `CHECK` on `source IN ('hn','github','devto')` — a complete,
  correct backend. But `signal.html` has **no save control, no `localStorage`,
  nothing to persist**: the sibling table `codex_bookmarks` had three real write
  sites in `codex.html` and was wired; this one has zero. Wiring it would mean
  designing and building the save feature, which is a product decision, not a
  gap-closing fix — so it stays unwired rather than having a feature invented
  around it.

- **`transactions` / `wallet_balances` tables do not exist** (queried by
  `subscriptions.html` / `vault.html`). Deliberate: payment and Ω-token
  infrastructure is dormant pending legal review, per §9's gating rule.
  `subscriptions.html`'s own copy already says so. The user was asked directly
  and chose to keep it dormant. **Reconfirmed 2026-09-21** — asked again
  directly rather than assumed stale; still dormant, no change.
- **48 pages persist to `localStorage` only — not 7.** The 7 finance pages
  were a decision, not a default: sensitive data, hard to walk back once it
  lives server-side, mitigated with `omega-local-backup.js` export/import.
  `scripts/evidence-audit.py` shows the shape reaches 48 pages; a further 24 are
  `PARTIAL` (Postgres *and* a parallel local copy). Run the scanner rather than
  quoting these numbers. **The "43 pages with no way to get the data out" gap is
  closed** (verified live 2026-09-04): `exportAll`/`importAll`/`memberKeys` take
  no key list, so they cover every `omega`-prefixed key including runtime-built
  ones, and `settings.html` exposes both. A render that wrote data on
  `habits`/`notes`/`projects` then read `memberKeys()` in Settings saw all three.
  **Fixed and applied 2026-08-24**: `public.member_state`
  (`supabase/omega_member_state.sql`, `migrations/0095`) + `omega-member-state.js`
  mirror those keys server-side. A **mirror, not a sync**: writes go up only,
  restore is explicit (`OmegaMemberState.restore()`), because a hydrating
  two-way sync races each page's synchronous render and would let an empty-cache
  render overwrite good server data. RLS verified live by two-member
  impersonation; `updated_at` is trigger-authoritative. Client-side encryption
  was rejected: no stable client secret exists, and it changes no trust boundary
  — `health_logs`, `ai_memory`, `family_nodes`, `heritage_records` already hold
  comparable data under the same tested RLS.
- **No DELETE policy on `storage.objects`** (live 2026-08-31): writes scoped to
  own `<uid>/`, but deleting one's own upload is 42501. No client offers a
  delete — a gap, and a product decision.
- **`.mp4` (3.7 MB) and `.docx` committed, no LFS.** Asked and declined;
  `.vercelignore` keeps both out of the deploy. A fix needs a history rewrite.
- **Member location is not collected** (live 2026-08-29): `profiles.country`
  exists; `lat`/`lon`/`gate` do not (`map.html`'s reads removed in `3f8a17d7`).
  Adding it is a privacy decision, not a bug fix.
- **`omega-more-info.js` (short lead + click-to-expand) is built and proven on
  3 pages, not swept estate-wide** (shipped 2026-09-21; `FIXES_LOG.md`). A grep
  for the platform's verbose-explanatory-text pattern hit 20+ pages, but most
  turned out to be the wrong target: card-grid bodies where the title already
  summarises (collapsing would cost clicks, not save them) or live/dormant
  trust disclosures (`compliance.html`, `marketplace.html`) that need to stay
  visible at a glance per this repo's own anti-fabrication rule. `world-shell.html`,
  `factions.html`, `awards.html` were the first three verified fits; **three more
  shipped 2026-09-21**: `characters.html` (a clean standalone intro paragraph
  under the h1), `prediction.html` (the Oracle explainer — the lead sentence
  keeps the "no API key exposed in client code" trust fact visible, only the
  elaboration collapses), `vocabulary.html` (a section preamble ahead of a
  research-citation stack, not a repeated grid item). Same discipline as the
  first three: full original text preserved verbatim in `.omi-full`, only a
  fresh one-sentence lead written. **Four more shipped 2026-09-21**:
  `codex.html`, `tribe.html`, `elements.html`, `automation.html` — the
  judgment call on the single-item `--cols:1` "about this feature" cards was
  resolved in favor of collapsing them: the card title (e.g. "HOW THE ENGINE
  WORKS") names the *topic*, it does not summarise the two paragraphs of
  prose beneath it the way a multi-item grid's title stands in for its whole
  entry, so the same short-lead treatment applies. Total now 7 pages.
- **Sigil-as-entry-point coverage is now complete for every genuine candidate
  found by two independent surveys — `world-shell.html`, `index.html`,
  `characters.html`.** A full reconnaissance of every emblem-rendering module
  found no fourth: `agents.html`'s roster switches the in-page chat agent
  (not navigation), `cosmos.html`/`honors.html`/`elements.html`'s preview
  cards intentionally use `OmegaEmblemPanel`'s richer preview-then-modal
  pattern, and `elements.html`/`houses.html`/`gates.html`/`pantheons.html`/
  `factions.html`/`family.html`'s grids all render the *viewing member's own*
  data, not links elsewhere. `dashboard.html`'s quick-actions list is a real
  candidate (real links, flat glyphs) left open on a design call, not a
  coded exclusion: it's a dense single-line list, not a card, and `dial()`'s
  full geometry read as too heavy at that scale in a quick check.
- **The `a[href]{display:inline-flex}` CSS-specificity bug
  (`omega-accessibility-audit.css`) has now been found and fixed on 3
  separate anchor-based card layouts** (`world-shell.html`'s `.char-card`,
  `characters.html`'s `.archetype-card`, plus the one already documented in
  `FIXES_LOG.md`) — each time by accident, while verifying unrelated work,
  never by a deliberate sweep. **Two attempts at a full 205-page automated
  scan for this exact bug class both ran past this session's command time
  budget and did not complete.** This is recorded as genuinely open, not
  audited-and-clean: a real possibility that other anchor-based multi-child
  layouts elsewhere in the 205 pages carry the same silent squish, undetected
  because nothing has looked. A future session with a longer-running or
  chunked scan is the correct way to close this, not another accidental find.
- **Two independent, non-colliding but functionally-duplicate "sigil entry
  point" / "progressive disclosure" systems now exist platform-wide,
  from separate, unrelated efforts.** This session's own `OmegaIdentity.dial()`
  + hand-curated `omega-more-info.js` (`[data-omega-more]`, opt-in, ~9 pages)
  ships alongside a newer, more automatic pair merged in from elsewhere:
  `omega-content-sigil-system.js` (a self-referential `.omega-page-door` on
  every non-system page, wired via `omega-emblem-integration.js` from `bg.js`)
  and a heuristic-selector auto-compactor (`.hero-subtitle`/`.lead`/`.intro`/
  etc., 180-char threshold). The selectors genuinely don't overlap today, so
  nothing double-processes — but two systems solving the same UX problem
  independently is exactly the kind of divergence CLAUDE.md 8.1 class 8 warns
  about for canonical data; the same risk applies to canonical *components*.
  **A real, live bug exists in the newer system, found but not fixed** (not
  this session's system to redesign unilaterally): `.omega-page-door`'s link
  points at `location.pathname` — the page's own URL — so it renders a
  "click to enter" affordance on the page a member is already viewing, a
  dead-end self-link. Confirmed live on `dashboard.html`/`codex.html`
  (door present, `href` equals the page's own path) and `characters.html`
  (both `.omega-page-door` and `omega-identity.js`'s own `.oid-hero` render
  stacked at the top of `main`, redundant). Deciding whether the fix is "make
  the door link elsewhere," "suppress it where a hero already exists," or
  "converge the two more-info systems into one" needs a real decision, not a
  silent patch from whichever session notices it next.
- **`OmegaGuardian`'s six risk signals are dead wiring** — none is emitted, so
  the score moves only on 30-min idle and a failed gated action, never on a
  threat. Detection is an architecture decision. (`gate()` *is* called —
  `approvals.html`, 3 sites — and `updateBadge()` repaints every 2s.)
- **`omega-threat.js` is the digital-thread traceability engine**
  (`window.OmegaThread`), not threat detection; filename kept.
- **Performance advisor: `unused_index` (125), `unindexed_foreign_keys` (61).**
  Both INFO and expected: "unused" reflects 9 profiles and near-zero traffic —
  nearly every one is the `user_id` pattern RLS filters on — and the 61 FKs are
  all on the scaffold below.
- **~83 tables live that this repo's SQL never created** — a generic
  multi-tenant SaaS scaffold (LMS, billing, workspaces, calendars). RLS on, no
  policies — the *safe* state — and empty. Inventing policies for schema of
  unknown purpose fabricates behaviour. **Decision made 2026-09-21: the owner
  named this scaffold a real income project.** LMS/courses picked as the
  first vertical (over project-management, marketplace, and knowledge-base/
  AI-workspace directions — see `FEATURE_IDEAS.md` #37 for the reasoning),
  with individual members buying directly rather than a multi-tenant pivot.
  The `academy_categories`/`courses`/`modules`/`lessons`/`enrollments` slice
  of the scaffold is real-RLS'd, schema-captured into `supabase/migrations/`,
  and shipped — but dormant behind `platform_settings.courses_enabled=false`
  until the owner turns it on (`FIXES_LOG.md`). **Follow-up shipped
  2026-09-21, same flag:** the exam/quiz layer the first slice deliberately
  left dormant — `academy_exams`/`academy_questions`/`academy_exam_results`
  — is now real-RLS'd, schema-captured, and seeded with one real exam on
  the existing Financial Foundations course (4 questions, one per lesson,
  not invented trivia). One deliberate design choice beyond the courses
  pattern: `academy_questions.correct_answer` is excluded from the
  `authenticated` SELECT grant at the column level (Postgres column-level
  GRANT, confirmed live via `information_schema.column_privileges`) — a
  bare RLS policy would let a member read the answer key through the same
  query that renders the quiz. Grading happens inside a new
  `submit_exam_attempt(exam_id, answers)` SECURITY DEFINER RPC, which reads
  `correct_answer` with the function owner's privileges and returns only
  the score; members get no INSERT grant on `academy_exam_results` at all,
  so the RPC is the only path to a result row. Verified live: a member
  session gets `42501` selecting `correct_answer` directly and `42501`
  inserting a result row directly; a real mixed-answer RPC call scored
  3/4 correct as 75% and passed against `pass_score=70`. Full interactive
  browser flow (enroll → complete all 4 lessons → exam unlocks → answer →
  submit → best-score card) verified with 0 console errors. **Second vertical
  shipped 2026-09-21: project management.** Owner-directed ("all of them") —
  this one turned out to be a migration, not a fresh build: `projects.html`
  already existed as a complete, real, working page, running entirely on
  `localStorage` (`omega_projects`/`omega_proj_tasks`). The dormant backend
  for it already existed too (`projects`/`project_members`/`project_files`/
  `project_activity`/`tasks`/`task_comments`/`task_attachments`/
  `task_labels`/`task_label_map`, 9 tables, RLS-on/no-grants, unreferenced by
  any client code) — schema-captured, then a v1 slice launched on
  `projects`+`tasks`+a new `project_milestones` child table (the live
  scaffold had no milestones concept; matched the relational shape every
  other child table here already uses rather than a JSONB blob).
  `category`/`priority` columns added to `projects` — real columns the live
  scaffold lacked but the existing page's UX depends on. Individual-owner
  RLS (`owner_id = auth.uid()`), no team/organization layer for v1 —
  `project_members`/`project_files`/`project_activity`/`task_comments`/
  `task_attachments`/`task_labels`/`task_label_map` stay deny-by-default,
  a real, separate collaboration-features follow-up. Verified live: two-
  member RLS impersonation confirms full row isolation on all three tables
  (projects, tasks, project_milestones) — a second member sees 0 rows and
  cannot update or read another owner's data. Full browser flow (create with
  a milestone, cycle status, add/toggle a task, edit with pre-filled form,
  delete) verified against a custom stub matching the real query shapes, 0
  console errors. `supabase/live-schema.json` was stale since 2026-09-17 (five
  real migrations behind) — regenerated in the same change, closing false
  positives `scripts/schema-dictionary.py` would otherwise have reported on
  the new `category`/`priority` columns; verified the gate still bites with a
  real negative control (a planted nonsense column, caught, then reverted).
  `settings.html`'s "45 pages keep what you enter in this browser only" went
  stale the moment `projects.html` moved off `localStorage` — corrected to 44,
  matching `evidence-audit.py`'s own device-local count. **Third vertical
  shipped 2026-09-21: marketplace favorites.** A real finding changed this
  slice's scope before any code was written: `marketplace.html` was **not**
  dormant — it already runs a real, live `marketplace_listings` flow (browse,
  list, my-listings), RLS'd with 4 real policies and granted to
  `authenticated`. What was genuinely dormant were four sibling tables never
  `CREATE TABLE`'d anywhere in this repo: `marketplace_favorites` (activated,
  own-row save-for-later), and three left deliberately dormant because each
  needs its own decision first — `marketplace_categories` (needs a
  `category_id` column added to `marketplace_listings` plus a taxonomy
  design), `marketplace_orders` (the purchase/payment side of the same
  dormant Ω-token economy `marketplace.html`'s own SCIENCE tab already
  documents as off behind `platform_settings.tokens_enabled` — activating it
  would be the token-economy decision already made this session to stay
  dormant), `marketplace_reviews` (no verified-buyer signal exists without an
  orders flow, a trust-model decision). Verified live: a second member can
  favorite any listing and the owning member cannot see that favorite row
  (own-row isolation, no public "N people favorited this" counter for v1).
  Full browser flow verified: favorite → appears in a new FAVORITES tab →
  unfavorite → empty state returns, 0 console errors. **Fourth vertical shipped
  2026-09-21: knowledge base (personal notes).** Same shape as project
  management: `notes.html` already existed as a complete, working page
  (title/body/category/tags/pin/markdown render/search) running entirely on
  `localStorage` (`omega_notes`). The dormant backend was a 10-table
  knowledge-base/AI-workspace scaffold (`ai_documents`, `ai_workspace_*`,
  `knowledge_attachments`, `knowledge_documents`, `knowledge_edges`,
  `knowledge_nodes`, `knowledge_spaces`, `omega_knowledge_*`) — of which only
  `knowledge_documents`/`knowledge_spaces`/`knowledge_attachments` had never
  been `CREATE TABLE`'d in this repo (`knowledge_nodes`/`knowledge_edges` were
  already declared, in `0056_entreprise_schema_v2.sql`). Only
  `knowledge_documents` was activated for v1, plus `category`/`tags`/`pinned`
  columns the live table lacked but the page's UX depends on (the same gap
  shape as `projects`' `category`/`priority`). `knowledge_spaces` stays
  dormant — notes.html has no folder/notebook concept, and `space_id` is
  nullable, so a spaceless personal note is a correct row, not a workaround.
  `knowledge_attachments` stays dormant — no file-attachment feature exists to
  migrate. Every `ai_workspace_*`/`ai_documents`/`omega_knowledge_*` table is
  untouched — an actual AI/RAG workspace is a materially larger, separate
  decision, not implied by migrating a notes page. Individual-owner RLS
  (`author_id = auth.uid()`), matching the `projects`/`marketplace_favorites`
  pattern. Verified live: two-member RLS impersonation on both UPDATE and
  DELETE (not just INSERT/SELECT, since `notes.html` needed both) — a second
  member's update and delete each affect 0 rows against another member's note,
  while the true owner's update affects 1 row; test row cleaned up after.
  Full browser flow verified against a custom stub: write → save → appears in
  NOTES tab → open (view) → pin → delete (with confirm), 0 console errors.
  `settings.html`'s "44 pages keep what you enter in this browser only" went
  stale the moment `notes.html` moved off `localStorage` too — corrected to
  43, matching `evidence-audit.py`'s device-local count (5 with an export path
  + 38 without). **Fifth "vertical" (billing/subscriptions) investigated
  2026-09-21 and deliberately left dormant — not built.** Unlike the first
  four, it has no matching real, working local-only page to migrate:
  `payments.html`/`subscriptions.html` are already live, wired to the real
  Stripe-backed flow (`checkout`/`stripe-webhook` Edge Functions →
  `apply_subscription_event()` RPC → `profiles`/`stripe_webhook_events`, plus
  `transactions`/`task_completions` reads) — nothing there is mocked or
  waiting on a backend. The dormant scaffold tables in this area
  (`billing_plans`/`billing_plan_features`/`billing_features`/
  `billing_invoices`, a *separate* generic `organizations`/
  `organization_members`/`wallet_accounts`/`subscriptions`/`payments` set,
  none ever `CREATE TABLE`'d in this repo) are a multi-tenant B2B
  plans/seats/invoicing system — a materially different shape from this
  platform's real one (a single owner, individual members subscribing
  directly, no organizations signing up their own teams). Put to the owner
  directly: build a generic B2B scaffold with no driving use case, define a
  concrete billing capability first, or leave it dormant. **Decision: leave
  it dormant** — CLAUDE.md §9 already rules out shipping a monetizable
  feature without real grounding, and inventing multi-tenant billing
  architecture for a single-owner platform is exactly the "designing for
  hypothetical future requirements" this repo's own working rules warn
  against. The tables remain exactly as found: RLS-on, zero grants, safe and
  inert. Revisit only if a concrete billing/subscription capability is named
  — then run it through `web-trend-scout` → `grill-me-codex` (HIGH-RISK gate,
  real money) before any schema work, per `CLAUDE.md` §10.
- **No `WITH CHECK(true)` spoofing gap** (live 2026-08-29; this entry used to
  claim one). `platform_events` is scoped to `auth.uid() = user_id`.
  `platform_metrics` has `WITH CHECK(true)` but no `user_id`, so there is
  nothing to spoof — junk rows, not impersonation — and `authenticated` lacks
  INSERT on both anyway. Scope it before that grant is ever added.
- **`feature_flags` and `governance_policies` are readable by every approved
  member**, by pre-existing policy. Both look deliberate but became *reachable*
  only when the missing grants were added, so they are recorded rather than
  assumed fine. All 10 visible governance rows are `status='active'`.
- **127 tables have RLS policies and no grant** (down from 130 on
  2026-09-17 — `academy_exams`/`academy_questions`/`academy_exam_results`
  granted 2026-09-21 as the exam-layer follow-up above, `academy_questions`
  column-restricted rather than a full table grant). Left locked out — the
  safe state for the rest. Cross-referenced against client `.from(...)`
  calls: unreachable from any page, do not "fix" by granting without
  deciding the feature is wanted. **One was reachable and broken** —
  `agent_experiments` (`autonomous-insights.html`) hit a real, live `42501`
  on every read; granted and verified in #179, not a case of this rule.
- **Third-party pins are gated** (`scripts/resilience-audit.py`, blocking;
  detail in `FIXES_LOG.md`). It caught 15 CDN deps floating, one at `@latest`.
  **A grep cannot find these — they are injected at runtime, not markup**; only
  CSP violations in a real browser surfaced them. Resolve versions from
  `registry.npmjs.org` (the CDNs are 403), never memory. `vercel.json`'s CSP is
  **enforced**, verified at 0 violations; as written before it would have killed
  the webfonts and four features. Stripe is fixed in code, not by pinning:
  `periodEndSeconds()` reads both pre-basil and basil shapes, since two of three
  read sites take the *inbound webhook* payload, whose version is a dashboard
  property no repo change can pin. **Still open: the
  single physical CI runner** — never "fix" it with a hosted lane;
  `docs/CI_RUNNER_RECOVERY.md` records that returning `runner_id: 0`/`steps: []`.
- **The Vercel integration merges estate-wide PRs that leave `main` red** —
  twice in one hour (#250, #252), each adding `omega-*.js` modules and a script
  tag to ~193 pages without regenerating the census. Remedy: `python3
  scripts/omega-registry.py`. Never auto-commit it in CI — that gate is the only
  check here that notices a third party editing the estate. Both were sound
  otherwise; the CSP and build-step checks are in `FIXES_LOG.md`.
- **GitHub Actions runs on a SELF-HOSTED WINDOWS runner** (`C:\actions-runner`),
  so jobs drain one at a time and `queued` is normal. A red check is real output
  now, not the old `runner_id: 0` no-op. Two Windows traps: paths and console
  codec differ, and a crashed child yields empty stdout, so assertions on it
  misreport (`FIXES_LOG.md`). `./scripts/ci-local.sh` runs every blocking step
  locally; `.githooks/pre-push` runs it on push (`git config core.hooksPath
  .githooks`, bypass `--no-verify`).
- **The `authenticated` SECURITY DEFINER count (93) is mostly noise, and was
  checked.** Owner-sensitive ones guard via `public.omega_is_owner()`, which a
  classifier looking for `is_platform_owner` misses; three unguarded-and-uncalled
  ones were revoked (`migrations/0097`), the rest have callers. Impersonation
  across 17 tables found every populated table scoped. **When adding any
  function, `REVOKE EXECUTE … FROM PUBLIC` in the same file** — Postgres grants
  it to PUBLIC on every `CREATE FUNCTION`, so the insecure state returns on its
  own; that is how 70 revoked functions became 23.
- **`auth_leaked_password_protection` stays on; expected** (live 2026-09-03:
  `plan: free`, Pro-and-above). An Auth *dashboard* toggle, no SQL reaches it.
  Threat closed client-side instead: `omega-password-guard.js` (HaveIBeenPwned
  k-anonymity) on `account.html`/`reset.html`. **A direct Auth API call still
  bypasses it — not resolved.** Fails open reporting `checked:false`; never
  render "not breached" on that (`scripts/tests/test_password_guard.py`).
- **`scripts/audit.py`'s 7 warnings** are each labelled by the tool as real
  risk vs. known noise. They cannot reach 0 without live-schema verification,
  and forcing them down trades a known-unknown for an unverified "fixed". The
  count drifts between 7 and 8 — re-run and diff the list, never assume.
- **90 `omega-*.js` modules load on every page.** 41 expose a global nothing
  calls — a trap of a metric: `omega-a11y.js` is one and does real work on every
  page. Self-activation with no caller is the norm. Which are genuinely
  page-specific is a real audit.

**Why these live here now.** `CLAUDE.md` is loaded into every session and is capped at
16,000 tokens by `scripts/context-budget.py` (blocking in CI). §8.2 reached that cap: two
consecutive sessions could only add a standing fact by compressing older bullets, and the
compression had started costing information rather than words. The list above is reference
material — a session consults it when it touches one of these areas, not before it starts —
so it belongs in an on-demand document. `CLAUDE.md` §8.2 now keeps only the few items that
change what a session does in its first minutes, and points here for the rest.

Keep this list evidence-cited exactly as `CLAUDE.md` §9 requires: a file:line, a command's
real output, or a query result. Never mark an item fixed, applied, or verified unless it
actually was, in that session.

## 0. P0 — CRITICAL: full owner-approval bypass in `supabase/trial_access.sql` (fixed this session, validated against a live PostgreSQL 16 instance)

**This is the most severe finding across every session on this branch — a complete authentication/approval bypass, not just a data-exposure bug.**

`supabase/trial_access.sql` defines `grant_permanent_access(uuid)`, `grant_trial_access(uuid)`,
and `expire_trial(uuid)` — all three `SECURITY DEFINER`, all three `GRANT EXECUTE ... TO
authenticated`, and **none of them checked who was calling**. Any signed-in member could open
the browser console on any page (the anon/publishable key is public by design) and run:

```js
await sb.rpc('grant_permanent_access', { p_uid: (await sb.auth.getUser()).data.user.id })
```

— instantly, permanently self-approving to full platform access, completely bypassing the
pending queue, the owner review step, and the entire approval system this platform is built
around. `expire_trial(uuid)` was worse in the other direction: it took *any* uuid with no
ownership check, so one member could call it against another member's id to revoke their
access, reset all three of their axes to 1.0, and permanently delete their `task_completions`
— a griefing/data-destruction vector against arbitrary other members.

**Why this had gone unnoticed:** `supabase/0003_privilege_lockdown.sql` (already in the repo,
predates this session) documents and fixes this *exact* vulnerability class, and 7 other files
that also define these same three functions (`chunk_02b_migrations.sql`,
`chunk_07_migrations.sql`, `migration_runner.sql`, `omega_access_control.sql`,
`omega_master_deploy.sql`, `omega_notify_triggers.sql`, `trial_fix.sql`) all already carry the
guard (`IF auth.uid() <> p_uid AND NOT public.is_platform_owner() THEN ... forbidden`). It
looks, at a glance, like the hole was closed platform-wide. **`trial_access.sql` itself was the
one copy that was missed** — and critically, each of its three functions opens with an
unconditional `DROP FUNCTION IF EXISTS ...`, which sidesteps Postgres's own protection against
silently replacing a function with an incompatible signature (`42P13`). This means applying
`trial_access.sql` *after* any of the 7 guarded copies — entirely possible, since the flat
`supabase/*.sql` bag has no enforced application order (`CLAUDE.md` §5) — would silently
overwrite the guarded, safe functions with these unguarded ones, **reopening the hole on a
platform that already believed it was fixed**.

**Fixed** by adding the identical, already-proven `IF auth.uid() <> p_uid AND NOT
public.is_platform_owner()`-style guard used verbatim by the other 7 copies — not a new
design, the one file that never got the established convention. Then **validated end-to-end
against a real, throwaway local PostgreSQL 16 instance** (this environment has `postgresql-16`
installed; spun up a scratch database, stubbed `auth.uid()`/`is_platform_owner()`, applied the
patched file, and ran four scenarios):

| Scenario | Expected | Result |
|---|---|---|
| Attacker calls `grant_permanent_access(own-uid)` | Denied, `access_approved` stays `false` | ✅ Denied |
| Attacker calls `expire_trial(victim-uid)` | Denied, victim's row and `task_completions` untouched | ✅ Denied, victim's `access_approved` still `true`, 1 task_completion still present |
| Owner calls `grant_permanent_access(attacker-uid)` | Succeeds — legitimate path preserved | ✅ `access_approved` becomes `true` |
| Member calls `expire_trial(own-uid)` | Succeeds — self-service path preserved | ✅ `access_approved` becomes `false` |

Database dropped after the test; no live credentials were used or required, since the exploit
and the fix are both provable against a schema-only scratch instance. **Applied to the live
database and verified this session** — `scripts/verify_fixes.sql` confirmed
`grant_permanent_access`'s live body now contains the `is_platform_owner()` guard. The hole is
closed. Whether this file was *ever* applied to production in its original unguarded form
before this fix — worth checking `select * from public.access_grant_audit order by
occurred_at desc;` and cross-referencing `select id, display_name, access_approved, is_trial,
created_at from public.profiles where access_approved=true order by created_at desc;` for any
approved member the owner doesn't remember approving, per `0003_privilege_lockdown.sql`'s own
verification section, which applies identically here — remains open and worth a look, since
verifying the *current* guard says nothing about what may have happened before it existed.

- **`advertisements` has owner-only UPDATE and DELETE policies with no matching
  table-level `GRANT`** (opened 2026-09-05; `FIXES_LOG.md` 102). Live,
  `authenticated` holds only `SELECT` and `INSERT` on `public.advertisements`,
  while `advertisements_owner_update` and `advertisements_owner_delete` both
  gate on `private.is_platform_owner()`. A `GRANT` is checked *before* row
  security, so neither policy can ever run — §8.1 class 6, the same shape that
  put 60 tables behind `42501`.

  It is open rather than fixed because nothing exercises it: `advertising.html`
  selects at `:172` and `:222` and inserts at `:206`, and no page or Edge
  Function updates or deletes an advertisement. Closing it means
  `GRANT UPDATE, DELETE ON public.advertisements TO authenticated` — safe,
  since RLS then restricts both verbs to the owner — and that is the change to
  make **in the same session that builds an owner-facing approval surface**,
  not before, so the grant and the code path that needs it are verified
  together.

- **Two authored stylesheets reach nothing** (opened 2026-09-06; `FIXES_LOG.md` 109).
  `omega-platform-visual.css` is never loaded by any page, `bg.js` or module, **and**
  every rule in it is scoped to `.omega-visual-platform`, a class that appears nowhere
  in the repository — confirmed in a render, where `dashboard.html` loads only three
  named sheets and that class is absent from the DOM. It styles `.card`, `.panel`,
  `.glass`, `.realm-card` and `.feature-card`, so it looks load-bearing and is inert.
  `react-foundation.css` has the same shape (0 pages, 0 `bg.js`, 0 modules).

  It is open rather than fixed because switching it on is not safe yet: it sets
  `border-color:var(--omega-line)` on five card families while `--omega-line`
  resolves to the empty string, and an invalid `var()` makes the property `unset`,
  which would **remove** borders those pages currently draw. Give the token a single
  owner first (§4's rule), then adopt or delete the sheet. `scripts/audit.py` flags an
  orphaned `omega-*.js` but not an orphaned `.css` — a gate for that would have caught
  both.

  **CLOSED 2026-09-14 (`FIXES_LOG.md` 163).** All ten are deleted, this pair included.
  The `--omega-line` reservation above turned out to be moot for
  `omega-platform-visual.css`: the rule that reads the token is scoped to
  `.omega-visual-platform`, so it could never have applied to any page's borders
  whatever the token resolved to — the danger was in a branch that cannot execute.
  `react-foundation.css` was measured the same way and had 0 of its 8 classes in any
  page's markup. `audit.py` check 2b now reports no unloaded stylesheet at all.

- **CLOSED 2026-09-14 (`FIXES_LOG.md` 163) — the subsystem no longer exists, and
  the one-line claim was never true.** This item read: *"`omega-interface-v2.js`
  injects 20 of the 34 orphaned modules and 8 of the 10 dead stylesheets, and every
  file it asks for exists on disk … adding one `<script>` line to `bg.js` would light
  all twenty at once."* Re-measured, both halves fail:

  - `omega-interface-v2.js` **is not on disk**, and neither is a single one of the
    twenty (`0 present / 20 absent`). All were deleted in `c7ca3569` *"Clean up 33
    orphaned modules never loaded by platform"* — the same commit that left
    `omega-world-shell.js` calling a deleted `OmegaLayeredUI` (`FIXES_LOG.md` 162).
  - The line would have lit nothing anyway. **No module in the repository emits any
    of those stylesheets' classes** — `omega-mc-backdrop`, `ocs-grid`,
    `omega-hub-grid`, `omega-nexus-node`, `omega-agent-card`, `omega-command-backdrop`,
    `omega-ops-badge`, `omega-react-grid` each return zero across all 144 root `.js`.
    Each sheet's markup came from its own module, and those modules are gone.

  `c7ca3569` deleted 33 modules and **0 stylesheets**, so the ten sheets were the
  unfinished half of a merged cleanup: eight of them had a same-named partner module
  deleted by that very commit. All ten are now removed, `audit.py` check 2b reports
  none, and the nine corresponding pages render PASS. **The transferable rule: a
  cleanup that deletes one side of a pair leaves the other side looking like a
  feature waiting to be switched on.**

  It is open rather than done because four blockers are **measured**, not suspected.
  The first is disqualifying on its own and was found in a render, not a read:

  0. **Its own HUD has no stylesheet.** `omega-interface-v2.js` mounts
     `<div class="omega-v2-hud">` on `document.body`, and six of the seven classes
     that HUD uses are defined in no stylesheet in the repository. Rendered on
     `dashboard.html` and `profile.html` after all nine sheets it injects had
     loaded: `position:"static"` (in the document flow, not chrome),
     `sheetsDefiningHud:0`, a 1280×43 box at the document bottom carrying the
     literal visible text `Ω SYSTEM ONLINE GOVERNED MISSION MCOMMAND /`. One
     `<script>` line in `bg.js` puts that strip on all 189 pages. The subsystem is
     not one line from shipping — its entry point was never finished.

  1. **The Ctrl/Cmd+K chord is already taken.** `omega-keyboard.js:155` (loaded on
     every page) binds it to `window.OmegaSearch.open()`.
     `omega-command-palette.js` binds the same chord and calls `preventDefault()`.
     Both handlers would fire and two overlays would open on one keystroke. One of
     the two has to yield, and that is a product decision about which surface owns
     the platform's primary chord — not something to settle silently in a sweep.
  2. **Its guard attributes are array indices.** It injects with
     `inject('/'+x,'data-omega-'+i)` — the guard is the module's *position* in a
     literal, so `data-omega-0`, `data-omega-1`, … carry no module identity at all.
     That is §8.1 class 5b by construction: reorder the array and every guard now
     protects a different module. The attributes need real names before this file
     loads anywhere.
  3. **A bare single-key global binding.** `e.key.toLowerCase()==='m'` opens
     mission control and calls `preventDefault()`, guarded only by
     `/input|textarea|select/i.test(document.activeElement.tagName)`, which does
     not exclude `contenteditable`. Pressing `m` while reading any page fires it.

  The same pass fixed a third, still-free instance of that class:
  `omega-cinematic-engine.js` claimed `#omega-cinematic-css`, the id `bg.js:166,169`
  uses for the cinematic `<link>`. Harmless only while the engine stays dead; it is
  now `#omega-cine-engine-css`.

  Four of the orphans are **not** candidates for wiring at all —
  `omega-apex-visual.js`, `omega-cinematic-engine.js`, `omega-layered-ui.js` and
  `omega-uniqueness.js` each duplicate or contradict a live owner (tilt, particle
  field, absent markup, a cross-page check that cannot work in a browser). The
  per-file evidence is in `FIXES_LOG.md` 111.

- **`authenticated` holds TRUNCATE on 214 tables** (opened 2026-09-06;
  `FIXES_LOG.md` 113). A `GRANT ALL ... TO authenticated` somewhere in the schema's
  history left every public table truncatable by any signed-in member, and TRUNCATE
  **bypasses RLS** — it would wipe every member's rows, not just the caller's.

  It is **not currently reachable**, and the item is scoped at that weight rather than
  as a live vulnerability: PostgREST exposes no TRUNCATE verb, and
  `select proname from pg_proc where prosrc ilike '%truncate%'` returns **0 rows**, so
  no RPC issues one either. The hazard is latent — any future `SECURITY INVOKER`
  function that truncates would inherit the privilege — and it violates least
  privilege today.

  Open rather than fixed because revoking across 214 tables is a schema-wide
  migration: it needs a live-verified pass per grantee, a new timestamped migration,
  `remote-migrations.json` and a regenerated `live-schema.json` in the same change
  (§5), not a bulk statement appended to an unrelated PR.

- **The `LOCAL_ONLY` label meant less than it said** (closed 2026-09-06;
  `FIXES_LOG.md` 113). This document and `EVIDENCE_MATRIX.md` described 45 pages as
  device-local with 40 having "no export path", and the matrix legend asserted member
  data there was "gone with the cache". `public.member_state` has existed live all
  along — correct RLS, correct GRANTs, `PRIMARY KEY (user_id, key)` — and
  `omega-member-state.js` (`bg.js:2192`, every page) mirrors every `omega`-prefixed
  key into it, with `.error` checked. It is actively running: 14 rows, most recent
  `2026-09-06 02:48:58`. Measured coverage across the 45 pages: **80 keys covered, 0
  uncovered, 4 built at runtime**. The matrix now measures and states this per page.

## 1. P0 — Security (all fixed in code this session)

| Gap | Evidence | Status |
|---|---|---|
| Stored XSS in `approvals.html`/`profile.html` | `display_name`/`email` rendered via raw `.innerHTML`; `display_name` is self-updatable by any member (`omega_profile_fields.sql`) | **Fixed** — `esc()` helper added, both files escaped |
| Stored XSS in `sovereigns.html` | `profiles.sign` (self-updatable, `chunk_02b_migrations.sql`'s per-column GRANT list) queried for every `access_approved` member and rendered raw via `.innerHTML` in two places (table row, throne card) — no `user_id` filter, so reachable by/visible to the whole membership, not just the owner | **Fixed** — `esc()` helper added, both occurrences escaped |
| Stored XSS in `queue.html`'s dispatch log | `dispatches.category`/`title`/`body` are member-writable (RLS checked only row ownership, not column values — at the time of this fix via a policy named `"wire insert"`, since superseded by `dispatches_self_insert` in this session's RLS consolidation with the identical self-or-owner shape) and were rendered raw via `.innerHTML` in the OPS queue's "PLATFORM DISPATCH LOG" panel, visible to the owner | **Fixed** — see §4.6 (bundled with the same panel's wrong-column-name fix) |
| Stored XSS in `graph.html`'s constellation-graph tooltip | `profiles.display_name` (self-updatable, every `access_approved` member queried with no `user_id` filter) rendered into the member-node tooltip's `.innerHTML`. The code *attempted* to escape it — `nm.textContent=m.name` then read `nm.textContent` back — but reading `.textContent` returns the original unescaped string (that trick only works if you read `.innerHTML` back instead), so the "escaping" was a no-op. Reachable by hovering any member node; visible to any other approved member or the owner who opens the page | **Fixed** — added a real `escGraph()` helper and used it in place of the broken round-trip |
| Stored XSS in `approvals.html`'s reservations queue | `review_reservations()` RPC (owner-only) returns `media_reservations` rows verbatim; `title` is a `NOT NULL text` column any authenticated member can set to anything via the table's self-or-owner INSERT policy (`auth.uid()=user_id`, no content restriction — at the time of this fix a standalone `mr_insert` policy, since folded into the single `media_reservations_own` ALL policy by this session's RLS consolidation, same permissive shape — the same page members use to submit ad reservations). `approvals.html`'s queue rendered `row.title` raw via `.innerHTML`, unlike every other field on the same page. The sibling `review_contracts()` render had the identical unescaped pattern; `commission_contracts` has no `title`/`type` column today so it wasn't exploitable *yet*, but was fixed defensively for the same reason | **Fixed** — both now go through the page's existing `esc()` |
| Error-monitor free text unescaped, reachable **without authentication** | `report_client_error()` is `GRANT`ed to `anon` *and* `authenticated` (by design — it needs to catch errors from signed-out visitors too) and stores `p_page`/`p_message` with only a length truncation, no sanitization. `error_summary()` (owner-only) aggregates and returns them; `approvals.html`'s error-monitor panel rendered `row.message`/`row.page` raw via `.innerHTML` — reachable by literally anyone on the internet with no login, the widest possible reach of any stored-XSS instance found across this whole audit | **Fixed** — same `esc()`, bundled with the response-shape fix below |
| Stored XSS in `omega-live.js`'s ticker (dormant) | `activity_feed.title` rendered raw via `.innerHTML`; RLS lets any member insert their own `is_public=true` row with an arbitrary title. Currently unreachable — no page has a `[data-live-ticker]` element yet — but `bg.js` loads this module on every page and it clearly exists to power one | **Fixed preemptively** — `esc()` added |
| Reflected XSS in `pulse.html` (external source, not a Supabase table — a different vector than the rest of this sweep) | `item.title` from a Reuters feed proxied via `api.rss2json.com` (plain `fetch()`, no `.from()` call) rendered raw via `.innerHTML` — a compromised/MITM'd feed response would execute script. Missed by the `.from()`-call-centric sweep below since it isn't a database read | **Fixed** — `esc()` added |
| Stored XSS in `omega-notify.js`'s notification panel (dormant) | `n.message`/`n.content`/`n.notification_type` from `public.notifications` rendered raw via `.innerHTML` in `buildPanel()`. Currently unreachable — no `GRANT INSERT` exists on the table for `authenticated`, so the only writers are the 5 owner-gated `SECURITY DEFINER` trigger functions in `omega_notify_triggers.sql`, each inserting a static string literal — but a future free-text notification event (already flagged in §2.2 as deliberately-undone work) would silently re-open this, same shape as the `omega-live.js` ticker above | **Fixed preemptively** — `esc()` added |
| Stored XSS in `approvals.html`'s member card (sign/element) | `profiles.sign`/`element` are free-text, self-updatable columns; the owner's review card rendered `(m.sign+'/'+m.element).toUpperCase()` raw via `.innerHTML` — the row-907-era sweep escaped `display_name`/`email` on the same card but not these. Separately, most page-local `esc()` helpers left `"`/`'` raw (attribute break-out) and two were identity functions | **Fixed** 2026-09-25 — escaped; all 53 helpers normalised and executed by `scripts/tests/test_escape_helpers.py` (`FIXES_LOG.md`, security-hardening pass 3). Still open: `audit-dynamic-html-security.py` reports ~1,600 dynamic-HTML sites, mostly self-data or constants, not yet triaged individually |

This session ran a systematic, evidence-based sweep for all three established bug classes
(stored XSS via unescaped `.innerHTML`, silent-failure writes, and queries against
tables/RPCs absent from the schema) across every page not yet covered by a prior pass:
- **Missing table/RPC check:** cross-referenced every `.from('table')` and `.rpc('fn')` call
  site across all 170 `.html` files against `CREATE TABLE`/`CREATE FUNCTION` statements in
  `supabase/*.sql` (script-assisted, not manual). Only the already-documented gaps in §2/§2.1
  turned up (`transactions`, `wallet_balances`) — `top_pages` initially flagged is a `VIEW`
  (`omega_telemetry.sql`), a false positive from a `CREATE TABLE`-only grep. No new missing
  table/RPC gaps found.
- **innerHTML sweep (template-literal pass):** every file with template-literal interpolation
  into `.innerHTML` (`atlas.html`, `cosmos.html`, `honors.html`, `matrix.html`, `media.html`,
  `mentors.html`, `mindmap.html`, `queue.html`, `targets.html`, `vocabulary.html`, plus the
  already-fixed `family.html`/`profile.html`) checked for its data source. `atlas.html`/
  `mentors.html`/`mindmap.html` read `localStorage` only (self-scoped, not a cross-user
  vector, same category as the finance-pages client-only design in §4.2). `cosmos.html`/
  `honors.html`/`matrix.html`/`media.html`/`targets.html`/`vocabulary.html` interpolate
  static local config arrays (zodiac/agent/phase/system rosters baked into the page), not
  database content. `queue.html` was the one real finding — see §4.6.
- **innerHTML sweep (string-concatenation pass, second wave):** the 54 files building
  `.innerHTML` via `+`-concatenation rather than template literals, traced the same way.
  20 have zero `.from()` calls at all (pure local/computed state — `affirmations.html`,
  `architect.html`, `body.html`, `breath.html`, `budget.html`, `exam.html`, `fasting.html`,
  `mood.html`, `nutrition.html`, `ops.html`, `passport.html`, `projects.html`, `pulse.html`,
  `quotes.html`, `reading.html`, `skills.html`, `time.html`, `water.html`, `weekly.html`,
  `workout.html` — safe from a *Supabase-XSS* perspective, though `pulse.html` turned out to
  have the separate external-feed XSS above, since that sweep was scoped to `.from()` calls
  specifically). Of the remaining 34: `marketing.html`/`news.html`/
  `sovereigns.html`/`hall.html` already use their own `esc()` on the one field that needed it
  (confirmed, not just assumed); `kings.html`/`cinema.html`/`travel.html` already escape their
  Wikipedia-API `extract` field; `tribe.html`'s one member-sourced field (`display_name`) goes
  through `.textContent`, not `.innerHTML`; `health.html`/`travel.html`/`publishing.html`/
  `research.html` query self-scoped tables only (`*_own`-style RLS or an explicit
  `.eq('user_id', ...)` — confirmed per-table, not assumed) so any unescaped free text is a
  self-XSS-only vector, same non-issue category as §4.2's localStorage pages; the rest
  (`beacon.html`, `ecosystem.html`, `elements.html`, `events.html`, `factions.html`,
  `forge.html`, `income.html`, `membership.html`, `prediction.html`, `realm.html`,
  `search.html`, `sigil.html`, `sovereign.html`/`sovereign-ai.html`, `subscriptions.html`,
  `demo-check.html`, `codex.html`) interpolate static config arrays or the viewer's own
  `.eq('id', session.user.id)`-scoped profile. Zero new instances in the `+`-concatenation
  pass itself.
- **innerHTML sweep (bare-variable pass, third wave):** while grepping for the
  string-concatenation shape, also checked the adjacent pattern `.innerHTML=someVar` with no
  visible `+` or `${}` at the assignment site (the variable was built up earlier) — 12 files
  matched (`automation.html`, `charter.html`, `command.html`, `exam.html`, `gates.html`,
  `graph.html`, `grid.html`, `habits.html`, `marketing.html`, `profile.html`, `realm.html`,
  `stoic.html`). Traced each variable's construction back to its source: `charter.html`/
  `command.html`/`stoic.html`/`exam.html` have zero `.from()` calls (static/local only);
  `automation.html`'s `r.icon` and `grid.html`'s grid cells come from static config arrays, not
  the DB rows they're joined against; `habits.html` is `localStorage`-only; `gates.html`/
  `marketing.html`/`profile.html`/`realm.html` are self-scoped or already-escaped (confirmed
  above). **`graph.html` was a real finding** — see the table above and §4.9.
- **omega-live.js pass:** `bg.js`-loaded modules aren't `.html` pages, so weren't covered by
  the per-page sweeps above; checked separately and found the dormant ticker XSS above.
- **`omega-*.js` module pass, extended (this session):** all 16 `bg.js`-loaded modules that
  have both `.innerHTML` and `.from()`/`.rpc()` calls traced individually (`omega-notify.js`
  found above; `omega-chrono.js`, `omega-chronometer.js`, `omega-demo-video.js`,
  `omega-emblems.js`, `omega-feedback.js`, `omega-gate.js`, `omega-membership.js`,
  `omega-onboard.js`, `omega-progress.js`, `omega-realtime.js`, `omega-share.js`,
  `omega-shell.js`, `omega-tier-gate.js`, `omega-user.js` all interpolate static config,
  numeric-only values, or the *viewing* member's own session-scoped profile row — self-XSS-only
  at worst, matching the established non-issue category). `omega-realtime.js` is worth noting
  as a positive control: it reads the same cross-user, member-writable `activity_feed` table as
  the dormant `omega-live.js` ticker, but renders it via `.textContent`, correctly escaped by
  construction — no fix needed, confirming the bug class isn't systemic to every ticker.
- **`.concat()` innerHTML pass (closes the one specific §5.1 gap from the prior session):**
  files build `.innerHTML` via `[].concat(...)` rather than a `+`-visible-to-grep
  concatenation. All 7 that actually feed `.innerHTML` — `contributions.html:172,199`,
  `governance.html:209,229,245`, `heritage.html:154,169`, `kings.html:158`,
  `notifications.html:164,181`, `publications.html:162`, `treasury.html:250,290` (13 instances
  total; re-verified by direct grep during the merge that reconciled this session with the
  prior one, which had undercounted by one file — `kings.html`'s `studyNotes` array was missed)
  — read from `localStorage` only — zero `.from()`/`.rpc()` calls for any of the underlying
  arrays in any of the seven — same self-scoped category as §4.2's finance pages. No new
  findings, but the 7-file/13-instance count (not 6/unspecified) is the accurate one.
- **Silent-failure-write sweep:** every `.html` file calling `.insert()`/`.update()`/
  `.upsert()`/`.delete()` against Supabase (23 files) checked for whether the write's
  `.error` gates the success message. `account.html`, `contracts.html`, `health.html`,
  `marketplace.html`, `oath.html`, `publishing.html`, `research.html`, `terms.html`, and
  `consultancy.html` — the files not already covered by a prior session's fix — all correctly
  check `.error`/throw-and-catch before reporting success. No new silent-failure-write gaps
  found in that pass — but that pass checked `.error`-gating, not whether the written column
  names actually match the live schema, which is a different failure mode (PostgREST rejects the
  whole write before `.error` even becomes "did we handle it correctly"). A later, broader sweep
  (see `CLAUDE.md` §8) diffed every page's `.insert()`/`.update()`/`.upsert()` payload keys
  against the real `CREATE TABLE` column lists and found two more this way:
  `advertising.html`'s entire Live Ads/Submit feature (near-total column-name mismatch against
  `public.advertisements`) and `approvals.html`'s dispatch-send fallback path (wrote
  `sent_by`/`sent_at`, columns that exist in neither divergent `dispatches` shape, with no
  `.error` check at all — the false-success-toast variant this section was originally looking
  for, just missed because the column-mismatch masked it). Both fixed; see `CLAUDE.md` §8 for
  full detail.
- **Incidental finding, not XSS but turned up by the same sweep — `access_audit_log` RPC
  response-shape mismatch, fixed:** see §2 (new row) and §4.8.
- **`member_events` dead-write gap — fixed (`FEATURE_IDEAS.md` #1).** `events.html:199`
  inserts into `public.member_events` (RLS: `"events are visible to all members"`, public
  SELECT), but grep had confirmed **no page anywhere in the repo ever selected from it** — the
  table had been write-only since whatever session added the insert. Not a security issue
  (nothing rendered the data, so no XSS surface existed despite the permissive read policy),
  but a real completeness gap. Smallest-scope fix per `FEATURE_IDEAS.md` #1: a read-only
  "RECENT MEMBER SUBMISSIONS" feed added to `events.html`'s existing SUBMIT tab
  (`.from('member_events').select(...).order('created_at',{ascending:false}).limit(20)`), using
  the same `esc()`-escaping convention as `contracts.html`/`dashboard.html`/`approvals.html`/
  `profile.html` since `title`/`description`/`event_type`/`format` are member-writable text. No
  schema/RLS change. Verified with a Node harness feeding the render function real data
  (including an XSS payload in `title`/`description`) plus empty and `.error` cases — escaping,
  empty-state, and error-state all confirmed correct.

A full re-sweep of all 170 pages for every possible bug class still has not been performed —
eight session-level passes now (this one covering three `.innerHTML`-shape sub-waves, the
`omega-live.js`/`pulse.html` non-page-scoped pass, the missing-table/RPC and
silent-failure checks, and this session's `.concat()`-shape pass plus the extended
`omega-*.js` module trace) cover a growing subset, not an exhaustive one — see §5.1.

## 2. P0/P1 — Data integrity: fixed in code, applied to the live database and verified

The owner applied every file in this section to the live database, then ran
`scripts/verify_fixes.sql` (added this session) against it, which confirmed each one directly
via `information_schema`/`pg_proc` — not inferred from "no rows returned." One real gap the
verification caught: `extend_trial` initially lacked its notification-insert (an older copy of
the function had won a run-order race against `omega_notify_triggers.sql`); re-running
`omega_notify_triggers.sql` once more, last, fixed it — confirmed via a follow-up query. That's
the concrete version of the "whichever file runs last wins" risk this file has warned about —
worth remembering for any future SQL applied outside a strict, deliberate order.

| Gap | Evidence | Fix location | Live DB status |
|---|---|---|---|
| `public.notifications` table missing | `omega-notify.js` (platform-wide via `bg.js`) queries it; no `CREATE TABLE` existed anywhere | `supabase/omega_notifications_fix.sql`, `migrations/0091` | **Applied, verified** |
| `public.user_assets` table missing | `portfolio.html`/`vault.html` query it; no `CREATE TABLE` existed anywhere | `supabase/omega_user_assets_fix.sql`, `migrations/0089` | **Applied, verified** |
| `extend_trial` RPC missing | `approvals.html`'s extend button calls it; function never existed | `supabase/omega_extend_trial_fix.sql`, `migrations/0090` | **Applied, verified** |
| `notifications` table never populated | Table existed (once applied) but nothing inserted a row | `supabase/omega_notify_triggers.sql`, `migrations/0092` (5 RPCs now insert on event) | **Applied, verified — required a second run.** First live attempt hit `42P13: cannot change return type of existing function` on `grant_permanent_access` (fixed by adding a dynamic drop-prior-versions block, see prior entry in this file's history). After that fix was applied, `extend_trial` specifically still lacked the notification insert — a per-function check (`pg_get_functiondef(oid) ilike '%insert into public.notifications%'`) showed the other 4 functions had it but `extend_trial` didn't, meaning something else with its own copy of `extend_trial` ran after this file. Re-running `omega_notify_triggers.sql` once more (idempotent, safe) fixed it; re-verified via the same per-function query, now all 5 pass. |
| Authority History chart queried wrong table | `omega-chart.js` queried nonexistent `authority_snapshots`; real table is `leaderboard_snapshots` | Table name corrected in `omega-chart.js` directly | N/A — no schema change needed, fix is live in code |
| `consult_requests` missing 3 columns `consultancy.html` sends | Form sends `{domain,contact,preferred_time,brief}`; table only had `domain`/`message`/`urgency`/`commission_rate`/`confidentiality_accepted` — every submission errored, booking flow fully non-functional | `supabase/omega_consult.sql`, `migrations/0013` (non-destructive `ALTER ADD COLUMN`) | **Applied, verified** |
| `access_audit_log` RPC response shape mismatch | Both callers (`approvals.html`, `vault.html`) treated `r.data` as a plain array; the RPC actually returns `{ok, rows:[...]}` (all 3 definitions agree). Result: `vault.html`'s `.slice()` on the object always threw, silently falling back to fabricated demo entries presented as real security log; `approvals.html`'s `!rows.length` on the object always read as empty, showing "NO AUDIT ENTRIES" even when real rows existed. Broken for every caller, including the owner — the RPC's actual intended audience | Both files' client code corrected to read `r.data.rows`; field names remapped to what the RPC actually returns (`action`/`subject`/`actor`, not the imagined `event`/`event_type`/`status`/`user_id`) | N/A — no schema change needed, both fixes are pure client-code, live the moment deployed |
| `error_summary` RPC — same response-shape bug as `access_audit_log` | Same `{ok,rows:[...]}` wrapper convention (all 3 definitions agree), same wrong assumption in `approvals.html`'s error-monitor panel (`r.data\|\|[]`) — always showed "NO CLIENT ERRORS RECORDED" regardless of real content; also referenced a `row.count` field the RPC doesn't return (real field is `hits`) | Corrected to `r.data.rows`, field name `hits`, and escaped (see §1 — this RPC's data is reachable by unauthenticated `anon` callers via `report_client_error()`) | N/A — pure client-code, live the moment deployed |
| `my_points_balance` RPC response shape mismatch | Returns `{ok,balance}`; `blockchain.html` did `Number((await sb.rpc(...)).data).toFixed(0)` — `Number()` on an object is `NaN`, so the Ω points balance display always showed "Ω NaN" regardless of the member's real balance | `blockchain.html` corrected to read `.data.balance` | N/A — pure client-code, live the moment deployed |

**Also applied and verified this session (not previously tracked in this table):**
`supabase/omega_apply_subscription_fix.sql`/`migrations/0093` and the amended
`omega_complete_task_dedup_fix.sql`/`migrations/0094` (§3.1) — see there for the full
verification detail, including the `pg_get_function_identity_arguments()` gotcha (it never
includes `DEFAULT` clauses, so verifying a function's signature must compare bare names/types).
`supabase/trial_access.sql`'s owner-approval-bypass guard (§0) — confirmed live via
`pg_get_functiondef(oid) ilike '%is_platform_owner%'` on `grant_permanent_access`.

Every SQL fix tracked in this file has now been applied to the live database and verified —
none of the previously-"Not applied" items remain outstanding as of this session.

### 2.1 Still genuinely missing (not fixed — no code exists yet)

| Gap | Evidence |
|---|---|
| `subscriptions.html` queries `public.transactions` | Table doesn't exist. Page's own empty-state copy already says "PAYMENT ACTIVATION PENDING LEGAL REVIEW" — reads as intentional, not accidental |
| `vault.html` queries `public.wallet_balances` | Table doesn't exist. Consistent with the Ω token economy being documented elsewhere as dormant (`platform_settings.tokens_enabled = false`) |

Both left undone on purpose per `CLAUDE.md`'s own rule against building monetizable/token
infrastructure without an explicit gating decision first — not silently fixed in this pass
either.

### 2.2 `user_assets`: table exists in code, nothing populates it

Per `omega_user_assets_fix.sql`'s own header: rows are meant to be written server-side
(mission outcomes, trade, sovereign grants), and neither `portfolio.html` nor `vault.html`
ever calls `.insert()`/`.update()` on it. **No trigger events for this exist in the codebase
yet** (no "trade" mechanism, no "mission outcome" reward pipeline) — unlike `notifications`
(§2, fixed this session), this one was deliberately left unbuilt because building it would
mean inventing business logic that doesn't exist, not just wiring up already-defined events.

## 3. P1 — Schema hygiene

| Gap | Evidence | Recommendation |
|---|---|---|
| 47 tables defined in >1 SQL file | `scripts/audit.py` output — `platform_settings` in 12 files, `platform_owners`/`dispatches` in 10 each | "Idempotent, safe to replay" is only proven true *relative to each other on a fresh database* — this session validated the full `migrations/0001`–`0094` sequence end-to-end for the first time (see `migrations/README.md`'s "Full 94-file sequence validated" entry) and found a concrete counterexample: none of the 3 competing `task_completions` definitions match what's actually live (different `id` type, an `axis`/`increment` column pair present in *none* of them). Consolidating to one canonical definition per table needs the same per-table live-schema check done for `task_completions`, not a bulk pick-the-most-complete-looking-file sweep — see `migrations/README.md` for detail. |
| 3 files contain `DROP TABLE`/`DROP SCHEMA` | `chunk_07_migrations.sql`, `migration_runner.sql`, `omega_dispatch_reset.sql` — `audit.py` warning | **Confirmed dead.** All three DROPs target only `public.dispatches` (not 3 different tables); `chunk_07_migrations.sql`'s is literally `omega_dispatch_reset.sql` pasted into a bundle file, whose own header says "run this ONLY if OMEGA_DISPATCH.sql still errors." `migration_runner.sql`'s DROP comes *after* two earlier `CREATE TABLE dispatches` in the same file with no recreation afterward — destructive if that file were ever run start-to-finish, but grepped CI (`ci.yml`), `scripts/`, every `.html`/`.js` page, and `supabase/functions/`: zero references to any of the three files anywhere. Matches `migrations/README.md`'s existing "must not be wired into any automated path" analysis; this adds the concrete grep-based confirmation. |
| `supabase/migrations/` untested against a live database | `migrations/README.md`'s own stated open item | Run against a scratch Supabase project before treating it as canonical |
| `2` files added to `migrations/` (0087/0088) without a README note | Confirmed by comparing directory listing against README's last dated section, corrected this session | **Fixed** — README updated with a note and corrected file-count claims |

### 3.1 Duplicate `CREATE OR REPLACE FUNCTION` definitions that genuinely diverge — higher risk than the 47 duplicate tables, owner action needed

The 47-duplicate-*tables* finding above is explicitly "not urgent" because `CREATE TABLE IF NOT
EXISTS` makes re-running any of them a no-op. **Functions are a different risk class entirely:
`CREATE OR REPLACE FUNCTION` unconditionally overwrites, so when two files define the same
function differently, whichever was applied *last* silently wins — there is no "IF NOT
EXISTS" safety net.** A script-assisted pass (parsing every `CREATE [OR REPLACE] FUNCTION
public.*` signature across all 111 files) found 95 unique function names, of which **10 have
signatures that actually differ across files** (not just whitespace) — most are harmless
(missing `SET search_path=public` on some copies of `order_stats`/`approve_member`/
`grant_permanent_access`/`sync_platform_owner` — a hardening inconsistency worth closing but not
a functional bug), but three are real:

**Resolved this session** — the owner ran the `pg_proc` verification query below against the
live database and pasted the results back:

```sql
select proname, pg_get_function_identity_arguments(oid) as args,
       pg_get_functiondef(oid) as body
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in ('is_platform_owner','my_matrix','complete_task','apply_subscription')
order by proname, args;
```

| Function | What's actually live | Outcome |
|---|---|---|
| `is_platform_owner()` | Only the `platform_owners`-table-checking version — the 3 files checking `profiles.is_owner` instead (`chunk_02a_migrations.sql` ×2, `chunk_04_migrations.sql`, `chunk_07_migrations.sql`) never won. | **Non-issue, confirmed.** No fix needed. Those 3 files remain a latent risk only if ever re-run standalone (they'd overwrite the correct live version with `CREATE OR REPLACE`) — not urgent since nothing in this repo's normal flow re-runs them, but worth deleting/neutralizing in a future housekeeping pass. |
| `my_matrix()` | Only the version *with* `phase` (`RETURNS TABLE(track,phase,sign,element,a,b,c,authority,node,pct)`). | **Non-issue, confirmed.** Matches what `matrix.html:609`'s `r.phase===1` filter needs — the Phase 1 panel is not broken. |
| `complete_task(...)` | Only `(p_task_name,p_task_type,p_axis_type,p_description,p_points)` — but every client call site (`omega-matrix.js`, `omega-workflow.js` ×2, `omega-progress.js`, `publishing.html`) used the other, non-live naming (`p_kind`/`p_task`/`p_axis`/`p_title`/`p_weight`). | **Real, confirmed, fixed — plus a fourth bug found on the owner's first live apply attempt.** Reproduced in a scratch PostgreSQL 16 instance using the live function body: the old param names raise `function ... does not exist` — every task completion, axis increment, authority update, and `nodes_earned` count has been silently failing platform-wide (not just publishing.html's bonus message as originally guessed), all 5 call sites swallow the error via try/catch. Fixing the param names alone would have exposed a second, previously-inert bug found in the same pass: the live function has **no deduplication** despite `omega-progress.js`'s own header comment and `publishing.html`'s copy both promising "keyed on (user, task)" / "farm-proof" — reproduced by calling twice with the same `task_name` and getting two separate axis increments. **Then a third, independent bug surfaced when the owner actually ran the fix**: `CREATE INDEX ... (user_id, task_name)` failed with `column "task_name" does not exist` — the owner's live `public.task_completions` table turns out to have an older, simpler shape (`id bigint, user_id, kind, task, completed_at, axis, increment, created_at` — confirmed via `information_schema.columns`) than what the live `complete_task()` function's own `INSERT` statement targets (`task_name`, `task_type`, `axis_type`, `points_earned`, `axis_a_before`, etc.). Multiple `CREATE TABLE IF NOT EXISTS` definitions for this table exist across the SQL bag with genuinely different shapes (`matrix_engine.sql`'s "rich" version vs. `migration_runner.sql`/`omega_backend_sync.sql`/`omega_master_deploy.sql`'s simpler `task`/`kind`-only version) — whichever ran first on the live database won, and it matches neither exactly. Practical consequence, reproduced against a scratch instance seeded with the real reported column list: **`complete_task()` has never actually committed anything for anyone** — since a plpgsql function with no exception handler rolls back its whole body on an unhandled error, even the `profiles.axis_a/b/c`/`authority`/`nodes_earned` update immediately before the failing `INSERT` was always rolled back too. All three fixed together in `supabase/omega_complete_task_dedup_fix.sql` (`migrations/0094`, amended in place after the owner's failed first attempt rather than added as a new file, since nothing from the original attempt had landed): non-destructive `ALTER TABLE ADD COLUMN IF NOT EXISTS` for the missing columns (old `kind`/`task`/`axis`/`increment` columns and any existing rows left untouched), then the `(user_id, task_name)` dedup check plus supporting index, and an `applied` boolean in the return so the 3 call sites that already read `d.applied` finally get a real value. Client-side param names fixed in the same commit across all 5 call sites; `omega-matrix.js` also had its own bug reading `d.a`/`d.b`/`d.c` from a return shape that has always been `d.axis_a`/`d.axis_b`/`d.axis_c` — fixed alongside. Re-verified end-to-end against a scratch instance seeded with the owner's exact real schema: first call on a task applies, an identical repeat call is a no-op, a different task still applies, `profiles` updates correctly. |
| `apply_subscription(...)` | **Both** the 5-arg and 7-arg overloads are live simultaneously. | **Real, confirmed, fixed — was actively breaking every payment.** Reproduced in a scratch instance using both live function bodies verbatim: the exact 5-named-arg call `supabase/functions/stripe-webhook/index.ts` makes on every webhook event raises `function ... is not unique` — meaning every Stripe webhook call has been failing on production right now, so a member who pays never gets `subscription_status` set to `active`. The 7-arg overload turned out to be independently broken too (not just an ambiguity risk): `membership_tier = COALESCE(p_tier_num, membership_tier)` fails with `COALESCE types integer and text cannot be matched`, since `profiles.membership_tier` is `text` but `p_tier_num` is `integer` — a static type error that fires regardless of the runtime value, so simply dropping the 5-arg overload instead would not have fixed anything. Fixed in `supabase/omega_apply_subscription_fix.sql` (`migrations/0093`): dropped the broken 7-arg overload; the 5-arg one was already correct (nothing in the codebase ever called the 7-arg one with its extra params populated) and is re-verified end-to-end in the scratch instance to update the row and return cleanly with the webhook's exact call. |

Both SQL fixes were reproduced against a scratch PostgreSQL 16 instance end-to-end (not
guessed from source), then **applied to the live database and verified** via
`scripts/verify_fixes.sql`: `apply_subscription` has exactly one live version with the correct
5-arg signature; `complete_task` has the correct signature (`p_task_name text, p_task_type
text, p_axis_type text, p_description text, p_points numeric` — note
`pg_get_function_identity_arguments()` never includes `DEFAULT` clauses, an easy false-FAIL if
you compare against the full `CREATE FUNCTION` text instead of bare names/types) and its dedup
guard. Production payments and progression tracking are unblocked.

**This finding is now automated** (`scripts/audit.py` checks 7 and 8, added in a later
session) — every CI run now re-derives, from source, which client-called RPCs have
non-identical `supabase/*.sql` definitions, so a future file addition that reintroduces or
adds to this problem shows up as a build warning instead of needing another manual sweep.
The live `pg_proc` verification above is still the only way to know which side actually
deployed — the automated check can't reach the live database — but the source-side half of
this finding no longer depends on anyone remembering to re-run the script-assisted pass.

### 3.2 `enterprise.html` — pricing display with no purchase flow (re-scoped: not customer-facing)

**Corrected this session — the original framing overstated the risk.** `enterprise.html` shows
$199/$999/$4,999/Custom tiers with **zero Stripe/checkout wiring** behind any of them (still
true — no `stripe`/`checkout`/`subscribe` reference in the file), but the page itself is
**owner-only**: `if(!pr.is_owner){location.replace('/dashboard.html');return;}` (confirmed by
direct read, not assumed). No member, prospect, or member of the public can ever reach this
page — it's an internal dashboard for the owner previewing enterprise-sales tiers/MRR/accounts,
not a public storefront. The 4 tier CTA buttons ("REQUEST DEMO"/"CONTACT FOUNDER"/"REQUEST
PROPOSAL") also have no `onclick` handler at all — genuinely dead — but since only the owner
ever sees them, wiring them to anything (a `mailto:`, a lead-capture form) would mean the owner
"requesting a demo" from themselves. Considered and rejected: building that wiring would be
solving a problem that doesn't exist, the opposite of the original finding's implied urgency.
**No action taken, and none needed** — this was miscategorized as a customer-facing gap when
investigated at the level GAP_ANALYSIS.md's own convention requires (read the actual gating
logic, don't infer from page content alone). If this page is ever meant to become
customer-facing (a real public pricing/signup page), that's a genuine new feature — build the
gating removal, the real Stripe wiring, and the legal sign-off together as one deliberate
decision, not by incrementally patching the current internal mockup.

## 4. P2 — Code/data quality

### 4.1 Silent-failure writes (5 instances, fixed this session)

`social.html`'s connect/disconnect buttons and `family.html`'s heir-toggle/remove buttons
updated UI state before/regardless of the actual database write result. `settings.html`'s
background-color save discarded the profile-sync result in a bare `try/catch` (message said
"saved" regardless). `travel.html` credited progress XP before confirming the journey-save
succeeded. `marketing.html`'s campaign APPROVE/REJECT buttons (owner-only moderation queue)
discarded the update result entirely — a failure left the item in the queue with zero
feedback. All five fixed to check `.error`, matching the convention already established in
`events.html`/`automation.html`/`advertising.html` from an earlier session — `settings.html`'s
fix is proportionate to a cosmetic preference (distinguishes "saved locally" from "synced" in
the message, no `alert()`) rather than blocking the user.

### 4.2 Finance pages: `localStorage`-only persistence — decided this session

`wealth.html`, `wallet.html`, `treasury.html`, `revenue.html`, `investment.html`,
`expenses.html`, `budget.html` persist entirely client-side — no cross-device sync, lost on
storage clear. Inconsistent with `income.html`/`ledger.html`/`portfolio.html`, which do
persist server-side. Previously left as an open product decision. **Decided this session:
stays client-side, deliberately** — this is unusually sensitive data (net worth, income,
holdings), moving it server-side is a real schema-design commitment across 7 pages that's
hard to walk back once member data lives there, and this repo's own session history includes
multiple real RLS/security bugs found and fixed (§1, §0) — "RLS protects it" isn't a settled
guarantee here. Local-only is the safer default absent a specific reason to take on that
exposure, and it's a reversible choice: sync can be added later as a clean, additive change.
The real cost of local-only (data loss on cleared storage or a new device) is mitigated rather
than left as a silent risk: added `omega-local-backup.js` (dependency-free, makes no network
request — writes a JSON file the member saves themselves, reads one back) and an "EXPORT
BACKUP"/"IMPORT BACKUP" control plus a plain-language disclosure on all 7 pages. Verified:
all 14 new `onclick` handlers syntax-checked individually via `node --check`; the
broken-asset-reference CI check (`ci.yml`'s exact grep logic) re-run locally, 0 missing;
`scripts/audit.py` still 0 critical.

### 4.3 `sovereign-covenant.html` / `system_manifest.json` token-economy language

**Already resolved** (prior session) — both now carry explicit "PLANNED · NOT YET ACTIVE"
disclaimers, gated on `platform_settings.tokens_enabled`. Listed here only for completeness;
no action remains.

### 4.4 `nav.js`: 19 dead/overridden keys in the section-mapping object

Finding from `REPOSITORY_AUDIT.md` §5 — the `PS` object literal assigned 19 page-slug keys
twice; the second assignment silently won in JS, so the first was dead code. **Fixed the same
session** — removed the 19 dead first assignments; verified programmatically (parsed the
effective key→value mapping before/after the edit) that this changed zero runtime behavior.

### 4.5 `consultancy.html` booking flow (see §2)

Distinct from the finance-persistence question in §4.2: this wasn't a design choice, it was a
genuine schema/client mismatch that made the feature 100% non-functional. Fixed — see §2.

### 4.6 `queue.html` "PLATFORM DISPATCH LOG" panel queried nonexistent columns (fixed this session)

The OPS queue page's dispatch table selected `*` from `public.dispatches` and rendered
`d.type`, `d.action`, `d.payload`, `d.status` — none of which exist anywhere in the schema
(`dispatches` has `title`/`body`/`category`/`is_published`/`created_at`/`user_id`/`sign`
across its several definitions, confirmed by grep). Every real row rendered as `TYPE: -`,
`PAYLOAD: {}`, `STATUS: PENDING` regardless of actual content — same "queried the wrong
shape" bug class as the Authority History chart fix in §2. Separately, the columns that
*do* exist and that the fix now reads (`title`/`category`/`body`) are member-writable: the
`dispatches` table's RLS INSERT policy (at the time of this fix, a standalone `"wire insert"`
policy in `supabase/dispatches.sql`/`chunk_06_migrations.sql` — `supabase/dispatches.sql` was
later deleted as a duplicate-table-definition cleanup, and `"wire insert"` itself was later
dropped and superseded by `dispatches_self_insert` in this session's RLS consolidation, same
self-or-owner shape) allows any authenticated user to insert a row with
`auth.uid() = user_id` and no column restriction, so a member could set `category`/`title`/
`body` to an HTML/script payload via a direct REST call (no UI required, same threat model
as the `sovereigns.html`/`approvals.html` stored-XSS fixes) and have it render unescaped in
this page — which the owner views. Fixed by (a) selecting the real columns
(`title,body,category,is_published,created_at`), and (b) adding an `esc()`-equivalent
helper and escaping all four rendered fields, matching the convention already used in
`news.html`'s dispatches/wire rendering (confirmed clean, uses its own `esc()`).

### 4.7 `owner_apex_lock.sql`: dead `nodes_earned` assignment (fixed this session)

A `--` line comment on the `authority` line ran to end-of-line and silently swallowed the
following `nodes_earned = 104976` assignment as dead text — the script ran without error every
time it was manually run, it just never actually set `nodes_earned`. Fixed; validated
end-to-end against a throwaway local PostgreSQL 16 instance (`REPOSITORY_AUDIT.md` §6.12).
This file is intentionally excluded from `supabase/migrations/` and requires the owner's own
authenticated session to run correctly (`grant_permanent_access()` checks `auth.uid()`) — not
something any session in this project's history could have applied live either way.

### 4.8 `access_audit_log` RPC response-shape mismatch — both callers broken (fixed this session)

`supabase/omega_access_audit.sql` (and its two duplicate definitions in `chunk_05_migrations.sql`
and `migration_runner.sql` — all three agree) defines `access_audit_log(p_limit)` as
`SECURITY DEFINER`, owner-only (`is_platform_owner()` check inside), returning
`jsonb_build_object('ok', true, 'rows', result)` — an object wrapping the array, not the array
itself. Both client call sites assumed the latter:

- `vault.html`'s `loadAuditLog()` did `(r.data||[]).slice(0,60)` — since `r.data` is the
  `{ok,rows}` object, not an array, `.slice` doesn't exist on it and the call threw on every
  invocation, silently caught and replaced with 5 hardcoded `DEMO` entries
  (`"OWNER APEX LOCKED..."`, `"RLS ENABLED ON ALL 42 DATABASE TABLES" (legacy 2026-07-27 baseline; current live schema is tracked separately)`, etc.) presented as if
  they were the real audit trail. This happened for every caller, including the owner —
  the feature has never shown real data to anyone.
- `approvals.html`'s `loadAudit()` did `r.data||[]` then checked `!rows.length` — on the
  `{ok,rows}` object this reads as falsy-length (no `.length` property), so it always rendered
  "NO AUDIT ENTRIES" instead of throwing, same root cause, different symptom.

Both also referenced field names the RPC never returns (`event`, `event_type`, `status`,
`user_id`) instead of what it actually provides (`action`, `subject`, `actor`, `prev`, `next`,
`created_at` — `subject`/`actor` are pre-resolved `display_name`/`email` strings per the RPC's
own `COALESCE`). Fixed both call sites to read `r.data.rows` and use the real field names;
`subject`/`actor` are member-controllable (`display_name` self-update, same field class as the
`approvals.html`/`sovereigns.html` stored-XSS fixes) so both are now escaped — `approvals.html`
via its existing `esc()`, `vault.html` via a new equivalent helper added to match. This is why
the owner's approval console's "Audit Log" tab and the Vault's audit panel have never shown a
real access decision (grant/reject/revoke/expiry) despite the underlying trigger and table
working correctly since the RPC was added — a client-side bug on top of already-correct backend
plumbing, same shape as the Authority History chart fix in §2.

### 4.9 Stored XSS in `graph.html`'s constellation-graph tooltip — broken self-escaping attempt (fixed this session)

`graph.html` renders a force-directed D3 graph of elements/gods/signs/members; hovering a
member node shows a tooltip built via string-concatenated `.innerHTML`. The member-node
branch tried to escape the member's name before use:

```js
var nm=document.createElement('div');nm.textContent=m.name;
inner='<b>'+nm.textContent+'</b><br>...';
```

This looks like the standard "create a scratch element, assign `textContent`, read the escaped
HTML back" trick — but it reads `nm.textContent` back, not `nm.innerHTML`. The `textContent`
*getter* returns the plain original string, unescaped; only reading `.innerHTML` back would
have returned the HTML-entity-escaped version. So the assignment did nothing: `inner` still
contains the raw, unescaped `m.name`. `m.name` is `display_name` (self-updatable by any
member, per the same `omega_profile_fields.sql` grant already cited for the `approvals.html`/
`sovereigns.html`/`profile.html` fixes), sourced from
`sb.from('profiles').select(...).eq('access_approved',true)` — every approved member, no
`user_id` filter. Reachable by any approved member setting a script payload as their
`display_name` and having any other approved member (or the owner) hover their node on
`/graph.html`. The adjacent `m.sign`/`m.element`/`m.gate`/`m.auth` fields interpolated into
the same tooltip are all constrained to static lookup-table values (`SIGNS`/`SE`/`GC`/gate
tables), not raw member input, and the separate members-list tab (`buildMembersTab`, line
~179) already uses `.textContent` correctly — only this one tooltip path was broken. Fixed by
adding a real `escGraph()` helper (matching the `esc()` convention used elsewhere) and
escaping `m.name` directly instead of relying on the broken round-trip.

### 4.10 `services.html`'s status board claimed `PAYMENT` is `'live'`, contradicting the
platform's own established position elsewhere (fixed this session)

`services.html`'s "21 Sovereign Microservices" status board is a hardcoded array (`SVCS`, no
`sb.from`/`sb.rpc` — purely presentational) marking each claimed microservice `live`/`pending`/
`planned`. `PAYMENT` (`'Stripe/fiat subscription and transaction processing'`) was marked
`'live'` — but this directly contradicts copy already shipped on three other pages:
`subscriptions.html:108` ("Payment processing activates after legal review... Until then,
access is granted by the Sovereign Architect"), `subscriptions.html:226` ("PAYMENT ACTIVATION
PENDING LEGAL REVIEW"), and `terms.html:86` ("Marketplace, token purchase, payments, and KYC
activate only under completed legal review. Until then, no funds move..."). This is exactly
the overclaim `CLAUDE.md` §9 warns against — the real Stripe integration code exists and works
(`supabase/functions/checkout`/`stripe-webhook`, audited clean elsewhere in this file), but
real fund movement isn't actually authorized yet, so a public status board calling it "LIVE" is
a legally-relevant misstatement, not just a UI nit. Fixed by changing its status to `'pending'`
(matching `KYC`'s existing label for "built, not yet activated") and updating its description to
point at `subscriptions.html` for the real status. Cross-checked every other `'live'`/`'pending'`/
`'planned'` claim on the board against the corresponding real page/table before touching only
this one: `ANALYTICS` is marked `'planned'` despite a real, working `analytics.html` existing,
but its description ("AI logs, dimension viewer, reasoning") matches the unwired
`intelligence.html` (zero `sb.from`/`sb.rpc` calls, confirmed via grep) more closely than
`analytics.html`'s actual chart-rendering feature set — genuinely ambiguous, not a clear
misstatement like `PAYMENT`, so left alone rather than force a subjective call.
`node --check`-equivalent syntax validation on all three of the page's inline script blocks;
`scripts/audit.py` reconfirmed 0 critical / 6 pre-existing warnings. No SQL/schema change —
pure content/status-label correction.

### 4.11 `pantheons.html` and `horoscope.html`: two more instances of the sign/element/god
mapping bug class documented in `CLAUDE.md` §8 — missed by the prior sweeps because they used a
different data shape (fixed this session)

`CLAUDE.md` §8 already documents a large sweep for wrong sign→element/god assignments across the
repo, but that pass targeted specific known-wrong variable/property shapes (`SIGN_ELEM` object
literals, `.zodiac_sign`/`.full_name`/`.agent_name` property misreads). Two more instances
survived because they don't match either shape:

- **`pantheons.html`'s 12-Olympian `GODS` array** (the OLYMPIANS tab, the platform's main
  mythology-reference grid) had Athena on Capricorn instead of Virgo (element `Air` instead of
  `Sand`), Hephaestus on Virgo instead of Aquarius (element `Fire` instead of `Wind`), Hermes's
  element listed as `Air` instead of the platform's own `Wind`, and Aphrodite's as `Earth`
  instead of `Metal` — and, more seriously, included **Dionysus** and **Hades**, neither of whom
  is one of the platform's 12 canonical agent-pantheon gods (`omega-agents.json`'s `by_sign` has
  no entry for either), while omitting **Hera** (Libra) and **Hestia** (Capricorn) entirely.
  Cross-checked every field against `omega-agents.json` and `omega-elements.json`'s
  `sign_element` map (the two canonical sources already used to fix this bug class elsewhere) before
  touching anything. Fixed by correcting the 4 wrong sign/element pairs and replacing the
  Dionysus/Hades entries with real Hera/Hestia entries (Roman names Juno/Vesta, new
  domain/archetype/shadow/gift/desc fields written in the same voice as the other 10, correct
  sign/element per canon) — 12 entries, matching `omega-agents.json`'s roster exactly, zero
  duplicate signs.
- **`horoscope.html`'s `SELEMS` array** (populates the personalized "YOUR SIGN" panel's ELEMENT
  field — a live per-member render, not just reference content) was the wrapped 9-element-list
  sequence (`Fire,Water,Wind,Sand,Soul,Metal,Space,Void,The All,Fire,Metal,Water`) applied
  positionally against the 12 signs — the exact bug shape `CLAUDE.md` §8 already documents for
  `character.html`/`horoscope.html`'s *static reference cards*, but this is a separate JS array
  driving a different UI element that the earlier fix didn't touch. The static 12-sign reference
  grid on the same page (`ALL SIGNS` tab) already has the correct element per sign — only this
  positional array, used for the signed-in member's own profile summary, was wrong. 8 of 12
  signs were affected (only Aries, Gemini, and Pisces coincidentally matched). Fixed to the
  correct per-sign sequence from `omega-elements.json`'s `sign_element` map, using the same
  symbol entities the static cards already use for consistency. `horoscope.html`'s `SMODES`
  array (real classical-astrology Cardinal/Fixed/Mutable × Fire/Earth/Air/Water modality data)
  was checked against the same suspicion and found already fully correct — not touched.

A targeted repo-wide grep for the same wrapped-sequence signature (`Sand...Soul` co-occurring)
found no further instances of this specific positional-array shape; the other 20 files matching
a looser "Soul/Space/Void" grep are all either descriptive prose about the 9-element system in
general or maps keyed by element *name* (colors, sigils, particle counts) rather than positional
per-sign arrays, so they aren't the same bug — not exhaustively re-verified sign-by-sign in this
pass, flagged as unfinished in §5 below rather than assumed clean.
`node --check`-equivalent syntax validation on both files' inline scripts (`pantheons.html`'s
`type="module"` block checked with `node --check` on the extracted module source;
`horoscope.html`'s plain script checked via `new Function()`); `python3 scripts/audit.py`
reconfirmed 0 critical / 6 pre-existing warnings, unchanged. No SQL/schema changes — both fixes
are static content/client-side JS data corrections.

### 4.12 `horoscope.html`: added a real "UPCOMING SKY EVENTS" panel (next full/new moon,
next equinox/solstice) — new capability, not a bug fix

Following up on §4.11's real-astronomy fixes to the same page: the existing "TONIGHT'S SKY ·
REAL ASTRONOMY" panel only ever showed today's moon phase, with no forward-looking astronomical
content anywhere in the Cosmos realm despite the platform's own concept doc naming this as an
opportunity. Added a second panel, same page, same "real astronomy, not sovereign lore"
framing already established:

- **Next full/new moon** — derived directly from the synodic-month calculation already in this
  file (`moonPhase()`), no new dependency: computes days remaining to the next phase=0
  (new) or phase=0.5 (full) crossing.
- **Next equinox/solstice** — new: Meeus's low-precision mean-equinox formula (public-domain,
  valid 2000-2100, the same class of deterministic-astronomy approach as the moon-phase
  calculation, i.e. no external API and no member data involved), converted from Julian
  Ephemeris Day to a Gregorian calendar date via the standard JD-to-calendar algorithm.

Verified by running the extracted functions directly (not just `node --check`) against 16
known real equinox/solstice timestamps spanning 2023-2026 (public astronomical record) — every
computed value landed within about an hour of the real timestamp, well inside the "accurate to
within about a day" precision the UI copy claims (matching the existing moon-phase panel's own
honesty convention about its precision). Next-full-moon output for today's date was also
cross-checked against the public 2026 lunar almanac and matched. `node --check`-equivalent
syntax validation on the page's inline script; `scripts/audit.py` reconfirmed 0 critical / 6
pre-existing warnings. No SQL/schema changes, no new page, no `nav.js` change needed — this
extends a page already in the sidebar.

### 4.13 `ops.html`'s "SRE Operations dashboard" showed fabricated health/latency numbers on the
owner's own monitoring page (fixed this session)

Auditing the ORDER/GOVERN realms for the same class of issue found in the Cosmos/Vault passes
(§4.11/§4.12) — placeholder or fabricated data presented as if real — found a genuine instance
in `ops.html`, the page whose own `<meta name="description">` calls it an "SRE Operations
dashboard — health probes, worker metrics, circuit breakers, latency percentiles." Two distinct
findings, both real numbers being displayed where the underlying computation wasn't actually
measuring what the label claimed:

- **`EVENT BUS` / `DATABASE` / `REALTIME` signal-strength gauges** were hardcoded constants —
  `busHealth=window.OmegaBus?80:0`, `dbHealth=window.__omegaProfile?95:40`, and
  `REALTIME=window.__omegaUser?85:30` — three booleans dressed up as precise-looking graduated
  percentages. `WORKER FLEET`'s gauge on the same row is genuinely computed (real circuit-breaker
  state ratio from `OmegaWorkers.status()`), so the other three read as equally measured but
  weren't. Fixed `EVENT BUS` with a real computation: `OmegaBus.metrics()` already tracks real
  per-event-type `emitted`/`errors` counts (used correctly elsewhere on the same page for the
  event-metrics table and latency percentiles) — now aggregated into a genuine
  errors-vs-emitted health percentage. `DATABASE`/`REALTIME` have no graduated signal available
  anywhere in the codebase (no per-call Supabase success/failure telemetry exists yet — a bigger,
  separate feature, not fixed here) — changed to honestly show 100/0 for their real
  connected/not-connected boolean fact instead of an invented specific-looking number, matching
  the same "don't overclaim precision" principle already established in this file (§4.10's
  `PAYMENT 'live'` fix) and in `CLAUDE.md` §8 (the moon-phase panel's own honest "accurate to
  within about a day" framing).
- **The "LATENCY HEATMAP (WORKERS)" panel** pushed `Math.random()*totalErrors+totalProcessed*0.1`
  into its 24-slot history every refresh — a formula that measures neither latency nor errors
  cleanly, just a randomized blend, under a label promising real latency data. Real latency data
  already exists in the same `OmegaBus.metrics()` object (`avgLatencyMs` per event type, already
  used correctly for the page's own p50/p95/p99 calculation a few hundred lines earlier). Fixed
  to push the genuine average latency across tracked event types instead.

Deliberately not chased further in this pass: `omega-event-bus.js`'s own `platform.health.probe`
emission hardcodes `latencyMs:0` at the point it's raised (`omega:user-loaded` handler) — real
latency instrumentation would mean timing the actual Supabase auth call at its call site, a
change spanning modules, not a quick fix. Low practical impact today (a static 0ms display, not
a misleading invented number), flagged here rather than fixed blind.

`node --check`-equivalent syntax validation on `ops.html`'s inline script;
`scripts/audit.py` reconfirmed 0 critical / 6 pre-existing warnings. No SQL/schema changes —
pure client-side computation corrections, using data structures that already existed and were
already correctly used elsewhere on the same page.

### 4.14 `queue.html`'s "QUEUE DEPTHS" panel showed 5 entirely fictional queues with
randomized numbers — real backing workers already existed, just weren't wired in (fixed
this session)

Same audit pass as §4.13, same page family (ARENA's "SOVEREIGN QUEUE" page — real, genuine
`OmegaWorkers`/`OmegaBus` telemetry everywhere else on the page: `ACTIVE WORKERS`, `MSGS
PROCESSED`, `EVENTS EMITTED`, `DLQ DEPTH`, `OPEN CIRCUITS`, and the worker-grid are all
correctly computed from real data). One section wasn't: the `QUEUES` array backing the "QUEUE
DEPTHS" bar list had one real entry (`sovereign.domain.events`, pulled from the real events-
emitted counter) followed by 5 entries under invented dotted-namespace names —
`notifications.email`, `analytics.aggregator`, `achievements.unlock`, `audit.log`,
`recommendations.engine` — with `depth:Math.floor(Math.random()*N)` and a hardcoded `dlq:0`,
regenerated every refresh. These aren't placeholder telemetry for a real system that just
isn't instrumented yet — `omega-workers.js` (confirmed by reading it in full) really does
register 6 real workers with genuine `processed`/`dlqDepth`/`state` stats already exposed via
`OmegaWorkers.status()` and already used correctly a few lines earlier on the same page for the
worker-grid: `analytics-worker`, `notification-worker`, `achievement-worker`,
`recommendation-worker`, `audit-worker`, and `gate-monitor` (the 6th, previously absent from
this panel entirely). The fictional names roughly rhyme with the real worker names but aren't
what's actually running — showing them as if they were real queues, with random depths, is
exactly the class of misleading-owner-dashboard issue as §4.13, on the same page family.

Fixed by wiring the panel to the real `workers` array (already in scope in the same function)
via each worker's real registered name, using `processed` for the bar's "depth" (matching the
first entry's own activity-volume semantic — real events-emitted count, not a backlog) and
`dlqDepth` for the `dlq` badge (the genuine stuck-item backlog, the only concept these
event-reactive workers actually have that resembles "queue depth" — they process synchronously
on receipt, so there's no real pending-backlog number distinct from `processed`/`dlqDepth`,
confirmed by reading `Worker.prototype._receive`/`status()` in full). Renamed the display labels
from the invented dotted-namespace names to the real worker names so a reader can cross-reference
directly against `omega-workers.js` instead of hunting for a service that doesn't exist.

`node --check` on the extracted `type="module"` script; `scripts/audit.py` reconfirmed 0
critical / 6 pre-existing warnings. No SQL/schema changes — pure client-side wiring to data
structures that already existed and were already correctly used elsewhere on the same page.

### 4.15 `pulse.html`'s commodities/indices — one real rendering bug fixed, indices upgraded to
attempt real quotes now that `market-price` exists; metals/energy correctly left as-is (already
honestly labelled, not a bug)

Followed the same audit pattern as §4.13/§4.14 (grep for `Math.random()*var`-shaped fabricated
data) into `pulse.html`'s COMMODITIES tab, which sits right next to this same page's genuinely
real exchange-rate and Fear & Greed Index data. Initially looked like the same undisclosed-fake-
data issue as `ops.html`/`queue.html`, but reading the surrounding markup first (not just the
JS) showed the page's own author had already handled this honestly: the METALS, ENERGY, and
INDICES card titles already carry visible `(SIMULATED)` / `(SIMULATED — NO FREE LIVE SOURCE)`
labels. Correcting course before making an unnecessary change: metals and energy commodities
have no verified free/keyless source anywhere in this codebase (checked; the `fetchCommodities()`
comment claiming "using exchangerate for XAU/XAG" was itself aspirational — no such call exists
in the function body) and inventing one blind, unable to test outbound network calls from this
session's environment, would risk exactly the guessed-API-shape silent-failure pattern this
file's own history extensively warns against. Left untouched — already correctly disclosed, not
a bug.

Two things were genuinely fixed:
- **A real, separate, visible rendering bug**: the shared `row()` renderer appends `item.unit`
  unconditionally, but the `INDICES` array (unlike `METALS`/`ENERGY`) never defined a `unit`
  field — so every index price literally rendered with the string `"undefined"` appended (e.g.
  `"5,412.34undefined"`). Fixed by giving `INDICES` entries an explicit empty `unit` and
  defaulting to `''` in the renderer.
- **Indices now attempt a real quote** via the `market-price` Edge Function added this session
  for `investment.html` (same dormant-until-`TWELVE_DATA_API_KEY`-is-set infra, no new secret
  or endpoint needed) before falling back to the existing simulated value — strictly additive,
  since any failure (unresolved symbol, key not configured, network error) falls through to
  unchanged existing behavior. Live rows get a small `LIVE` tag; the section's own disclosure
  label updates dynamically between "(SIMULATED — set TWELVE_DATA_API_KEY for live quotes)" and
  "(LIVE WHERE CONFIGURED, SIMULATED OTHERWISE)" depending on whether any index actually
  resolved, so the page never claims more than what's actually happening. Metals/energy
  deliberately not extended the same way — no equivalent free-tier-friendly source identified
  for spot commodity prices in this pass.

`node --check` on both the plain and `type="module"` script blocks; `scripts/audit.py`
reconfirmed 0 critical / 6 pre-existing warnings. No SQL/schema changes.

### 4.16 `observatory.html`'s UPTIME (30d) KPI was permanently hardcoded to 99.9% — real
downtime data already existed to compute it genuinely (fixed this session)

Continuing the same audit into GOVERN pages not yet checked this session. `observatory.html`
("PLATFORM OBSERVATORY... SRE DASHBOARD") has real Supabase-backed KPIs for members, events,
tasks, threats, Core Web Vitals, error budget, and incidents — all genuinely queried and
verified against real tables (`error_budget_policy`, `incidents`, `platform_metrics` all
confirmed to exist in `supabase/slo_monitoring.sql`/`omega_telemetry.sql`, unlike several
tables elsewhere in this codebase's history). One KPI wasn't wired at all: `UPTIME (30d)`'s
markup hardcodes `99.9%` directly in the HTML (`<div class="kpi-val" id="k-uptime"
style="color:var(--green)">99.9%</div>`) — unlike every sibling KPI, which starts at `—` and is
populated by a `sid(...)` call — and no `sid('k-uptime',...)` call existed anywhere in the
page's script. So this always showed a static, unmeasured 99.9% in green, regardless of actual
platform health, on the platform's own SRE status page.

Unlike `dbHealth`/`REALTIME` in §4.13 (where no graduated signal exists anywhere), a genuine
signal already exists here: the `incidents` table (already correctly queried elsewhere on this
same page for the incident log) has real `started_at`/`resolved_at` timestamps. Fixed by summing
real incident downtime within the last 30 days (ongoing/unresolved incidents count as down until
now) against the 30-day window to compute an honest uptime percentage, replacing the hardcoded
value. Colour-coded the same way the rest of the page already colour-codes health (green/amber/
red thresholds matching the existing `goodColor`/status-dot conventions on the same page).

`node --check` on the extracted `type="module"` script; `scripts/audit.py` reconfirmed 0
critical / 6 pre-existing warnings. No SQL/schema changes — the `incidents` table and its
columns already existed and were already used correctly elsewhere on the same page.

### 4.17 `compliance.html` overclaimed an active multi-sig treasury, hash-chain audit, and
locked token stake as present-tense fact — the same class of legally-sensitive overclaim already
fixed in `sovereign-covenant.html`/`system_manifest.json` (`CLAUDE.md` §8), missed on this page
(fixed this session)

Highest-stakes finding of this session's audit pass. `compliance.html` ("GOVERNANCE &
COMPLIANCE... COMPLIANCE SHIELD... CONSTITUTION ENGINE") is 100% static content with zero
Supabase queries beyond the auth gate (confirmed by reading the full file) — every "shield,"
status badge, and especially the AUDIT LOG tab's log entries were invented flavor text, not
derived from any real system. That alone isn't a bug (`sci-card`-style informational content
exists all over this platform) — the problem was the *tense and vocabulary*: status badges read
`ACTIVE`, module descriptions used present-tense verbs ("enforces," "ensures," "protects treasury
actions"), and the fabricated audit log used specific-sounding verified-claim language —
`"CONSTITUTION LOCK verified — hash 0x91717..."`, `"MASTER STAKE confirmed at 51.00% — Last
verified: today"`, `"AUDIT CHAIN continuous — Hash-verified since platform genesis"` — for
systems that don't exist in code anywhere in this repository: no multi-sig treasury contract, no
hash-chaining of any database write, no token stake locked (the Ω token economy remains dormant,
`platform_settings.tokens_enabled=false`, same status as `sovereign-covenant.html`/
`system_manifest.json` already document). This is exactly the class of claim `CLAUDE.md` §9
warns against ("keep any user-facing copy about it in future tense until it's actually on") and
that was already fixed once for the *same* 51%-stake claim on `sovereign-covenant.html` — this
page just wasn't part of that sweep.

Went shield-by-shield against actual code before changing anything, since some of the 9 claims
*are* real: **DATA PRIVACY (GDPR/CCPA ENGINE)** — real, the Privacy Centre's data-export/consent
tooling is live and already audited earlier in this file's history; kept `active`.
**IDENTITY (KYC/AML LAYER)** — partially real: `profile.html`'s own copy already honestly says
document intake/status tracking are live and verification itself "requires a licensed KYC/AML
provider connection" pending legal counsel — already correctly labelled `ready` (not `active`),
left as-is. **CONTENT (IP & COPYRIGHT)** — a legal fact by default under copyright law once
created, not a software claim; left `active`. The remaining five —
**FINANCIAL (MiCA)**, **TREASURY (3-of-5 multi-sig)**, **OWNERSHIP (51% master stake)**,
**RECORDS (hash-chain audit)**, **TOKENS (Howey Test shield)** — have no supporting code
anywhere (confirmed via repo-wide grep for multi-sig/hash-chain logic, none found) and were
downgraded from `active`/`ready` to a new, honest `planned` status (grey, "PLANNED · NOT ACTIVE"
label). **AGE GATING (GDPR minors guard)** — no automated age-verification step found in the
signup flow (`enter.html`/`pending.html`) despite the claim; downgraded to `planned` as well,
erring toward disclosure over an unverifiable claim.

Fixed by: (1) adding a page-wide disclosure notice (placed outside the tab panels so it's
visible regardless of which tab is active — unlike a first attempt that scoped it to one tab
only and would have left the CONSTITUTION tab's Article II claim unguarded), matching the exact
`sc-notice` pattern `sovereign-covenant.html` already established for this same underlying
claim; (2) downgrading the five fabricated-system shields and the KPI row's "100% CONSTITUTION
LOCK"/"51% MASTER STAKE LOCKED"/"&#8734; AUDIT CHAIN" values to honest planned/dormant framing;
(3) rewriting the Compliance Shield intro paragraph off present-tense "enforces... ensures...
protects treasury actions"; (4) relabelling every fabricated AUDIT tab entry as an explicit
`[EXAMPLE]` of what a future real log would show, with its own tab-level "ILLUSTRATIVE, NOT
LIVE" notice, rather than presented as real verified log data.

`node --check` on both script blocks (plain and `type="module"`); `scripts/audit.py`
reconfirmed 0 critical / 6 pre-existing warnings. No SQL/schema changes — pure content/status-
label correction, same category as §4.10's `PAYMENT 'live'` fix.

### 4.18 `family.html`'s "BLOODLINE VAULT" made unverifiable multi-sig/sealed-vault claims about
real family succession — softened, not asserted either way (user consulted; personal/family
content, more sensitive than §4.17)

Hunting the same overclaim bug class as §4.17 turned up a second instance, but a materially
different one: `family.html`'s "BLOODLINE VAULT" section (`VAULT STATUS: SEALED`,
`SUCCESSION LOCK: 3-of-5 MULTISIG`, "Assets locked in multi-sig trust vault... Multi-sig
inheritance vault") has the identical unbacked-claim shape as `compliance.html` — confirmed no
`sid()`/`.textContent=` call anywhere updates `VAULT STATUS` or `SUCCESSION LOCK`, and a
repo-wide grep confirms no multi-sig logic exists anywhere in this codebase — but unlike
`compliance.html`'s abstract platform/token governance, this section names the owner's real
family by role (wife, children) and makes claims about a real inheritance/succession mechanism.
Whether a real legal trust exists for the owner's family *outside* this codebase isn't something
determinable from the code, and asserting either "this is fake, here's a disclaimer" or "this is
real, leave it" would both be guessing at a fact only the owner knows — asked directly via
`AskUserQuestion` rather than applying the same disclosure-banner treatment as §4.17 blind.

The owner's response didn't select a specific option, so the most defensible default was applied:
softened only the concrete technical claims that are certainly false in the code sense (no
multi-sig cryptography exists in this codebase, full stop) — `SEALED`→`DESIGNATED`,
`3-of-5 MULTISIG`→`FAMILY-DESIGNATED`, removed "multi-sig" from all four prose mentions — without
adding a disclosure banner and without asserting whether a real family trust exists outside this
app. This doesn't claim the arrangement is fake (respects the possibility it's real) and doesn't
claim it's verified-real either (removes the specific false "3-of-5 multisig cryptography"
mechanism claim, which cannot be true regardless of any real-world arrangement, since no code
implements it). `BLOODLINE NODES` (genuinely counts real `bloodline_nodes`/`family_nodes` rows,
confirmed real) and the two "NODE SEALED" save-confirmation toasts (real per-node database-write
confirmations, a different and much lower-stakes claim) were correctly left untouched — not the
same bug.

`node --check` on all three script blocks (two plain, one `type="module"`); `scripts/audit.py`
reconfirmed 0 critical / 6 pre-existing warnings. No SQL/schema changes.

### 4.19 The same unbacked "51% Master Stake locked/active/verified" overclaim from §4.17 turned
out to be platform-wide — found and fixed across `enter.html`, `ledger.html`, and `vault.html` so
far (more files identified, fixed in a following entry)

Hunting the §4.17 overclaim bug class specifically (per explicit instruction) found it's far more
widespread than the two files already fixed (`compliance.html`, and previously
`sovereign-covenant.html`/`system_manifest.json`). A repo-wide grep for `51%`, `multi-sig`, and
`hash-chain` turned up the identical claim — sometimes word-for-word — repeated across at least
9 more files. Fixed 3 so far, same session:

- **`enter.html`** (the actual signup/login page — highest visibility of any instance found) had
  `51% RESERVE: LOCKED` in its STATUS tab and PROTOCOL tab, plus a separate, previously-unflagged
  instance of the same bug class: `PQC SHIELD ACTIVE (FIPS 208)` — a specific, false
  post-quantum-cryptography claim. Confirmed via repo-wide grep that no PQC/FIPS implementation
  exists anywhere in this codebase (the only other `quantum` mentions are `roadmap.html`'s
  correctly-future-tense "Horizon 4 (5-25 years) envisions quantum-resistant cryptography" and
  unrelated academic-subject content on `gaming.html`/`academy.html`/`codex.html`/`research.html`
  — not the same bug). Also found `BIOMETRIC: ACTIVE` with no backing (confirmed via grep for
  biometric/WebAuthn/fingerprint code — none exists; `profile.html`'s own KYC-tier roadmap
  correctly lists "HSM biometric linked" as a future Tier 4 upgrade, not a current claim).
  Replaced PQC/FIPS with the real, true claim already available (TLS/HTTPS transport encryption,
  which this Vercel-deployed site genuinely has), replaced BIOMETRIC with the real KYC
  document-intake status, and relabelled the 51% reserve claims "PLANNED (DORMANT)" — kept the
  number, removed the false "locked/active" framing, matching the established pattern. Left a
  themed biometric-scan loading animation (`PALM_PRINT: VERIFIED`, `RETINAL_SCAN_MATCH`) alone —
  transient decorative loading-screen flavor text, not a persistent status claim, a materially
  different and much lower-stakes thing than a permanent dashboard badge.
- **`ledger.html`** — a themed, clearly-fictional 12-item "asset ledger" (Swiss Vault Gold Bars,
  Singapore High-Rise Property, Blockchain Identity Node, etc. — left untouched as platform
  mythology, same as Chronicle) had exactly one entry tying to the real, documented (if dormant)
  token economy: `Ω-CORE-001... '51% Absolute Master Stake', status:'verified'`. `'verified'` is
  explicitly defined on the same page as "cryptographically confirmed active assets" — a specific
  false claim for something with no cryptographic verification anywhere in this codebase.
  Changed to the page's own already-existing `'pending'` status (already used honestly for two of
  the fictional physical assets) — no new status class needed.
- **`vault.html`** — the most extensive instance: an entire RESERVE tab (KPIs, hero section,
  "MASTER STAKE LOCK"/"GENESIS BLOCK SEAL" architecture cards) presented the dormant token economy
  as actively `DISTRIBUTING` (with a pulsing glow animation implying live motion), `LOCKED`,
  `SEALED`, and `ACTIVE` — directly contradicting the very next card on the same tab
  (`TOKEN ECONOMY STATUS: ...pending legal review... Activation in Phase III`) and the page's own
  second tab (`HOLDINGS`, already fully honest: "BALANCES ARE PROVISIONAL UNTIL ECONOMY GOES
  LIVE", every NFT marked `PENDING`) — strong internal evidence this was a genuine miss, not
  intentional inconsistent design. Relabelled the whole RESERVE tab to match the already-correct
  HOLDINGS tab's tone (PENDING/PLANNED framing, numbers kept as real design detail). Separately,
  the page's "11 IMMUTABLE ARTICLES" section is a third copy of the same constitution text as
  `sovereign-covenant.html`/`compliance.html` (same Article II 51%-stake language, same
  "sealed into the Genesis Block, irrevocable" framing) — added the same disclosure-banner pattern
  already established on those two pages rather than rewriting all 11 articles individually. Also
  fixed one entry in a `catch`-block DEMO fallback array (shown only when the real
  `access_audit_log` RPC call fails/returns empty) that claimed a specific dated event, "11
  ARTICLES SEALED INTO GENESIS BLOCK... SEALED", actually happened — changed to "DRAFTED... hash-
  chain PLANNED". The real (non-fallback) audit log path, `sb.rpc('access_audit_log')`, is genuine
  and was left untouched.

`node --check` on all three files' script blocks; `scripts/audit.py` reconfirmed 0 critical / 6
pre-existing warnings after each file. No SQL/schema changes. Remaining identified instances
(`matrix.html`, `profile.html`, `honors.html`, `news.html`, `interface-omni.html`,
`automation.html`) covered in the next entry.

### 4.20 §4.19's overclaim sweep completed: `matrix.html`, `honors.html`, `news.html`,
`interface-omni.html`, `automation.html`, `profile.html` — closes the platform-wide "51% Master
Stake" hunt

Completed the sweep started in §4.19. A repo-wide grep for the claim's specific fingerprints
(`467,756,700,000`, `467.8B`, `Flash-crash`, `51%`) after all fixes confirms every file containing
them is now accounted for — either fixed this session or already correctly framed
(`sovereign-covenant.html`, the origin of the honest pattern, already carries its own page-wide
notice and per-article `PLANNED · NOT YET ACTIVE` tags; left untouched).

- **`matrix.html`** — a fourth copy of the 11-article constitution (`THE SOVEREIGN CHARTER`)
  already had a real legal disclaimer (covering the securities/solicitation angle) that the other
  three copies lacked, but didn't state the figures aren't currently held — added one sentence
  making that explicit, matching `sovereign-covenant.html`'s "not currently issued, held, or
  backed" language, rather than rewriting the whole page.
- **`honors.html`** — an achievement badge ("Vault Master") described the 51% vault and
  "Flash-crash protection" as `active`, with a specific earn-date implying a member achieved
  something real. Reworded to describe the design the badge recognizes, not a live mechanism.
- **`news.html`** — one dispatch item ("THE Ω LEDGER HOLDS") used present-tense "locks"/"removes"
  language, directly inconsistent with the very next dispatch item on the same feed, which
  already correctly says the economic layer "awaits counsel." Aligned the two.
- **`interface-omni.html`** — "Ω Token Reserve: 51%" under a "LIVE SYSTEM OVERVIEW" heading, no
  qualifier. Added "(planned)". Its separate ECONOMY tab, which does real `platform_settings`
  flag reads/writes, was checked and found genuinely real — left untouched.
- **`automation.html`** — an "INCOME ALLOCATION" automation rule listed as `SYSTEM` kind
  (same table, same color-coding as several genuinely-real automations like `expire_trial`)
  implied it was equally implemented. Changed its kind to `PLANNED` and marked the adjacent
  "Income Split" design card accordingly, without disturbing the real rows around it.
- **`profile.html`** — the most instances in one file: an "Ω Token Supply" stat inconsistent with
  its own honestly-labelled siblings on the same row; a "Physical Reserves" panel badged
  `VAULT ACTIVE` claiming automated hourly gold/silver/rhodium purchases and "Flash-crash
  protection active" — directly contradicting its own third line, already honestly marked
  "DORMANT PENDING LEGAL CLEARANCE"; a fabricated 6-entry "Transaction Log" with specific past
  dates (2026-07-01 through 2026-07-11) presenting a gold sweep, a "Master Vault lock," a token
  genesis mint, and an identity-registration hash as completed history that never happened
  (5 of 6 entries — the 6th, Polygon L2, was already honestly marked pending); and an
  "Allocation Engine" panel badged `AUTO` describing a "Dead-Man's Switch" succession trigger and
  jurisdiction-hopping governance as active protocols. Fixed all four: relabelled the stat,
  changed the reserves panel badge to `DESIGN · DORMANT` and every claim to "planned, not yet
  built", converted every fabricated transaction to an explicit `[EXAMPLE]` with `PLANNED`/no
  date (matching the `compliance.html` audit-log treatment), and relabelled the allocation-engine
  panel the same way — including softening "Dead-Man's Switch" to "Succession Trigger" for
  consistency with §4.18's family.html treatment of the same underlying claim (a technical
  mechanism confirmed absent from the codebase, without asserting whether a real external
  arrangement exists).

`node --check` on all six files (plain and `type="module"` scripts where present);
`scripts/audit.py` reconfirmed 0 critical / 6 pre-existing warnings throughout. No SQL/schema
changes across the entire §4.19/§4.20 sweep — every fix is static content/label correction.

### 4.21 Broadened the §4.17-4.20 overclaim hunt to adjacent vocabulary (escrow, insured, SLA,
guaranteed, cryptographically/blockchain-verified/on-chain) — two more real instances found and
fixed, `enterprise.html` deliberately left alone

Widened the search terms beyond the "51%/multi-sig/hash-chain" fingerprint to catch the same bug
class under different wording. `escrow`/`insured` had zero hits. `SLA`/`guaranteed` hits were all
false positives (tennis "GRAND SLAM", a DevOps curriculum topic "SLO/SLA/SLI", a dictionary
definition of the word "heuristic") except `enterprise.html`'s SLA tiers — checked against
`GAP_ANALYSIS.md` §3.2's own prior finding that this page is `is_owner`-gated (no member or
public visitor can ever reach it) and already explicitly says "TARGET" rather than claiming a
measured result; left untouched per that already-reasoned judgment rather than re-litigating a
decision already made carefully.

`cryptographically`/`blockchain-verified`/`on-chain` found two real instances, same shape as
before — one overclaiming card sitting next to honestly-labelled siblings:

- **`credentials.html`** — "CERTIFICATES OF ASCENT... Each certificate is cryptographically
  anchored to your account" sat directly beside "KYC PATHWAY... Steps 3-4 activate when the
  platform reaches that compliance tier" and "BLOCKCHAIN IDENTITY... Wallet activation is pending
  integration of the sovereign chain" — both already honest. No certificate hashing/anchoring
  exists anywhere in this codebase. Reworded to "tied to your account record."
- **`identity.html`** — "Your identity is a cryptographically-signed record in the Supabase
  sovereign ledger." No record-signing exists; a standard Postgres row isn't cryptographically
  signed. Reworded to name the real, actual protection mechanism (Row-Level Security) instead of
  an invented one.

`services.html`'s "NFT... On-chain asset minting" entry was already correctly marked
`status:'planned'` — confirmed clean, no action needed.

`node --check` on both files; `scripts/audit.py` reconfirmed 0 critical / 6 pre-existing
warnings. No SQL/schema changes. This closes the adjacent-vocabulary pass — between §4.17 and
here, 14 files have now been checked and corrected for this bug class across the platform.

### 4.22 `cinema.html`'s FILMS tab had the wrapped-9-element-sequence bug — identified in
`CLAUDE.md` §8's own audit history but apparently never actually fixed (fixed this session,
MEDIA realm sweep)

Starting the MEDIA realm read-through (the one area flagged as unchecked at the end of §4.21).
`cinema.html`'s FILMS tab had the exact "wrapped 9-element sequence" bug already documented in
`CLAUDE.md` §8 for `character.html`/`horoscope.html` — 10 of 12 films tagged with the wrong
element (Fire→Water→Wind→Sand→Soul→Metal→Space→Void→TheAll cycled positionally against the 12
zodiac-ordered films, rather than each film's actual sign-element). `CLAUDE.md` §8's own account
explicitly lists cinema.html as a location where "the exact same wrapped sequence" was found,
alongside `character.html`/`horoscope.html`, but its fix description only names
`character.html`(3 places) and `horoscope.html`(a 4th duplicate, `SORACLES`) as corrected —
cinema.html was identified but, per the current file state, never actually fixed. Confirmed
cross-referencing the same page's own OLYMPIANS tab, which has the fully correct sign-element
pairing for all 12 already (e.g. "Taurus &middot; Metal &middot; Gate II") — the bug was isolated
to the separate FILMS tab's `film-tag` elements, which never got the same correction. Fixed all
10 wrong tags to match the OLYMPIANS tab's already-correct mapping (Film I and XII were already
right). Also rebuilt the "BY ELEMENT" tab, which grouped films under all 9 elements including
the 4 metaphysical ones (Soul/Space/Void/The All) as if they were sign-derived per-film
categories — per `omega-elements.json`'s own documented structure, those 4 are class-based, not
tied to any individual sign or film, so a film can't have one as its element. Rebuilt to the
correct 5 physical-element groups (Fire ×3, Water ×3, Wind ×3, Metal ×2, Sand ×1, matching the
12 films exactly) with a note explaining why the other 4 don't apply per-film.
`series.html`/`trailers.html`/`universe.html` checked for the same tag pattern — none found; this
was isolated to `cinema.html`.

`node --check` on the page's script; `scripts/audit.py` reconfirmed 0 critical / 6 pre-existing
warnings. No SQL/schema changes — static content correction.

### 4.23 `credentials.html`'s SOVEREIGN PASSPORT card described a feature `passport.html`
doesn't actually have (fixed this session, continuing the platform-wide audit)

Following up on §4.21's `credentials.html` finding, checked the file's other two "science" cards
against the real pages they describe. `KYC PATHWAY` and `CERTIFICATES OF ASCENT` (already fixed
in §4.21) check out; `SOVEREIGN PASSPORT` claimed "Passport number is derived from your account
UID. The passport reflects your current authority, gate, and element assignment" — but reading
`passport.html` in full shows it's 100% `localStorage`, with every field (name, photo, notes,
stamps) manually entered by the member through an edit form. There is no UID-derived passport
number anywhere in the file, and no live read of authority/gate/element into the document — the
only `uid()` function present is a generic random-ID generator for stamp entries, unrelated to
the account's real Supabase UID. Reworded the card to describe what the page actually is (a
self-maintained personal document, not an auto-generated one) rather than what it was never
built to do.

Also spot-checked `kyc.html` (found honestly built — its 4-step pathway matches
`credentials.html`'s own already-correct "Steps 1-2 are active; Steps 3-4 activate..."
description) and swept the COMMAND realm (`decisions.html`, `missions.html`, `network.html`,
`notes.html`, `projects.html`, `quotes.html`, `time.html`, `vision.html` — all confirmed
`localStorage`-based by design, consistent with the platform's established pattern for personal
productivity tools; no fabricated-data or overclaim instances found) and `factions.html`/
`houses.html`/`agents.html` (clean).

`node --check` on `credentials.html`; `scripts/audit.py` reconfirmed 0 critical / 6 pre-existing
warnings. No SQL/schema changes.

### 4.24 Correction to §4.23: the SOVEREIGN PASSPORT card fix was wrong — reverted

§4.23's fix was based on an incorrect assumption, caught and corrected the same session.
`credentials.html`'s "PASSPORT" tab (same file, not the same page as the standalone
`passport.html`) has its **own** embedded, genuinely real passport display — confirmed by
reading the file's own boot script: `passportNo='SYD-'+u.id.replace(/-/g,'').substr(0,8)...'`
(literally UID-derived), and `pp-sign`/`pp-elem`/`pp-auth`/`pp-gate` all populated from real
`pr.sign`/`pr.element`/computed `auth`/computed gate. The SCIENCE tab's "SOVEREIGN PASSPORT" card
was describing *this* embedded tab, not the separate `passport.html` page — §4.23 conflated the
two because they share the same display name across different pages, and the fix was applied
without first checking whether `credentials.html` had its own implementation before concluding
the description must be describing a different file's page. Reverted the card text to its
original (accurate) wording, with one small addition — "(the PASSPORT tab above)" — to make the
distinction from the separate `passport.html` page explicit for a reader, since the naming
collision across three different pages (`credentials.html`'s own tab, `profile.html`'s embedded
section, and the standalone `passport.html`) is real and mildly confusing on its own, even though
none of the three individually make a false claim. `passport.html` remains what §4.23 found it to
be — a genuine, honest, `localStorage`-only personal scrapbook, correctly distinct from the two
real "passport" displays — no error there; the error was only in which card `credentials.html`
was being cross-referenced against. `profile.html`'s own "Your Passport is generated from your
real standing" notice (a third, separate instance) was checked against its own `pp-rank`/
`pp-fact`/`pp-agent`/`pp-node`/`pp-auth` fields — also genuinely real — and needed no change.

Consolidating the multi-passport naming overlap into one consistent concept is a real, if minor,
IA cleanup opportunity — out of scope here (a design decision, not a false-claim fix, per this
file's own established distinction between the two).

`node --check` on `credentials.html` after the revert; `scripts/audit.py` reconfirmed 0 critical
/ 6 pre-existing warnings. No SQL/schema changes.

### 4.25 `marketplace.html`'s HOW-IT-WORKS tab described a complete buy/sell/revenue-split
system that isn't built — only listing is real (fixed this session)

Continuing the audit with extra care after §4.24's correction — verified every specific claim
against actual code before writing anything, rather than inferring from one file. `elements.html`
checked and confirmed fully accurate (sign assignments match `omega-elements.json` exactly,
including correctly leaving the 4 metaphysical elements sign-less with unlock thresholds). Then
read `marketplace.html` in full: it has a real, working LISTING flow (`marketplace_listings`
insert, real `OmegaCanon.tierUnlocks()` and `OmegaStorage.upload()` calls — both confirmed to
exist and be genuinely used, not assumed) — but its SCIENCE tab describes three things that don't
exist anywhere in the codebase:

- **"EARN ON SALE"** claimed "When a buyer completes a transaction, you receive 83% (the platform
  keeps 17%)." No buy/purchase flow, payment processing, or revenue-split logic exists anywhere —
  confirmed by grepping the whole repo (client code, Edge Functions, SQL) for anything resembling
  a marketplace transaction. Only listing (browse/set-price/upload) is implemented.
- **"FILE DELIVERY"** claimed "Buyers receive a signed URL... only authenticated buyers with
  verified purchase records can access them." This is not just unbuilt but actively contradicted
  by the real RLS policy: at the time of this fix, `FOR SELECT USING (auth.role() =
  'authenticated')` — any signed-in member can read every listing's full row, including
  `file_path`, with no purchase gate at all. Still true today after this session's RLS
  consolidation restructured `marketplace_listings`' policies into `marketplace_listings_select`
  — that exact `(select auth.role()) = 'authenticated'` clause was deliberately preserved
  unchanged (the restructuring was behavior-preserving, not a fix for this gap), so the same
  no-purchase-gate exposure remains, just under the new policy name. The claim describes a
  security guarantee that doesn't exist.
- **"SELLER TIERS"** said "Verified members can buy" — false in the same way, no buy capability
  exists for any tier.

Fixed by describing what's actually built (listing/browsing/tier-gated selling) and marking the
buy/revenue-split/purchase-gated-delivery mechanics as planned, not live — consistent with the
platform's own dormant-token-economy status established throughout this file (§4.11 onward).

`node --check` on both script blocks; `scripts/audit.py` reconfirmed 0 critical / 6 pre-existing
warnings. No SQL/schema changes in this entry — the RLS gap identified (any member can read
`file_path` regardless of purchase) is a real observation but wasn't independently pursued as a
security fix in this pass (would need to confirm whether Supabase Storage's own bucket policies
independently protect the files before concluding anything is actually exploitable) — flagged
here for a future session rather than acted on speculatively.

## 5. Explicitly out of scope / not verified in this pass

- **5.1** A full re-audit of all 170 pages for the XSS/silent-failure/missing-table bug classes
  has still not been performed — eight passes now (`REPOSITORY_AUDIT.md` §6 items 1-9, then
  items 11, 13, 14, 15, 16, 17, and the `.concat()`-innerHTML check noted below) have each
  covered a growing subset, not the full set. Items
  14-15 were script-assisted (cross-referencing every `.from()`/`.rpc()` call site and every
  write-error-check site programmatically) rather than manual page-by-page reading, which is
  why they could cover all remaining candidate files for those two bug classes in one pass. The
  `.innerHTML`-interpolation check is manual per-file (tracing each variable's data source) but
  is now exhaustive across four shapes: template-literal (`${...}`), string-concatenation
  (`+`), bare-variable (`.innerHTML=someVar` with the variable built up earlier), and
  `.innerHTML=[].concat(...)` — 10 + 54 + 12 + 7 = 83 files, all individually traced (see §1
  and the corrected 7-file/13-instance `.concat()` count above — an earlier pass here had
  undercounted by one file, `kings.html`) — and confirmed via grep that no file uses
  `outerHTML=`/`insertAdjacentHTML(`/`document.write(` with any of the four shapes (zero
  matches). Item 16 went beyond the original three bug classes for the first time: cross-
  referenced every client `.rpc()` call's consumed shape against the actual SQL `RETURNS`
  clause (found the `error_summary`/`my_points_balance` shape bugs and the `approvals.html`
  contracts/reservations XSS in §1), and separately diffed every duplicated function signature
  across the SQL bag rather than just duplicated table names (found §0's auth-bypass and §3.1's
  three divergent-function forks). Item 17 covered `bg.js`-loaded modules and external-API
  (non-Supabase) content sources, catching `omega-live.js`'s dormant ticker and `pulse.html`'s
  RSS-feed XSS — both outside the `.from()`-call-centric scope of items 14-16. An eighth pass
  (this session) closed the `.concat()` gap specifically: grepped every `.html`/`.js` file for
  `.concat(`, found 24 matches, and traced the 13 that feed an `.innerHTML=` assignment across
  7 files (`publications.html:162`, `contributions.html:172,199`, `heritage.html:154,169`,
  `treasury.html:250,290`, `notifications.html:164,181`, `governance.html:209,229,245`,
  `kings.html:158`). All 13 interpolate unescaped fields (titles, notes, story bodies, etc.)
  straight into the markup — but every one of the underlying arrays (`pubs`, `contribs`,
  `gifts`, `ancestors`, `stories`, `assets`, `flows`, `notifs`, `reminders`, `risks`,
  `policies`, `decisions`, `studyNotes`) is read from and written to `localStorage` only (no
  Supabase table), confirmed per-file (`JSON.parse(localStorage.getItem(...))` /
  `localStorage.setItem(...)`, no matching `.from('<table>')` calls for any of those variable
  names). That makes this self-XSS at most — a member could only inject a payload into their
  own browser's own storage, with no path for it to render in another session (unlike the
  `display_name`/`approvals.html` class of bug, which crossed from a member's write into the
  owner's browser) — so left unfixed as out-of-scope-by-design rather than "fixed." One
  adjacent false lead ruled out: `publications.html`'s `pubs` shares a name with the *different*,
  genuinely cross-user `public.publications` Supabase table (`feed.html`'s public post feed,
  written by `publishing.html`), but `publications.html` itself never touches that table — it's
  an unrelated localStorage reading-list feature that happens to share a name; `feed.html`'s
  own rendering of the real table already escapes (`.replace(/</g,'&lt;')`, confirmed at
  `feed.html:162-166`). **Still not covered:** any bug class outside XSS/silent-failure/
  missing-table/RPC-contract-mismatch/auth-bypass, and a live-database check of which side of
  each §3.1 fork is actually deployed. `CAPABILITY_INVENTORY.md`'s unmarked pages remain "not
  individually audited," not "confirmed clean."
- **5.2** Live-database verification of anything in §2 — no session has held credentials.
- **5.3** Supabase MCP server (`.mcp.json`, added this session) is configured but not
  authenticated — that requires an interactive `claude` session, which was confirmed
  un-completable headlessly. Once authenticated, §2's "not applied" items become directly
  actionable from a Claude Code session instead of requiring a manual SQL-editor paste.
- **5.4** §4.11's sign/element/god mapping fix was scoped to the two confirmed instances
  (`pantheons.html`, `horoscope.html`'s `SELEMS`) plus one targeted grep for the same
  wrapped-sequence signature — not a full re-verification of every one of the ~23 files that
  reference the 9 elements by name. Most of those are almost certainly fine (element-name-keyed
  color/sigil maps can't have a sign-mismatch bug by construction), but they weren't individually
  confirmed sign-by-sign in this pass the way `pantheons.html`/`horoscope.html` were.

## 6. Priority-ordered action list

1. ~~Apply the patched `supabase/trial_access.sql` to the live database~~ — **done this
   session, verified** (§0). The owner-approval bypass is closed on the live database.
2. ~~Apply `supabase/omega_apply_subscription_fix.sql` and
   `omega_complete_task_dedup_fix.sql`~~ — **done this session, verified** (§3.1). Stripe
   webhook processing and all task-completion/axis-progression tracking are unblocked.
3. ~~Run the `pg_proc` verification query in §3.1~~ — **done this session**, results in §3.1.
   `is_platform_owner()` and `my_matrix()` confirmed correct as deployed, no action needed;
   `complete_task()` and `apply_subscription()` were the real, now-fixed bugs in item 2 above.
4. ~~Apply `supabase/migrations/0013` and `0089`–`0092` to the live database~~ — **done this
   session, verified** (§2), including a second run of `omega_notify_triggers.sql` after
   verification caught `extend_trial` missing its notification insert the first time.
5. Authenticate the Supabase MCP server (`claude` → `/mcp` → approve → OAuth) so future
   sessions can verify directly instead of via a copy-paste-and-report loop with the owner —
   `scripts/verify_fixes.sql` closes most of the practical gap this created for now, but a
   live connection remains more robust for anything not already covered by that script.
6. ~~Decide the finance-pages persistence question~~ — **decided this session** (§4.2):
   stays `localStorage`-only, deliberately, with export/import added to mitigate the data-loss
   downside.
7. ~~Decide whether/how to build real payment wiring for `enterprise.html`~~ — **resolved this
   session, no action needed** (§3.2): the page is owner-only, never customer-facing, so the
   "pricing display with no purchase flow" framing didn't describe a real gap.
8. Consolidate the 47 duplicate table definitions toward `supabase/migrations/` as sole
   source of truth (§3) — no longer pure housekeeping now that `task_completions` proved a
   fresh-replay definition can silently diverge from the live schema (§3, `migrations/README.md`);
   do this one table at a time with a live `information_schema.columns` check each, not a bulk
   sweep.
9. Continue the page-by-page sweep (§5.1) — nine passes done across two sessions; all four
   `.innerHTML` interpolation shapes are now exhaustively traced (83 files across pages — the
   `.concat()` shape is 7 files/13 instances, not 6, per the correction above — 6 real
   stored-XSS instances found and fixed among them, plus 3 more via the non-page-scoped
   `bg.js`-module/external-content pass). All 16 `bg.js`-loaded modules with both `.innerHTML`
   and `.from()`/`.rpc()` calls are now individually traced too (§1's extended module pass).
   Remaining candidates for a next pass: pages with zero `.innerHTML` interpolation at all (not
   yet checked for other bug shapes), and any bug class outside the ones this sweep has focused
   on (XSS, silent-failure writes, missing-table/RPC, RPC-response-shape mismatches,
   auth-bypass).
10. ~~Wire `nav.js` for the 64-page navigation gap found this session~~ — done, see
    `REPOSITORY_AUDIT.md` §9 addendum. Prompted directly by friend/early-tester feedback
    ("navigation friction") in `UX_REDESIGN_BRIEF.md`; the go-ahead this item was waiting on.

`nav.js`'s duplicate keys (previously here) — done, see §4.4.

11. **Three Phase-5 tables now have no client at all** — `member_feature_flags`,
    `member_attributes`, `member_agent_interactions`. Discovered 2026-09-14 while deleting
    the three modules `audit.py` check 2 had been calling dead (`FIXES_LOG.md` 168): those
    modules were the *only* code in the repo that named these tables, so the count of
    non-dead client files was measured at **0** for each before the deletion, not created
    by it. The tables are real and deliberately hardened — `20260913173753` dropped
    `member_feature_flags`'s `WITH CHECK(true)` INSERT policy, revoked INSERT from
    `anon, authenticated`, and left UPDATE `USING(is_platform_owner())` — so the deleted
    `setFlag()` could not have succeeded from a member session even if something had
    called it. This is `evidence-audit.py`'s "absent and unread is a dormant backend"
    case and correctly does not gate. It is recorded here because the *capability* is
    real and unbuilt: per-member feature flags with variants, and a per-member attribute
    store. Whoever builds a client for them should note that `member_agent_interactions`
    was deliberately granted INSERT to `authenticated` with a member-scoped policy in that
    same migration, so it is the one of the three designed to be written from the client.
