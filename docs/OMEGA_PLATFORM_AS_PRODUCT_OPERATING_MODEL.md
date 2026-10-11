# Ω SYD OMEGA 91717 — Platform-as-a-Product Operating Model

**Status:** Operating model proposal grounded in the current repository and the supplied project source corpus. This is not a claim that every workstream is staffed or every capability is live.

## Executive decision

Build **one product, one governed core, many domain experiences**. Do not merge every feature into one giant page or one unbounded script. Unify identity, navigation, design primitives, policy, data contracts, task lifecycle, events, evidence, observability, release gates, and customer support. Keep specialist domains independently understandable and deployable within the existing static HTML/CSS/JavaScript + Supabase + Vercel architecture.

The product promise is: **a member enters one coherent Ω environment, understands where they are, what they can do, what data powers it, and whether the result is real, calculated, simulated, unavailable, or awaiting approval.**

## What a business leader asks before funding work

Every proposed feature must answer these questions before implementation:

1. **Customer/job:** Which user has a problem, and what job are they trying to complete?
2. **Outcome:** What observable customer or business outcome changes if this works?
3. **Evidence:** What supports demand—interviews, support cases, usage, conversion, or a validated operational need?
4. **Differentiation:** Why does this belong in SYD OMEGA rather than a generic external tool?
5. **Economics:** What are the implementation, provider, support, moderation, storage, and ongoing operating costs? What measurable value offsets them?
6. **Risk:** What can go wrong for users, the company, data, money, safety, compliance, or reputation?
7. **Ownership:** Who owns the feature after launch, including incidents, data quality, provider changes, and deprecation?
8. **Proof of delivery:** What test and live evidence demonstrate success?
9. **Adoption:** How will users discover, understand, trust, and return to the capability without manipulative engagement?
10. **Exit:** What is the rollback, migration, and retirement plan if it fails or is no longer valuable?

A feature is not prioritized because it appears in a long blueprint or sounds futuristic. Prioritize by user value, risk reduction, strategic fit, evidence strength, cost, and dependency order.

## The unified-core model

### Shared platform core — one owner per concern

- **Experience shell:** shared navigation, page identity, responsive layout, accessible controls, consistent loading/empty/error/denied states, and deep-link behavior.
- **Identity and policy:** Supabase Auth, verified session, role/capability checks, RLS/RPC/Edge Function enforcement, step-up authentication, and audit trail.
- **Capability and task fabric:** every action resolves to a canonical capability and task contract; unknown actions create explicit remediation work, not invented mappings.
- **Data and content fabric:** canonical metadata and provenance for assets, documents, media, datasets, exports, and external references; bytes, metadata, publication, entitlement, and rights remain distinct.
- **Event and evidence fabric:** validated, versioned, idempotent events; durable evidence separated from mutable UI projections; actor identity derived from trusted auth.
- **Truth and lineage:** LIVE, CALCULATED, SIMULATED, USER-CREATED, LORE, UNAVAILABLE, UNVERIFIED, BLOCKED, and other allowed states remain explicit; freshness and source lineage travel with the value.
- **Delivery and operations:** contract suite, release gate, deployment revision, provider state, monitoring, backup/restore evidence, incident workflow, and rollback.
- **Design system:** shared typography, color tokens, Ω brand primitives, focus states, reduced-motion support, and performance budgets.

### Domain modules — separate responsibilities, shared rules

Each domain owns its user job, domain data, domain-specific workflow, capability declarations, and acceptance tests. It does **not** create its own competing identity system, role policy, content catalog, event format, design system, release gate, or truth vocabulary.

Pages remain specialist views/projections over the same governed platform. A module may be unavailable or blocked without making the whole platform incoherent. Domain boundaries should follow distinct business responsibilities, not arbitrary technical fashion.

### Data flow

`SOURCE REQUIREMENT → DOMAIN → PAGE/PROJECTION → CAPABILITY → TASK → AUTHORIZATION → EXECUTION → EVENT → EVIDENCE → TRUTH STATE → RELEASE STATE`

For consequential mutations, the server/provider remains authoritative. The browser may request and display; it cannot grant itself permissions, mint achievement/financial truth, approve KYC, or claim provider success without evidence.

## How a company asks creators to execute

Every task ticket must include:

- **User and problem**
- **Expected outcome / measurable acceptance criteria**
- **Canonical page, domain, capability, and requirement IDs**
- **Current-state evidence** (file, route, test, provider response, or issue)
- **Scope and explicit non-goals**
- **Data source and ownership**
- **Authorization matrix and negative cases**
- **Truth state and evidence required**
- **UX/accessibility/responsive requirements**
- **Dependencies, cost, privacy/security/legal review**
- **Failure, retry, idempotency, and recovery behavior**
- **Tests to run and exact commands**
- **Deployment/production verification**
- **Rollback/migration plan**
- **Accountable owner and residual risks**

### Definition of done

