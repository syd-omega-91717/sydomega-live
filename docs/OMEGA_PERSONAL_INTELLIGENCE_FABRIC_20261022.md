# Ω Personal Intelligence Fabric — Architecture and Delivery Contract

**Status:** DESIGN / NOT YET PRODUCTION-ENABLED  
**Created:** 2026-10-22  
**Applies to:** existing static HTML, shared browser modules, Supabase Postgres/RLS/Edge Functions, and Vercel.

## Mission

Make SYD OMEGA a user-directed personal intelligence system. Users may deliberately contribute life context, thoughts, goals, skills, knowledge, projects, preferences, and relationship context. The platform can use permitted context to answer questions, research options, create plans, coordinate approved workflows, and deliver useful reminders across existing modules.

This is a delivery contract, not evidence that the target capability is already implemented. Inspect and reuse existing features before adding parallel systems.

## Non-negotiable constraints

1. Keep the current static/Supabase/Vercel architecture. No framework rewrite or speculative microservice fleet.
2. Deployment and authentication/security blockers remain OPEN. Do not bypass, suppress, or relabel them as resolved.
3. Users decide whether to provide data, enable AI use, connect a source, share information, or authorize an external action.
4. Private thoughts, health-related information, family/friend details, precise location, identity documents, credentials, and financial records are sensitive by default. Uploading data or approving an account is not consent for every purpose.
5. No covert collection, background scraping of contacts, silent relationship profiling, or automatic disclosure of one person's information to another.
6. Generated inferences, horoscope/lore, simulations, and model guesses are not verified facts.
7. Client-side state never authorizes access, awards, payments, identity, or consequential state. Supabase RLS and server-side checks remain the enforcement boundary.
8. Reuse canonical auth, domain, page, event, notification, knowledge, storage, and AI authorities. No competing auth service, duplicate memory store, or second navigation registry.
9. Model providers must sit behind one policy-aware router. Provider availability, model identity, retention, data region, cost, and failure state must be explicit. Sensitive context cannot be sent until policy and consent allow it.
10. Financial, legal, identity, publication, messaging, and irreversible actions require a preview and explicit confirmation. No autonomous trading, medical diagnosis, legal representation, or unapproved communication.

## Target architecture

### 1. User Context Vault

A user-controlled workspace for structured facts and user-authored notes. Each item carries:
- owner user ID, stable item ID, type/category, title and content/reference;
- origin: user-entered, user-uploaded, connected source, AI-inferred, or system event;
- sensitivity: ordinary, personal, sensitive, or highly sensitive;
- lifecycle status: active, archived, deletion pending, or deleted;
- timestamps, optional expiry/review date, schema version and content hash;
- explicit permitted purposes, such as assistant answers, personalization, planning, reminders, or cross-module use;
- consent/policy reference and retention rule;
- provenance, confidence and human-verification state for derived claims.

Do not store passwords, API keys, session tokens, payment-card data, or private signing keys as personal-context items. Keep identity documents and financial credentials in their existing protected systems.

### 2. Safe ingestion pipeline

Select/upload → validate → enforce size/type limits → malware/content scan → extract text/metadata → classify sensitivity → show extracted summary → user confirms purpose → store → index → record provenance.

- Treat every file and extracted text as untrusted input, including embedded prompt injection.
- Allowlist file types; enforce size and decompression limits; reject active content when unnecessary.
- Store originals in private buckets with per-object authorization; never expose permanent public URLs for private uploads.
- Separate source-document permissions from derived chunks, embeddings, summaries and graph edges. Deletion and permission revocation must cascade through derived representations.
- Preserve originals; record extraction errors rather than silently losing content.

### 3. Personal knowledge graph

Reuse the existing knowledge/evidence graph where possible. Nodes may represent user-approved facts, goals, skills, projects, documents, people/relationships, decisions and events. Edges carry provenance, visibility, purpose, confidence and validity period. Relationships involving other people are private by default and user-asserted unless the other person consents or the information is legitimately public.

The graph is a retrieval aid, not a source of truth by itself. Keep conflicts visible; ask the user to resolve important contradictions instead of silently choosing.

### 4. Context and memory policy

Before context is assembled for a model, enforce:
1. authenticated actor and approved account state;
2. resource-level authorization and owner match;
3. current purpose-specific consent;
4. sensitivity and provider policy;
5. minimum-necessary context;
6. prompt-injection and untrusted-content isolation;
7. output provenance and uncertainty labels.

Memory categories: user-approved durable preference, user-authored note, time-bounded task context, and AI-generated candidate insight. Candidate insights must not become durable facts without user review. Provide inspect, edit, correct, export and delete controls. Forgetting must cover primary data and indexed/derived copies, with a deletion receipt or clearly disclosed failure.

### 5. Cross-module orchestration

Use existing event-fabric and workflow/task authorities. Every proposed action follows a typed lifecycle:
- OBSERVE: gather permitted evidence;
- ANALYZE: produce a sourced finding and confidence;
- PROPOSE: show options, trade-offs and consequences;
- CONFIRM: obtain approval where required;
- EXECUTE: call an allowlisted server-side action;
- VERIFY: read back authoritative state;
- REPORT: show result, provenance, errors and next step.

Modules subscribe only to events they need. Use idempotency keys, bounded retries, dead-letter handling, audit records and timeouts. An event notification is not proof of success; verify authoritative state.

### 6. Trusted research and source quality

For web-backed advice, retain source URL, publisher, publication/update time, retrieval time, relevant claim, source type and confidence. Prefer primary sources, official documentation, standards bodies, peer-reviewed research and original datasets. Cross-check consequential claims. Flag stale, conflicting, sponsored, speculative or unverified information. Cite evidence near each claim and distinguish source facts from inference and recommendation.

