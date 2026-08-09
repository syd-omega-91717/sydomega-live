// SYD OMEGA 91717 -- snapshot-leaderboard Edge Function
// Computes AUTH = sqrt(A³+B³+C³)×φ/e for all approved members,
// ranks them, and upserts a daily row into leaderboard_snapshots.
//
// Meant to run on a daily schedule (e.g. Supabase cron at 00:05 UTC).
// Also callable on-demand by the owner (used by leaderboard.html tier 2).
//
// Contract: POST {}
//   → 200 { ok: true, rows_written: number, snapshot_date: string }
//   → 200 { enabled: false } if service key not configured
//
// Env (Supabase secrets): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");

  if (!serviceKey || !supabaseUrl) {
    return json({ enabled: false, message: "snapshot-leaderboard not configured." }, 200);
  }

  // Require caller to be authenticated as the owner, or be the scheduled cron
  // job calling with the service_role key directly. The previous check only
  // verified an Authorization header was present -- not that it was valid or
  // belonged to the owner -- so any authenticated member could trigger this.
  const authHeader = req.headers.get("Authorization") || "";
  const bearer = authHeader.replace(/^Bearer\s+/i, "");
  if (!bearer) return json({ error: "unauthorized" }, 401);

  const isServiceCall = bearer === serviceKey;
  if (!isServiceCall) {
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    try {
      const callerClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: u } = await callerClient.auth.getUser();
      if (!u?.user) return json({ error: "unauthorized" }, 401);
      const { data: callerProfile } = await createClient(supabaseUrl, serviceKey)
        .from("profiles")
        .select("is_owner")
        .eq("id", u.user.id)
        .single();
      if (!callerProfile?.is_owner) return json({ error: "owner_only" }, 403);
    } catch {
      return json({ error: "unauthorized" }, 401);
    }
  }

  try {
    const sb = createClient(supabaseUrl, serviceKey);

    // Fetch all approved profiles
    const { data: profiles, error } = await sb
      .from("profiles")
      .select("id, display_name, axis_a, axis_b, axis_c, element, sign, is_owner, subscription_tier")
      .eq("access_approved", true);

    if (error) return json({ error: error.message }, 502);

    const rows = (profiles as Profile[] || []);
    const snapshotDate = new Date().toISOString().slice(0, 10);

    // Compute AUTH, sort, assign ranks
    const scored = rows.map((p) => {
      const isOwner = Boolean(p.is_owner);
      const a = isOwner ? 9 : Math.max(Number(p.axis_a) || 0.001, 0.001);
      const b = isOwner ? 9 : Math.max(Number(p.axis_b) || 0.001, 0.001);
      const c = isOwner ? 9 : Math.max(Number(p.axis_c) || 0.001, 0.001);
      const auth = isOwner ? APEX : computeAuth(a, b, c);
      return { p, a, b, c, auth, isOwner };
    });

    scored.sort((x, y) => y.auth - x.auth);

    // Build upsert rows
    const snapshotRows = scored.map((item, i) => ({
      user_id:        item.p.id,
      snapshot_date:  snapshotDate,
      authority:      parseFloat(item.auth.toFixed(4)),
      axis_a:         parseFloat(item.a.toFixed(3)),
      axis_b:         parseFloat(item.b.toFixed(3)),
      axis_c:         parseFloat(item.c.toFixed(3)),
      rank_global:    i + 1,
      display_name:   item.p.display_name || null,
      element:        item.p.element || null,
      sign:           item.p.sign || null,
      tier:           item.p.subscription_tier || "free",
      is_owner:       item.isOwner,
    }));

    // Upsert in batches of 100 to stay within edge function memory limits
    const BATCH = 100;
    let rowsWritten = 0;
    for (let i = 0; i < snapshotRows.length; i += BATCH) {
      const batch = snapshotRows.slice(i, i + BATCH);
      const { error: uErr } = await sb
        .from("leaderboard_snapshots")
        .upsert(batch, { onConflict: "user_id,snapshot_date", ignoreDuplicates: false });
      if (uErr) {
        console.error("Snapshot upsert error:", uErr.message);
      } else {
        rowsWritten += batch.length;
      }
    }

    return json({ ok: true, rows_written: rowsWritten, snapshot_date: snapshotDate, total_members: rows.length });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
