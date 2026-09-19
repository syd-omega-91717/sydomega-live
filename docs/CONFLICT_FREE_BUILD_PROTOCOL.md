# Ω SYD OMEGA 91717 — Conflict-Free Build Protocol

## Purpose

Protect the current `main` branch while allowing continuous delivery of measurable improvements across UX, visual design, security, data, and infrastructure.

## Non-negotiable rules

1. **One task, one branch, one pull request.** Never reuse a branch after its pull request is merged or closed.
2. **Branch from current `main`.** Before starting, resolve the current `main` SHA and create a new branch from that exact commit.
3. **One ownership lane per change.**
   - Visual rendering: `omega-sculpture.js` only for WebGL.
   - Visual composition: existing visual runtime and CSS layers; do not introduce another renderer.
   - Navigation: `nav.js` and one canonical route registry.
   - Database: one migration per isolated schema change; never edit already-applied migrations.
   - Security: additive hardening with an explicit threat and verification statement.
4. **Read before write.** Fetch the complete current file and its blob SHA before replacing it. Never overwrite from an old conversation snapshot.
5. **Small vertical slices.** Each pull request must deliver one user-visible or security-relevant outcome, not a mixed batch of unrelated changes.
6. **No duplicate systems.** Search for existing selectors, functions, route keys, tables, migrations, agents, and visual owners before adding anything.
7. **Evidence gate.** Every pull request must state `VERIFIED`, `UNVERIFIED`, and `BLOCKED` items separately. Do not describe unverified deployment or live-database behavior as complete.
8. **Merge sequence.** Merge only one related pull request at a time; refresh `main`, then start the next branch from the new `main` SHA.
9. **Conflict recovery.** If a branch becomes stale, do not force-push or manually resolve from memory. Create a fresh branch from current `main`, port only the intended change, and close the stale pull request.
10. **Production safety.** Do not create empty or cosmetic commits to trigger deployments. A deployment issue must be investigated through its provider status and configuration, not by generating commit noise.

## Delivery lanes

Work is executed in this order unless a verified production incident changes the priority:

1. **Baseline and integrity:** repository state, CI contracts, syntax, migration consistency, secret and RLS checks.
2. **Usability:** simplify repeated content, create clear page summaries, improve navigation and mobile readability.
3. **Visual experience:** enhance existing cinematic, emblematic, motion, and 3D layers without creating competing renderers.
4. **Functional data:** replace static claims with explicit loading, empty, error, and verified-data states.
5. **Production:** validate Vercel, Supabase, authentication, payments, observability, and rollback paths separately.

## Pull request checklist

- [ ] Branch was created from the current `main` SHA.
- [ ] Existing implementation and ownership boundaries were searched.
- [ ] Scope changes only the files required for one outcome.
- [ ] No second WebGL context or competing visual runtime was introduced.
- [ ] Accessibility includes keyboard focus, readable text, mobile layout, and reduced-motion behavior where relevant.
- [ ] Validation commands and their actual results are recorded.
- [ ] Deployment and live-provider claims are labeled as verified or unverified.
- [ ] The next task can start from the merged `main` commit without depending on an unmerged branch.
