# Ω Personal Context Graph

## Purpose

Give each authenticated member a private, editable and exportable context space for self-authored reflections, self-described personality, values, goals, skills, knowledge, relationships, family/friend context, work, learning, preferences, ideas and environment. This is an additive domain that complements rather than replaces ai_memory, life_entries and the existing Knowledge Loom.

## Data contract

- omega_personal_context_items stores one member-owned context record per row.
- omega_personal_context_links stores explicit, member-authored relationships between records. Composite foreign keys prevent linking another member's records.
- omega_personal_context_preferences stores independent purpose switches for AI personalization, web research, proactive alerts and highly sensitive processing.
- omega_personal_context_consent_events records preference grants/revocations with policy version and timestamp. It is a user-scoped history, not a tamper-proof legal audit log.

## Privacy and security invariants

1. RLS is enabled on every table and each row is scoped to auth.uid().
2. Anonymous/public access is revoked. Only the authenticated role receives the necessary table grants.
3. Context is private by default. This feature does not create public profiles, friend/family sharing or contact discovery.
4. Account-level AI consent and per-record AI consent are both required. Highly sensitive records additionally require the dedicated sensitive-data preference.
5. Disabling account-level AI personalization clears every record's item-level AI consent. Revoking highly sensitive processing clears item-level AI consent for highly sensitive records. Re-enabling either switch does not silently reactivate earlier item consent.
6. No AI provider is called by the initial UI. Consent records permission for a future governed workflow; it does not itself trigger processing.
7. The client imports only TXT, Markdown, CSV and JSON, with a 1 MB file limit and 200,000-character record limit. Text is read locally for review and saved only after the member submits the form. This first release does not parse PDF or binary formats.
8. UI rendering uses DOM text nodes, not innerHTML; imported text is treated as untrusted content.
9. Member-authored statements remain user-authored. AI-generated relationship or personality claims must not be represented as facts without explicit member confirmation.
10. The UI supports export and permanent deletion. Context content is not copied into platform event metadata or analytics.

## Cross-surface behavior

- Ω LIFE is the canonical editor, import, consent, relationship graph, search, edit/delete and export surface.
- INTELLIGENCE links to the same context workspace and shows a member-scoped context summary. The client exposes window.OmegaPersonalContext for same-origin consumers and emits omega:personal-context:changed with counts only, never content.
- Privacy Centre remains the destination for broader data export/privacy workflows.
- Knowledge Loom remains the governed, provenance-bearing platform knowledge corpus. Private member context is not automatically ingested into the shared corpus.
- Future AI advice must require server-side authorization, explicit consent filtering, source/provenance labels, provider/model disclosure, bounded context, deletion propagation, prompt-injection resistance, and a clear human approval boundary before any external side effect.

## Truth states

- LIVE: the authenticated query returned persisted member records.
- EMPTY: the source is reachable and the member has no saved records.
- UNAVAILABLE: authentication, schema or source access is unavailable.
- CONSENTED: account and item permissions allow a future governed workflow to consider a record. It does not mean an AI model has processed it.
- AI ANALYSIS NOT CONNECTED: the UI intentionally does not fabricate analysis or claim a model/provider is active.

## Deployment gate

Migration 20261022120000_omega_personal_context_graph_20261022.sql is additive and must remain explicitly pending until fresh replay, RLS/cross-member isolation probes, consent-revocation probes, upload/input-safety tests, static contracts and provider rollout checks pass. Do not apply it to production as part of a code-only merge.

## Deferred capabilities

- Governed model/provider routing and user-facing advice with citations.
- Web retrieval with source trust scoring, dates, licensing, user consent and prompt-injection isolation.
- Alert scheduler with quiet hours, rate limits, explainable triggers and opt-out.
- OCR/PDF/media import with malware scanning, size limits, parser sandboxing and provenance.
- Cross-domain recommendations and relationship visualizations after consent and evidence boundaries are verified.
- Provider-independent evaluation, quality/cost/latency telemetry and fallback policy.

## External engineering basis (reviewed 2026-10-22)

- OWASP GenAI LLM Top 10 (2026): https://genai.owasp.org/llm-top-10/ — treat prompt injection, sensitive information disclosure, excessive agency, supply-chain risk, unbounded consumption, misinformation, hidden context exposure, vector/embedding weaknesses and improper output handling as explicit design/test categories.
- NIST AI Risk Management Framework and Generative AI Profile: https://www.nist.gov/itl/ai-risk-management-framework — use lifecycle risk management, documented controls, evaluation and human oversight rather than treating model output as inherently reliable.

These references inform the design; they do not certify this implementation or substitute for privacy/legal review.
