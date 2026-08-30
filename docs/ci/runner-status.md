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

## Acceptance for closing #157 (unchanged)

Each of CI, Production Contract, Capability Evidence, and Workflow Contract
must produce a run with a **non-zero runner ID, ≥1 executed step, and a real
job log**. Only then are red checks treated as code-level failures rather than
infra noise. Until then: `ci-local.sh` green + a self-hosted run is the bar.

## Why work does not stop on this

Repository-side completeness (broken/partial capabilities, error paths,
data/schema contracts, static evidence) is verified by the deterministic
scripts, which run anywhere. The only thing gated on runner provisioning is a
**cloud** execution record; live-provider verification is gated separately on
Supabase/Vercel access. Both are tracked per-capability in
`docs/capabilities/registry.json` under `contract.live_verification`.
