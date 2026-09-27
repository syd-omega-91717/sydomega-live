// SYD OMEGA 91717 — `secrets-health`: prove a key rotation without ever showing a key.
// Decision record: docs/decisions/secrets-health/PLAN.md.
//
// POST { action: "check" | "confirm" }  (owner only; JWT required)
//   -> { ok, checked_at, all_live, keys: [{ name, label, set, live, status, fp, changed }], recorded? }
//
// For each provider secret this Supabase project holds it reports:
//   set     - the secret exists here;
//   live    - the provider accepted it just now (true / false; null = no probe,
//             presence only);
//   status  - the provider's HTTP status only. A provider body is never
//             relayed: some echo request details, and none is needed;
//   fp      - the first 8 hex of SHA-256(key). 32 bits of a hash of a
//             high-entropy secret: enough to tell two keys apart, useless for
//             recovering one;
//   changed - fp differs from the one recorded at the last confirmation
//             (null when nothing was recorded yet).
//
// "confirm" records the fingerprints and the rotation time with the service
// role, so the page cannot claim a rotation the server did not observe. It
// refuses while any set key is failing. The key values never leave this
// function: not in a response, not in a log line.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.112.4";

const allowedOrigin = (origin: string | null) => {
  if (!origin) return null;
  try {
    const url = new URL(origin);
    if (url.protocol !== "https:") return null;
    if (url.hostname === "sydomega.com" || url.hostname.endsWith(".sydomega.com")) return origin;
  } catch {
    // Invalid Origin is not trusted.
  }
  return null;
};

const corsHeaders = (origin: string | null) => {
  const allowed = allowedOrigin(origin);
  return {
    ...(allowed ? { "Access-Control-Allow-Origin": allowed, Vary: "Origin" } : {}),
    "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
};

const json = (body: unknown, status = 200, origin: string | null = null) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

const FP_KEY = "owner_secret_fingerprints";
const ROTATED_KEY = "owner_secrets_rotated_at";
const TIMEOUT_MS = 6000;

// Display names for the Owner Deck, so the page itself names no secret.
const LABELS: Record<string, string> = {
  ANTHROPIC_API_KEY: "ANTHROPIC", STRIPE_SECRET_KEY: "STRIPE", STRIPE_WEBHOOK_SECRET: "STRIPE HOOK",
  RESEND_API_KEY: "RESEND", TWELVE_DATA_API_KEY: "TWELVE DATA", SUPABASE_SERVICE_ROLE_KEY: "SUPABASE",
};

type Probe = (key: string) => Promise<{ live: boolean | null; status: number | null }>;

const http = async (url: string, init: RequestInit): Promise<{ live: boolean; status: number | null }> => {
  try {
    const res = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
    await res.body?.cancel();
    return { live: res.status >= 200 && res.status < 300, status: res.status };
  } catch {
    return { live: false, status: null };
  }
};

// Fixed provider endpoints only (no caller-supplied URL), each a read that
// changes nothing and costs nothing.
const PROBES: Record<string, Probe> = {
  ANTHROPIC_API_KEY: (k) =>
    http("https://api.anthropic.com/v1/models?limit=1", {
      headers: { "x-api-key": k, "anthropic-version": "2023-06-01" },
    }),
  STRIPE_SECRET_KEY: (k) =>
    http("https://api.stripe.com/v1/balance", { headers: { Authorization: `Bearer ${k}` } }),
  RESEND_API_KEY: (k) =>
    http("https://api.resend.com/domains", { headers: { Authorization: `Bearer ${k}` } }),
  TWELVE_DATA_API_KEY: async (k) => {
    // Answers 200 with {status:"error"} for a bad key, so read the flag.
    try {
      const res = await fetch("https://api.twelvedata.com/api_usage", {
        headers: { Authorization: `apikey ${k}` },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      const body = await res.json().catch(() => null);
      return { live: res.ok && !!body && body.status !== "error", status: res.status };
    } catch {
      return { live: false, status: null };
    }
  },
  SUPABASE_SERVICE_ROLE_KEY: (k) => {
    const url = Deno.env.get("SUPABASE_URL");
    if (!url) return Promise.resolve({ live: null, status: null });
    return http(`${url}/rest/v1/platform_settings?select=key&limit=1`, {
      headers: { apikey: k, Authorization: `Bearer ${k}` },
    });
  },
  // No read-only probe exists for a webhook signing secret: presence and
  // fingerprint only.
  STRIPE_WEBHOOK_SECRET: () => Promise.resolve({ live: null, status: null }),
};

const fingerprint = async (value: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest).slice(0, 4)).map((b) => b.toString(16).padStart(2, "0")).join("");
};

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405, origin);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.toLowerCase().startsWith("bearer ")) {
    return json({ ok: false, error: "authentication_required" }, 401, origin);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceKey) return json({ ok: false, error: "not_configured" }, 500, origin);

  // Owner check through the caller's own JWT, so it is exactly the database's
  // rule -- including the aal2 requirement once owner two-factor is enforced.
  // A non-owner learns nothing, not even which secrets exist.
  const asCaller = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
  const who = await asCaller.auth.getUser(authHeader.slice(7).trim());
  if (who.error || !who.data?.user) return json({ ok: false, error: "authentication_required" }, 401, origin);
  const gate = await asCaller.rpc("owner_security_status");
  if (gate.error || !gate.data || gate.data.ok !== true) return json({ ok: false, error: "forbidden" }, 403, origin);

  let action = "check";
  try {
    const body = await req.json();
    if (body && body.action === "confirm") action = "confirm";
  } catch {
    // An empty body is a check.
  }

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const prior = await admin.from("platform_settings").select("text_value").eq("key", FP_KEY).maybeSingle();
  if (prior.error) return json({ ok: false, error: "read_failed" }, 500, origin);
  let before: Record<string, string> = {};
  try { before = prior.data?.text_value ? JSON.parse(prior.data.text_value) : {}; } catch { before = {}; }

  const keys = await Promise.all(Object.keys(PROBES).map(async (name) => {
    const value = Deno.env.get(name);
    const label = LABELS[name] ?? name;
    if (!value) return { name, label, set: false, live: null, status: null, fp: null, changed: null };
    const [probe, fp] = await Promise.all([PROBES[name](value), fingerprint(value)]);
    return { name, label, set: true, live: probe.live, status: probe.status, fp, changed: before[name] ? before[name] !== fp : null };
  }));

  const checkedAt = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const allLive = keys.every((k) => !k.set || k.live !== false);
  const result: Record<string, unknown> = { ok: true, action, checked_at: checkedAt, all_live: allLive, keys };

  if (action === "confirm") {
    if (!allLive) return json({ ...result, ok: false, error: "key_failing" }, 200, origin);
    const fps: Record<string, string> = {};
    keys.forEach((k) => { if (k.fp) fps[k.name] = k.fp; });
    // Supabase resolves {data, error}; it does not throw (CLAUDE.md 8.1 class 1).
    const write = await admin.from("platform_settings").upsert([
      { key: FP_KEY, bool_value: false, text_value: JSON.stringify(fps), updated_at: new Date().toISOString() },
      { key: ROTATED_KEY, bool_value: false, text_value: checkedAt, updated_at: new Date().toISOString() },
    ], { onConflict: "key" });
    if (write.error) return json({ ...result, ok: false, error: "record_failed" }, 200, origin);
    result.recorded = true;
  }

  return json(result, 200, origin);
});
