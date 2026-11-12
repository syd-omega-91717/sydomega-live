#!/usr/bin/env python3
"""Static governance contract for the SYD OMEGA provider-routed AI runtime."""

from __future__ import annotations

import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def load(path: str):
    return json.loads(read(path))


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def main() -> int:
    try:
        policy = load("config/omega-ai-routing-policy.json")
        eval_cases = load("config/omega-ai-evaluation-cases.json")
        agent_policy = load("config/omega-agent-execution-policy.json")
        agent_registry = load("config/omega-agent-registry.json")
        router = read("supabase/functions/_shared/omega-model-router.ts")
        env_example = read("supabase/functions/.env.example")

        profiles = policy["profiles"]
        require(set(profiles) == {"fast", "balanced", "reasoning"}, "AI profiles must be fast, balanced and reasoning")
        require(policy["providers"]["anthropic"]["defaultForProfiles"] is True, "Anthropic must remain the compatibility default")
        require(policy["providers"]["openai"]["defaultForProfiles"] is False, "OpenAI must remain explicit opt-in until credentials are verified")
        require(policy["governance"]["toolAccess"] == "DENY", "AI model output must not receive tool authority")
        require(policy["governance"]["autonomousExternalSideEffects"] is False, "model output must not trigger external side effects")
        require(policy["governance"]["silentProviderFallback"] is False, "provider fallback must never be silent")
        require(policy["governance"]["storePrompts"] is False and policy["governance"]["storeMemberContent"] is False, "prompt and member content persistence must remain disabled")
        require(policy["governance"]["evaluationDefault"] == "NOT_RUN", "evaluation must not be claimed without execution")

        expected_models = {
            "fast": ("claude-haiku-4-5-20251001", "gpt-6-luna", 512),
            "balanced": ("claude-haiku-4-5-20251001", "gpt-6.1-sol", 2048),
            "reasoning": ("claude-opus-5", "gpt-6-astra", 4096),
        }
        for name, (anthropic, openai, budget) in expected_models.items():
            profile = profiles[name]
            require(profile["anthropicModel"] == anthropic, f"{name} Anthropic model drift")
            require(profile["openaiModel"] == openai, f"{name} OpenAI model drift")
            require(profile["maxOutputTokens"] == budget, f"{name} output budget drift")
            require(profile["maxOutputTokens"] <= 4096, f"{name} output budget exceeds hard cap")
            require(profile["defaultProvider"] == "anthropic", f"{name} default provider must preserve current integration")
            require(profile["allowedRisk"] == (["low", "medium", "high"] if name == "reasoning" else ["low", "medium"]), f"{name} risk allowlist drift")
            require(anthropic in router and openai in router, f"{name} model missing from router implementation")

        require("https://api.anthropic.com/v1/messages" in router, "Anthropic adapter missing")
        require("https://api.openai.com/v1/responses" in router, "OpenAI Responses adapter missing")
        require("OMEGA_AI_PROVIDER_" in router, "per-profile provider routing missing")
        require("PROFILE_RISK_ALLOWLIST" in router and "ai_profile_risk_not_allowed" in router, "risk-to-profile enforcement missing")
        require("PROFILE_INPUT_CHAR_LIMITS" in router and "MAX_SYSTEM_CHARS" in router and "ai_request_too_large" in router, "profile-specific input size limits missing")
        require("ai_provider_not_configured" in router and "ai_profile_risk_not_allowed" in router and 'record("blocked"' in router, "provider and risk-profile violations must fail closed")
        require("estimated_cost: null" in router, "unknown model cost must not be reported as zero")
        require("input_tokens: inputTokens" in router and "output_tokens: outputTokens" in router, "token usage telemetry missing")
        require("latency_ms:" in router and "trace_id: requestId" in router, "latency/trace telemetry missing")
        require('evaluation: { status: "NOT_RUN"' in router, "unexecuted evaluation must be explicitly labelled")
        require("citations: []" in router, "router must not fabricate citations")
        usage_block = router.split("const usage: OmegaAiUsageRecord", 1)[1].split("try {", 1)[0]
        require("request.system" not in usage_block and "request.input" not in usage_block, "prompt/member content must not enter AI usage telemetry")

        require(agent_policy["defaults"]["tool_access"] == "deny", "agent tool access must default deny")
        require(agent_policy["defaults"]["autonomous_spend"] is False, "autonomous spend must remain disabled")
        require(agent_policy["defaults"]["approval_required"] is True, "agent actions must require approval")
        require(agent_registry["defaultPolicy"]["enabled"] is False, "agent registry must remain disabled by default")
        require(agent_registry["defaultPolicy"]["toolAccess"] == "DENY", "agent registry tool access must deny by default")
        require(agent_registry["defaultPolicy"]["externalSideEffects"] is False, "agent registry side effects must remain disabled")
        require(len(agent_registry["agents"]) == 12, "12-agent registry coverage changed")
        require(all(agent["status"] == "DESIGNED" and not agent["allowedTools"] for agent in agent_registry["agents"]), "designed agents must not be represented as active tool users")

        consumers = {
            "concierge": "supabase/functions/concierge/index.ts",
            "concierge-orchestrator": "supabase/functions/concierge-orchestrator/index.ts",
            "growth-orchestrator": "supabase/functions/growth-orchestrator/index.ts",
            "product-orchestrator": "supabase/functions/product-orchestrator/index.ts",
        }
        for name, path in consumers.items():
            source = read(path)
            require("omega-model-router.ts" in source and "runOmegaModel(" in source, f"{name} is not routed through the shared model router")
            require("omega_ai_requests" in source and "recordUsage:" in source, f"{name} is missing AI usage telemetry")
            require("api.anthropic.com" not in source and "ANTHROPIC_API_KEY" not in source, f"{name} still contains a direct provider call or key read")

        concierge = read(consumers["concierge"])
        require("supabase.auth.getUser" in concierge and "ai_personalization_enabled" in concierge, "concierge auth/consent gate missing")
        require("model_profile: modelProfile" in concierge and 'decision.risk === "HIGH" ? "reasoning" : "fast"' in concierge, "concierge must route high-risk requests to reasoning")

        for name in ("concierge-orchestrator", "growth-orchestrator", "product-orchestrator"):
            source = read(consumers[name])
            require("autonomous_agents_enabled" in source, f"{name} owner-controlled dormant gate missing")
            require("member_id !== caller.userId" in source, f"{name} member binding missing")
            require("[UNTRUSTED MEMBER CONTEXT" in source, f"{name} must structurally label member context as untrusted")

        graphify_query = read("supabase/functions/graphify-ai-query/index.ts")
        graphify_ingest = read("supabase/functions/graphify-ai-ingest/index.ts")
        graphify_helper = read("supabase/functions/_shared/graphify-consent.ts")
        for name, source in (("graphify-query", graphify_query), ("graphify-ingest", graphify_ingest)):
            require("runOmegaModel(" in source and "omega_ai_requests" in source, f"{name} must use governed AI routing and metadata telemetry")
            require("checkGraphifyAiConsent" in source, f"{name} server-side consent gate missing")
            require("api.anthropic.com" not in source and "@anthropic-ai/sdk" not in source, f"{name} retains a direct provider SDK")
        require("graphify_ai_enabled" in graphify_helper and "ai_personalization_enabled" in graphify_helper and "sensitive_data_processing_enabled" in graphify_helper, "Graphify gate must require global enablement and both explicit consents")
        supabase_config = read("supabase/config.toml")
        require("[functions.graphify-ai-query]" not in supabase_config and "[functions.graphify-ai-ingest]" not in supabase_config, "Graphify must remain held outside routine function registration")
        graphify_migration = read("supabase/migrations/20261112110000_omega_graphify_ai_safety_gate.sql")
        require("'graphify_ai_enabled'" in graphify_migration and "false" in graphify_migration, "Graphify default-off migration missing")
        require(policy["heldFeatures"]["graphify"]["status"] == "HELD", "Graphify release state must remain held")
        legacy_prototype = read("platform.jsx")
        require("api.anthropic.com" not in legacy_prototype and 'functions.invoke("concierge"' in legacy_prototype, "legacy prototype must use authenticated server-side AI, never a direct provider call")
        secrets_health = read("supabase/functions/secrets-health/index.ts")
        require("api.anthropic.com/v1/models?limit=1" in secrets_health and "const PROBES:" in secrets_health, "the only direct provider exception must remain a fixed read-only health probe")
        require("api.anthropic.com/v1/messages" not in secrets_health and "messages.create" not in secrets_health and "body.message" not in secrets_health, "provider health probe must not process member prompts")
        legacy_sql = read("supabase/index.sql")
        require(legacy_sql.startswith("-- LEGACY REFERENCE ONLY"), "legacy provider sketch must be clearly marked non-deployable")

        product = read(consumers["product-orchestrator"])
        require("proposed_feature_flags" in product and "applied: false" in product and "approval_required: true" in product, "product adaptation must remain proposal-only")
        require('confidence_status: "MODEL_REPORTED_NOT_CALIBRATED"' in product, "product confidence must be labelled uncalibrated")
        require("pendingFeatures.includes(feature)" in product, "product proposals must be bounded by the request feature allowlist")
        require("updateMemberFeatureFlags" not in product and '.from("member_feature_flags").upsert' not in product, "product agent must not mutate member entitlements")

        growth = read(consumers["growth-orchestrator"])
        require("revenue_impact_usd: null" in growth and "estimated_revenue_impact: null" in growth, "uncalibrated revenue must not be stored or reported as a KPI")
        require("NOT_CALIBRATED" in growth and "MODEL_REPORTED_NOT_CALIBRATED" in growth, "model estimate/confidence labels missing")
        require("* 0.15" not in growth, "uncalibrated 15% revenue heuristic remains")
        require('confidence_status: "MODEL_REPORTED_NOT_CALIBRATED"' in growth, "growth confidence must be labelled uncalibrated")
        concierge_orchestrator = read(consumers["concierge-orchestrator"])
        require("member response text is not persisted" in concierge_orchestrator, "concierge response text must not be retained in decision history")

        cases = eval_cases["cases"]
        case_ids = [case["id"] for case in cases]
        require(eval_cases["executionMode"] == "STATIC_CONTRACT_ONLY", "policy cases must not be misrepresented as executed model evaluations")
        require(len(case_ids) == len(set(case_ids)) and len(cases) >= 10, "AI adversarial policy case coverage incomplete")
        required_cases = {"untrusted-memory-injection", "financial-action-request", "cross-member-context", "provider-unconfigured", "prompt-persistence", "model-estimated-revenue", "feature-flag-mutation", "tool-execution", "fabricated-citations", "unvalidated-evaluation", "graphify-consent-gate"}
        require(required_cases.issubset(set(case_ids)), "required AI safety evaluation cases missing")

        env_keys = {line.split("=", 1)[0].strip() for line in env_example.splitlines() if line.strip() and not line.lstrip().startswith("#") and "=" in line}
        required_env = {"ANTHROPIC_API_KEY", "OPENAI_API_KEY"}
        require(required_env.issubset(env_keys), "provider secret names missing from .env.example")
        require(all(env_keys), "empty environment key found")
        print(f"OMEGA_AI_RUNTIME_CONTRACT=PASS profiles={len(profiles)} providers=2 consumers={len(consumers) + 2} policy_cases={len(cases)} telemetry=metadata_only")
        return 0
    except Exception as exc:
        print(f"OMEGA_AI_RUNTIME_CONTRACT=FAIL {exc}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
