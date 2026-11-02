### A project named after the production ID: wrong Supabase project mistaken for production (2026-11-02)

**Why.** What was wrong, and the evidence (file:line, command output, query result).

**Fix.** What changed.

**Verified.** The exact command or render, and its actual output. Before and after where it is a bug.

**Not done / not verified.** Say it plainly. An unverified item stays unverified.

**Symptom.** The erasure test and its check query, run in the owner's Supabase SQL editor, failed with `relation "public.consent_records" does not exist` and `WRONG DATABASE`, although the dashboard header read `ydqhzvvoyufiiqvzcjns / sydomega` on branch `main`.

**Cause.** That header is the project *name*. Settings > General showed Project ID `nvgedlxlkdzvcelimbvq`, region us-east-1, in the organisation `syd-omega-91717's projects`. Production is `ydqhzvvoyufiiqvzcjns`, ap-southeast-1, listed by the connector under another organisation. Measured: editor server address `2600:1f18:...`, 89 public relations, 0 users; production `2406:da18:...`, 295, 9 users. I misread the name as the ref for several turns and told the owner the ref matched.

**Also found.** The wrong project has the Supabase GitHub integration connected to this repository with "Deploy to production" on and production branch `main`, so merges to `main` are applied to it as well as to production. Not changed here: pausing, disconnecting or deleting it is the owner's decision (any DROP needs owner confirmation).

**Fix.** `docs/legal/ERASURE_ROLLBACK_TEST.md` step 1 now verifies the Project ID and region, and the production gate is recorded as row 20 of `LEGAL_GAP_AUDIT.md`.

**Verified.** Connector read of production before and after: 9 users, 9 profiles, 2 owners, no erasure functions, tables or cron job.
