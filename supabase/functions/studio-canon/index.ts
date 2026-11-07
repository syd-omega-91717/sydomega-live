// SYD OMEGA 91717 — canonical source for the governed `studio-canon` Edge Function.
// Owner-only delivery of the unreleased Ω Studios Worlds canon (nothing is published yet, so approved members do not see it): POST {} -> { canon } or a typed error.
//
// Why a function and not a static file: every file the site serves is public to anyone who knows its URL; bg.js only
// hides the page. Content that must not be seen without approval has to come from a server that checks approval.
// verify_jwt plus auth.getUser() proves who is calling; _shared/studio-access.mjs decides if that profile is an owner.
//
// No input selects the data: the body is ignored, so there is no path, id or filter to inject into.
// The payload (./worlds-data.ts) is generated from config/omega-studio-worlds.json by
// scripts/studio-worlds-check.py --write-function-data, and the validator fails if it is stale.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.112.4";
import { publishableKey, secretKey } from "../_shared/keys.ts";
import { decideOwner } from "../_shared/studio-access.mjs";
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

// "403_42501" style: the HTTP status and the database error code, letters, digits and underscores only, so it is safe to return to a signed-in caller.
const diagnose = (status: number | undefined, code: string | undefined) =>
  `${status ?? 0}${code ? `_${code}` : ""}`.replace(/[^A-Za-z0-9_]/g, "").slice(0, 24) || "unknown";

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
  let caller: ReturnType<typeof createClient> | null = null;
  try {
    caller = createClient(url, publicKey, { global: { headers: { Authorization: auth } } });
    const { data, error } = await caller.auth.getUser();
    userId = error || !data?.user ? null : data.user.id;
  } catch {
    userId = null;
  }

  let profile = null;
  let profileError = false;
  let reason = ""; // a short fixed-shape diagnostic for a failed profile read: who read it, an HTTP status and a database error code, never a message or a key
  // Read the caller's own `is_owner` flag: first with the caller's own session (row-level security scopes it to that user, the app's own
  // sign-in guard reads the same row the same way, and it does not depend on the server-side key), then, only if that gives no row, with the
  // server-side key. Any failure of both is a 503, a missing row is a 403, and only a literal `true` passes (decideOwner).
  const readProfile = async (client: ReturnType<typeof createClient>, who: string): Promise<boolean> => {
    try {
      const { data, error, status } = await client.from("profiles").select("is_owner").eq("id", userId).maybeSingle();
      if (error) {
        reason = `${who}_${diagnose(status, error.code)}`.slice(0, 24);
        console.error(JSON.stringify({ event: "OWNER_PROFILE_READ_FAILED", who, status, code: error.code ?? null, message: String(error.message ?? "").slice(0, 200) }));
        return false;
      }
      profile = data;
      return true;
    } catch (e) {
      reason = `${who}_thrown`.slice(0, 24);
      console.error(JSON.stringify({ event: "OWNER_PROFILE_READ_THREW", who, message: String((e as Error)?.message ?? e).slice(0, 200) }));
      return false;
    }
  };
  if (userId) {
    let ok = caller ? await readProfile(caller, "own") : false;
    if (!ok || !profile) ok = await readProfile(createClient(url, adminKey), "admin");
    profileError = !ok;
  }

  const verdict = decideOwner(userId, profile, profileError);
  if (!verdict.ok) return json(verdict.status === 503 && reason ? { error: verdict.error, reason } : { error: verdict.error }, verdict.status, origin);
  return json({ canon: WORLDS }, 200, origin);
});
