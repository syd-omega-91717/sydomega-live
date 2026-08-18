import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import { Anthropic } from "https://esm.sh/@anthropic-ai/sdk@0.9.0";

interface QueryRequest {
  user_id: string;
  query: string;
  query_type?: "natural_language" | "path_find" | "centrality" | "anomalies";
  entity_name?: string;
  relationship_type?: string;
}

interface GraphResponse {
  entities: any[];
  relationships: any[];
  paths?: any[];
  evidence?: any[];
  insights?: string;
}

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const anthropic = new Anthropic({ apiKey: anthropicKey });

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const queryReq: QueryRequest = await req.json();
  const {
    user_id,
    query,
    query_type = "natural_language",
    entity_name,
    relationship_type,
  } = queryReq;

  console.log(`Graph query: ${query_type} - ${query}`);

  try {
    let result: GraphResponse;

    switch (query_type) {
      case "path_find":
        result = await pathFindQuery(user_id, entity_name || "", relationship_type || "");
        break;
      case "centrality":
        result = await centralityQuery(user_id);
        break;
      case "anomalies":
        result = await anomalyQuery(user_id);
        break;
      default:
        result = await naturalLanguageQuery(user_id, query);
    }

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Graph query error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

async function naturalLanguageQuery(user_id: string, query: string): Promise<GraphResponse> {
  // Translate natural language query to structured graph query via Claude
  const prompt = `User is asking about their knowledge graph. Interpret their query and determine what graph data to retrieve.

Query: "${query}"

Respond with JSON:
{
  "query_type": "search|path_find|analysis",
  "entity_search": "search term or null",
  "relationship_type": "relationship type or null",
  "analysis": "brief description of what to analyze"
}`;

  const message = await anthropic.messages.create({
    model: "claude-opus-5",
    max_tokens: 500,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response");

  const parsed = JSON.parse(content.text);

  // Execute based on parsed query type
  if (parsed.entity_search) {
    return await entitySearchQuery(user_id, parsed.entity_search);
  } else if (parsed.query_type === "path_find" && parsed.relationship_type) {
    return await pathFindQuery(user_id, parsed.entity_search || "", parsed.relationship_type);
  } else if (parsed.analysis) {
    return await analysisQuery(user_id, parsed.analysis);
  }

  return { entities: [], relationships: [] };
}

async function entitySearchQuery(user_id: string, search: string): Promise<GraphResponse> {
  const { data: entities, error: entityError } = await supabase
    .from("graph_entities")
    .select("*")
    .eq("user_id", user_id)
    .or(`display_name.ilike.%${search}%,canonical_name.ilike.%${search}%`)
    .limit(20);

  if (entityError) throw entityError;

  const entityIds = (entities || []).map((e: any) => e.id);
  let relationships: any[] = [];

  if (entityIds.length > 0) {
    const { data: rels, error: relError } = await supabase
      .from("graph_relationships")
      .select("*")
      .eq("user_id", user_id)
      .or(`source_entity_id.in.(${entityIds.join(",")}),target_entity_id.in.(${entityIds.join(",")})`);

    if (!relError) relationships = rels || [];
  }

  // Get evidence for top entity
  let evidence: any[] = [];
  if (entityIds.length > 0) {
    const { data: evid, error: evidError } = await supabase
      .from("graph_evidence")
      .select("*")
      .eq("user_id", user_id)
      .eq("graph_entity_id", entityIds[0])
      .limit(5);

    if (!evidError) evidence = evid || [];
  }

  return { entities: entities || [], relationships, evidence };
}

async function pathFindQuery(
  user_id: string,
  source_entity: string,
  target_entity: string
): Promise<GraphResponse> {
  // Find source entity
  const { data: sourceData, error: sourceError } = await supabase
    .from("graph_entities")
    .select("id")
    .eq("user_id", user_id)
    .ilike("display_name", `%${source_entity}%`)
    .limit(1)
    .single();

  if (sourceError || !sourceData) {
    return { entities: [], relationships: [], paths: [], insights: `Could not find entity: ${source_entity}` };
  }

  // Find target entity
  const { data: targetData, error: targetError } = await supabase
    .from("graph_entities")
    .select("id")
    .eq("user_id", user_id)
    .ilike("display_name", `%${target_entity}%`)
    .limit(1)
    .single();

  if (targetError || !targetData) {
    return { entities: [], relationships: [], paths: [], insights: `Could not find entity: ${target_entity}` };
  }

  // Find paths using the recursive function
  const { data: paths, error: pathError } = await supabase.rpc("find_graph_paths", {
    p_user_id: user_id,
    p_source_entity_id: sourceData.id,
    p_target_entity_id: targetData.id,
  });

  if (pathError) throw pathError;

  return {
    entities: [sourceData, targetData],
    relationships: [],
    paths: paths || [],
    insights: `Found ${paths?.length || 0} paths between ${source_entity} and ${target_entity}`,
  };
}

async function centralityQuery(user_id: string): Promise<GraphResponse> {
  const { data: centrality, error } = await supabase.rpc("graph_entity_centrality", {
    p_user_id: user_id,
  });

  if (error) throw error;

  return {
    entities: centrality || [],
    relationships: [],
    insights: "Top connected entities by degree centrality",
  };
}

async function anomalyQuery(user_id: string): Promise<GraphResponse> {
  // Find orphaned entities
  const { data: orphaned, error: orphanError } = await supabase
    .from("graph_entities")
    .select(`*, rel_count:graph_relationships(count)`)
    .eq("user_id", user_id)
    .lt("confidence_score", 0.6);

  if (orphanError) throw orphanError;

  // Find contradictory relationships (blocks vs enables between same entities)
  const { data: contradictory, error: contraError } = await supabase.rpc("find_contradictions", {
    p_user_id: user_id,
  });

  if (contraError) console.warn("Could not find contradictions (function may not exist)");

  return {
    entities: orphaned || [],
    relationships: contradictory || [],
    insights: "Anomalies: orphaned entities, low-confidence relationships, and contradictions",
  };
}

async function analysisQuery(user_id: string, analysis_type: string): Promise<GraphResponse> {
  // Generic analysis - return summary stats
  const { count: entityCount } = await supabase
    .from("graph_entities")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user_id);

  const { count: relCount } = await supabase
    .from("graph_relationships")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user_id);

  return {
    entities: [],
    relationships: [],
    insights: `Graph summary: ${entityCount} entities, ${relCount} relationships. Analysis type: ${analysis_type}`,
  };
}