A task is done only when:
1. the correct existing subsystem was extended rather than duplicated;
2. behavior matches the contract and user journey;
3. authorized and unauthorized cases are tested;
4. errors, empty states, provider outages, and retries are handled;
5. telemetry/evidence records what actually happened without exposing secrets or unnecessary personal data;
6. tests and CI pass without suppressing gates;
7. deployed behavior is verified where the task requires production evidence;
8. documentation and traceability are updated;
9. no claim exceeds its evidence;
10. rollback and remaining risks are explicit.

## Proposed delivery teams / accountable roles

These are responsibilities, not claims about current staffing.

| Workstream | Accountable role | Primary deliverables |
|---|---|---|
| Product strategy | Product owner / business lead | validated user jobs, roadmap, outcome metrics, cost/value decisions |
| Platform core | Platform architect / lead engineer | shell, registries, shared contracts, integration boundaries |
| Domain delivery | Domain creator / feature engineer | user journey, capability implementation, domain tests |
| Security & privacy | Security/privacy owner | threat model, access tests, retention, incident and provider review |
| Data & intelligence | Data/AI owner | provenance, lineage, retrieval scope, quality/cost evaluations |
| Experience quality | UX/accessibility owner | navigation, readable hierarchy, keyboard, mobile/responsive behavior |
| Reliability & release | SRE/DevSecOps owner | CI, deployment parity, observability, recovery drills, rollback |
| Finance/legal activation | Qualified finance/legal owner | jurisdiction review, disclosures, custody/payment controls, activation approval |

For a small team, one person may hold several roles; accountability must still be explicit and conflicts of interest reviewed for sensitive approvals.

## Roadmap by dependency, not by excitement

### P0 — Trust and release integrity
- Verify production revision matches reviewed main and resolve provider-side deployment blocks.
- Enforce main-branch protections and mandatory checks.
- Resolve credential-shaped values in legacy sources through provider inventory, rotation, and log review.
- Verify owner MFA, session recovery, RLS boundaries, and sensitive-action assurance.
- Keep payments, token issuance, AI memory, and KYC activation blocked until their provider and policy gates pass.

### P1 — Make the shared core real
- Reduce page-action UNMAPPED count through source-backed mappings only.
- Reconcile page contracts, domain registry, capability registry, task pipeline, and event/evidence contracts.
- Finish upload/content lifecycle and cross-user negative tests.
- Add a single navigation/search/task entry point that routes into domain projections.
- Ratchet accessibility, responsive behavior, failure-state, and runtime test coverage.

### P2 — Product value and economics
- Interview target users and rank domain journeys by validated demand.
- Instrument privacy-safe funnel and reliability metrics with explicit data definitions.
- Pilot one or two high-value journeys end-to-end before expanding every module.
- Measure adoption, completion, support burden, latency, provider spend, and conversion; remove features that do not justify their cost.

### P3 — Expansion under gates
- Expand AI agents, marketplace, media, gaming/social, finance, and mobile only with explicit value cases, owner, security boundary, legal review where relevant, cost model, and rollback.
- Keep fictional/lore content distinct from real money, investment, health, identity, or public claims.

## Scorecard — outcomes, not vanity

Use measured baselines before setting targets:
- critical-journey completion rate and failure rate;
- task success time and user-reported ease;
- percentage of executable actions with verified contracts;
- number of unresolved high-risk authorization findings;
- production revision freshness and successful smoke-test rate;
- accessibility pass rate on representative journeys;
- provider cost per successful task;
- incident detection/recovery time and measured restore results;
- adoption and retention by meaningful use case, not raw page views alone.

Do not publish fabricated numbers. If telemetry is absent, the metric state is UNAVAILABLE and the first task is to instrument it safely.

## External principles adapted, not copied

- **Platform as a Product / Team Topologies:** treat shared infrastructure as a product with real internal customers, a clear value proposition, adoption feedback, and a thin useful core. The goal is to reduce cognitive load and speed delivery—not add a platform layer for its own sake.
- **Product-oriented business platform strategy:** shared capabilities reduce data and process silos, but only when boundaries and ownership are clear.
- **Site Reliability Engineering:** define service indicators from measured behavior, use error budgets and incident learning, and verify recovery rather than treating configuration as proof.

References:
- Team Topologies, Platform Engineering: https://teamtopologies.com/platform-engineering
- Martin Fowler, How platform teams get stuff done: https://martinfowler.com/articles/platform-teams-stuff-done.html
- Thoughtworks Enterprise Architecture Playbook, Business platform strategy: https://www.thoughtworks.com/content/dam/thoughtworks/documents/report/thoughtworks-enterprise-architecture-playbook.pdf
- Google SRE, Error budget policy: https://sre.google/workbook/error-budget-policy/

## Boundary

This operating model coordinates existing contracts; it does not replace the canonical fabric, page contract registry, capability registry, requirement control plane, event/evidence fabric, or production evidence gate. It does not prove legal compliance, business demand, profitability, or live production readiness.
