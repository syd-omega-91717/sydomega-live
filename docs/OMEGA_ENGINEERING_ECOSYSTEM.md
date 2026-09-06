# SYD OMEGA 91717 — Vetted Engineering Ecosystem Adoption Map

## Purpose

This document records external, public, reputable engineering projects and standards that can strengthen OMEGA. It is an adoption map, not a dependency dump. OMEGA must adopt principles and narrowly scoped capabilities only when they fit the current static HTML + Supabase + Vercel architecture and can be verified safely.

The project blueprint explicitly calls for continuous benchmarking across open-source ecosystems, security frameworks, enterprise architectures, AI laboratories, cloud infrastructure, observability, testing, governance, and compliance. It also requires knowledge to be generalized and adapted rather than copied.

## Adoption rule

For every candidate:

1. Verify the official upstream repository/project.
2. Check license, security policy, maintenance activity, release health, and architecture fit.
3. Prefer tools that can run outside the production runtime.
4. Start in local/staging environments.
5. Pin versions when a tool becomes part of a reproducible gate.
6. Capture machine-readable evidence.
7. Do not weaken existing gates merely to accommodate a tool.
8. Do not add a dependency when a deterministic repository-native check is stronger and sufficient.

## Tier A — adopt or integrate first

| Capability | Project / standard | OMEGA use | Decision |
|---|---|---|---|
| Adversarial security | Strix | Authorized dynamic security testing, PoC validation, SARIF/evidence | **ADOPT** |
| Browser/runtime verification | Microsoft Playwright | Real browser journeys, auth-gated rendering, interaction and regression evidence | **ADOPT** |
| Application security requirements | OWASP ASVS 5.0 | Turn security requirements into a verification matrix | **ADOPT** |
| Secret detection | Gitleaks | Full git-history/current-tree secret scanning in addition to the browser-surface baseline | **ADOPT** |
| SAST/pattern analysis | Semgrep | Detect security and correctness patterns that regex-based repository audits cannot reliably express | **ADOPT** |
| Vulnerability/SBOM scanning | Trivy | Filesystem, secret, misconfiguration, dependency and future container scanning | **ADOPT** |
| Supply-chain posture | OpenSSF Scorecard | Measure branch protection, code review, signed releases, CI, security policy and dependency posture | **ADOPT** |
| Dependency maintenance | Renovate | Controlled update PRs; never auto-merge security-sensitive changes without the existing evidence gates | **ADOPT** |
| API contract testing | Pact JS | Protect future Edge Function/API boundaries from breaking changes | **ADOPT WHEN API SURFACE GROWS** |
| Load/performance testing | Grafana k6 | Staging load, latency, rate-limit and resource-consumption evidence | **ADOPT** |
| Policy-as-code | Open Policy Agent | Evaluate explicit authorization/compliance policies if OMEGA develops policy complexity beyond SQL/RLS | **EVALUATE** |
| Telemetry standard | OpenTelemetry JS | Standardize traces/metrics/logs if runtime observability needs exceed the existing privacy-safe local recorder | **EVALUATE** |

## Tier B — valuable but not immediate

| Capability | Project | OMEGA decision |
|---|---|---|
| Web proxy/scanner | OWASP ZAP | Add to staging security assessment after Strix baseline is established; use as complementary coverage, not a duplicate blocking gate on day one |
| Artifact signing | Sigstore Cosign | Introduce when OMEGA publishes containers, binaries, signed release artifacts, or attestations; current static Vercel artifact does not justify adding it to the critical path yet |
| Developer portal | Backstage | Useful for a future multi-service enterprise operating model; premature for the current static architecture |
| Supabase async HTTP | Supabase pg_net | Useful for controlled database-triggered integration patterns; only adopt for concrete use cases with failure/retry/RLS analysis |
| Supabase queues | Supabase queue tooling / pgmq | Evaluate for durable asynchronous work before introducing an external queue service |
| Vercel Turborepo | Turborepo | Valuable for a future multi-package React/Node monorepo, but **do not migrate OMEGA merely to use it**; current architecture intentionally has no bundler/build framework |

## Tier C — benchmark/reference only

These projects are valuable sources of engineering patterns but should not be copied wholesale into OMEGA:

- Vercel platform patterns: deployment isolation, preview environments, immutable builds and edge-aware operations.
- Supabase platform patterns: PostgreSQL-first architecture, RLS, Edge Functions, Storage and realtime boundaries.
- GitHub engineering patterns: review gates, protected branches, security advisories, provenance and automation.
- Cloudflare patterns: WAF, bot/rate controls, caching, DNS and perimeter resilience.
- Backstage: service catalog and internal developer portal concepts.
- OpenTelemetry: vendor-neutral telemetry semantics.
- OpenSSF: software supply-chain trust practices.
- OWASP: application/API/security verification methodology.

## Why these fit OMEGA

### 1. Security evidence becomes layered

Current deterministic controls prove source/configuration invariants. Strix adds authorized adversarial verification. Playwright proves browser behavior. ASVS supplies a security-control checklist. Gitleaks/Semgrep/Trivy cover additional static and supply-chain classes. Scorecard evaluates repository trust posture.

