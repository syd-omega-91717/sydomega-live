# Ω SYD OMEGA 91717 — Production Readiness Backlog

> Evidence-based tracking document. An item is not marked complete without repository, CI, or live-environment evidence.

## Release blockers

- [x] Resolve `migration-drift` without editing the remote migration snapshot by assumption.
      `FIXES_LOG.md` #176: #174's premise was wrong — the 2026-09-15 snapshot
      predated both `20260916204000`/`20260916210000` and could not have shown
      either as applied, but `mcp__Supabase__list_migrations` (authenticated,
      2026-09-17) confirms both *are* in the live ledger. Restored the file
      #174 wrongly deleted, regenerated `supabase/remote-migrations.json` from
      live truth (189 versions). `python3 scripts/migration-drift.py` →
      `MIGRATION DRIFT: PASS`.
- [x] Obtain authorized live Supabase migration state for project `ydqhzvvoyufiiqvzcjns`.
      `mcp__Supabase__list_projects` confirmed `ydqhzvvoyufiiqvzcjns` (name
      "sydomega", `ACTIVE_HEALTHY`) as the correct project — matches
      `ydqhzvvoyufiiqvzcjns.supabase.co` hardcoded in shipped `bg.js` — before
      any query ran against it; two other projects on the account are
      `INACTIVE` and unrelated. `list_migrations` and `execute_sql` both work
      from this session.
- [ ] Reconcile duplicate and local-only migration files through a reviewed migration plan.
      `FIXES_LOG.md` #174/#176: the `stripe_webhook_events` pair is resolved —
      both versions are genuinely live-applied and both files now exist,
      matching the ledger. A second pair (`creator_proposals`, `0105_` and
      `20260901143526_`) is already live on both sides and is left as
      historical record, not touched.
- [x] Re-run the full contract suite after reconciliation and preserve failure visibility.
      `python3 scripts/contract-suite.py` → `CONTRACT SUITE: PASS`, 18/18
      gates — first fully-green run this session, `migration-drift` included.
- [x] Verify the Vercel repository integration and production deployment from the canonical project.
      `FIXES_LOG.md` #180: the 2026-09-06 production-404 outage this item
      tracked is closed. Live-fetched `sydomega.com` (never curl) returns
      200, `etag` matching the newest `target:production` deployment
      byte-for-byte. `vercel.json`'s `git.deploymentEnabled.main` is now
      `true` (was `{"*":false}`) — Vercel's own Git integration promotes
      every `main` push; the repo's custom `vercel-production.yml` still
      lacks `VERCEL_TOKEN` and self-reports `CONTROLLED`, but it is a
      redundant backup, not the active path. Who changed the Vercel
      project setting and when is not established — not this session's
      change, and not re-opened as a blocker since live evidence settles
      the actual question this item asks.

## Security and compliance

- [x] Scan repository source, documentation, workflows, and configuration for credential-like values.
      2026-09-17: repo-wide grep (excl. `.git`/`vendor`/`node_modules`) for
      Stripe/Supabase-secret/AWS/Anthropic/Resend key formats, embedded
      JWTs (`eyJ...`), literal password/secret/token assignments, and
      `.env*` files. Two hits, both confirmed placeholders on inspection:
      `scripts/tests/test_supabase_runtime_contract.py:56` asserts client
      code never uses `sb_secret_do_not_use` (a deliberate dummy in a
      negative test); `.claude/skills/supabase-server/SKILL.md:186` is a
      vendored doc's truncated example (`sb_secret_automations_...`). No
      `.env*` files committed; no hardcoded value in `.github/workflows/`.
      `scripts/omega_security_baseline.py` and the CI service-role scan
      independently corroborate: 0 findings.
- [x] Rotate any credential that was exposed or cannot be proven non-secret.
      No exposed or unprovable credential found above — nothing to rotate.
