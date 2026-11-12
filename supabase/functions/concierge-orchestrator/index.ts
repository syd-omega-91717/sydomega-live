import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { publishableKey, secretKey } from "../_shared/keys.ts";
import { runOmegaModel, type OmegaAiUsageRecord } from "../_shared/omega-model-router.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = secretKey()!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function requireCaller(req: Request): Promise<{ userId: string } | Response> {
  const authorization = req.headers.get("Authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim();
  const anonKey = publishableKey();
  if (!token || !anonKey) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await callerClient.auth.getUser();
  if (error || !data.user) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return { userId: data.user.id };
}

interface ConciergeRequest {
  member_id: string;
  issue_type: "support_query" | "onboarding" | "escalation_review";
  context: {
    current_lifecycle_stage: string;
    propensity_scores: Record<string, number>;
    recent_interactions: Array<{
      type: string;
      timestamp: string;
      content: string;
    }>;
    member_profile: Record<string, unknown>;
  };
  input: string;
}

interface ConciergeResponse {
  decision_id: string;
  response: string;
  action: string;
  escalate: boolean;
  escalation_reason?: string;
  confidence: number;
}

async function callOmegaConciergeModel(
  prompt: string,
  context: string,
  profile: "fast" | "balanced" | "reasoning",
  risk: "low" | "medium" | "high",
) {
  return runOmegaModel({
    agentId: "concierge",
    task: "support_escalation_decision",
    risk,
    promptVersion: "concierge-orchestrator-v2",
    profile,
    system: `You are the Ω Concierge Agent, an empathetic member success specialist. You provide support, guidance, and escalation decisions.

Guidelines:
- Be concise and helpful
- Escalate for billing, account security, or high churn risk
- Provide actionable guidance
- Consider member lifecycle stage in your response
- Return JSON with: action, escalate, confidence (0-1)`,
    input: `Context:\n${context}\n\nMember Query:\n${prompt}`,
    recordUsage: async (record: OmegaAiUsageRecord) => {
      const { error } = await supabase.from("omega_ai_requests").insert(record);
      if (error) throw new Error("ai_telemetry_write_failed");
    },
  });
}

async function saveConciergeDecision(
  memberId: string,
  decision: Record<string, unknown>,
  reasoning: string,
  modelUsed: string,
): Promise<string> {
  const { data, error } = await supabase
    .from("autonomous_decisions")
    .insert({
      agent_id: "concierge",
      member_id: memberId,
      decision_type: "support_response",
      context_snapshot: decision,
      reasoning: reasoning,
      decision_payload: decision,
      confidence_score: decision.confidence || 0.85,
      model_used: modelUsed,
      temperature: null,
      outcome_recorded: false,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error saving decision:", error);
    throw error;
  }

  return data.id;
}

async function processConciergeRequest(
  req: ConciergeRequest
): Promise<ConciergeResponse> {
  // Build context prompt
  const contextString = `
Member Lifecycle Stage: ${req.context.current_lifecycle_stage}
Churn Risk Score: ${req.context.propensity_scores.churn_risk || 0}
Upgrade Propensity: ${req.context.propensity_scores.upgrade_propensity || 0}

Recent Interactions:
${req.context.recent_interactions.map((i) => `- ${i.type} (${i.timestamp}): ${i.content}`).join("\n")}

Member Profile:
${JSON.stringify(req.context.member_profile, null, 2)}
  `.trim();

  // Call Claude API
  let claudeResponse: string;
  let modelResult: Awaited<ReturnType<typeof callOmegaConciergeModel>>;
  try {
    const churnRisk = Number(req.context?.propensity_scores?.churn_risk ?? 0);
  const profile = req.issue_type === "escalation_review" || churnRisk > 0.85 ? "reasoning" : "balanced";
  const risk = profile === "reasoning" ? "high" : "medium";
    modelResult = await callOmegaConciergeModel(req.input, contextString, profile, risk);
    claudeResponse = modelResult.text;
  } catch (error) {
    console.error("Claude API error:", error);
    throw error;
  }

  // Parse response
  let decision = {
    action: "provide_guidance",
    escalate: false,
    confidence: 0.85,
    response: claudeResponse,
  };

  try {
    const jsonMatch = claudeResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      decision = JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error("Failed to parse response:", e);
  }

  // Check escalation criteria
  const shouldEscalate =
    req.context.propensity_scores.churn_risk > 0.85 ||
    decision.escalate ||
    req.issue_type === "escalation_review";

  // Save decision
const decisionId = await saveConciergeDecision(
    req.member_id,
    decision,
    modelResult.text,
    `${modelResult.provider}:${modelResult.model}`
  );

  return {
    decision_id: decisionId,
    response: decision.response || "I'm here to help. Please let me know more.",
    action: decision.action || "provide_guidance",
    escalate: shouldEscalate,
    escalation_reason: shouldEscalate
      ? decision.escalation_reason || "High churn risk detected"
      : undefined,
    confidence: decision.confidence || 0.85,
  };
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    /* Dormant until the owner turns platform_settings.autonomous_agents_enabled
       on (CLAUDE.md section 9). Fails closed: an unreadable flag is off. */
    const { data: flag, error: flagError } = await supabase
      .from("platform_settings")
      .select("bool_value")
      .eq("key", "autonomous_agents_enabled")
      .maybeSingle();
    if (flagError || flag?.bool_value !== true) {
      return new Response(JSON.stringify({ error: "disabled" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }

    const caller = await requireCaller(req);
    if (caller instanceof Response) return caller;

    const conciergeRequest: ConciergeRequest = await req.json();


    // Validate input
    if (!conciergeRequest.member_id || !conciergeRequest.input) {
      return new Response("Missing required fields", { status: 400 });
    }

    if (conciergeRequest.member_id !== caller.userId) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const response = await processConciergeRequest(conciergeRequest);

    return new Response(JSON.stringify(response), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in concierge orchestrator:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
