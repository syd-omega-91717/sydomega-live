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
- [ ] Verify the Vercel repository integration and production deployment from the canonical project.

## Security and compliance

- [ ] Scan repository source, documentation, workflows, and configuration for credential-like values.
- [ ] Rotate any credential that was exposed or cannot be proven non-secret.
- [ ] Verify Stripe webhook signature validation, replay protection, and idempotency in a deployed environment.
- [ ] Verify RLS policies against authenticated, anonymous, and privileged access paths.
      `FIXES_LOG.md` #177: `profiles`/`task_completions`/`certificates`
      spot-checked with real in-database impersonation (`SET LOCAL ROLE`,
      not the `set_config('role',...)` method CLAUDE.md §8.4 documented
      before this — that method silently never engages RLS despite
      reading back as if it does) — all three correctly scoped, no leak.
      Only 3 of ~224 tables checked; the rest of this item is still open.
      Separately found: `profiles.is_owner = true` on two accounts, only
      one documented in `CLAUDE.md` §1 — flagged to the user, not resolved.
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
