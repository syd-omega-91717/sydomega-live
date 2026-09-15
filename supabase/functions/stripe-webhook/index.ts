// SYD OMEGA 91717 -- Stripe Webhook receiver
//
// Activates, updates, or cancels member subscriptions in response to real
// Stripe events. The existing Edge Function -> RPC architecture is preserved.
// Stripe event IDs are passed to apply_subscription() so each event is
// persisted and applied at most once transactionally.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.112.4";

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), {
    status: s,
    headers: { "Content-Type": "application/json" },
  });

async function verifyStripeSignature(payload: string, sigHeader: string, secret: string): Promise<boolean> {
  const parts = Object.fromEntries(sigHeader.split(",").map((p) => p.split("=") as [string, string]));
  const timestamp = parts["t"];
  const sig = parts["v1"];
  if (!timestamp || !sig) return false;
  const timestampSeconds = Number(timestamp);
  if (!Number.isFinite(timestampSeconds)) return false;
  const age = Date.now() / 1000 - timestampSeconds;
  if (age > 300 || age < -300) return false;
  const signedPayload = `${timestamp}.${payload}`;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signedPayload));
  const computed = Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, "0")).join("");
  if (computed.length !== sig.length) return false;
  let mismatch = 0;
  for (let i = 0; i < computed.length; i++) mismatch |= computed.charCodeAt(i) ^ sig.charCodeAt(i);
  return mismatch === 0;
}

function extractMetadata(obj: Record<string, unknown>): { uid: string | null; tier: string | null } {
  const meta = (obj.metadata as Record<string, string>) || {};
  return { uid: meta["uid"] || null, tier: meta["tier"] || null };
}

function periodEndSeconds(subLike: unknown): number | null {
  const s = (subLike || {}) as Record<string, unknown>;
  const top = s["current_period_end"];
  if (typeof top === "number") return top;
  const item = (s["items"] as any)?.data?.[0]?.current_period_end;
  return typeof item === "number" ? item : null;
}

const STRIPE_API_VERSION = "2025-02-24.acacia";

async function fetchStripeSubscription(subscriptionId: string): Promise<Record<string, unknown> | null> {
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) return null;
  const response = await fetch(`https://api.stripe.com/v1/subscriptions/${encodeURIComponent(subscriptionId)}`, {
    headers: { Authorization: `Bearer ${stripeKey}`, "Stripe-Version": STRIPE_API_VERSION },
  });
  if (!response.ok) return null;
  const value = await response.json();
  return value && typeof value === "object" ? value as Record<string, unknown> : null;
}

