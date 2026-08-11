// SYD OMEGA 91717 -- Concierge (optional AI upgrade for /chatbot.html)
// chatbot.html already calls this endpoint today and gracefully falls back to
// its built-in keyword guide (localReply) if this 404s, errors, or is disabled --
// so this function being absent has never been a live bug, only a missed upgrade.
// Contract (already assumed by chatbot.html): POST { message: string, context: {
//   sign, a, b, c, auth, tier, rank } } -> 200 { reply: string }, or any non-200 /
// network error, which the caller silently treats as "use the local guide instead."
//
// Gated the same way checkout/index.ts is: refuses (cleanly, not with a 500) unless
// ANTHROPIC_API_KEY is configured, so deploying this file does nothing until you
// choose to turn it on.
//
// Env (Supabase secrets): ANTHROPIC_API_KEY
//   Optional: SUPABASE_URL, SUPABASE_ANON_KEY (used to attach a display name
//   and recall/store AI memory for signed-in members via ai_memory /
//   recall_ai_context, omega_ai_memory.sql; the endpoint works fine for
//   anonymous visitors too, just without personalization or memory)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

const SYSTEM_PROMPT = `You are the Concierge of SYD OMEGA 91717, a guide who helps members
understand the platform: the 12×12×9×9×9 progression matrix (104,976 nodes), the 12 chambers (Academy, Games,
Contributions, Agents, Honors, Horoscope, Publishing, Marketing, Consultancy, Contracts,
Treasury, Family & Heritage), and how to raise their standing. Speak with warmth and a
touch of ceremony, but always be genuinely useful and concrete -- point members to the
specific page for what they're asking about (e.g. /gaming.html, /academy.html). Keep
replies to 2-4 sentences. If asked about money, tokens, KYC, or identity verification,
say plainly that those features are not live yet. You are not a financial or legal
adviser and must not act like one.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) return json({ enabled: false, message: "Concierge AI is not configured yet." }, 200);

    const body = await req.json().catch(() => ({ message: "", context: {} }));
    const { message, context, system_override } = body as { message: string; context: Record<string, unknown>; system_override?: string };
    if (!message || typeof message !== "string" || !message.trim()) {
      return json({ error: "empty_message" }, 400);
    }
    if (message.length > 2000) return json({ error: "message_too_long" }, 400);
    if (system_override && (typeof system_override !== "string" || system_override.length > 2000)) {
      return json({ error: "system_override_invalid" }, 400);
    }

    // Best-effort: identify the member so the reply can be personalized, and
    // recall their AI memory (ai_memory table / recall_ai_context RPC --
    // omega_ai_memory.sql). Never blocks the request if any of this fails or
    // the visitor is anonymous; a fresh, memory-less reply is always a
    // correct fallback, never an error.
    let displayName = "";
    let memberId: string | null = null;
    let authedSupabase: ReturnType<typeof createClient> | null = null;
    let memoryLine = "";
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (authHeader && supabaseUrl && anonKey) {
      try {
        const supabase = createClient(supabaseUrl, anonKey, {
          global: { headers: { Authorization: authHeader } },
        });
        const { data: u } = await supabase.auth.getUser();
        if (u?.user) {
          memberId = u.user.id;
          authedSupabase = supabase;
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("id", u.user.id)
            .single();
          displayName = profile?.display_name || "";

          const { data: recalled } = await supabase.rpc("recall_ai_context", { p_limit: 5 });
          const mems = recalled?.ok ? (recalled.memories as Array<{ content: string }>) : [];
          if (mems?.length) {
            const summary = mems.map((m) => m.content).filter(Boolean).slice(0, 5).join(" | ");
            if (summary) memoryLine = `Remembered context from prior conversations with this member: ${summary}`;
          }
        }
      } catch {
        // anonymous / lookup / recall failed -- fine, continue without it
      }
    }

    const ctx = context && typeof context === "object" ? context : {};
    const contextLine = `Member context -- sign: ${ctx.sign || "unknown"}, rank: ${ctx.rank || "unknown"}, ` +
      `axes (Knowledge/Mastery/Contribution): ${ctx.a ?? "?"}/${ctx.b ?? "?"}/${ctx.c ?? "?"}, ` +
      `authority: ${ctx.auth ?? "?"} of 27.8367${displayName ? `, name: ${displayName}` : ""}.` +
      (memoryLine ? `\n${memoryLine}` : "");

    // system_override lets agent personas (sovereign.html, agents.html) substitute
    // their own character-specific system prompt. Bounded to 2000 chars (validated above).
    const effectiveSystem = system_override
      ? `${system_override}\n\n${contextLine}`
      : `${SYSTEM_PROMPT}\n\n${contextLine}`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 220,
        system: effectiveSystem,
        messages: [{ role: "user", content: message }],
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return json({ error: "upstream_error", detail }, 502);
    }
    const data = await res.json();
    const reply = data?.content?.[0]?.text?.trim();
    if (!reply) return json({ error: "empty_reply" }, 502);

    // Best-effort: remember this exchange for next time. Never blocks or
    // fails the response -- a reply the member never sees stored is a much
    // smaller problem than a reply that doesn't arrive.
    if (memberId && authedSupabase) {
      try {
        await authedSupabase.from("ai_memory").insert({
          user_id: memberId,
          memory_key: crypto.randomUUID(),
          memory_type: "conversation",
          content: `Member asked: "${message.slice(0, 300)}" -- Concierge replied: "${reply.slice(0, 300)}"`,
          source: "agent",
          agent_name: "concierge",
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
      } catch {
        // memory write failed -- fine, the reply below still goes out
      }
    }

    return json({ reply });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
