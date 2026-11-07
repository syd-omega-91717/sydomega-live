// SYD OMEGA 91717 — canonical source for the governed `studio-canon` Edge Function.
// Approval-gated delivery of the Ω Studios Worlds canon: POST {} -> { canon } or a typed error.
//
// Why a function and not a static file: every file the site serves is public to anyone who knows its URL; bg.js only
// hides the page. Content that must not be seen without approval has to come from a server that checks approval.
// verify_jwt plus auth.getUser() proves who is calling; _shared/studio-access.mjs decides if that profile is approved.
//
// No input selects the data: the body is ignored, so there is no path, id or filter to inject into.
// The payload (./worlds-data.ts) is generated from config/omega-studio-worlds.json by
// scripts/studio-worlds-check.py --write-function-data, and the validator fails if it is stale.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.112.4";
import { publishableKey, secretKey } from "../_shared/keys.ts";
import { decideAccess } from "../_shared/studio-access.mjs";
import { WORLDS } from "./worlds-data.ts";

const allowedOrigin = (origin: string | null) => {
  if (!origin) return null;
  try {
    const url = new URL(origin);
    if (url.protocol !== "https:") return null;
    if (url.hostname === "sydomega.com" || url.hostname.endsWith(".sydomega.com")) return origin;
    if (url.hostname === "sydomega.pages.dev" || url.hostname.endsWith(".sydomega.pages.dev")) return origin;
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

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405, origin);

  const url = Deno.env.get("SUPABASE_URL");
  const publicKey = publishableKey();
  const adminKey = secretKey();
  if (!url || !publicKey || !adminKey) return json({ error: "server_not_configured" }, 503, origin);

  const auth = req.headers.get("Authorization");
  if (!auth?.toLowerCase().startsWith("bearer ")) return json({ error: "not_authenticated" }, 401, origin);

  let userId: string | null = null;
  try {
    const caller = createClient(url, publicKey, { global: { headers: { Authorization: auth } } });
    const { data, error } = await caller.auth.getUser();
    userId = error || !data?.user ? null : data.user.id;
  } catch {
    userId = null;
  }

  let profile = null;
  let profileError = false;
  if (userId) {
    try {
      const admin = createClient(url, adminKey);
      const { data, error } = await admin
        .from("profiles")
        .select("is_owner,access_approved,is_rejected,is_trial,trial_expires_at")
        .eq("id", userId)
        .maybeSingle();
      if (error) profileError = true;
      else profile = data;
    } catch {
      profileError = true;
    }
  }

  const verdict = decideAccess(userId, profile, profileError, Date.now());
  if (!verdict.ok) return json({ error: verdict.error }, verdict.status, origin);
  return json({ canon: WORLDS }, 200, origin);
});
