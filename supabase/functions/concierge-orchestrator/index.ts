import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY")!;

const supabase = createClient(supabaseUrl, supabaseKey);

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

async function callClaudeAPI(prompt: string, context: string): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-opus-4-100k",
      max_tokens: 1024,
      temperature: 0.3,
      system: `You are the Ω Concierge Agent, an empathetic member success specialist. You provide support, guidance, and escalation decisions.

Guidelines:
- Be concise and helpful
- Escalate for billing, account security, or high churn risk
- Provide actionable guidance
- Consider member lifecycle stage in your response
- Return JSON with: action, escalate, confidence (0-1)`,
      messages: [
        {
          role: "user",
          content: `Context:\n${context}\n\nMember Query:\n${prompt}`,
        },
      ],
    }),
  });

  const data = await response.json();
  return data.content[0].text;
}

async function saveConciergeDecision(
  memberId: string,
  decision: Record<string, unknown>,
  reasoning: string
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
      model_used: "claude-opus-4-100k",
      temperature: 0.3,
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
  try {
    claudeResponse = await callClaudeAPI(req.input, contextString);
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
    claudeResponse
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

    const conciergeRequest: ConciergeRequest = await req.json();

    // Validate input
    if (!conciergeRequest.member_id || !conciergeRequest.input) {
      return new Response("Missing required fields", { status: 400 });
    }

    const response = await processConciergeRequest(conciergeRequest);

    return new Response(JSON.stringify(response), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in concierge orchestrator:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
