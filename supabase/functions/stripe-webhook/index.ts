// SYD OMEGA 91717 -- Stripe Webhook receiver
//
// Activates, updates, or cancels member subscriptions in response to real
// Stripe events. This is the missing half of the checkout flow: the checkout
// Edge Function creates a Stripe session; this function listens for payment
// confirmation and writes the result to public.profiles via apply_subscription().
//
// EVENTS HANDLED:
//   checkout.session.completed   → payment successful, activate subscription
//   customer.subscription.updated → renewal, upgrade, downgrade
//   customer.subscription.deleted → cancellation / non-renewal
//   invoice.payment_failed        → mark status 'past_due' to trigger gating
//
// SECURITY:
//   - Validates Stripe-Signature header with the webhook signing secret.
//     Without this check, any HTTP call could fake a payment.
//   - Calls apply_subscription() which enforces service_role requirement server-side.
//   - Returns 200 for unhandled event types so Stripe doesn't retry them.
//
// ENV (Supabase secrets):
//   STRIPE_WEBHOOK_SECRET   whsec_… from Stripe Dashboard → Webhooks
//   SUPABASE_URL            injected automatically
//   SUPABASE_SERVICE_ROLE_KEY  injected automatically (needed to call apply_subscription)
//
// DEPLOY:
//   supabase functions deploy stripe-webhook --no-verify-jwt
//
// STRIPE DASHBOARD SETUP:
//   Webhooks → Add endpoint → https://<project>.supabase.co/functions/v1/stripe-webhook
//   Events to listen for (minimum):
//     checkout.session.completed
//     customer.subscription.updated
//     customer.subscription.deleted
//     invoice.payment_failed

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.112.4";

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), {
    status: s,
    headers: { "Content-Type": "application/json" },
  });

// Stripe signature verification using the Web Crypto API (no Node.js crypto
// module available in Deno Edge Functions). Follows the Stripe webhook signature
// verification spec: https://stripe.com/docs/webhooks/signatures
async function verifyStripeSignature(
  payload: string,
  sigHeader: string,
  secret: string
): Promise<boolean> {
  const parts = Object.fromEntries(
    sigHeader.split(",").map((p) => p.split("=") as [string, string])
  );
  const timestamp = parts["t"];
  const sig = parts["v1"];
  if (!timestamp || !sig) return false;

  // Guard against replay attacks: reject webhooks older than 5 minutes
  const age = Date.now() / 1000 - parseInt(timestamp, 10);
  if (age > 300) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(signedPayload)
  );
  const computed = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Constant-time comparison to prevent timing attacks
  if (computed.length !== sig.length) return false;
  let mismatch = 0;
  for (let i = 0; i < computed.length; i++) {
    mismatch |= computed.charCodeAt(i) ^ sig.charCodeAt(i);
  }
  return mismatch === 0;
}

