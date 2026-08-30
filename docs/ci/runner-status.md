# CI runner status — tracking issue #157

**Issue:** GitHub-hosted runners stopped provisioning for this private repo on
2026-08-27 (`runner_id: 0`, empty `steps`, ~2 s job lifetime, `BlobNotFound`
logs). Reproduced on standard and `ubuntu-slim` labels, so it is an
account/repository Actions-provisioning problem, not a workflow-image one.

## Current state

| | |
|---|---|
| GitHub-hosted runners | **still blocked** — needs an account/org-settings + Actions-billing fix (issue #157 steps 1–3); not something this repo's code can change |
| Workflow `runs-on` | **`self-hosted`** on all four workflows (`ci.yml`, `production-contract.yml`, `capability-evidence.yml`, `workflow-contract.yml`). The `ubuntu-slim` routing mentioned in the issue body has been superseded. |
| Self-hosted runner | a **Windows** runner (`C:\actions-runner`). `shell: cmd` steps; two platform traps recorded in `CLAUDE.md` §8.2 (path/codec differences; a crashed child yields empty stdout). |
| Local execution evidence | **`bash scripts/ci-local.sh`** mirrors every blocking contract (18 checks) and is what proves a change passes while cloud runners are unavailable. `.githooks/pre-push` runs it on every push (`git config core.hooksPath .githooks`). |
| Runtime verification | **`node scripts/verify-runtime.js`** renders the real capability entrypoints in headless Chrome/Edge (zero repo deps — resolves `playwright-core` from a scratchpad, or `SKIPPED` if absent) and asserts load / approval-guard-lifts / no-throw / no-overflow / no-dup-id, plus an advisory a11y pass. Blocking step in `capability-evidence.yml`; a full `--all` report-only sweep runs alongside. Also `scripts/ci-local.sh --all`. |

## Acceptance for closing #157 (unchanged)

Each of CI, Production Contract, Capability Evidence, and Workflow Contract
must produce a run with a **non-zero runner ID, ≥1 executed step, and a real
job log**. Only then are red checks treated as code-level failures rather than
infra noise. Until then: `ci-local.sh` green + a self-hosted run is the bar.

## Why work does not stop on this

Repository-side completeness (broken/partial capabilities, error paths,
data/schema contracts, static evidence) is verified by the deterministic
scripts, which run anywhere. **Browser runtime** is now verified too, by
`scripts/verify-runtime.js`. The only things still gated on external access:

- a **cloud** CI execution record with a non-zero runner ID → issue #157 (GitHub
  Actions billing/settings)
- **live database / auth / deploy** verification → Supabase MCP + Vercel access

Both are tracked per-capability in `docs/capabilities/registry.json` under
`contract.live_verification`, which now reads `runtime-verified 2026-08-30 …`
for the browser-checkable capabilities and `BLOCKED — no provider access` only
for the genuinely live-only parts.

## Issue #175 — capability gaps + runtime verification

Progress in this PR:
- `scripts/verify-runtime.js` added and wired into CI + `ci-local.sh --all`.
- **`identity`**: `account.html` route() silent-swallowed `reactivate_account`
  and its profile reads — now checks `{ error }` and logs a reason. Promoted
  PARTIAL → BUILT.
- **`import-export`** (`vault.html`): its inline CSP had no `img-src`/`font-src`,
  so it blocked its own `data:` textures and Google-Fonts files. Fixed;
  runtime-verified clean.
- Every capability's `contract.live_verification` updated with the runtime
  evidence or an honest BLOCKED.
- Still open, named precisely in the contracts: `feed`/`family` under-covered
  `.error` paths; the dead `ops.html` metrics panel; a platform-wide sub-24px
  tap-target sweep (bg.js footer/nav chrome) and one unlabelled input.