Do not claim access to the entire web, all knowledge, future technology, or 128 simultaneous reasoning engines unless those capabilities are implemented and measured.

### 7. Model routing and continuous evolution

One provider-neutral router supports capability-based selection, evaluation, fallback, budgets, timeouts and circuit breakers. Select models by task and data policy, not brand prestige. Keep sensitive data out of provider requests unless policy and consent permit it. Log provider/model/version, policy version, tools used, source references, latency, cost estimate and outcome without raw sensitive content by default.

Benchmark new models against a versioned evaluation set for factuality, citation validity, privacy leakage, prompt-injection resistance, multilingual quality, latency and cost. A new model is not automatically better: deploy behind a feature flag, compare outcomes and retain rollback.

### 8. Notifications and proactive help

Proactive suggestions are opt-in and configurable by category, quiet hours, channel, frequency and urgency. Use explainable triggers, deduplication, rate limits and suppression after dismissal. No speculative psychological diagnosis or hidden emotional scoring. For distress-related content, respond supportively without pretending to be a clinician.

### 9. Product experience

Build a clear personal workspace with:
- capture for text, files, structured forms and optional connected sources;
- a visible inventory of what the AI knows, including source and last-updated date;
- goals and projects with plans, milestones, owners and evidence;
- conversations linked to relevant documents and tasks;
- a review queue for uncertain or inferred facts;
- notifications and an approval queue;
- privacy controls on every relevant data surface;
- readable typography, accessible controls, responsive layout, and visible loading/error/empty states.

Every page must have one primary job, one authoritative data source, a permission boundary, a failure state, an event/task contract, and an automated test.

## Phased implementation plan

### P0 — Protect and establish truth
- Keep deployment and auth-security blockers OPEN.
- Inventory existing memory, storage, knowledge graph, consent, event, AI, search and notification contracts.
- Confirm live schema, RLS policies/grants, bucket policies, provider configuration and CI status before any migration or deployment.
- Identify exposed credentials in historical documents or source control; rotate real keys and remove them from history where feasible.

### P1 — Safe personal data foundation
- Define canonical item schema and purpose-specific consent contract.
- Add migrations only after schema/migration-history parity is verified; include RLS tests for cross-user access, anonymous access, deletion and derived-data cleanup.
- Add upload scanning, private storage, content-type/size enforcement and provenance.
- Never auto-ingest private uploads into AI memory.

### P2 — Personal knowledge and context
- Reuse existing knowledge graph and memory stores; add typed provenance, expiry and review state through backward-compatible migrations.
- Add user-facing inspect/edit/delete/export and purpose controls.
- Add retrieval tests proving unauthorized context never reaches model requests.

### P3 — Coordinated assistant
- Integrate the existing copilot, concierge and event fabric through the canonical model router.
- Return cited answers, structured plans, explicit action previews and verified outcomes.
- Add model evaluation, provider fallback, cost budgets and prompt-injection tests.

### P4 — Proactive assistance and ecosystem
- Add opt-in reminders, cross-module task suggestions, notification controls and outcome feedback.
- Add connectors only when permissions, terms, retention and revocation behavior are understood.
- Add mobile/PWA improvements when they solve validated user journeys.

### P5 — Scale and continuous improvement
- Measure task success, evidence coverage, citation validity, latency, cost, deletion completion, authorization failures and user correction rate.
- Roll out by feature flag; compare against baseline; keep a rollback path.
- Review AI, retrieval, agent and security advances continuously using a reproducible evaluation harness.

## Definition of done

A capability is not implemented until:
- its data owner and canonical authority are named;
- schema and migration history are verified;
- RLS/grants and negative authorization tests pass;
- consent, purpose limitation, retention, export and deletion are tested;
- uploads are scanned and privately stored;
- model inputs are permission-filtered and provenance retained;
- cross-module actions are idempotent, confirmed when consequential and verified after execution;
- loading, empty, partial, denied, offline and error states are handled;
- automated contracts and browser acceptance tests pass;
- deployment/runtime evidence is linked to the exact commit;
- unresolved risks remain visible in the release gate.

## Initial acceptance tests

1. User A cannot read, update, delete, search or infer User B's private items, documents, embeddings, graph edges or conversation context.
2. Disabling AI personalization prevents personal context being sent to model providers while non-personal assistance remains available where possible.
3. Uploading a document does not grant permission to use it for every purpose.
4. Revoking consent blocks subsequent retrieval immediately and schedules derived copies for deletion.
5. Model-inferred claims are visibly marked and cannot silently overwrite user-confirmed facts.
6. Prompt injection in an uploaded file cannot change tool permissions or authorize an action.
7. Cross-module workflows require server-side authorization and verify completion against authoritative systems.
8. A failed provider or search source yields a clear partial/unavailable result, not fabricated citations.
9. Export/deletion covers documents, extracted text, chunks, embeddings, graph relations and memory, with backup retention disclosed.
10. No release gate can mark deployment/auth security resolved without current successful evidence.

## Current risks / open decisions

- Existing omega-memory.js uses sessionStorage fallback and writes profile-derived values to ai_memory; its fallback may report success-like behavior without durable persistence. Review callers before changing semantics.
- The repository has overlapping legacy data objects and a large migration history. Do not add a second store before inspecting live schema and migration parity.
- Auth and deployment issues are known unresolved blockers and remain release-blocking.
- Provider retention/data-processing terms, model data residency, file scanner, retention periods and notification channels need documented decisions before sensitive-data features are enabled.
- This proposal does not authorize processing special-category data, building clinical profiles, collecting third-party private data, or autonomously executing financial/legal actions.