// Extract the Supabase user ID and tier from Stripe metadata.
// The checkout function writes both as metadata on the session and
// on the subscription_data, so both paths are available.
function extractMetadata(obj: Record<string, unknown>): { uid: string | null; tier: string | null } {
  const meta = (obj.metadata as Record<string, string>) || {};
  return {
    uid: meta["uid"] || null,
    tier: meta["tier"] || null,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok");
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!secret) {
    // Not configured yet — acknowledge so Stripe doesn't retry, but log.
    console.warn("[stripe-webhook] STRIPE_WEBHOOK_SECRET not set; skipping verification.");
    return json({ received: true, configured: false });
  }

  const sigHeader = req.headers.get("stripe-signature") || "";
  const rawBody = await req.text();

  const valid = await verifyStripeSignature(rawBody, sigHeader, secret);
  if (!valid) return json({ error: "invalid_signature" }, 400);

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const eventType = event.type as string;
  const data = event.data as { object: Record<string, unknown> };
  const obj = data?.object || {};

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  try {
    // ── checkout.session.completed ─────────────────────────────────────────
    // Member paid; activate their subscription immediately.
    if (eventType === "checkout.session.completed") {
      const { uid, tier } = extractMetadata(obj);
      if (!uid || !tier) {
        console.warn("[stripe-webhook] checkout.session.completed: missing uid/tier in metadata", obj.metadata);
        return json({ received: true, skipped: "missing_metadata" });
      }

      // period_end comes from the subscription object embedded in the session
      // when mode=subscription. Fall back to now+30 days if absent.
      const sub = obj.subscription as Record<string, unknown> | null;
      const periodEnd = sub?.current_period_end
        ? new Date((sub.current_period_end as number) * 1000).toISOString()
        : new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();

      const customer = (obj.customer as string) || null;

      const { data: result, error } = await admin.rpc("apply_subscription", {
        p_uid: uid,
        p_tier: tier,
        p_status: "active",
        p_period_end: periodEnd,
        p_customer: customer,
      });

      if (error) {
        console.error("[stripe-webhook] apply_subscription failed:", error);
        return json({ error: "db_error", detail: error.message }, 500);
      }

      console.log("[stripe-webhook] checkout.session.completed applied:", result);
      return json({ received: true, event: eventType, result });
    }

    // ── customer.subscription.updated ────────────────────────────────────
    // Renewal, plan change, trial end, etc.
    if (eventType === "customer.subscription.updated") {
      const { uid, tier } = extractMetadata(obj);
      if (!uid) {
        console.warn("[stripe-webhook] subscription.updated: no uid in metadata");
        return json({ received: true, skipped: "missing_uid" });
      }

      const resolvedTier = tier || (obj.items as any)?.data?.[0]?.plan?.nickname || "unknown";
      const status = (obj.status as string) || "active";
      const periodEnd = obj.current_period_end
        ? new Date((obj.current_period_end as number) * 1000).toISOString()
        : null;
      const customer = (obj.customer as string) || null;

      const { data: result, error } = await admin.rpc("apply_subscription", {
        p_uid: uid,
        p_tier: resolvedTier,
        p_status: status,
        p_period_end: periodEnd,
        p_customer: customer,
      });

      if (error) {
        console.error("[stripe-webhook] apply_subscription (update) failed:", error);
        return json({ error: "db_error", detail: error.message }, 500);
      }

      return json({ received: true, event: eventType, result });
    }

    // ── customer.subscription.deleted ────────────────────────────────────
    // Subscription cancelled or not renewed; revoke access.
    if (eventType === "customer.subscription.deleted") {
      const { uid } = extractMetadata(obj);
      if (!uid) {
        console.warn("[stripe-webhook] subscription.deleted: no uid in metadata");
        return json({ received: true, skipped: "missing_uid" });
      }

      const customer = (obj.customer as string) || null;

      const { data: result, error } = await admin.rpc("apply_subscription", {
        p_uid: uid,
        p_tier: null,
        p_status: "cancelled",
        p_period_end: null,
        p_customer: customer,
      });

      if (error) {
        console.error("[stripe-webhook] apply_subscription (cancel) failed:", error);
        return json({ error: "db_error", detail: error.message }, 500);
      }

      return json({ received: true, event: eventType, result });
    }

    // ── invoice.payment_failed ────────────────────────────────────────────
    // Renewal payment failed; mark the subscription past_due so gating pages
    // can warn the member without revoking access immediately.
    if (eventType === "invoice.payment_failed") {
      const subId = obj.subscription as string | null;
      if (!subId) return json({ received: true, skipped: "no_subscription" });

      // Fetch the subscription to get the uid from its metadata
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (!stripeKey) return json({ received: true, skipped: "no_stripe_key" });

      const subRes = await fetch(`https://api.stripe.com/v1/subscriptions/${subId}`, {
        headers: { Authorization: `Bearer ${stripeKey}` },
      });
      if (!subRes.ok) return json({ received: true, skipped: "stripe_fetch_failed" });

      const subData = await subRes.json();
      const { uid } = extractMetadata(subData);
      if (!uid) return json({ received: true, skipped: "no_uid_in_sub_metadata" });

      const { data: result, error } = await admin.rpc("apply_subscription", {
        p_uid: uid,
        p_tier: subData.metadata?.tier || null,
        p_status: "past_due",
        p_period_end: subData.current_period_end
          ? new Date(subData.current_period_end * 1000).toISOString()
          : null,
        p_customer: subData.customer || null,
      });

      if (error) {
        console.error("[stripe-webhook] apply_subscription (past_due) failed:", error);
        return json({ error: "db_error", detail: error.message }, 500);
      }

      return json({ received: true, event: eventType, result });
    }

    // Acknowledge unhandled events so Stripe doesn't retry them
    return json({ received: true, event: eventType, handled: false });

  } catch (e) {
    console.error("[stripe-webhook] unhandled error:", e);
    return json({ error: String(e) }, 500);
  }
});
