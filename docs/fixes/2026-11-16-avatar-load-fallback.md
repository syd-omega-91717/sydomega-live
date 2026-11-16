### A dead avatar address no longer leaves a broken image or a blank photo box (2026-11-16)

**Why.** Every surface shipped this session was verified against the harness stub, which returns empty lists, so each data panel had only ever been seen empty. A populated-data pass (a scratch runner that overrides the stub with realistic rows: a member with axes 6/5/4, 12,840 points, four news items, five activity rows, a mix of true and false flags) found the first real defect on the first render: the home surface's profile avatar was a black disc with a broken-image icon. The address passed validation (`https:`), and the image behind it did not load, which is exactly what a member sees if their avatar file is deleted or moved. Checking the only other client file that renders avatars, `profile.html`, found the same class of flaw in another form: it validated the scheme, then cleared the passport placeholder and set the address as a CSS background, so a dead address left a blank photo box.

**Fix.**
- `omega-ecosystem-home.js`: on the image's `error` event, fall back once to the sign medallion the agent list already uses; a guard stops a loop if the medallion itself fails.
- `profile.html`: the passport photo probes the address with an `Image` and applies the background (and clears the placeholder) only in the probe's `load` handler. The existing hardening (https only, characters that end a CSS url encoded) is unchanged; `no-referrer` is now also set on the probe. `addEventListener` only, no inline or property handlers.

**Verified.**
- Home surface, populated stub, dead address: before the fix `src` stayed on the dead address and `naturalWidth` was 0; after it `src` is `/assets/legacy/sign-aries.webp` and `naturalWidth` is 512. Removing the listener fails `test_ecosystem_home`.
- Passport photo, four cases rendered (the passport tab opened with `setTab('passport')`; the Ω placeholder is drawn by a platform module as a `<canvas>`, so "kept" means the canvas survives): working address, photo applied and placeholder replaced; dead address (404) after the fix, placeholder kept and no background; dead address before the fix, **placeholder removed and the 404 address applied as the background**, which is the bug; no avatar, placeholder kept. 0 page errors in all four.
- `scripts/tests/test_avatar_load_fallback.py`: 4 tests; applying the background directly again (the old behaviour) is caught.

**Also found by the same pass, no defect:** with real-looking data the home surface's wallet, news, activity, honours, axes and ascension panels, and the command wall's lit gates (5 of 12 on both surfaces, consistent) and its `[ACTIVE]` / `[DORMANT]` flag rows, all render correctly with 0 errors. The home surface grows from 869px (empty) to 1,093px (populated), because the news and activity lists get longer.

**Not done / not verified.**
- Only how a stored avatar address is rendered was tested. How a member sets an avatar (upload, storage, who may write it) was not looked at.
- A grep for `avatar_url` in client code finds only these two renderers. Avatars derived some other way, such as from storage paths or server-rendered, were not searched for.
- Real database permissions were still not exercised; the stub proves wiring only.
- Chromium only.