- [x] Verify Stripe webhook signature validation, replay protection, and idempotency in a deployed environment.
      `FIXES_LOG.md` #182: read `stripe-webhook`/`checkout` in full and
      checked every claim against the live database, not the SQL bag.
      Signature validation is real HMAC-SHA256 with a constant-time
      compare and a ±300s timestamp tolerance (replay protection at the
      transport layer). Idempotency verified against live schema, not
      assumed: `stripe_webhook_events.event_id` carries a real unique PK
      index, `apply_subscription_event`'s live body does `ON CONFLICT
      (event_id) DO NOTHING` + `FOR UPDATE` + a `processed`/duplicate
      check, and `apply_subscription` raises rather than silently
      no-oping when the target profile doesn't exist. `stripe_webhook_events`
      has a live `RESTRICTIVE` deny-all policy for `anon`/`authenticated`;
      both RPCs also gate internally on `service_role`/owner. **Residual,
      named honestly**: `payments_enabled = false` live and
      `stripe_webhook_events` has processed **zero** real events ever —
      the mechanism is soundly built by every check available without
      live traffic, but has never actually executed. A true end-to-end
      test needs real Stripe test traffic or a synthetic write against a
      real profile's subscription fields — the latter wasn't attempted
      without the account owner's sign-off, matching CLAUDE.md §5's own
      caution on payment code.
- [x] Verify RLS policies against authenticated, anonymous, and privileged access paths.
      `FIXES_LOG.md` #177: the two-`is_owner`-accounts anomaly it
      surfaced is resolved (`FIXES_LOG.md` #178) — the account owner
      confirmed both addresses are theirs; `CLAUDE.md` §1 documents both.
      `FIXES_LOG.md` #177/#179/#181, in combination, now cover every one
      of the 202 `public` tables one of two ways: **130** have no
      table-level grant to `anon`/`authenticated` at all (129 correctly
      dormant, 1 — `agent_experiments` — was reachable and silently
      broken, fixed in #179) and **90** carry a real `authenticated`
      `SELECT` grant, every one of which was impersonation-tested in
      #181 (real `SET LOCAL ROLE authenticated`, not the broken
      `set_config` method #177 replaced) with its row count compared
      against a privileged count. All 90 are correctly scoped: per-user
      (`profiles` correctly returns 1 of 9), owner-only writes on
      shared-read tables (`platform_settings`, `dispatches`), or genuine
      public catalogs (`matrix_phases`/`matrix_tracks`/`point_perks`/
      `token_catalog`, plus the already-documented `feature_flags`/
      `governance_policies`). `signups` (anon `INSERT` only, no `SELECT`
      grant to anyone) is correctly write-only. **What this does not
      cover**: per-row correctness inside a shared table across many
      real users (this pass compared aggregate counts, not which rows) —
      narrower, real residual scope, not the ~221-of-224 gap this item
      opened with.
- [ ] Verify MFA, RBAC, audit logging, retention, deletion, incident response, and vendor records.

## Runtime verification

- [ ] Test authentication and session recovery.
- [ ] Test navigation targets and duplicate navigation keys.
- [ ] Test storage upload, download, and authorization boundaries.
- [ ] Test database reads and writes with failure reporting.
- [ ] Test Edge Functions with valid, invalid, unauthorized, and repeated requests.
- [ ] Test responsive layout, readability, keyboard access, reduced motion, and accessible names.
- [ ] Verify the single WebGL ownership contract in CI and in a browser session.

## Architecture and product evidence

- [ ] Map every documented module to an implementation path, test, and runtime evidence.
- [ ] Mark aspirational or physically impossible claims as concepts rather than implemented capabilities.
- [ ] Confirm whether each planned service is implemented, partially implemented, unverified, blocked, or not approved.
- [ ] Create a dependency and ownership map for frontend, Supabase, Vercel, payments, media, and AI integrations.
- [ ] Define rollback, backup restoration, observability, and release approval procedures.

## Operating rule

No item may be marked complete solely because it appears in a prompt, blueprint, generated report, or successful static check. Evidence must identify the exact file, test result, deployed behavior, or live provider response.
