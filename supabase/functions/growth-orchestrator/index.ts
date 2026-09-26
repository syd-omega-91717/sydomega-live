import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY")!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function requireCaller(req: Request): Promise<{ userId: string } | Response> {
  const authorization = req.headers.get("Authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim();
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
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

interface GrowthRequest {
  member_id: string;
  propensity_type: "upgrade" | "adoption" | "expansion";
  context: {
    propensity_score: number;
    ltv_estimate: number;
    lifecycle_stage: string;
    persona: string;
    recent_purchases: Array<{ item: string; date: string }>;
    engagement_metrics: Record<string, number>;
  };
}

interface GrowthResponse {
  campaign_id: string;
  campaign_type: string;
  personalized_offer: string;
  channel_recommendation: string;
  send_timing: string;
  confidence: number;
  estimated_revenue_impact: number;
}

async function callClaudeForGrowth(
  prompt: string,
  context: string
): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-opus-5",
      max_tokens: 16000,
      system: `You are the Ω Growth Agent, orchestrating personalized revenue expansion campaigns.

Your role:
- Compose multi-touch campaigns personalized to member context
- Recommend timing, channels, and offers
- Maximize revenue while respecting frequency caps
- Return JSON with: campaign_type, offer, channel, timing, confidence, estimated_impact

Rules:
- Max 1 campaign per member per week
- Respect engagement patterns
- Consider lifecycle stage transitions
- Recommend email, in-app, or multi-channel`,
      messages: [
        {
          role: "user",
          content: `Context:\n${context}\n\nGrowth Opportunity:\n${prompt}`,
        },
      ],
    }),
  });

  const data = await response.json();
  /* The API answers errors as JSON with no `content`; claude-opus-5 also runs
     adaptive thinking, so the first block is a thinking block, not text. */
  if (!response.ok) {
    throw new Error(`Anthropic API ${response.status}: ${data?.error?.type ?? "error"}`);
  }
  if (data.stop_reason === "refusal") throw new Error("Anthropic API refusal");
  const text = (data.content ?? []).find((b: { type: string }) => b.type === "text");
  if (!text) throw new Error("Anthropic API returned no text block");
  return text.text;
}

async function saveGrowthDecision(
  memberId: string,
  campaign: Record<string, unknown>,
  propensityType: string
): Promise<string> {
  const { data, error } = await supabase
    .from("autonomous_decisions")
    .insert({
      agent_id: "growth",
      member_id: memberId,
      decision_type: `campaign_${propensityType}`,
      context_snapshot: campaign,
      reasoning: `Autonomous campaign composition for ${propensityType} growth`,
      decision_payload: campaign,
      confidence_score: campaign.confidence || 0.75,
      model_used: "claude-opus-5",
      temperature: null,
      outcome_recorded: false,
      revenue_impact_usd: campaign.estimated_impact || 0,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error saving growth decision:", error);
    throw error;
  }

  return data.id;
}

async function processGrowthRequest(req: GrowthRequest): Promise<GrowthResponse> {
  // Skip if propensity too low
  if (req.context.propensity_score < 0.55) {
    return {
      campaign_id: "",
      campaign_type: "none",
      personalized_offer: "No campaign at this time",
      channel_recommendation: "none",
      send_timing: "none",
      confidence: 0,
      estimated_revenue_impact: 0,
    };
  }

  // Build growth context
  const contextString = `
Member Propensity Type: ${req.propensity_type}
Propensity Score: ${req.context.propensity_score}
LTV Estimate: $${req.context.ltv_estimate}
Lifecycle Stage: ${req.context.lifecycle_stage}
Persona: ${req.context.persona}

Recent Purchases:
${req.context.recent_purchases.map((p) => `- ${p.item} (${p.date})`).join("\n")}

Engagement Metrics:
${Object.entries(req.context.engagement_metrics).map(([k, v]) => `- ${k}: ${v}`).join("\n")}
  `.trim();

  const prompt = `Generate a personalized ${req.propensity_type} campaign for this high-propensity member.`;

  // Call Claude
  let claudeResponse: string;
  try {
    claudeResponse = await callClaudeForGrowth(prompt, contextString);
  } catch (error) {
    console.error("Claude API error:", error);
    throw error;
  }

  // Parse response
  let campaign = {
    campaign_type: req.propensity_type,
    offer: "Personalized recommendation",
    channel: "email",
    timing: "immediate",
    confidence: 0.75,
    estimated_impact: req.context.propensity_score * req.context.ltv_estimate * 0.15,
  };

  try {
    const jsonMatch = claudeResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      campaign = JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error("Failed to parse campaign response:", e);
  }

  // Save decision
  const campaignId = await saveGrowthDecision(
    req.member_id,
    campaign,
    req.propensity_type
  );

  return {
    campaign_id: campaignId,
    campaign_type: campaign.campaign_type || req.propensity_type,
    personalized_offer: campaign.offer || "Exclusive offer based on your profile",
    channel_recommendation: campaign.channel || "email",
    send_timing: campaign.timing || "optimal_window",
    confidence: campaign.confidence || 0.75,
    estimated_revenue_impact: campaign.estimated_impact || 0,
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

    const growthRequest: GrowthRequest = await req.json();


    // Validate input
    if (!growthRequest.member_id || !growthRequest.propensity_type) {
      return new Response("Missing required fields", { status: 400 });
    }

    if (growthRequest.member_id !== caller.userId) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const response = await processGrowthRequest(growthRequest);

    return new Response(JSON.stringify(response), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in growth orchestrator:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
