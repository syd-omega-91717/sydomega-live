import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import { secretKey, publishableKey } from "../_shared/keys.ts";

const url = Deno.env.get("SUPABASE_URL")!;
const adminKey = secretKey();
const publicKey = publishableKey();
const admin = adminKey ? createClient(url, adminKey) : null;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

async function callerId(req: Request): Promise<string | null> {
  const auth = req.headers.get("Authorization");
  if (!auth || !publicKey) return null;
  try {
    const caller = createClient(url, publicKey, { global: { headers: { Authorization: auth } } });
    const { data, error } = await caller.auth.getUser();
    return error || !data?.user ? null : data.user.id;
  } catch { return null; }
}

function safeName(value: unknown): string {
  if (typeof value !== "string" || !value.trim() || value.length > 255) throw new Error("invalid_filename");
  return value.replace(/[^A-Za-z0-9._-]+/g, "_");
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const userId = await callerId(req);
  if (!userId) return json({ error: "not_authenticated" }, 401);
  if (!admin) return json({ error: "server_not_configured" }, 503);

  try {
    const body = await req.json();
    const bucket = body?.bucket;
    const path = body?.path;
    const filename = safeName(body?.filename);
    const mimeType = typeof body?.mime_type === "string" && body.mime_type.length <= 255 ? body.mime_type : null;
    const sizeBytes = Number.isSafeInteger(body?.size_bytes) && body.size_bytes >= 0 ? body.size_bytes : null;

    if (bucket !== "uploads") return json({ error: "unsupported_bucket" }, 400);
    if (typeof path !== "string" || !path || path.length > 1024) return json({ error: "invalid_path" }, 400);
    if (!path.startsWith(userId + "/")) return json({ error: "path_not_owned" }, 403);

    const slash = path.indexOf("/");
    const objectName = path.slice(slash + 1);
    const folder = userId;

    const { data: objects, error: listError } = await admin.storage.from(bucket).list(folder, {
      limit: 100,
      search: objectName,
    });
    if (listError) throw listError;
    const object = (objects || []).find((entry) => entry.name === objectName);
    if (!object) return json({ error: "object_not_found" }, 404);

    const { data: existing, error: existingError } = await admin
      .from("storage_files")
      .select("id,storage_path,owner_id")
      .eq("storage_path", path)
      .eq("owner_id", userId)
      .limit(1)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing) {
      return json({
        ok: true,
        duplicate: true,
        content_id: "storage_files:" + existing.id,
        file: existing,
        review_state: "PENDING_REVIEW",
      });
    }

    const { data: file, error: insertError } = await admin
      .from("storage_files")
      .insert({
        owner_id: userId,
        folder,
        filename,
        storage_path: path,
        mime_type: mimeType,
        extension: filename.includes(".") ? filename.split(".").pop() : null,
        size_bytes: sizeBytes ?? object.metadata?.size ?? null,
        checksum: null,
        visibility: "private",
      })
      .select("id,owner_id,folder,filename,storage_path,mime_type,extension,size_bytes,checksum,visibility,created_at")
      .single();
    if (insertError) throw insertError;

    const { error: eventError } = await admin.from("omega_platform_events").insert({
      event_type: "evidence_recorded",
      route: "/content",
      actor_user_id: userId,
      metadata: {
        schema_version: "1",
        event_name: "content_asset_registered",
        content_id: "storage_files:" + file.id,
        storage_path: path,
        review_state: "PENDING_REVIEW",
        rights_state: "UNVERIFIED",
        publication_state: "UNVERIFIED",
        entitlement_state: "UNVERIFIED",
        scan_state: "UNAVAILABLE",
      },
    });
    if (eventError) throw eventError;

    return json({
      ok: true,
      duplicate: false,
      content_id: "storage_files:" + file.id,
      file,
      review_state: "PENDING_REVIEW",
    }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "content_ingest_failed";
    const clientErrors = new Set(["invalid_filename", "unsupported_bucket", "invalid_path", "path_not_owned"]);
    return json({ error: clientErrors.has(message) ? message : "content_ingest_failed" }, clientErrors.has(message) ? 400 : 500);
  }
});
