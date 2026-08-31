// SYD OMEGA 91717 -- Stripe Checkout (DORMANT until the founder enables payments)
// Double-gated: refuses unless payments_enabled=true AND STRIPE_SECRET_KEY is set.
// Env (Supabase secrets): STRIPE_SECRET_KEY, STRIPE_PRICE_MAP (JSON tier->price_id),
//   SITE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.112.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const svc = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, svc);

    // GATE 1 -- the founder's feature flag
    const { data: flag } = await admin.rpc("get_platform_flag", { p_key: "payments_enabled" });
    if (flag !== true) return json({ enabled: false, message: "Payments are not active yet." });

    // GATE 2 -- the Stripe secret must be configured
    const sk = Deno.env.get("STRIPE_SECRET_KEY");
    if (!sk) return json({ enabled: true, configured: false, message: "Payment processor not configured." });

    // identify the member from their JWT
    const jwt = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const { data: u } = await createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    }).auth.getUser();
    if (!u?.user) return json({ error: "not_authenticated" }, 401);

    const { tier } = await req.json().catch(() => ({ tier: "" }));
    const priceMap = JSON.parse(Deno.env.get("STRIPE_PRICE_MAP") || "{}");
    const price = priceMap[tier];
    if (!price) return json({ error: "unknown_tier" }, 400);

    // create a Stripe Checkout Session (subscription) via the REST API
    const site = Deno.env.get("SITE_URL") || "https://www.sydomega.com";
    const form = new URLSearchParams();
    form.set("mode", "subscription");
    form.set("line_items[0][price]", price);
    form.set("line_items[0][quantity]", "1");
    form.set("success_url", `${site}/subscriptions.html?checkout=success`);
    form.set("cancel_url", `${site}/subscriptions.html?checkout=cancel`);
    form.set("customer_email", u.user.email || "");
    form.set("client_reference_id", u.user.id);
    form.set("metadata[uid]", u.user.id);
    form.set("metadata[tier]", tier);
    form.set("subscription_data[metadata][uid]", u.user.id);
    form.set("subscription_data[metadata][tier]", tier);

    const r = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: { Authorization: `Bearer ${sk}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });
    const session = await r.json();
    if (!r.ok) return json({ error: "stripe_error", detail: session?.error?.message }, 400);
    return json({ url: session.url });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
