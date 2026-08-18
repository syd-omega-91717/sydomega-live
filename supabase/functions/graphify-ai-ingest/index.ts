import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import { Anthropic } from "https://esm.sh/@anthropic-ai/sdk@0.9.0";

interface RequestBody {
  user_id: string;
  data_sources?: string[];
  force_full_rescan?: boolean;
}

interface Entity {
  type: string;
  name: string;
  display_name?: string;
  description?: string;
  confidence: number;
}

interface Relationship {
  source_name: string;
  target_name: string;
  type: string;
  strength: number;
  confidence: number;
}

interface ExtractionResult {
  entities: Entity[];
  relationships: Relationship[];
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

  const body: RequestBody = await req.json();
  const { user_id, data_sources = ["task_completions"], force_full_rescan = false } = body;

  console.log(`Starting Graphify ingestion for user ${user_id}`);

  try {
    let extractedData: ExtractionResult = { entities: [], relationships: [] };

    // Fetch raw data from specified sources
    for (const source of data_sources) {
      const rawData = await fetchDataSource(user_id, source, force_full_rescan);
      if (rawData.length === 0) continue;

      console.log(`Extracting from ${source}: ${rawData.length} records`);

      // Send to Claude for entity/relationship extraction
      const aiResult = await extractWithAI(user_id, source, rawData);
      extractedData.entities.push(...aiResult.entities);
      extractedData.relationships.push(...aiResult.relationships);
    }

    // Deduplicate entities
    const dedupedEntities = deduplicateEntities(extractedData.entities);
    console.log(`Deduped: ${extractedData.entities.length} → ${dedupedEntities.length} entities`);

    // Upsert into graph tables
    const entityIdMap = await upsertEntities(user_id, dedupedEntities);
    await upsertRelationships(user_id, extractedData.relationships, entityIdMap);
    await recordEvents(user_id, extractedData);

    console.log(`Graphify ingestion complete for user ${user_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        entities_processed: dedupedEntities.length,
        relationships_processed: extractedData.relationships.length,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Graphify ingestion error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

async function fetchDataSource(
  user_id: string,
  source: string,
  force_full_rescan: boolean
): Promise<Record<string, unknown>[]> {
  let query = supabase.from(source).select("*").eq("user_id", user_id);

  if (!force_full_rescan) {
    // Only fetch records changed since last ingestion
    const lastIngest = await supabase
      .from("graph_events")
      .select("recorded_at")
      .eq("user_id", user_id)
      .eq("source_event_id", `ingest-${source}`)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .single();

    if (lastIngest.data?.recorded_at) {
      query = query.gte("created_at", lastIngest.data.recorded_at);
    }
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function extractWithAI(
  user_id: string,
  source: string,
  data: Record<string, unknown>[]
): Promise<ExtractionResult> {
  const dataStr = JSON.stringify(data.slice(0, 5), null, 2);

  const prompt = `Extract entities and relationships from this ${source} data for a member's knowledge graph.

Return ONLY valid JSON (no markdown, no explanation):
{
  "entities": [{"type": "goal|task|skill|concept|event", "name": "canonical_name", "display_name": "...", "description": "...", "confidence": 0.0-1.0}],
  "relationships": [{"source_name": "...", "target_name": "...", "type": "depends_on|enables|blocks|creates|relates_to", "strength": 0.0-1.0, "confidence": 0.0-1.0}]
}

Data:
${dataStr}`;

  const message = await anthropic.messages.create({
    model: "claude-opus-5",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");

  try {
    return JSON.parse(content.text);
  } catch {
    console.warn("Could not parse AI response, returning empty");
    return { entities: [], relationships: [] };
  }
}

function deduplicateEntities(entities: Entity[]): Entity[] {
  const seen = new Map<string, Entity>();
  for (const e of entities) {
    const key = `${e.type}:${e.name.toLowerCase()}`;
    if (!seen.has(key) || e.confidence > (seen.get(key)?.confidence || 0)) {
      seen.set(key, e);
    }
  }
  return Array.from(seen.values());
}

async function upsertEntities(
  user_id: string,
  entities: Entity[]
): Promise<Map<string, string>> {
  const idMap = new Map<string, string>();

  for (const entity of entities) {
    const { data, error } = await supabase.rpc("upsert_graph_entity", {
      p_user_id: user_id,
      p_entity_type: entity.type,
      p_canonical_name: entity.name,
      p_display_name: entity.display_name || entity.name,
      p_description: entity.description,
      p_metadata: { ai_extracted: true },
      p_confidence: entity.confidence,
      p_source_system: "extraction",
    });

    if (error) {
      console.error(`Error upserting entity ${entity.name}:`, error);
      continue;
    }

    idMap.set(`${entity.type}:${entity.name}`, data);
  }

  return idMap;
}

async function upsertRelationships(
  user_id: string,
  relationships: Relationship[],
  entityIdMap: Map<string, string>
): Promise<void> {
  for (const rel of relationships) {
    const sourceId = entityIdMap.get(`goal:${rel.source_name}`) ||
      entityIdMap.get(`task:${rel.source_name}`) ||
      entityIdMap.get(`concept:${rel.source_name}`);
    const targetId = entityIdMap.get(`goal:${rel.target_name}`) ||
      entityIdMap.get(`task:${rel.target_name}`) ||
      entityIdMap.get(`concept:${rel.target_name}`);

    if (!sourceId || !targetId) {
      console.warn(
        `Skipping relationship: could not find entities ${rel.source_name} → ${rel.target_name}`
      );
      continue;
    }

    const { error } = await supabase.rpc("add_graph_relationship", {
      p_user_id: user_id,
      p_source_entity_id: sourceId,
      p_target_entity_id: targetId,
      p_relationship_type: rel.type,
      p_strength: rel.strength,
      p_confidence: rel.confidence,
      p_source_system: "extraction",
    });

    if (error) console.error("Error adding relationship:", error);
  }
}

async function recordEvents(user_id: string, result: ExtractionResult): Promise<void> {
  const event = {
    user_id,
    event_type: "ingestion_completed",
    occurred_at: new Date().toISOString(),
    change_summary: `Ingested ${result.entities.length} entities, ${result.relationships.length} relationships`,
    source_event_id: `ingest-${new Date().getTime()}`,
  };

  const { error } = await supabase.from("graph_events").insert([event]);
  if (error) console.error("Error recording event:", error);
}
