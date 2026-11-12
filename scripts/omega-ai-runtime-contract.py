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
            require(anthropic in router and openai in router, f"{name} model missing from router implementation")

        require("https://api.anthropic.com/v1/messages" in router, "Anthropic adapter missing")
        require("https://api.openai.com/v1/responses" in router, "OpenAI Responses adapter missing")
        require("OMEGA_AI_PROVIDER_" in router, "per-profile provider routing missing")
        require("ai_provider_not_configured" in router and 'record("blocked"' in router, "unconfigured providers must fail closed")
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
        require("model_profile: "fast"" in concierge, "concierge must use the fast profile")

        for name in ("concierge-orchestrator", "growth-orchestrator", "product-orchestrator"):
            source = read(consumers[name])
            require("autonomous_agents_enabled" in source, f"{name} owner-controlled dormant gate missing")
            require("member_id !== caller.userId" in source, f"{name} member binding missing")

        product = read(consumers["product-orchestrator"])
        require("proposed_feature_flags" in product and "applied: false" in product and "approval_required: true" in product, "product adaptation must remain proposal-only")
        require("pendingFeatures.includes(feature)" in product, "product proposals must be bounded by the request feature allowlist")
        require("updateMemberFeatureFlags" not in product and '.from("member_feature_flags").upsert' not in product, "product agent must not mutate member entitlements")

        growth = read(consumers["growth-orchestrator"])
        require("revenue_impact_usd: null" in growth and "estimated_revenue_impact: null" in growth, "uncalibrated revenue must not be stored or reported as a KPI")
        require("NOT_CALIBRATED" in growth and "MODEL_REPORTED_NOT_CALIBRATED" in growth, "model estimate/confidence labels missing")
        require("* 0.15" not in growth, "uncalibrated 15% revenue heuristic remains")

        cases = eval_cases["cases"]
        case_ids = [case["id"] for case in cases]
        require(eval_cases["executionMode"] == "STATIC_CONTRACT_ONLY", "policy cases must not be misrepresented as executed model evaluations")
        require(len(case_ids) == len(set(case_ids)) and len(cases) >= 10, "AI adversarial policy case coverage incomplete")
        required_cases = {"untrusted-memory-injection", "financial-action-request", "cross-member-context", "provider-unconfigured", "prompt-persistence", "model-estimated-revenue", "feature-flag-mutation", "tool-execution", "fabricated-citations", "unvalidated-evaluation"}
        require(required_cases.issubset(set(case_ids)), "required AI safety evaluation cases missing")

        env_keys = {line.split("=", 1)[0].strip() for line in env_example.splitlines() if line.strip() and not line.lstrip().startswith("#") and "=" in line}
        required_env = {"ANTHROPIC_API_KEY", "OPENAI_API_KEY"}
        require(required_env.issubset(env_keys), "provider secret names missing from .env.example")
        require(all(env_keys), "empty environment key found")
        print(f"OMEGA_AI_RUNTIME_CONTRACT=PASS profiles={len(profiles)} providers=2 consumers={len(consumers)} policy_cases={len(cases)} telemetry=metadata_only")
        return 0
    except Exception as exc:
        print(f"OMEGA_AI_RUNTIME_CONTRACT=FAIL {exc}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