The intended chain is:

`source invariants → SAST/secrets/SCA → browser verification → authorized adversarial testing → remediation → re-test → release evidence`

No single tool is treated as proof that the system is secure.

### 2. Browser truth becomes first-class

The platform is static HTML and heavily gated. Therefore syntax checks alone are insufficient. Playwright should become the preferred controlled browser instrument for:

- front door rendering;
- navigation;
- approval-gated surfaces;
- responsive layouts;
- form validation;
- failed-network states;
- localStorage export/import;
- accessibility assertions;
- console/page errors;
- critical user journeys.

### 3. Security requirements become traceable

OWASP ASVS 5.0 is the strongest candidate for converting broad security requirements into explicit evidence. OMEGA should maintain a control matrix with:

`ASVS control → OMEGA surface → implementation → automated evidence → runtime evidence → status`

Statuses remain VERIFIED, PARTIALLY_VERIFIED, UNVERIFIED, FAILED, or BLOCKED.

### 4. Supply-chain risk becomes measurable

Gitleaks, Trivy, Scorecard and Renovate address different problems and should not be conflated:

- Gitleaks: secrets.
- Trivy: vulnerabilities/misconfiguration/SBOM-related scanning.
- Scorecard: repository/process trust posture.
- Renovate: controlled dependency freshness.

### 5. Performance becomes evidence rather than impression

k6 should be used against staging only, with bounded scenarios for authentication, read-heavy pages, permitted API calls, rate limiting and resource consumption. It should never be used as a production stress test without explicit authorization.

## Do not adopt blindly

### Turborepo / Next.js

The Master Prompt describes an older React/Node/Turbo architecture, while the current repository is intentionally framework-free static HTML with Supabase. A migration to Next.js/Turborepo is therefore a strategic rewrite, not an incremental enhancement. It should only happen if the product requirements justify the operational cost and after a dedicated migration plan.

### Kubernetes / microservices / service mesh

The blueprint lists these as possible future architecture patterns. They are not automatically improvements. They add operational surface area, security boundaries, observability requirements, deployment complexity and cost. Keep the current static/Supabase architecture until measured requirements demonstrate the need.

### Large AI agent frameworks

OMEGA's agent concepts should not be turned into unrestricted autonomous agents. Agent permissions must be domain-scoped, least-privilege, auditable and incapable of silently changing security, ownership, payment, RLS or deployment state.

## Recommended implementation sequence

### Phase 1 — current blocker removal

1. Restore reliable CI execution evidence; current failed runs with `runner_id=0` and zero executed steps are infrastructure/runner failures, not proof of source failure.
2. Re-run all release gates on the current main-derived tree.
3. Resolve genuine failing gates only; do not weaken them to obtain green.
4. Keep Strix contract separate from application runtime.

### Phase 2 — security evidence

1. Strix controlled staging scan.
2. Playwright browser journeys.
3. ASVS control matrix.
4. Gitleaks repository/history scan.
5. Semgrep security/correctness scan.
6. Trivy filesystem/SBOM/misconfiguration scan.
7. OpenSSF Scorecard posture review.

### Phase 3 — reliability and performance

1. k6 staging scenarios.
2. API contract tests where real API boundaries exist.
3. OpenTelemetry evaluation against existing runtime observability.
4. ZAP complementary staging scan.

### Phase 4 — release integrity

1. Artifact provenance.
2. Cosign/Sigstore when artifact types justify it.
3. Dependency update automation through Renovate.
4. Release evidence bundle tying commit, build, test, security, runtime and deployment evidence together.

## Evidence policy

A tool completing successfully is not equivalent to the system being secure, available, performant, compliant, or production-ready.

Every adopted tool must produce an evidence record containing at least:

- tool and version;
- target;
- commit/build;
- scope;
- timestamp;
- configuration/profile;
- result;
- findings;
- artifact reference;
- remediation state;
- re-test result.

## External research basis

The candidate list was researched against official public upstream sources. Key references include:

- OWASP ASVS 5.0 — `OWASP/ASVS`.
- Microsoft Playwright — `microsoft/playwright`.
- Semgrep — `semgrep/semgrep`.
- Trivy — `aquasecurity/trivy`.
- Gitleaks — `gitleaks/gitleaks`.
- OpenSSF Scorecard — `ossf/scorecard`.
- Renovate — `renovatebot/renovate`.
- Pact JS — `pact-foundation/pact-js`.
- OpenTelemetry JS — `open-telemetry/opentelemetry-js`.
- Open Policy Agent — `open-policy-agent/opa`.
- Grafana k6 — `grafana/k6`.
- Sigstore Cosign — `sigstore/cosign`.
- Supabase pg_net — `supabase/pg_net`.
- Vercel Turborepo — `vercel/turborepo`.
- Backstage — `backstage/backstage`.

These are reference points and capability sources. OMEGA should implement only the subset that improves measurable outcomes without violating its existing architecture and ownership boundaries.
