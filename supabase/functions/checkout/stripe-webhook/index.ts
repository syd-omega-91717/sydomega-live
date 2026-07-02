// ============================================================================
// FILE: /supabase/functions/stripe-webhook/index.ts
// NEW FILE
// ============================================================================
// SYD OMEGA 91717 -- Stripe Webhook: records subscription results onto the member.
// Env: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
import Stripe from "https://esm.sh/stripe@14?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const sk = Deno.env.get("STRIPE_SECRET_KEY");
  const wh = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!sk || !wh) return new Response("not configured", { status: 503 });

  const stripe = new Stripe(sk, { apiVersion: "2024-06-20" });
  const sig = req.headers.get("stripe-signature") || "";
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, wh);
  } catch (e) {
    return new Response(`bad signature: ${e}`, { status: 400 });
  }

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const apply = (uid: string, tier: string, status: string, end: number | null, cust: string | null) =>
    admin.rpc("apply_subscription", {
      p_uid: uid, p_tier: tier, p_status: status,
      p_period_end: end ? new Date(end * 1000).toISOString() : null, p_customer: cust,
    });

  try {
    if (event.type === "checkout.session.completed") {
      const s = event.data.object as Stripe.Checkout.Session;
      const uid = s.client_reference_id || (s.metadata?.uid ?? "");
      const tier = s.metadata?.tier ?? "";
      if (uid) await apply(uid, tier, "active", null, (s.customer as string) ?? null);
    } else if (event.type.startsWith("customer.subscription.")) {
      const sub = event.data.object as Stripe.Subscription;
      const uid = (sub.metadata?.uid ?? "");
      const tier = (sub.metadata?.tier ?? "");
      const status = event.type.endsWith("deleted") ? "canceled" : sub.status;
      if (uid) await apply(uid, tier, status, sub.current_period_end ?? null, (sub.customer as string) ?? null);
    }
  } catch (_) { /* swallow -- Stripe will retry */ }

  return new Response(JSON.stringify({ received: true }), { headers: { "Content-Type": "application/json" } });
});