async function applySubscription(admin: ReturnType<typeof createClient>, args: {
  uid: string;
  tier: string | null;
  status: string;
  periodEnd: string | null;
  customer: string | null;
  eventId: string;
  eventType: string;
}) {
  const { data: result, error } = await admin.rpc("apply_subscription", {
    p_uid: args.uid,
    p_tier: args.tier,
    p_status: args.status,
    p_period_end: args.periodEnd,
    p_customer: args.customer,
    p_event_id: args.eventId,
    p_event_type: args.eventType,
  });
  if (error) {
    console.error("[stripe-webhook] apply_subscription failed:", error.message);
    return { ok: false as const };
  }
  if (!result || typeof result !== "object" || (result as Record<string, unknown>).ok !== true) {
    console.error("[stripe-webhook] apply_subscription returned a non-success result");
    return { ok: false as const };
  }
  return { ok: true as const, result };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok");
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!secret) {
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET is not configured; refusing webhook.");
    return json({ error: "webhook_not_configured" }, 503);
  }

  const sigHeader = req.headers.get("stripe-signature") || "";
  const rawBody = await req.text();
  if (!(await verifyStripeSignature(rawBody, sigHeader, secret))) return json({ error: "invalid_signature" }, 400);

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const eventId = typeof event.id === "string" ? event.id.trim() : "";
  const eventType = typeof event.type === "string" ? event.type : "";
  if (!eventId || !eventType) return json({ error: "invalid_event" }, 400);

  const data = event.data as { object: Record<string, unknown> };
  const obj = data?.object || {};
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    console.error("[stripe-webhook] Supabase server credentials are not configured.");
    return json({ error: "webhook_not_configured" }, 503);
  }
  const admin = createClient(supabaseUrl, serviceKey);

  try {
    if (eventType === "checkout.session.completed") {
      const { uid, tier } = extractMetadata(obj);
      if (!uid || !tier) return json({ received: true, skipped: "missing_metadata" });

      const subscriptionId = typeof obj.subscription === "string" ? obj.subscription : null;
      const sub = subscriptionId ? await fetchStripeSubscription(subscriptionId) : null;
      // A subscription ID means Stripe is the authoritative entitlement source.
      // Never grant active access when that authoritative lookup fails.
      if (subscriptionId && !sub) {
        console.error("[stripe-webhook] subscription lookup failed for checkout.session.completed");
        return json({ error: "stripe_lookup_failed" }, 503);
      }
      const subPeriodEnd = periodEndSeconds(sub || obj.subscription);
      const periodEnd = subPeriodEnd !== null ? new Date(subPeriodEnd * 1000).toISOString() : null;
      const customer = typeof obj.customer === "string" ? obj.customer : null;
      const applied = await applySubscription(admin, {
        uid,
        tier: sub?.metadata && typeof sub.metadata === "object" ? ((sub.metadata as Record<string, string>).tier || tier) : tier,
        status: "active",
        periodEnd,
        customer,
        eventId,
        eventType,
      });
      if (!applied.ok) return json({ error: "db_error" }, 500);
      return json({ received: true, event: eventType, result: applied.result });
    }

    if (eventType === "customer.subscription.updated") {
      const { uid, tier } = extractMetadata(obj);
      if (!uid) return json({ received: true, skipped: "missing_uid" });
      const resolvedTier = tier || (obj.items as any)?.data?.[0]?.plan?.nickname || (obj.items as any)?.data?.[0]?.price?.nickname || "unknown";
      const status = typeof obj.status === "string" ? obj.status : "active";
      const updPeriodEnd = periodEndSeconds(obj);
      const periodEnd = updPeriodEnd !== null ? new Date(updPeriodEnd * 1000).toISOString() : null;
      const customer = typeof obj.customer === "string" ? obj.customer : null;
      const applied = await applySubscription(admin, { uid, tier: resolvedTier, status, periodEnd, customer, eventId, eventType });
      if (!applied.ok) return json({ error: "db_error" }, 500);
      return json({ received: true, event: eventType, result: applied.result });
    }

    if (eventType === "customer.subscription.deleted") {
      const { uid } = extractMetadata(obj);
      if (!uid) return json({ received: true, skipped: "missing_uid" });
      const customer = typeof obj.customer === "string" ? obj.customer : null;
      const applied = await applySubscription(admin, { uid, tier: null, status: "cancelled", periodEnd: null, customer, eventId, eventType });
      if (!applied.ok) return json({ error: "db_error" }, 500);
      return json({ received: true, event: eventType, result: applied.result });
    }

    if (eventType === "invoice.payment_failed") {
      const subId = typeof obj.subscription === "string" ? obj.subscription : null;
      if (!subId) return json({ received: true, skipped: "no_subscription" });
      const subData = await fetchStripeSubscription(subId);
      if (!subData) {
        console.error("[stripe-webhook] subscription lookup failed for invoice.payment_failed");
        return json({ error: "stripe_lookup_failed" }, 503);
      }
      const { uid } = extractMetadata(subData);
      if (!uid) return json({ received: true, skipped: "no_uid_in_sub_metadata" });
      const failedPeriodEnd = periodEndSeconds(subData);
      const meta = (subData.metadata as Record<string, string>) || {};
      const applied = await applySubscription(admin, {
        uid,
        tier: meta.tier || null,
        status: "past_due",
        periodEnd: failedPeriodEnd !== null ? new Date(failedPeriodEnd * 1000).toISOString() : null,
        customer: typeof subData.customer === "string" ? subData.customer : null,
        eventId,
        eventType,
      });
      if (!applied.ok) return json({ error: "db_error" }, 500);
      return json({ received: true, event: eventType, result: applied.result });
    }

    return json({ received: true, event: eventType, handled: false });
  } catch (e) {
    console.error("[stripe-webhook] unhandled error:", e instanceof Error ? e.message : "unknown error");
    return json({ error: "webhook_processing_failed" }, 500);
  }
});
