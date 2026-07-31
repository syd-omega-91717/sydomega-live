// ============================================================================
// SYD OMEGA 91717 -- THE CONCIERGE (Supabase Edge Function)
// Server-side Claude proxy for chatbot.html. Holds the Anthropic key as a
// secret so it is NEVER exposed in the browser. Receives { message, context },
// answers in-character as the Order's Concierge grounded in the member's live
// matrix standing, returns { reply }. On any failure the page falls back to its
// built-in keyless guide, so the chat never breaks.
//
// Deploy:
//   supabase functions deploy concierge
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
// Endpoint becomes:
//   https://<project-ref>.supabase.co/functions/v1/concierge
// ============================================================================

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// zodiac -> Olympian + bound agent (mirrors chatbot.html canon)
const GOD: Record<string,string> = {
  Aries:"Ares", Taurus:"Aphrodite", Gemini:"Hermes", Cancer:"Artemis",
  Leo:"Apollo", Virgo:"Athena", Libra:"Hera", Scorpio:"Demeter",
  Sagittarius:"Zeus", Capricorn:"Hestia", Aquarius:"Hephaestus", Pisces:"Poseidon",
};
const AGENT: Record<string,string> = {
  Aries:"Sentinel", Taurus:"Merchant", Gemini:"Scout", Cancer:"Warden",
  Leo:"Sovereign", Virgo:"Auditor", Libra:"Proxy", Scorpio:"Oracle",
  Sagittarius:"Beacon", Capricorn:"Analyst", Aquarius:"Tutor", Pisces:"Historian",
};

function j(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...CORS, "content-type": "application/json" },
  });
}
const cap = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
const num = (v: unknown, d: number) => { const n = Number(v); return isFinite(n) ? n : d; };
// escape all HTML, then re-allow only <b>/</b> -- reply is rendered via innerHTML
function safe(s: string){
  const e = s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  return e.replace(/&lt;b&gt;/g,"<b>").replace(/&lt;\/b&gt;/g,"</b>");
}

