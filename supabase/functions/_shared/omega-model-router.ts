// SYD OMEGA 91717 — provider-neutral, policy-routed text inference.
// No browser access, tool execution, prompt persistence, or silent provider fallback.
// The current default remains Anthropic to preserve the deployed path. OpenAI Responses
// can be enabled per profile only after its server-side key and model access are configured.

export type OmegaAiProfile = "fast" | "balanced" | "reasoning";
export type OmegaAiRisk = "low" | "medium" | "high";
export type OmegaAiProvider = "anthropic" | "openai";

export interface OmegaAiUsageRecord {
  request_id: string;
  agent_id: string;
  prompt_version: string;
  task: string;
  risk: OmegaAiRisk;
  provider: string | null;
  model: string | null;
  status: "completed" | "failed" | "blocked";
  input_tokens: number | null;
  output_tokens: number | null;
  estimated_cost: null;
  latency_ms: number;
  citations: unknown[];
  evaluation: Record<string, unknown>;
  trace_id: string;
  error: string | null;
  completed_at: string;
}

export interface OmegaAiRoute {
  provider: OmegaAiProvider;
  model: string;
  apiKey: string | undefined;
  maxOutputTokens: number;
  timeoutMs: number;
  reasoningEffort: "low" | "medium" | "high";
  serviceTier?: "ultrafast";
}

export interface OmegaAiQuotaResult {
  allowed: boolean;
  reason?: string;
  retryAfterSeconds?: number;
}

export interface OmegaAiResult {
  requestId: string;
  provider: OmegaAiProvider;
  model: string;
  text: string;
  inputTokens: number | null;
  outputTokens: number | null;
  latencyMs: number;
}

export interface OmegaAiRequest {
  agentId: string;
  task: string;
  risk: OmegaAiRisk;
  promptVersion: string;
  profile: OmegaAiProfile;
  system: string;
  input: string;
  requestId?: string;
  consumeQuota: () => Promise<OmegaAiQuotaResult>;
  recordUsage?: (record: OmegaAiUsageRecord) => Promise<void>;
}

const PROFILE_RISK_ALLOWLIST: Record<OmegaAiProfile, OmegaAiRisk[]> = {
  fast: ["low", "medium"],
  balanced: ["low", "medium"],
  reasoning: ["low", "medium", "high"],
};

const PROFILE_INPUT_CHAR_LIMITS: Record<OmegaAiProfile, number> = {
  fast: 16000,
  balanced: 24000,
  reasoning: 30000,
};
const MAX_SYSTEM_CHARS = 12000;

const PROFILE_DEFAULTS: Record<OmegaAiProfile, {
  provider: OmegaAiProvider;
  anthropicModel: string;
  openaiModel: string;
  maxOutputTokens: number;
  timeoutMs: number;
  reasoningEffort: "low" | "medium" | "high";
}> = {
  fast: {
    provider: "anthropic",
    anthropicModel: "claude-haiku-4-5-20251001",
    openaiModel: "gpt-6-luna",
    maxOutputTokens: 512,
    timeoutMs: 20000,
    reasoningEffort: "low",
  },
  balanced: {
    provider: "anthropic",
    anthropicModel: "claude-haiku-4-5-20251001",
    openaiModel: "gpt-6.1-sol",
    maxOutputTokens: 2048,
    timeoutMs: 30000,
    reasoningEffort: "medium",
  },
  reasoning: {
    provider: "anthropic",
    anthropicModel: "claude-opus-5",
    openaiModel: "gpt-6-astra",
    maxOutputTokens: 4096,
    timeoutMs: 60000,
    reasoningEffort: "high",
  },
};

type EnvReader = (name: string) => string | undefined;

export function resolveOmegaModelRoute(
  profile: OmegaAiProfile,
  readEnv: EnvReader = (name) => Deno.env.get(name),
): OmegaAiRoute {
  const defaults = PROFILE_DEFAULTS[profile];
  const providerValue = (readEnv(`OMEGA_AI_PROVIDER_${profile.toUpperCase()}`) || defaults.provider).trim().toLowerCase();
  if (providerValue !== "anthropic" && providerValue !== "openai") {
    throw new Error("ai_provider_unsupported");
  }
  const provider = providerValue as OmegaAiProvider;
  const modelEnv = `OMEGA_AI_${provider.toUpperCase()}_MODEL_${profile.toUpperCase()}`;
  const modelDefault = provider === "anthropic" ? defaults.anthropicModel : defaults.openaiModel;
  const model = (readEnv(modelEnv) || modelDefault).trim();
  if (!model || model.length > 160) throw new Error("ai_model_configuration_invalid");
  const keyName = provider === "anthropic" ? "ANTHROPIC_API_KEY" : "OPENAI_API_KEY";
  const apiKey = readEnv(keyName)?.trim() || undefined;
  const serviceTier = provider === "openai"
    ? readEnv(`OMEGA_AI_OPENAI_SERVICE_TIER_${profile.toUpperCase()}`)
    : undefined;
  return {
    provider,
    model,
    apiKey,
    maxOutputTokens: defaults.maxOutputTokens,
    timeoutMs: defaults.timeoutMs,
    reasoningEffort: defaults.reasoningEffort,
    ...(serviceTier === "ultrafast" ? { serviceTier: "ultrafast" as const } : {}),
  };
}

