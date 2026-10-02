import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const admin = createClient(supabaseUrl, serviceKey);

const EVENT_TYPES = new Set([
  "route_view","action_started","action_completed","mission_progress",
  "capability_used","simulation_run","evidence_recorded","replay_checkpoint",
]);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

async function requireCallerId(req: Request): Promise<string | null> {
  const auth = req.headers.get("Authorization");
  if (!auth) return null;
  try {
    const caller = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: auth } } });
    const { data, error } = await caller.auth.getUser();
    return error || !data?.user ? null : data.user.id;
  } catch { return null; }
}

function validRoute(route: unknown): string | null {
  if (route === undefined || route === null) return null;
  if (typeof route !== "string" || route.length === 0 || route.length > 240) throw new Error("invalid_route");
  return route;
}

function validMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("invalid_metadata");
  const encoded = JSON.stringify(value);
  if (encoded.length > 8192) throw new Error("metadata_too_large");
  const metadata = value as Record<string, unknown>;
  if (metadata.schema_version !== "1") throw new Error("unsupported_event_schema");
  const key = metadata.idempotency_key;
  if (key !== undefined && (typeof key !== "string" || key.length < 8 || key.length > 160)) throw new Error("invalid_idempotency_key");
  return metadata;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const actorUserId = await requireCallerId(req);
  if (!actorUserId) return json({ error: "not_authenticated" }, 401);

  try {
    const body = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "invalid_body" }, 400);
    const eventType = body.event_type;
    if (typeof eventType !== "string" || !EVENT_TYPES.has(eventType)) return json({ error: "unsupported_event_type" }, 400);

    const route = validRoute(body.route);
    const metadata = validMetadata(body.metadata);
    const idempotencyKey = metadata.idempotency_key;

    if (typeof idempotencyKey === "string") {
      const { data: existing, error: lookupError } = await admin
        .from("omega_platform_events")
        .select("id,event_type,created_at")
        .eq("actor_user_id", actorUserId)
        .eq("event_type", eventType)
        .eq("metadata->>idempotency_key", idempotencyKey)
        .limit(1)
        .maybeSingle();
      if (lookupError) throw lookupError;
      if (existing) return json({ accepted: true, duplicate: true, event_id: existing.id });
    }

    const { data, error } = await admin
      .from("omega_platform_events")
      .insert({ event_type: eventType, route, actor_user_id: actorUserId, metadata })
      .select("id,event_type,created_at")
      .single();

    if (!error) return json({ accepted: true, duplicate: false, event: data }, 201);

    if (error.code === "23505" && typeof idempotencyKey === "string") {
      const { data: existing, error: duplicateLookupError } = await admin
        .from("omega_platform_events")
        .select("id,event_type,created_at")
        .eq("actor_user_id", actorUserId)
        .eq("event_type", eventType)
        .eq("metadata->>idempotency_key", idempotencyKey)
        .limit(1)
        .maybeSingle();
      if (duplicateLookupError) throw duplicateLookupError;
      if (existing) return json({ accepted: true, duplicate: true, event_id: existing.id });
    }

    throw error;
  } catch (error) {
    const message = error instanceof Error ? error.message : "event_ingest_failed";
    const clientErrors = new Set(["invalid_body","invalid_route","invalid_metadata","metadata_too_large","unsupported_event_schema","invalid_idempotency_key"]);
    return json({ error: clientErrors.has(message) ? message : "event_ingest_failed" }, clientErrors.has(message) ? 400 : 500);
  }
});