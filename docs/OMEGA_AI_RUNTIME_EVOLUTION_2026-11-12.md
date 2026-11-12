# SYD OMEGA — AI runtime evolution and technology radar

**State:** source integrated in this branch; production Edge Function deployment and first live usage records are still pending.

## 1. Live baseline observed on 2026-11-12

- The production Supabase project has Edge Functions for `concierge`, `concierge-orchestrator`, `growth-orchestrator`, `product-orchestrator`, `agent-execute`, `omega-runtime-gateway`, provider workers and knowledge-embedding workers. Graphify query/ingest functions exist but are deliberately held back and are not registered in `supabase/config.toml`.
- `platform_settings.autonomous_agents_enabled` is currently `false`. The three decision orchestrators remain dormant behind this owner-controlled switch.
- The 12 records in `omega_agents` are `DESIGNED`; the agent registry defaults to disabled, tool access `DENY`, no external side effects and human approval for financial actions.
- `omega_ai_requests` exists with request IDs, provider/model, risk, token counts, latency, trace ID, citations and evaluation metadata, but had **zero rows** at the time of inspection.
- The `ai_providers` metadata table lists providers as enabled, but the inspected records have no endpoint values. That table is not proof that provider credentials or integrations are configured.
- Three orchestrators directly called Anthropic Opus with a 16,000-token output ceiling. The active `concierge` used a separate direct Anthropic call. There was no shared provider routing path or recorded AI usage evidence.

## 2. Implemented source changes in this branch

### Shared model router

`supabase/functions/_shared/omega-model-router.ts` provides a server-side, text-only adapter for Anthropic Messages and OpenAI Responses. It is deliberately provider-neutral and does not grant tools or execution authority.

| Profile | Default Anthropic | Optional OpenAI | Output ceiling | Intended work |
|---|---|---|---:|---|
| fast | Claude Haiku 4.5 | GPT-6 Luna | 512 | Short member responses, classification |
| balanced | Claude Haiku 4.5 | GPT-6.1 Sol | 2,048 | Support decisions, campaign drafts, product recommendations |
| reasoning | Claude Opus 5 | GPT-6 Astra | 4,096 | Escalation review and complex analysis |

Anthropic remains the default to preserve the existing production integration. OpenAI routing is **opt-in per profile** and requires a separately configured `OPENAI_API_KEY`. The router never silently falls back to another provider.

The router adds:
- profile-specific timeouts and bounded retry for transient network/429/5xx failures;
- explicit refusal, incomplete-response, timeout and provider-configuration error codes;
- provider/model selection recorded with each request;
- metadata-only writes to `omega_ai_requests`: request ID, agent/task/risk, provider/model, input/output token counts, latency, trace ID and status;
- no prompt, user message, retrieved content, memory, credentials or personal identifiers in telemetry;
- `evaluation.status = NOT_RUN` until a real evaluator has run;
- no cost estimate until a verified provider pricing catalog and billing reconciliation are available.

The active `concierge` path and the three owner-gated orchestrators now use the shared router. The three dormant orchestrators use the balanced profile by default; the concierge escalation-review path selects reasoning. Their `model_used` field now records the actual provider and model.

### Safety corrections

- Product adaptation now produces proposed feature flags only. It does not write to `member_feature_flags`; the response explicitly reports `applied=false` and `approval_required=true`.
- Graphify query/ingestion now has a server-side default-off gate plus mandatory account-level AI personalization and sensitive-data consent. Its functions remain held and are not registered for routine deployment; a pending migration creates `graphify_ai_enabled=false`. The code is not considered live until the held functions are updated in production.
- Growth orchestration no longer invents a 15% revenue uplift or writes a model estimate to `revenue_impact_usd`. Estimated impact remains `null` with status `NOT_CALIBRATED`; an unvalidated model estimate, if returned, is retained only as clearly labelled proposal metadata.
- Existing member binding, the owner-controlled autonomous-agent switch, and tool-deny defaults remain in place.

## 3. Current model and API technology choices

### OpenAI

The current OpenAI API documentation recommends the Responses API for new integrations. It separates system guidance into top-level `instructions`, accepts `input`, and returns text through `output_text`. The router uses that contract; it does not introduce a second conversation store.

The current model catalog distinguishes:
- **GPT-6 Luna** for focused, high-volume and cost-sensitive workloads;
- **GPT-6.1 Sol** for a balance of intelligence and cost;
- **GPT-6 Astra** for demanding reasoning and coding.

