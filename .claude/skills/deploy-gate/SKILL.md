---
name: deploy-gate
description: Ship a change to sydomega-live's real deployment surface — the static Vercel site and, separately, the Supabase backend — without letting a green local run stand in for a live one. Use for any release, deploy, rollback, CI-gate, or "is this safe to push" question. Covers what actually gates a deploy, why GitHub Actions is currently unreliable here, what never reaches the public bundle, and how a bad deploy is undone.
---

# DEPLOY GATE

## What "deployed" means in this repo

Two independent planes, deployed by different tools. Conflating them has
shipped broken changes before.

1. **The static site → Vercel.** `vercel.json` sets `outputDirectory: "."`,
   `installCommand: "echo skip-install"`, `buildCommand: "echo static-no-build"`,
   `framework: null`. The repo root *is* the deploy. There is no build, no
   bundler, no transform — a file that parses and whose asset refs resolve is
   a file that ships. Vercel deploys on push to the connected branch via its
   own Git integration; there is no deploy step in `.github/workflows/`.
2. **The backend → Supabase CLI / dashboard.** Everything under `supabase/`
   (125 flat `*.sql`, 143 `migrations/*.sql`, 11 Edge Functions) is applied
   by hand against the project, never by Vercel. `.vercelignore` excludes
   `supabase/` entirely. A migration file added in a commit is **"added, not
   yet applied"** until someone runs it and says so — match the convention
   already in those files.

## The gate, in order

`scripts/vercel-build.sh` is the production gate and it runs three things.
Reproduce it locally before claiming a change is deployable:

```
bash scripts/ci-local.sh          # every BLOCKING repository contract (~16 steps)
python3 scripts/production-contract.py
python3 scripts/capability-audit.py --check
```

`ci-local.sh` mirrors `.github/workflows/ci.yml`, `production-contract.yml`,
and `capability-evidence.yml`. Its blocking steps include: `node --check` on
every `.js`, inline-script syntax, `scripts/audit.py` (0 new CRITICAL),
`scripts/context-budget.py`, `scripts/omega-registry.py --check`,
`scripts/i18n-contract.py`, broken-asset refs, the `service_role` /
`SUPABASE_SERVICE_ROLE_KEY` scan, `sw.js` precache resolution, and PWA
manifest icons. A single failing blocking step means **not deployable** —
`ci-local.sh` exits 1 and so does the Vercel gate.

Run `bash scripts/ci-local.sh --all` to also see the advisory checks
(`rls-auditor`, `silent-failure-detector`, `migration-consistency`,
`schema-dictionary`, `upsert-conflict-check`) — these never block a merge but
a new finding is worth reading before you push.

## GitHub Actions is not a reliable signal here

Per `scripts/ci-local.sh`'s own header: since 2026-08-22 this private
personal-account repo has been unable to assign a runner — `runner_id 0`, no
executed steps, 0 billable ms, empty check output. That is an **account-level
Actions entitlement problem, not a code failure**. Consequences:

- A green GitHub checkmark may mean "ran and passed" or "never ran." Read the
  run: zero executed steps is not a pass. `omega-redteam-verifier`'s rule —
  "a failed or zero-step CI check is not equivalent to a passed test" —
  applies directly.
- The workflows now target `runs-on: self-hosted` (a Windows runner; CI
  steps are `shell: cmd`). If you are on that runner, `python` and `node` are
  on PATH but the bash helper scripts need Git Bash.
- A **local** `ci-local.sh` pass is real execution evidence. Record it with
  the commit SHA. Never write a sentence that implies GitHub Actions passed
  when it did not run.

## What must never reach the public bundle

`.vercelignore` is the **only** defense — an earlier `vercel.json`
extension-redirect safety net was removed for invalid route syntax and never
restored. Do not assume `vercel.json` backs it up. It currently excludes:
`supabase/`, `*.ts *.tsx *.py *.sol *.sql`, `*.md *.doc *.docx *.pdf`,
`.env*`, `*.log`, `node_modules/ .git/ .github/ .vscode/ .idea/`,
`package.json`, `package-lock.json`.

Known gaps to keep in mind:
- **`.claude/` is not excluded.** SKILL.md files are `*.md` so they don't
  ship, but `.claude/skills/verify-in-browser/harness/*.js` would. If you add
  non-`.md` files under `.claude/`, add a `.claude/` line to `.vercelignore`.
- **`*.mp4` is not excluded** — `SYDOMEGA91717_DEMOD-1-.mp4` (3.7 MB) ships on
  purpose; `omega-demo-video.js` serves it from `/`. Only `*.docx` of the two
  git-committed binaries is kept out. (CLAUDE.md §8.2 says "both" — the file
  is what's authoritative.)
- The site is `X-Robots-Tag: noindex, nofollow` and invite-gated. No public
  SEO/marketing/ad surface exists — do not add one, and see CLAUDE.md §10.1
  on why ad-production skills were rejected twice.

## Client-credential rule (blocking, non-negotiable)

`service_role` and `SUPABASE_SERVICE_ROLE_KEY` must never appear in any
`.js`, `.html`, or `.json` that ships. The client uses only the publishable
key (`sb_publishable_…`). This is scanned in `ci-local.sh` step 5,
`production-contract.py`, and CI. RLS — not client code — is the security
boundary (CLAUDE.md §5); a deploy does not change RLS, a Supabase apply does.

## Rolling back

- **Static site:** Vercel keeps every deployment. Promote the previous good
  deployment in the Vercel dashboard (instant, no git op), then land a
  `git revert` of the bad commit so the repo matches what's live. Do not
  force-push `main`.
- **Backend:** there is no automatic down-migration. A bad SQL apply is
  undone by a new idempotent forward fix (`supabase/omega_<x>_fix.sql`), not
  by rerunning history. Edge Function: redeploy the previous version via the
  Supabase CLI.
- **A release invariant that fails after deploy** (RLS regression,
  cross-user read, webhook 500) is a rollback, not a "fix forward under
  pressure" — this repo's history (CLAUDE.md §8.1) is full of forward fixes
  that shipped a second bug.

## Guardrails

- Never introduce a build step, bundler, or framework — `vercel.json`
  disables install/build on purpose.
- Never merge the working branch into `main` or open/merge a PR unless the
  user explicitly asks. Deploy discussions do not authorize a merge.
- Never flip a `platform_settings` flag to `true` as part of a deploy — that
  is a human business/legal decision (CLAUDE.md §9).
- A monetizable or legally-sensitive feature ships dormant (flag `false`,
  UI copy future-tense) regardless of how ready the code is.
- "The matrix is green" is not "the surface works." Verify the deployed page
  after a static deploy; verify the RPC/policy against the live project after
  a backend apply.
