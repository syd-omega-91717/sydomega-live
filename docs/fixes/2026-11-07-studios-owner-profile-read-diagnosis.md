### Studios owner functions: say why the profile read failed (2026-11-07)

**Why.** What was wrong, and the evidence (file:line, command output, query result).

**Fix.** What changed.

**Verified.** The exact command or render, and its actual output. Before and after where it is a bug.

**Not done / not verified.** Say it plainly. An unverified item stays unverified.

**Found:** the owner's first successful look at the page (iPhone screenshot, 2026-11-07 22:51 local) showed `UNAVAILABLE · 503 · profile_unavailable`. That is the label added in #1199 doing its job. `profile_unavailable` is the function's own answer when the server-side read of the caller's `profiles` row fails; the user's token had already been verified (a bad token is a 401). So the failure is in the admin read, not in who the caller is.

**Not found:** *why* that read fails. `snapshot-leaderboard` and `weekly-digest` run the same query (`profiles.select("is_owner").eq("id", …)` with the server-side key) and nothing in the repo shows it failing. The live-grants snapshot covers only the `authenticated` role, so it says nothing about the server-side role. Read-only Supabase provider access is now available. On 2026-11-10, both functions were read back as ACTIVE (studio-canon v4, studio-library v8); their entrypoints, shared keys/access modules and generated payload files matched main byte-for-byte. A unified Edge log query was attempted but returned a provider FetchException, so the original 503 cause is still not known. No cause is claimed.

**Change:** both owner functions (`studio-canon`, `studio-library`) now record the real database error in the function log (`OWNER_PROFILE_READ_FAILED`: HTTP status, database error code and the first 200 characters of its message; never a key) and return only a fixed-shape `reason` on a 503, the HTTP status and database error code such as `403_42501`, sanitised to letters, digits and underscores and 24 characters. Both pages show it after the code, and only if it matches `^[A-Za-z0-9_]{1,24}$`. The pinned source hashes for the two functions in `docs/runtime/supabase-edge-functions-live.json` are updated, as the reconciliation check requires.

**Verified:** TypeScript parse of both functions, 0 diagnostics; `supabase-edge-runtime-reconciliation.py` PASS; 27 Studios and gate tests pass, including two new ones (the response carries `reason` and never a message, key or header; the pages accept only the safe shape); headless Chromium: `503 profile_unavailable 403_42501` renders in full and a hostile `reason` value (`<img … onerror=…>`) is ignored. Live provider read-back on 2026-11-10 confirms versions 4 and 8, `verify_jwt=true`, and exact repository entrypoint/shared-data parity.

**Not verified:** the live cause and a successful owner-page invocation after the latest deploy. The provider log query was unavailable in this pass; a new authenticated browser request plus function-log inspection is still required.
