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

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const userId = await callerId(req);
  if (!userId) return json({ error: "not_authenticated" }, 401);
  if (!admin) return json({ error: "server_not_configured" }, 503);

  try {
    const body = await req.json();
    const fileId = body?.file_id;
    if (typeof fileId !== "string" || !fileId) return json({ error: "file_id_required" }, 400);

    const { data: file, error: fileError } = await admin
      .from("storage_files")
      .select("id,owner_id,storage_path,filename,mime_type,size_bytes,visibility")
      .eq("id", fileId)
      .maybeSingle();
    if (fileError) throw fileError;
    if (!file) return json({ error: "file_not_found" }, 404);
    if (file.owner_id !== userId) return json({ error: "forbidden" }, 403);
    if (file.visibility !== "private") return json({ error: "unsupported_visibility" }, 403);

    const { data, error: signError } = await admin.storage
      .from("uploads")
      .createSignedUrl(file.storage_path, 900);
    if (signError || !data?.signedUrl) throw signError || new Error("signed_url_failed");

    const { error: eventError } = await admin.from("omega_platform_events").insert({
      event_type: "capability_used",
      route: "/content",
      actor_user_id: userId,
      metadata: {
        schema_version: "1",
        event_name: "content_asset_signed_download",
        content_id: "storage_files:" + file.id,
        filename: file.filename,
        delivery: "signed_url",
        expires_seconds: 900,
      },
    });
    if (eventError) throw eventError;

    return json({
      ok: true,
      content_id: "storage_files:" + file.id,
      signed_url: data.signedUrl,
      expires_at: new Date(Date.now() + 900000).toISOString(),
      delivery_state: "SIGNED",
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "content_delivery_failed" }, 500);
  }
});
