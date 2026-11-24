### Trophies merged into Honors (VAULT tab); canon names win (2026-11-24)

**Why.** `honors` and `trophies` read the same three tables (`trophies`, `medals`, `certificates`), `honors` had no menu entry and `trophies` was folded away (`docs/PAGE_CONSOLIDATION.md`, "Should merge", strongest evidence). Not a deletion: `trophies.html` held 23 of 27 lines of its own. A second finding made it a decision, not a copy: the two pages **named the same 36 items differently**. `trophies.html` hard-coded names ("THE GENESIS MARK", "FIRST LIGHT", "GENESIS CERTIFICATE"); `omega-canon.json` (which `honors.html` reads through `OmegaCanon.track(n)`) names them by sign ("Trophy of the Ram", "Medal of Valor", "Certificate of Initiation"). That is CLAUDE.md §8.1 class 8 (two divergent copies of one canonical table). **The owner chose the canon names** (asked, 2026-11-24).

**Fix.**
- `honors.html` has a **VAULT** tab (`#vault` deep link works) built by the new `omega-honors-vault.js` (a file, not an inline block, so the CSP inline ratchet stays at its baseline). It keeps what the old page did: earned/locked state per item, earned dates for trophies, the four stat tiles with real fill bars and tier (SAND / GOLD / PLATINUM / OMEGA MASTER), the animated icon per trophy (one still frame under reduced motion), the share-card button, and the new-unlock celebration, with the same `omega_trophy_celebrate_seen_v1` baseline key so nobody re-celebrates old unlocks.
- Names come from `OmegaCanon.track(n)`; colours from `OmegaRealm.palette` by the track's element. The 36 hard-coded names and colours are gone.
- **A failed read is no longer "nothing earned":** the old page treated an errored `trophies`/`medals`/`certificates` query as empty. The tab shows a message instead.
- `trophies.html` is deleted; `/trophies` and `/trophies.html` redirect permanently to `/honors#vault` (`vercel.json`). Links, search entries, previous/next chain, nav slug maps, the page-count claims (241) and the generated registries (page contracts, hub ownership, action audit, bootstrap, review tasks, world actions, visual survey, CSP baseline) were updated; generated files were regenerated with their own scripts.

**Verified.**
- Browser (`vault_test.js`, headless Chromium, Supabase stubbed with table-aware rows): **27/27** over four cases (member at 1000px, owner, a failing `trophies` read, member at 375px): `#vault` deep link opens the tab; 12 canon names in each of the three lists; counts match the rows (2/12, 1/12, 0/12, tier SAND); owner 36/36 = OMEGA MASTER; earned icons differ from the identical locked discs; a failed read shows the message, not 0/12; no horizontal overflow at 375px; no duplicate ids; no page errors; the MY RECORD tab still fills all 36 slots (no id collision). It first failed 9 of 27: a `#vault` deep link ran `bootVault` before `bg.js` had injected `OmegaCanon`, so nothing rendered and the "built" flag blocked a retry; `bootVault` now waits for the canon.
- `scripts/tests/test_honors_trophies_merge.py` (7 tests): page gone and redirected, nothing links to it, VAULT tab present and loaded from a file, names from the canon (the retired names must not reappear), failed-read guard, celebration key kept, no duplicate ids.
- `contract-suite`, `audit.py`, `omega-registry.py --check`, CSP and XSS ratchets: see the PR.

**Not done / not verified.**
- Members who knew the old names ("Knowledge Crown") will see new ones; no migration or notice was added.
- The old SCIENCE tab text (it described the old names) was not ported; `honors` already has a SCIENCE tab. Nothing else in that text was unique.
- The old page's per-medal category labels (GENESIS, ACADEMY...) are replaced by the canon sign; the medal and certificate lists show sign, not the old domain text ("PLATFORM FOUNDATION").
- Headless Chromium only; the stub is not production RLS; not seen on a real phone.
- Not merged: `grid`+`levels`+`gates`, `movies`+`series`+`cinema`, `payments`+`subscriptions` (each a separate decision, `docs/PAGE_CONSOLIDATION.md`).
