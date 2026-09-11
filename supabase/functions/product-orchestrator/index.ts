import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY")!;

const supabase = createClient(supabaseUrl, supabaseKey);

interface ProductRequest {
  member_id: string;
  action_type: "feature_rollout" | "ux_adaptation" | "behavioral_optimization";
  context: {
    persona: string;
    lifecycle_stage: string;
    feature_adoption_count: number;
    engagement_score: number;
    complexity_tolerance: number;
    pending_features: string[];
  };
}

interface ProductResponse {
  decision_id: string;
  action: string;
  feature_flags: Record<string, boolean>;
  ux_config: Record<string, unknown>;
  reasoning: string;
  confidence: number;
}

async function callClaudeForProduct(
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
      model: "claude-opus-4-100k",
      max_tokens: 1500,
      temperature: 0.4,
      system: `You are the Ω Product Agent, orchestrating real-time product adaptation.

Your role:
- Decide feature availability per member cohort
- Personalize UX based on adoption readiness
- Optimize for engagement and complexity balance
- Return JSON with: features_to_enable, ux_config, confidence

Personas and UX complexity levels:
- Power Users: Full feature set, advanced settings, batch operations
- Regular Users: Core features, step-by-step guides
- Casual Users: Simplified UI, fewer options, contextual help
- Explorers: Discovery mode, tutorials, feature highlights`,
      messages: [
        {
          role: "user",
          content: `Context:\n${context}\n\nProduct Decision:\n${prompt}`,
        },
      ],
    }),
  });

  const data = await response.json();
  return data.content[0].text;
}

async function saveProductDecision(
  memberId: string,
  decision: Record<string, unknown>
): Promise<string> {
  const { data, error } = await supabase
    .from("autonomous_decisions")
    .insert({
      agent_id: "product",
      member_id: memberId,
      decision_type: "product_adaptation",
      context_snapshot: decision,
      reasoning: `Product adaptation decision for ${decision.persona}`,
      decision_payload: decision,
      confidence_score: decision.confidence || 0.8,
      model_used: "claude-opus-4-100k",
      temperature: 0.4,
      outcome_recorded: false,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error saving product decision:", error);
    throw error;
  }

  return data.id;
}

async function updateMemberFeatureFlags(
  memberId: string,
  features: Record<string, boolean>
): Promise<void> {
  for (const [featureId, enabled] of Object.entries(features)) {
    const { error } = await supabase.from("member_feature_flags").upsert({
      member_id: memberId,
      feature_id: featureId,
      enabled: enabled,
      set_by_agent: true,
      set_reason: "product_agent_adaptation",
      set_timestamp: new Date().toISOString(),
    });

    if (error) {
      console.error(`Error setting feature flag ${featureId}:`, error);
    }
  }
}

async function processProductRequest(req: ProductRequest): Promise<ProductResponse> {
  // Determine persona UX complexity
  const getComplexityLevel = (persona: string): string => {
    switch (persona) {
      case "power_user":
        return "advanced";
      case "regular_user":
        return "standard";
      case "casual_user":
        return "simplified";
      case "explorer":
        return "discovery";
      default:
        return "standard";
    }
  };

  const contextString = `
Persona: ${req.context.persona}
Lifecycle Stage: ${req.context.lifecycle_stage}
Feature Adoption Count: ${req.context.feature_adoption_count}
Engagement Score: ${req.context.engagement_score}
Complexity Tolerance: ${req.context.complexity_tolerance}

Pending Features:
${req.context.pending_features.join("\n")}
  `.trim();

  const prompt = `Decide which features to enable and how to personalize the UX for this ${req.context.persona} member at ${req.context.lifecycle_stage} stage.`;

  // Call Claude
  let claudeResponse: string;
  try {
    claudeResponse = await callClaudeForProduct(prompt, contextString);
  } catch (error) {
    console.error("Claude API error:", error);
    throw error;
  }

  // Parse response
  let decision = {
    features_to_enable: [],
    ux_complexity: getComplexityLevel(req.context.persona),
    confidence: 0.8,
  };

  try {
    const jsonMatch = claudeResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      decision = JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error("Failed to parse product response:", e);
  }

  // Create feature flags
  const featureFlags: Record<string, boolean> = {};
  const featuresToEnable = decision.features_to_enable || [];

  for (const feature of req.context.pending_features) {
    featureFlags[feature] = featuresToEnable.includes(feature);
  }

  // Determine UX config based on persona
  const uxConfigs: Record<string, Record<string, unknown>> = {
    advanced: {
      show_api_docs: true,
      batch_operations: true,
      advanced_settings: true,
      show_technical_details: true,
    },
    standard: {
      show_tutorials: true,
      step_by_step_guides: true,
      advanced_settings: false,
      contextual_help: true,
    },
    simplified: {
      show_core_features_only: true,
      simplify_navigation: true,
      hide_advanced_options: true,
      show_tooltips: true,
    },
    discovery: {
      feature_discovery_highlights: true,
      tutorial_badges: true,
      try_next_suggestions: true,
      showcase_new_features: true,
    },
  };

  const uxConfig = uxConfigs[decision.ux_complexity] || uxConfigs.standard;

  // Save decision
  const decisionId = await saveProductDecision(req.member_id, {
    ...decision,
    feature_flags: featureFlags,
    ux_config: uxConfig,
  });

  // Update feature flags
  await updateMemberFeatureFlags(req.member_id, featureFlags);

  return {
    decision_id: decisionId,
    action: "product_adaptation",
    feature_flags: featureFlags,
    ux_config: uxConfig,
    reasoning: claudeResponse,
    confidence: decision.confidence || 0.8,
  };
}

serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const productRequest: ProductRequest = await req.json();

    // Validate input
    if (!productRequest.member_id || !productRequest.action_type) {
      return new Response("Missing required fields", { status: 400 });
    }

    const response = await processProductRequest(productRequest);

    return new Response(JSON.stringify(response), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in product orchestrator:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
