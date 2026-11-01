// SYD OMEGA 91717 -- snapshot-leaderboard Edge Function
// Computes AUTH = sqrt(A³+B³+C³)×φ/e for all approved members,
// ranks them, and upserts a daily row into leaderboard_snapshots.
//
// Callable on-demand by the owner (used by leaderboard.html tier 2). No schedule runs it yet.
//
// Contract: POST {}
//   → 200 { ok: true, rows_written: number, snapshot_date: string }
//   → 200 { enabled: false } if service key not configured
//
// Env (Supabase secrets): SUPABASE_URL; API keys via ../_shared/keys.ts

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.112.4";
import { publishableKey, secretKey } from "../_shared/keys.ts";

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

  const serviceKey = secretKey();
  const supabaseUrl = Deno.env.get("SUPABASE_URL");

  if (!serviceKey || !supabaseUrl) {
    return json({ enabled: false, message: "snapshot-leaderboard not configured." }, 200);
  }

  // Owner-only: the caller must present a valid session whose profile has is_owner.
  // The earlier "bearer equals the service key" path for a cron caller was removed
  // before this function was first deployed: comparing a bearer to the admin key is
  // not timing-safe (legacy-key-migration PLAN.md, Phase 1 flagged it "REDESIGN BEFORE
  // DEPLOY"), and no scheduled job calls this function. A schedule can be added later
  // with its own design (pg_cron + a dedicated, timing-safe shared secret).
  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.replace(/^Bearer\s+/i, "")) return json({ error: "unauthorized" }, 401);
  {
    const anonKey = publishableKey() || "";
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

    // Fetch all approved profiles. Family members (profiles.family_of set) are
    // never ranked where members can see: leaderboard_snapshots is readable by
    // every member (docs/decisions/family-access).
    const { data: profiles, error } = await sb
      .from("profiles")
      .select("id, display_name, axis_a, axis_b, axis_c, element, sign, is_owner, subscription_tier")
      .eq("access_approved", true)
      .is("family_of", null);

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
        return json({ error: "snapshot_persist_failed" }, 502);
      }
      rowsWritten += batch.length;
    }

    return json({ ok: true, rows_written: rowsWritten, snapshot_date: snapshotDate, total_members: rows.length });
  } catch (e) {
    console.error("[snapshot-leaderboard] unhandled error:", e instanceof Error ? e.message : "unknown error");
    return json({ error: "snapshot_failed" }, 500);
  }
});