function safeErrorCode(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  return /^ai_[a-z0-9_]{1,80}$/.test(message) ? message : "ai_provider_error";
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...init, signal: controller.signal });
      if ((response.status === 429 || response.status >= 500) && attempt === 0) {
        await response.body?.cancel();
        await new Promise((resolve) => setTimeout(resolve, 250));
        continue;
      }
      return response;
    } catch (error) {
      if (attempt === 0) {
        await new Promise((resolve) => setTimeout(resolve, 250));
        continue;
      }
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("ai_request_timeout");
      }
      throw new Error("ai_network_error");
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error("ai_retry_exhausted");
}

async function invokeAnthropic(route: OmegaAiRoute, system: string, input: string) {
  const response = await fetchWithRetry("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": route.apiKey!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: route.model,
      max_tokens: route.maxOutputTokens,
      system,
      messages: [{ role: "user", content: input }],
    }),
  }, route.timeoutMs);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`ai_upstream_http_${response.status}`);
  if (data?.stop_reason === "refusal") throw new Error("ai_provider_refusal");
  const block = (data?.content ?? []).find((item: { type?: string }) => item?.type === "text");
  if (typeof block?.text !== "string" || !block.text.trim()) {
    throw new Error("ai_provider_no_text");
  }
  return {
    text: block.text.trim(),
    inputTokens: Number.isFinite(data?.usage?.input_tokens) ? data.usage.input_tokens : null,
    outputTokens: Number.isFinite(data?.usage?.output_tokens) ? data.usage.output_tokens : null,
  };
}

async function invokeOpenAi(route: OmegaAiRoute, system: string, input: string) {
  const body: Record<string, unknown> = {
    model: route.model,
    instructions: system,
    input,
    max_output_tokens: route.maxOutputTokens,
    reasoning: { effort: route.reasoningEffort },
  };
  if (route.serviceTier) body.service_tier = route.serviceTier;
  const response = await fetchWithRetry("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${route.apiKey!}`,
    },
    body: JSON.stringify(body),
  }, route.timeoutMs);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`ai_upstream_http_${response.status}`);
  if (data?.status === "incomplete") throw new Error("ai_response_incomplete");
  const text = typeof data?.output_text === "string"
    ? data.output_text
    : (data?.output ?? []).flatMap((item: { content?: unknown[] }) => item?.content ?? [])
      .find((item: { type?: string }) => item?.type === "output_text")?.text;
  if (typeof text !== "string" || !text.trim()) throw new Error("ai_provider_no_text");
  return {
    text: text.trim(),
    inputTokens: Number.isFinite(data?.usage?.input_tokens) ? data.usage.input_tokens : null,
    outputTokens: Number.isFinite(data?.usage?.output_tokens) ? data.usage.output_tokens : null,
  };
}

export async function runOmegaModel(request: OmegaAiRequest): Promise<OmegaAiResult> {
  const route = resolveOmegaModelRoute(request.profile);
  const requestId = request.requestId || crypto.randomUUID();
  const startedAt = Date.now();
  let inputTokens: number | null = null;
  let outputTokens: number | null = null;

  const record = async (
    status: OmegaAiUsageRecord["status"],
    error: string | null,
  ) => {
    if (!request.recordUsage) return;
    const usage: OmegaAiUsageRecord = {
      request_id: requestId,
      agent_id: request.agentId.slice(0, 80),
      prompt_version: request.promptVersion.slice(0, 80),
      task: request.task.slice(0, 120),
      risk: request.risk,
      provider: route.provider,
      model: route.model,
      status,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      estimated_cost: null,
      latency_ms: Math.max(0, Date.now() - startedAt),
      citations: [],
      evaluation: { status: "NOT_RUN", policy_version: "omega-ai-routing-v1", profile: request.profile },
      trace_id: requestId,
      error,
      completed_at: new Date().toISOString(),
    };
    try {
      await request.recordUsage(usage);
    } catch (writeError) {
      console.warn(JSON.stringify({
        event: "OMEGA_AI_USAGE_WRITE_FAILED",
        request_id: requestId,
        error_code: safeErrorCode(writeError),
      }));
    }
  };

  if (!PROFILE_RISK_ALLOWLIST[request.profile].includes(request.risk)) {
    await record("blocked", "ai_profile_risk_not_allowed");
    throw new Error("ai_profile_risk_not_allowed");
  }
  if (request.system.length > MAX_SYSTEM_CHARS || request.input.length > PROFILE_INPUT_CHAR_LIMITS[request.profile]) {
    await record("blocked", "ai_request_too_large");
    throw new Error("ai_request_too_large");
  }
  if (!route.apiKey) {
    await record("blocked", "ai_provider_not_configured");
    throw new Error("ai_provider_not_configured");
  }

  let quota: OmegaAiQuotaResult;
  try {
    quota = await request.consumeQuota();
  } catch {
    await record("blocked", "ai_quota_unavailable");
    throw new Error("ai_quota_unavailable");
  }
  if (!quota.allowed) {
    const reason = quota.reason && /^ai_[a-z0-9_]{1,80}$/.test(quota.reason)
      ? quota.reason
      : "ai_rate_limit_exceeded";
    await record("blocked", reason);
    throw new Error(reason);
  }

  try {
    const result = route.provider === "anthropic"
      ? await invokeAnthropic(route, request.system, request.input)
      : await invokeOpenAi(route, request.system, request.input);
    inputTokens = result.inputTokens;
    outputTokens = result.outputTokens;
    await record("completed", null);
    return {
      requestId,
      provider: route.provider,
      model: route.model,
      text: result.text,
      inputTokens,
      outputTokens,
      latencyMs: Math.max(0, Date.now() - startedAt),
    };
  } catch (error) {
    const code = safeErrorCode(error);
    await record("failed", code);
    throw new Error(code);
  }
}
