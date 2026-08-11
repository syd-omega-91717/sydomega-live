# Autonomous feature-proposal pipeline

Four skills, meant to run in this order, each a separate Claude Code
invocation (`/web-trend-scout`, `/feature-architect`, `/autonomous-coder`,
`/subscriber-portal`):

1. **web-trend-scout** — research only. Writes a grounded, proposal-only
   idea into `FEATURE_IDEAS.md`. No code.
2. **feature-architect** — planning only. Turns one chosen proposal into an
   exact file-by-file blueprint (page name, nav.js wiring, SQL file,
   flag). No code.
3. **autonomous-coder** — implementation. Writes the actual `.html`/
   `omega-*.js`/`supabase/*.sql` files per the blueprint, verifies with
   `scripts/audit.py` + `node --check`, commits to the current branch.
   Never flips a `platform_settings` flag to `true`, never merges to
   main, never edits CI.
4. **subscriber-portal** — exposure. Only runs once a human has decided a
   shipped-but-dormant feature is ready and its flag is actually `true`;
   wires it into the real dashboard/hub pages and the real tier system
   (`OmegaCanon`/`membership_tier`), not a parallel one.

## Why it stops short of full autonomy

This repo is a single-owner platform with real Stripe payments and a
documented history of serious, silently-shipped bugs (stored XSS in the
admin panel, a Stripe webhook that failed on every call, a task-completion
RPC that never committed anything — see root `CLAUDE.md` §8). Its own
rules (`CLAUDE.md` §9) say: no monetizable/legally-sensitive feature ships
"live" without an explicit gating decision, and changes should stay
reviewable rather than irreversible. This pipeline is built to match that:
every stage up through step 3 produces reviewable, dormant-by-default
output on a branch — nothing reaches an actual subscriber until a human
looks at the diff and flips a flag. Step 4 only ever activates something a
human already decided to turn on.

If a task genuinely needs to skip a stage (e.g. the blueprint is trivial
enough that architecture and coding happen in one pass), that's fine — but
the safety defaults in each `SKILL.md` (RLS required, flags default
`false`, no auto-merge, docs updated same-commit) still apply regardless
of which skill produced the change.
