# Ω SYD OMEGA 91717 — Source Corpus Reconciliation

## Purpose

This document establishes a governed boundary between the project's historical source documents and the current repository implementation.

The source corpus is valuable because it contains product ideas, architecture proposals, security requirements, business goals, visual concepts, implementation instructions, and future-world concepts. It is **not** itself proof that every described capability exists in the current production system.

## Corpus inventory

The five supplied source documents contain:

| Source | Lines | Role |
|---|---:|---|
| `SYD OMEGA 91717 - Master Prompt.txt` | 1,847 | Historical full-system build specification and implementation prompt |
| `Ω SYD OMEGA 91717_Document.txt` | 363 | Earlier application architecture, routes, services, and build instructions |
| `SYD OMEGA 91717.txt` | 553 | Research, benchmarking, continuous-improvement, engineering, security, compliance, quality, and business requirements |
| `Ω- SYD OMEGA 91717-THE 999-POINT SOVEREIGN BLUEPRINT-NANO-DETAIL EXPANSION.txt` | 1,231 | 999-point conceptual/strategic blueprint plus narrative and illustrative code |
| `Absolute.txt` | 74 | Additional project directives and conceptual material |

The inventory is a source-analysis result, not a claim that every source line represents an implementation requirement.

## Required source classification

Every future source-derived item should be classified before implementation:

- **IMPLEMENTATION REQUIREMENT** — directly applicable to the current repository architecture.
- **PRODUCT REQUIREMENT** — defines a user/business outcome without prescribing obsolete infrastructure.
- **SECURITY / GOVERNANCE REQUIREMENT** — must become an enforceable control or explicit verified exception.
- **CONTENT / UX REQUIREMENT** — informs information architecture, copy, visual design, accessibility, or interaction.
- **RESEARCH PRINCIPLE** — transferable idea that requires adaptation.
- **ARCHITECTURE PROPOSAL** — candidate design, not current architecture.
- **ASPIRATIONAL / FUTURE** — intentionally not represented as currently available.
- **LORE / NARRATIVE** — world-building material; never presented as real-world operational fact.
- **REJECTED / REPLACED** — conflicts with a stronger current decision and is retained only for historical traceability.

## Important architecture reconciliation

The historical Master Prompt contains a React/Vite + Express microservices + Redis + Docker/Kubernetes style architecture. The current repository is instead a framework-free static web estate with Supabase PostgreSQL/RLS/Edge Functions/Storage and Vercel delivery.

Therefore:

**Historical infrastructure instructions must not be copied into the current repository merely because they appear in an older prompt.**

The current repository architecture, its contracts, runtime evidence, and explicit accepted design decisions are authoritative for implementation.

The reusable principles from the historical architecture remain useful where they improve:

- separation of concerns;
- API and capability boundaries;
- asynchronous work;
- caching;
- observability;
- authentication/authorization;
- testing;
- resilience;
- deployment automation;
- operational ownership.

## Security and privacy boundary

The source corpus contains credential-shaped material and highly specific infrastructure concepts in historical text.

Public project documentation must never reproduce:

- credentials;
- tokens;
- passwords;
- service keys;
- private provider configuration;
- personal identity information;
- internal deployment identifiers.

If a historical credential-shaped value could have been real, provider-side validity, revocation/rotation, and access-log review are the required controls. The value itself must not be copied into a new document or codebase.

## 999-point blueprint integrity

The explicit numbered-point inventory of the supplied 999-point blueprint currently has:

- 399 explicit numbered bullets matching the `* N.` format;
- 391 unique point numbers;
- duplicate explicit point numbers: 100, 101, 102, 103, 104, 112, 113, 133;
- 608 numbers absent from the explicit 1–999 numbered inventory;
- observed range: 1–999;
- final explicit point 999 appears before additional unnumbered prose/code.

This is a **format inventory**, not proof that 608 concepts are missing. Unnumbered prose can contain valid requirements or concepts.

The deterministic inventory tooling should remain the authoritative method for repeating this check.

## Research and benchmarking rule

The source material explicitly calls for learning from scientific, engineering, enterprise, security, standards, product, gaming, financial, infrastructure, and AI ecosystems.

The governed rule is:

1. Study the underlying principle.
2. Generalize it.
3. Compare it against Omega's current architecture.
4. Adapt it without copying proprietary implementation.
5. Document the benefit.
6. Identify dependencies and risks.
7. Define migration or rollback when replacing an existing design.
8. Add tests and evidence.

Benchmarking therefore improves Omega without turning external products into architectural dependencies.

## Content integrity rule

The following must never be silently converted into production claims:

- fictional space infrastructure;
- fictional ownership systems;
- speculative planetary or interplanetary ledgers;
- simulated financial mechanisms;
- narrative agents;
- lore-based authority;
- future technologies;
- conceptual blockchain assets;
- illustrative code that has no corresponding deployed implementation.

These may remain valuable as **LORE**, **SIMULATED**, or **FUTURE** content when clearly labelled.

## Unified implementation gate

A source-derived requirement enters implementation only when it can be connected to:

**SOURCE → REQUIREMENT → DOMAIN → PAGE/CAPABILITY → TASK → AUTHORIZATION → DATA → EVENT → EVIDENCE → TEST → RELEASE**

If any link is missing, the item remains a governed gap rather than an assumed implementation.

## Outcome

The source corpus should remain a living source of product intelligence while the repository remains the implementation authority.

This separation allows Omega to become richer without becoming contradictory, misleading, insecure, or architecturally fragmented.