GPT-6.1 Terra is a candidate for future image/computer-use work, but the present router is text-only. OpenAI Ultrafast processing is optional and remains disabled by default; enable it only after latency, spend, rate-limit and regional-processing review.

### Agent orchestration

The OpenAI Agents API and Agents SDK now expose managed sessions, tools, multi-agent workflows, sandboxes, tracing, recovery and evaluation capabilities. These are technology options, not an automatic reason to replace SYD OMEGA's existing Supabase event/task fabric. Any adoption must first demonstrate parity for:
1. member identity and authorization;
2. owner-scoped idempotency;
3. approvals and irreversible-action boundaries;
4. audit/evidence persistence;
5. failure recovery and replay;
6. data residency, retention and cost controls.

### MCP and external tools

MCP is a candidate integration boundary, not a permission shortcut. Before enabling an MCP server, require audience-bound authentication, short-lived scoped credentials, server identity validation, tool allowlists, per-call authorization, output validation, timeout/rate/cost limits and auditable approvals. Never forward a user's token to an unrelated downstream service. The current router has no tool calling.

### Observability and evaluation

The existing `omega_ai_requests` table is the first telemetry sink. It intentionally records metadata only. OpenTelemetry GenAI agent-span conventions are still marked Development in the upstream specification; retain the stable local `request_id`/`trace_id` contract until a reviewed instrumentation mapping is ready.

The evaluation cases in `config/omega-ai-evaluation-cases.json` are policy test cases, **not model benchmark results**. They cover prompt injection, member isolation, unconfigured providers, telemetry privacy, uncalibrated financial estimates, feature-flag mutation, tool execution, fabricated citations and evaluation truthfulness.

## 4. Roadmap and priorities

### P0 — finish this release wave
1. Pass clean migration replay and the runtime adapter SQL probe.
2. Pass the AI routing, Edge Function, secret, CodeQL and release contracts.
3. Deploy the shared router and four dependent Edge Functions through the controlled production deployment path.
4. Verify function versions and source hashes against the repository.
5. Confirm one real, non-sensitive `omega_ai_requests` record is written; do not create synthetic production usage.

### P1 — prove quality before model promotion
1. Upgrade the current field allowlists and bounds to a versioned JSON Schema validator for every orchestrator response.
2. Run the policy cases against mocked provider responses and adversarial inputs.
3. Establish a reviewed golden set for concierge, growth and product tasks.
4. Compare providers on task success, refusal correctness, latency, token usage, cost and human override rate.
5. Promote models only when quality gates pass; maintain a rollback route.

### P2 — add capabilities safely
1. Add retrieval with source provenance, freshness and user-scope filters.
2. Add structured tool calling only through server-side allowlisted adapters.
3. Add MCP only for explicitly approved integrations and scoped credentials.
4. Add image/audio input profiles only after consent, retention, malware scanning and privacy controls are verified.
5. Add OpenTelemetry tracing when the selected semantic conventions and privacy mapping are stable.

### P3 — continuous technology evolution
- Review model catalogs, provider pricing, API deprecations, MCP security, agent runtimes and evaluation standards monthly.
- Keep model IDs in server-side environment configuration, not client bundles.
- Use canary traffic and measured rollback thresholds for provider/model changes.
- Keep AI agents non-authoritative for identity, money, legal status, KYC/AML, custody and entitlement grants.

## 5. Acceptance criteria

This AI layer is not declared production-ready until:
- provider keys are confirmed present without exposing their values;
- the deployed Edge Function versions match this source;
- at least one real request is recorded with token/latency metadata and no prompt content;
- the evaluation suite has actual results, not `NOT_RUN`;
- product feature mutations remain approval-gated;
- no uncalibrated revenue or investment outcome is represented as a real KPI;
- fallback and rollback are tested under provider outage and rate limiting.

## References

- [OpenAI Responses API migration guide](https://developers.openai.com/api/docs/guides/migrate-to-responses)
- [OpenAI model catalog](https://developers.openai.com/api/docs/models)
- [OpenAI API changelog](https://developers.openai.com/api/docs/changelog)
- [OpenAI Agents API](https://developers.openai.com/api/docs/guides/agents-api/overview)
- [OWASP Top 10 for Agentic Applications 2026](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/)
- [OWASP AI Agent Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html)
- [MCP 2026-07-28 authorization security considerations](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/security-considerations)
- [OpenTelemetry GenAI agent span conventions](https://github.com/open-telemetry/semantic-conventions-genai/blob/main/docs/gen-ai/gen-ai-agent-spans.md)
