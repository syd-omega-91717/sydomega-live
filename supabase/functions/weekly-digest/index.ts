// ============================================================================
// Ω SYD OMEGA 91717 — Weekly Activity Digest Edge Function
// Processes weekly digest queue and sends email notifications
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.112.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function requireAuthorizedCaller(req: Request): Promise<boolean> {
  const authorization = req.headers.get("Authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim();
  if (!token) return false;

  // Scheduled invocations may authenticate directly with the service-role
  // secret. Never log or return the token.
  if (serviceRoleKey && token === serviceRoleKey) return true;

  // Interactive owner invocations must present a real Supabase user session.
  if (!anonKey || !supabaseUrl) return false;
  const caller = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await caller.auth.getUser();
  if (error || !data?.user) return false;

  const { data: owner, error: ownerError } = await supabase
    .from("profiles")
    .select("is_owner")
    .eq("id", data.user.id)
    .maybeSingle();

  return !ownerError && owner?.is_owner === true;
}

Deno.serve(async (req) => {
  // CORS headers
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    // Only POST allowed
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!(await requireAuthorizedCaller(req))) {
      return new Response(
        JSON.stringify({ error: "unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check if digest feature is enabled
    const { data: settings } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "weekly_digest_enabled")
      .single();

    if (!settings || settings.value !== "true") {
      return new Response(
        JSON.stringify({
          ok: true,
          message: "Weekly digest feature is currently disabled",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Process pending digests
    const { data: queue, error: queueError } = await supabase
      .from("weekly_digest_queue")
      .select("*")
      .eq("status", "pending")
      .limit(100);

    if (queueError) {
      throw new Error(`Queue query failed: ${queueError.message}`);
    }

    let processed = 0;
    let failed = 0;

    for (const item of queue || []) {
      try {
        // Mark as processing
        await supabase
          .from("weekly_digest_queue")
          .update({ status: "processing" })
          .eq("id", item.id);

        // Get member email
        const { data: user } = await supabase.auth.admin.getUserById(
          item.user_id
        );

        if (!user) {
          await supabase
            .from("weekly_digest_queue")
            .update({
              status: "failed",
              error_message: "User not found",
            })
            .eq("id", item.id);
          failed++;
          continue;
        }

        // Never mark a digest as sent unless a real delivery provider exists.
        // The previous implementation silently treated a stub as successful,
        // creating false delivery evidence and advancing last_digest_sent_at.
        const emailProviderConfigured = Boolean(Deno.env.get("RESEND_API_KEY"));
        if (!emailProviderConfigured) {
          throw new Error("email_delivery_not_configured");
        }

        // Delivery remains intentionally unimplemented until the digest email
        // contract (template, sender identity, unsubscribe semantics, and
        // provider integration) is explicitly approved. A configured secret
        // alone must never be treated as proof that delivery occurred.
        throw new Error("email_delivery_contract_not_implemented");

        // Delivery is intentionally disabled until the approved provider contract exists.
        // Throwing above records a truthful failure rather than creating false delivery evidence.
        processed++;

      } catch (err) {
        console.error(`[Digest] Error processing ${item.id}:`, err);
        await supabase
          .from("weekly_digest_queue")
          .update({
            status: "failed",
            error_message: String(err).slice(0, 255),
          })
          .eq("id", item.id);
        failed++;
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        processed,
        failed,
        total: (queue || []).length,
        message: `Weekly digest processing complete. ${processed} sent, ${failed} failed.`,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[Digest] Error:", err);
    return new Response(
      JSON.stringify({
        ok: false,
        error: String(err),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
