// SYD OMEGA 91717 -- Rankings Edge Function
// Computes AUTH = sqrt(A³+B³+C³)×φ/e for all approved members server-side,
// ranks them, and returns the top N with optional caller rank injection.
//
// Contract: POST {} or POST { limit?: number, user_id?: string }
//   → 200 { rankings: RankRow[], my_rank: number|null, total: number }
//   → 200 { enabled: false } if SUPABASE_SERVICE_ROLE_KEY is not set
//
// Env (Supabase secrets): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// The service role key is required so the function can read all profiles
// without being bound by the calling user's RLS policies.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.112.4";

const PHI = 1.6180339887;
const EU  = 2.7182818285;
const APEX = 27.8367;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

function computeAuth(a: number, b: number, c: number): number {
  return Math.sqrt(Math.pow(a, 3) + Math.pow(b, 3) + Math.pow(c, 3)) * PHI / EU;
}

interface Profile {
  id: string;
  display_name: string | null;
  axis_a: number | null;
  axis_b: number | null;
  axis_c: number | null;
  element: string | null;
  sign: string | null;
  is_owner: boolean | null;
  subscription_tier: string | null;
}

interface RankRow {
  rank: number;
  user_id: string;
  display_name: string;
  auth: string;
  axis_a: string;
  axis_b: string;
  axis_c: string;
  element: string;
  sign: string;
  tier: string;
  is_owner: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");

  if (!serviceKey || !supabaseUrl) {
    return json({ enabled: false, message: "Rankings function not configured." }, 200);
  }

  try {
    const body = await req.json().catch(() => ({})) as { limit?: number; user_id?: string };
    const limit = Math.min(Math.max(Number(body.limit) || 50, 1), 200);
    const requestedUserId = typeof body.user_id === "string" ? body.user_id : null;

    // Also try to extract user_id from the auth header (best-effort)
    let callerId: string | null = requestedUserId;
    if (!callerId) {
      const authHeader = req.headers.get("Authorization");
      if (authHeader && supabaseUrl) {
        try {
          const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
          const callerClient = createClient(supabaseUrl, anonKey, {
            global: { headers: { Authorization: authHeader } },
          });
          const { data: u } = await callerClient.auth.getUser();
          if (u?.user) callerId = u.user.id;
        } catch {
          // fine, we just won't highlight the caller
        }
      }
    }

    // Use service role to read all profiles
    const sb = createClient(supabaseUrl, serviceKey);

    const { data: profiles, error } = await sb
      .from("profiles")
      .select("id, display_name, axis_a, axis_b, axis_c, element, sign, is_owner, subscription_tier")
      .eq("access_approved", true);

    if (error) return json({ error: error.message }, 502);

    const rows = (profiles as Profile[] || []);

    // Compute and sort
    const scored = rows.map((p) => {
      const isOwner = Boolean(p.is_owner);
      const a = isOwner ? 9 : Math.max(Number(p.axis_a) || 0.001, 0.001);
      const b = isOwner ? 9 : Math.max(Number(p.axis_b) || 0.001, 0.001);
      const c = isOwner ? 9 : Math.max(Number(p.axis_c) || 0.001, 0.001);
      const auth = isOwner ? APEX : computeAuth(a, b, c);
      return { p, a, b, c, auth, isOwner };
    });

    scored.sort((x, y) => y.auth - x.auth);

    // Assign ranks
    let myRank: number | null = null;
    const rankings: RankRow[] = [];

    scored.forEach((item, i) => {
      const rank = i + 1;
      if (item.p.id === callerId) myRank = rank;
      if (i < limit) {
        rankings.push({
          rank,
          user_id: item.p.id,
          display_name: (item.p.display_name || "SOVEREIGN MEMBER").toUpperCase(),
          auth: item.auth.toFixed(4),
          axis_a: item.a.toFixed(3),
          axis_b: item.b.toFixed(3),
          axis_c: item.c.toFixed(3),
          element: (item.p.element || "").toUpperCase(),
          sign: (item.p.sign || "").toUpperCase(),
          tier: (item.p.subscription_tier || "free").toUpperCase(),
          is_owner: item.isOwner,
        });
      }
    });

    return json({ rankings, my_rank: myRank, total: scored.length });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
