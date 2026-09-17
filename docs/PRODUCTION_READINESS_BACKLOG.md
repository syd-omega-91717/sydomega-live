# Ω SYD OMEGA 91717 — Production Readiness Backlog

> Evidence-based tracking document. An item is not marked complete without repository, CI, or live-environment evidence.

## Release blockers

- [ ] Resolve `migration-drift` without editing the remote migration snapshot by assumption.
- [ ] Obtain authorized live Supabase migration state for project `ydqhzvvoyufiiqvzcjns`.
- [ ] Reconcile duplicate and local-only migration files through a reviewed migration plan.
- [ ] Re-run the full contract suite after reconciliation and preserve failure visibility.
- [ ] Verify the Vercel repository integration and production deployment from the canonical project.

## Security and compliance

- [ ] Scan repository source, documentation, workflows, and configuration for credential-like values.
- [ ] Rotate any credential that was exposed or cannot be proven non-secret.
- [ ] Verify Stripe webhook signature validation, replay protection, and idempotency in a deployed environment.
- [ ] Verify RLS policies against authenticated, anonymous, and privileged access paths.
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
