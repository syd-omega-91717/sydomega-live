### Twelve LIFE tracker pages become tabs of one page (2026-11-14)

**Why.** The owner asked for fewer pages, merged into one another and not deleted, in the style of the reference
screens (one dark-and-gold page, one focal point, tools inside it). Of 241 `.html` files, 16 were already
redirect stubs, 23 were small, and 202 were real pages (median 19KB), so merging by hand-porting scripts was
not realistic or safe in one pass. Framing a page is not possible either: production sends
`X-Frame-Options: DENY`. The twelve LIFE tools (body, workout, sleep, mood, breath, habits, fasting,
gratitude, water, affirmations, stoic, rituals) were each a separate page with its own localStorage data, and
the daily log on `life.html` already linked to nine of them.

**Fix.** New `omega-panels.js`: a host page lists existing pages as tabs; choosing one shows that page's own
`<main>` content in place and runs its scripts, then tears everything down when you switch. The source pages
are untouched and still open on their own, so no URL breaks and nothing is deleted.
- Content comes from `DOMParser` (no string into `innerHTML`); styles are copied and removed on unload.
- Classic inline scripts run inside a function (their top-level `let`/`const` would throw "already declared"
  on the second open) and the handler names the markup calls (`onclick="fn("`) are copied to `window`.
  Module scripts run as written; the panel stays "current" until each reports it finished evaluating.
- Timers, animation frames and `document`/`window` listeners a panel creates are tied to it, skipped once it
  is gone, and removed on unload. `DOMContentLoaded` handlers are called once instead of waiting for an event
  that already fired.
- Modals that sit outside `<main>` (`ritual-modal`, `habit-modal`) are carried over.
- `life.html` mounts the 12 tabs under the daily log (`#water` deep-links and scrolls to the panel after it
  loads); the daily-log tile arrows open the tracker in place (real `href` kept for no-JS and middle-click);
  the hub chip strip no longer lists those 12 (they stay in `WORKSPACES`).
- Tests: `test_omega_panels.py` (6), `test_life_opens_on_the_log.py` updated.

**Verified.** Headless Chromium, 1280x900 and 390x844 touch profile.
- Parity, panel vs standalone page, all 12: same number of controls clicked, same tab behaviour, **0 page
  errors on both**, **identical sets of localStorage keys written** (including the logs: `omega_sleep_log`,
  `omega_mood_log`, `omega_water_log`, `omega_ritual_logs`, `omega_habit_logs_v2`, `omega_affirmations`...).
- Re-entry: after 5 open/close cycles one click on `+250ml` adds exactly 1 entry (0 -> 1), so no duplicate
  handlers survive teardown. Rapid switching through 9 tabs: 0 errors, 1 active tab, 1 injected style set, no
  duplicate ids.
- Two real bugs were found and fixed by these runs, not by reading: rituals threw `reading 'classList'` (modal
  outside `<main>` not copied) and a stale HABITS module callback threw `setting 'textContent'` on the next
  tab (module scripts run after the recording window had closed). A third: `#water` did not scroll to the
  panel because the approval guard keeps the shell at zero height until it lifts (scroll now runs after load).
- Phone: the 12 tabs are one swipeable row with the selected tab centred; `#water` lands with the panel at
  the top; 0 horizontal overflow; 0 errors.

**Not done / not verified.**
- File count is unchanged: the 12 source pages still exist as standalone pages (reachable by URL, search and
  the launcher). Turning them into redirect stubs would remove them as pages in their own right; that is an
  owner decision and was not made here.
- These trackers keep their own localStorage data, separate from the daily log's `life_entries` rows. Two
  stores for the same facts is the real duplication; merging data is a schema and migration decision and was
  not touched.
- Promise callbacks (`fetch().then`) a panel starts are not tied to it. None of the 12 failed on this, but a
  panel that fetches slowly and is closed first could touch a removed element.
- Only these 12 pages were tested. Pages with Supabase writes, E2E-encrypted state (journal) or heavy canvas
  (3-D) were deliberately not put in tabs. Not checked on a real phone or with a screen reader.
