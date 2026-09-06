# SYD OMEGA 91717 — Production Readiness Coordination Map

**Purpose:** keep parallel engineering work convergent. This document is a coordination
map, not a second architecture contract. `CLAUDE.md` remains authoritative for codebase
facts; `AGENTS.md` governs ChatGPT/Codex work.

## 1. Source-of-truth rule

The repository's deployed architecture is a framework-free static web surface backed by
Supabase. The master design prompts describe a broader React/microservice/mobile target,
but those documents are specifications, not evidence that those components exist.
Source: `REPOSITORY_AUDIT.md` §1; uploaded `SYD OMEGA 91717 - Master Prompt.txt`, execution
order and frontend/mobile sections.

Do not create a second architecture merely to satisfy the older specification. Any future
architecture change requires an explicit migration decision and must preserve the current
no-build deployment contract. Source: `AGENTS.md` §5.4.

## 2. Parallel-agent ownership

| Area | Current handling | Rule |
|---|---|---|
| `bg.js` | Claude-owned | ChatGPT supplies a patch only when necessary. |
| `nav.js` | Claude-owned except additive new-page wiring | New-page entries are appended only. |
| `omega-*.js` | Claude-owned | Do not edit directly from ChatGPT. |
| `.github/workflows/*`, `ci-local.sh` | Claude-owned | Do not alter from ChatGPT. |
| Vercel deployment surface | Claude-owned | No ChatGPT edits to `vercel.json`, `.vercelignore`, `vercel-build.sh`. |
| Existing RLS/GRANTs | Protected | No ChatGPT edits. |
| New Python tooling | ChatGPT lane | Safe for independent audit/analysis tools. |
| New documentation | ChatGPT lane | Use new documents or isolated sections; never edit `CLAUDE.md`. |
| New migrations | Authoring allowed | Never apply; live-schema verification is required before any promotion. |
| Live services | Neither agent autonomously changes them | No migration apply, Edge Function deploy, Vercel promotion, or secret access. |

Source: `AGENTS.md` §§2, 5, 8.

## 3. Evidence states

Use these states consistently:

- **VERIFIED** — direct command, render, query, or other reproducible evidence exists.
- **PARTIALLY VERIFIED** — some surfaces or conditions were directly checked.
- **UNVERIFIED** — implementation may exist, but evidence has not been produced.
- **FAILED** — a reproducible test demonstrates a defect.
- **BLOCKED** — verification requires an unavailable runner, credential, service, or owner action.
- **SPECIFICATION ONLY** — requested by the design documents but not established as implemented.

Never promote a specification to implemented status without evidence. Source:
`AGENTS.md` §§7–8; uploaded `SYD OMEGA 91717.txt`, “Working Principles” and
“Deliverables.”

## 4. Current high-value work queue

### A. CI evidence recovery — BLOCKED/INFRASTRUCTURE

The repository has experienced GitHub Actions dispatch failures where jobs completed with
no executable steps. Do not modify source gates to make such runs appear green. Re-run or
inspect the current runner/account state before attributing a failure to source code.
Source: `docs/CI_RUNNER_RECOVERY.md`; `AGENTS.md` §7.

### B. Authorized dynamic security testing — READY FOR STAGING INPUT

The controlled Strix harness exists at `scripts/strix-staging-run.sh`. It rejects obvious
production targets and requires an explicit staging/test/non-production target plus secure
runtime credentials. Production must not be scanned by this wrapper. Source:
`scripts/strix-staging-run.sh`, `docs/STRIX_STAGING_EXECUTION.md`.

### C. Legacy SQL duplicate definitions — ANALYSIS IN PROGRESS

The repository records duplicate table definitions in the legacy `supabase/*.sql` bag.
`supabase/migrations/` remains authoritative. A live-schema comparison is required before
consolidating any competing definition. Source: `REPOSITORY_AUDIT.md` §4;
`GAP_ANALYSIS.md` §S and schema-organization sections.

### D. Third-party CDN reduction — SEPARATE WORKSTREAM

The project has already removed the Supabase CDN dependency and has reduced other CDN
traffic. Remaining third-party runtime dependencies require measurement before removal;
blindly deleting them can remove real features. Source: `AGENTS.md` §4.3;
`GAP_ANALYSIS.md` §S; `FIXES_LOG.md` recent CDN/performance entries.

### E. Product-sensitive dormant economy — OWNER DECISION

Payment, token, and legally sensitive features remain dormant behind platform settings.
Do not activate them from an engineering branch. Source: `AGENTS.md` §5.5;
`GAP_ANALYSIS.md` §S.

### F. Local-only member persistence — DELIBERATE DESIGN

The platform has server-side mirroring for member state while keeping restoration explicit.
Do not replace this with an eager two-way hydration loop without a measured race-safe design.
Source: `GAP_ANALYSIS.md` §S.

## 5. Master-prompt reconciliation

The uploaded master prompt asks for React, microservices, Redis, mobile Expo, Stripe,
Socket.io, Docker, and a multi-service gateway. The repository audit establishes that the
current production architecture is instead static HTML/JS + Supabase. Therefore:

1. Treat those older components as **future architecture requirements**, not missing files
   that should be generated blindly.
2. Implement capabilities that fit the current architecture first: evidence, security,
   accessibility, resilience, observability, data integrity, localization, and controlled
   integrations.
3. Introduce a new runtime architecture only through an explicit architecture decision,
   migration plan, and verified deployment path.

Source: uploaded `SYD OMEGA 91717 - Master Prompt.txt`, execution order; `REPOSITORY_AUDIT.md`
§1; `AGENTS.md` §5.4.

## 6. Required handoff

Every branch must report:

- exact base SHA and branch;
- exact files changed;
- shared/Claude-owned files touched (normally `none`);
- checks actually run and checks not run;
- generated files and migrations status;
- live services touched (`none` for this lane);
- known risks and evidence state;
- exact dependency on the other agent, if any.

Source: `AGENTS.md` §9.3.
