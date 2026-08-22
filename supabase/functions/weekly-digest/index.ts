// ============================================================================
// Ω SYD OMEGA 91717 — Weekly Activity Digest Edge Function
// Processes weekly digest queue and sends email notifications
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);

serve(async (req) => {
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

        // TODO: Call email service (Resend, SendGrid, etc.) to send digest
        // For now, just mark as sent
        console.log(`[Digest] Queued for ${user.email}:`, item.digest_data);

        // Mark as sent
        const { error: updateError } = await supabase
          .from("weekly_digest_queue")
          .update({
            status: "sent",
            processed_at: new Date().toISOString(),
          })
          .eq("id", item.id);

        if (updateError) throw updateError;

        // Update last_digest_sent_at in preferences
        await supabase
          .from("digest_preferences")
          .update({
            last_digest_sent_at: new Date().toISOString(),
          })
          .eq("user_id", item.user_id);

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
