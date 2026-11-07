### Studios pages: UNAVAILABLE now says why (2026-11-07)

**Why.** What was wrong, and the evidence (file:line, command output, query result).

**Fix.** What changed.

**Verified.** The exact command or render, and its actual output. Before and after where it is a bug.

**Not done / not verified.** Say it plainly. An unverified item stays unverified.

**Found:** an owner session (OWNER and LOG OUT visible in the nav, screenshot 2026-11-07 21:24 local, 19:24 UTC) opened `/studio-library` and saw only `UNAVAILABLE`. That label covered every failure that is neither `owner_only` nor 401/403: a 404 (function not yet deployed), a 5xx, a network/CORS failure, an empty payload. So the owner path could not be diagnosed from the page.

**Evidence of what it is not:** `studio-library/index.ts`, `library-data.ts`, `studio-canon/*` parse with TypeScript 5 (0 diagnostics); the payload loads (7 franchises, 10 documents, 256,946 bytes); the `profiles` columns `id`/`is_owner` exist in `supabase/live-schema.json` and `snapshot-leaderboard` queries the same; the CORS allow-list matches `concierge` and `agent-execute`. The Supabase connector has no access to project `ydqhzvvoyufiiqvzcjns` (permission denied on logs and function listing), so the live cause was not read. Timing is a candidate only: the function answered 404 at 19:19:47Z and 401 at 19:23:49Z, the screenshot is 19:24Z.

**Fix:** `omega-studio-library.js` and `omega-worlds.js` now show `UNAVAILABLE · <HTTP status>` plus the function's own error code (`/^[a-z_]{1,40}$/` only, via `textContent`), or `NO RESPONSE` when no HTTP response arrived. `RESTRICTED` and `APPROVAL REQUIRED` are unchanged; no library or canon content is in the DOM on any failure.

**Verified:** headless Chromium, stubbed client, 1280 and 375 wide: owner path unchanged (26/7/7/62 cards, reader, design documents, 0 page errors); `owner_only` -> RESTRICTED; 403 -> APPROVAL REQUIRED; 500 -> `UNAVAILABLE · 500`; 404 -> `UNAVAILABLE · 404`; 503 -> `UNAVAILABLE · 503 · server_not_configured`; no response -> `UNAVAILABLE · NO RESPONSE`; each with no library text in the page. `./scripts/ci-local.sh`: the one failure was the generated census (`omega-*.js` KB), regenerated with `omega-registry.py`. 41 Studios tests pass.

**Not verified:** the live owner request. A real owner session must reload the page after this deploys.
