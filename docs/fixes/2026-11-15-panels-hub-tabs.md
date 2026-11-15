### Seven hubs show 84 of their pages as in-place tabs (2026-11-15)

**Why.** Second batch of the page-merge work. After `omega-panels.js` carried the 12 LIFE trackers (#1290), the
question was how far the same loader generalises. A hub chip strip (`omega-single-page-workspaces.js`) was a row of
links that each left the hub; ascend, govern, achieve, cosmos, intel, services and order list 7-19 of them.

**Fix.** `PANELS` in `omega-single-page-workspaces.js` (space-separated strings, so the hub-list parser in
`test_hub_picker_links.py` does not read it as a second chip list) names, per hub, the pages shown as tabs under
`#hub-tools`; every other page in the hub stays a chip. 84 tabs: ascend 18, govern 16, achieve 13, cosmos 12,
intel 11, order 7, services 7. The picker loads `omega-panels.js` only on a hub that has tabs.

**Selection was measured, not guessed.** Every one of the 165 hub pages was loaded as a tab and compared with its own
standalone page (controls clicked, localStorage keys written, page errors, rendered content, navigation). Then
the real hubs were tested, which found problems the throwaway host could not (see below).

**Loader fixes that testing forced** (`omega-panels.js`):
1. Pages with several inline scripts share one scope on a real page; they now run as one unit (a function in one
   script was `not defined` in the next).
2. Every top-level `function`/`var`/`let`/`const`/`class` is exposed as a live window binding, as on a real page, including
   names in comma lists (`var PHI=1.6,EU=2.7;` exposed only `PHI`; a declarator scan replaced the regex).
   Host globals of the same name (`esc`, `sid`, `switchTab`) are never replaced by an accessor, and handler
   names the markup calls are copied by value and restored on teardown.
3. The page's own wrapper (`#app`) and authored elements outside it (modals, overlays, toasts) are carried over; scripts
   look them up by id.
4. `<script type="module" src=...>` is loaded as a module and re-evaluated each time the tab opens.
5. Events inside the stage run with the panel current, so a timer started by `onclick="start()"` is stopped on
   teardown (a "start focus" click had left a timer that wrote into removed elements and broke later tabs).

**Bugs this change made and then fixed (kept here on purpose):**
- A getter that read its own name recursed forever ("Maximum call stack size exceeded") in three different ways: a
  name the page declared inside its own inner function, a name the host also had as a global, and a name the page itself
  assigned to `window`. Final rule: define a live binding only if the host has no global of that name, and the
  name is still absent from `window` when it is defined.
- An access guard in `observatory` and `enterprise` calls `location.replace(...)` for members without the role;
  as a tab that ejects the member from the hub, and `location` cannot be intercepted. Both stay chips.

**Verified.** Headless Chromium (stubbed Supabase, signed-in non-owner member).
- Throwaway host, all 165 pages vs standalone, final loader: 147 pass strictly, 10 weak (the standalone page navigates or
  differs in controls), 8 fail.
- Real hubs, a fresh hub load per tab: 81 of 85 clean; of the 4, three raise the same error on the standalone page
  (`setCat is not defined`, a null `textContent` in clarity, an `onclick` syntax error in library: page bugs, not
  loader bugs) and one, `map`, rendered 88 characters against 1,176 standalone, so it was removed (now a chip).
- Real hubs, cycling every tab in ONE session (the realistic case): 83 of 84; the one error (`sigma`) occurred once
  while four scans ran in parallel and did not recur in two further full cycles or three isolated loads.
- The 12 LIFE trackers re-run after every loader change: identical controls and storage keys, 0 errors; one click
  adds exactly one entry after 5 reopens; the host page's globals are unchanged after opening and closing 8 tabs.
- Phone profile 390x844: one-row swipeable tab strip, selected tab in view, 0 overflow, 0 errors (ascend, flashcard).
- Tests: `test_omega_panels.py` now 14 tests, including that no payment, consent, identity, role-gated page or
  media/dashboard/vault/invest/profile/archive/arena hub gets tabs.

**Not done / not verified.**
- **The number of choices on a hub did not shrink**: govern still offers 19 destinations (16 tabs + 3 chips). What
  changed is that they open in place instead of leaving the hub. Cutting the count itself is a separate decision.
- Deliberately NOT tabs: the whole vault and invest hubs (payments, ledgers), profile, archive (KYC), arena (agent
  tools), `contracts`, `health`, `privacy`, `graph-admin`, `observatory`, `enterprise`, `map`. They passed or
  failed the scan on their own; the exclusion is a safety choice, not a measurement.
- `media.html` has no `<main>`, so its chip strip never rendered (also before this change); it gets no tabs.
- 28 other pages did not pass cleanly (weak or fail) and remain plain chips; the failing ones are listed in
  `docs/fixes/` history only by this paragraph, not fixed.
- Promise callbacks (`fetch().then`) started by a panel are still not tied to it.
- Tested against stubbed Supabase and one signed-in non-owner profile only. An owner profile, a trial member,
  or real data could behave differently. Not checked on a real phone, with a screen reader, or in Safari/Firefox.

**Follow-up (CodeQL and Semgrep on this PR).** Two code-scanning tools objected to the one line that built a
RegExp from a handler name: CodeQL (two high-severity "incomplete string escaping" alerts, backslash not escaped) and
the blocking Semgrep rule `detect-non-literal-regexp`. The names are identifier characters only, so neither was
exploitable. A first fix (a full `escapeRe` helper) answered CodeQL but not Semgrep, whose rule objects to the
non-literal pattern itself, so the helper was removed too: `declares()` now finds the declaration with
`indexOf` and literal patterns on a short window, and `omega-panels.js` builds no RegExp from data at all.
Compared against the regex it replaced on every handler name in all 241 pages (144 names): zero differences.
Re-ran the loader tests, both ratchets, the 12-tracker parity run, the host-globals check and three hub sequences:
unchanged.
