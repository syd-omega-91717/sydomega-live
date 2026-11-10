### Studios: episode 102 and the delegated decisions (2026-11-07)

**Why.** The owner asked to take the right decision and continue. The three open decisions were delegated; the work continues with Myth of the Stones, the only franchise with founder-approved content.

**Fix.** Season 1 episode 102, "The Hidden Bloodline" (short first draft, about 15 of about 50 pages), registered as the second script of the series. Written against the approved film: the tin box's contents match Act One (five numerals pay off episode 101's "91717"), and the bookshop flashback shows a nine-year-old Auren meeting Seraphine, which the film requires ("You met me when I was nine?"), with the bible's "left with a neighbour" moved to the second visit that night. Self-review caught and removed a breach of the bible's rule that the exact phrase "Hold the other end" is spoken only in episode 7. Decisions recorded in the master status as delegated proposals (the nine worlds stay PROPOSED; repository visibility is unchanged because it needs the owner's own settings). Deploy observation recorded: unauthenticated probe of `studio-canon` returns 401, the control (nonexistent function) 404.

**Verified.** `studio-canon-check.py` 0 findings, Studios tests, the full `./scripts/ci-local.sh` (35 of 35). The probe was made through Firecrawl because the sandbox cannot reach supabase.co.

**Provider update 2026-11-10.** `studio-canon` is ACTIVE at version 4 with `verify_jwt=true`; its entrypoint and returned Studio dependencies match main byte-for-byte. The owner path and non-owner 403 have not been re-run, and the earlier 503 profile-read cause remains unknown because the provider log query failed. 147 episodes, 24 screenplays and every game build remain unwritten; nothing here is approved content.