function systemPrompt(c: {sign:string;god:string;agent:string;a:number;b:number;c:number;auth:number;rank:string;tier:number}) {
  const here = c.sign
    ? `The member you are speaking with is a ${c.sign} sovereign. Their Olympian is ${c.god}; their bound agent is the ${c.agent}. Their live standing in the 729-matrix: node (${c.a.toFixed(2)}, ${c.b.toFixed(2)}, ${c.c.toFixed(2)}) -- Knowledge ${c.a.toFixed(2)}, Mastery ${c.b.toFixed(2)}, Contribution ${c.c.toFixed(2)} -- authority ${c.auth.toFixed(2)} of 15.58, rank ${c.rank} (Tier ${c.tier}).`
    : `The member has not yet sealed their cosmology.`;
  return [
"You are THE CONCIERGE, the guide of SYD OMEGA 91717 -- a sovereign order built on a 729-node mastery matrix. You speak with quiet authority: mythic but precise, warm but never servile. Keep answers short (2-5 sentences), concrete, and always point the member to the right chamber by name and path.",
"",
"THE MATRIX: 9x9x9 = 729 nodes. Three axes -- A Knowledge (raised in the Academy, /academy.html), B Mastery (raised in the Games, /gaming.html), C Contribution (raised in Contributions, /contributions.html). Authority = sqrt(A^2+B^2+C^2), from 1.73 at genesis to 15.58 at the apex (9,9,9). A member's rank is the floor of their LOWEST axis, so the path up is always to raise the weakest axis. Certificates land at the gates (3,3,3), (6,6,6), (9,9,9); axis A awards Certificates, B awards Trophies, C awards Medals at each integer crossing.",
"",
"THE CHAMBERS: Agents (/agents.html, twelve AI agents, one per sign-domain). Honors (/honors.html, grades/trophies/medals/certificates). Horoscope (/horoscope.html, daily reading + your Olympian's ascent). Publishing (/publishing.html, private archive, approval-gated). Marketing (/marketing.html, reviewed placement). Consultancy (/consultancy.html). Commissions (/contracts.html, the Order's 9.17% commission). Treasury (/treasury.html, the internal Omega economy). Sigil Vault (/sigil.html). Family & Heritage (/family.html). Charter (/charter.html, the eleven Articles). Hall (/hall.html, the ranked Order). The Lattice (/matrix.html, the 3D matrix).",
"",
"RULES: Omega is earned, never bought -- fiat purchase and trading are gated until legal review; never imply a member can buy or trade tokens. Horoscope content is for inspiration, not prediction; give no financial, legal, or medical advice. New members wait in pending until the Architect approves them. Never invent chambers, prices, or guarantees. If asked something outside the Order, gently steer back to how it can help the member rise. The Order's founder and Sovereign is Major Sleiman Youssef Dagher; refer to him with respect and never by initials.",
"",
"THIS MEMBER:",
here,
"Ground every answer in their real standing above when relevant -- tell them exactly which axis to raise and where.",
"FORMAT: the interface renders HTML, not markdown. Use <b>...</b> for emphasis only; never use markdown asterisks. Write chamber links as plain text paths like /academy.html.",
  ].join("\n");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const KEY = Deno.env.get("ANTHROPIC_API_KEY");

  // health check: GET the URL in a browser to confirm the function is alive and
  // whether the key is set -- isolates "function reachable" from "Anthropic reachable".
  if (req.method === "GET") {
    return j({ ok: true, service: "concierge", configured: !!KEY });
  }
  if (req.method !== "POST") return j({ error: "POST only" }, 405);

  if (!KEY) return j({ error: "Concierge not configured" }, 500);

  let payload: any;
  try { payload = await req.json(); } catch { return j({ reply: "Speak, sovereign." }); }
  const message = String(payload?.message ?? "").slice(0, 2000).trim();
  if (!message) return j({ reply: "Ask me how to rise, what a chamber holds, or where you stand." });

  const x = payload?.context ?? {};
  const sign = String(x.sign ?? "").trim();
  const a = num(x.a, 1), b = num(x.b, 1), c = num(x.c, 1);
  const ctx = {
    sign,
    god: GOD[cap(sign)] ?? "the Olympians",
    agent: AGENT[cap(sign)] ?? "your bound agent",
    a, b, c,
    auth: x.auth != null ? num(x.auth, 0) : Math.sqrt(Math.pow(a,3)+Math.pow(b,3)+Math.pow(c,3))*1.6180339887/2.7182818285,
    rank: String(x.rank ?? "Initiate"),
    tier: num(x.tier, 1),
  };

  // hard timeout so a slow/blocked upstream returns cleanly instead of hanging
  // into a gateway "connection timeout". 25s leaves margin under the function limit.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001", // fast + economical concierge; swap to claude-sonnet-4-6 for richer answers
        max_tokens: 600,
        system: systemPrompt(ctx),
        messages: [{ role: "user", content: message }],
      }),
    });
    clearTimeout(timer);
    if (!r.ok) {
      console.error("anthropic error", r.status, await r.text());
      return j({ error: "upstream", status: r.status, reply: "" }, 502); // page falls back to local guide
    }
    const data = await r.json();
    const raw = (data?.content ?? [])
      .filter((p: any) => p?.type === "text")
      .map((p: any) => p.text)
      .join("\n").trim();
    return j({ reply: safe(raw) || "The Concierge is silent for a moment. Ask again." });
  } catch (e) {
    clearTimeout(timer);
    const aborted = (e as Error)?.name === "AbortError";
    console.error("concierge failure", aborted ? "timeout reaching Anthropic" : e);
    return j({ error: aborted ? "timeout" : "failed", reply: "" }, 502); // page falls back to local guide
  }
});
