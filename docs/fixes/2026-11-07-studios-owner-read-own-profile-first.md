### Studios owner functions: read the owner flag with the caller's own session first (2026-11-07)

**Why.** What was wrong, and the evidence (file:line, command output, query result).

**Fix.** What changed.

**Verified.** The exact command or render, and its actual output. Before and after where it is a bug.

**Not done / not verified.** Say it plainly. An unverified item stays unverified.

**Found:** the owner's second screenshot (2026-11-07 23:35 local, after #1202 merged) still showed `UNAVAILABLE · 503 · profile_unavailable` with no reason code. The live page script (fetched from the site) already contains the code that shows a reason, so either the owner's browser held an older script or the deployed function was not yet returning one. That could not be told apart from here, and the owner asked not to be asked again.

**Change:** both owner functions now read the caller's `is_owner` flag with the **caller's own session** first, then fall back to the server-side key only if that gives no row. The caller's session is the same way the app's own sign-in guard reads the same row on every page, row-level security scopes it to that user, and `is_owner` is not among the columns a user may update (`supabase/live-grants.json`, the `authenticated` UPDATE list), so a user cannot grant themselves the flag. The decision is unchanged and still made only in `decideOwner`: only a literal `true` passes; a missing row is a 403; both reads failing is a 503 with a reason that now says which read failed (`own_…` or `admin_…`).

**Why this is the likeliest fix, and how sure I am:** the server-side read is the part that fails (a bad token would have been a 401), and the function should not depend on it to answer a question the caller's own session can answer. I am fairly confident (likely, not certain) that this makes the owner path work. If it does not, the reason code now names which read failed and why.

**Verified:** the real TypeScript of both functions was compiled and run against fake database clients (scratch harness, not committed because it needs the TypeScript compiler): 24 cases pass. Owner passes with the server-side read broken; a non-owner's own row cannot be overridden by the fallback; `"true"` as a string is refused; no row anywhere is 403; both reads failing or throwing is 503 with `admin_401_PGRST301` or `admin_thrown`; an invalid session is 401 with the profile never trusted; a missing server key is still 503 `server_not_configured`; no key appears in any response or log line. Plus a static test pinning the read order, the pinned source hashes updated, and `supabase-edge-runtime-reconciliation.py` PASS.

**Not verified:** the live owner request. After this deploys, an owner reload shows either the library or a code.
