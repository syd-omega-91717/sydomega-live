// SYD OMEGA 91717 -- Market Price (stock/ETF quote lookup)
// Fills the gap investment.html's fetchLivePrice() already documents: crypto prices work
// keyless via CoinGecko client-side, but stocks/ETFs need a keyed API, so that has to be a
// server-side proxy per this repo's own secrets convention (ANTHROPIC_API_KEY/STRIPE_* never
// ship client-side). Gated the same way checkout/index.ts gates on STRIPE_SECRET_KEY: works
// once the secret is set, degrades to a clear "not configured" response until then -- never a
// silent failure or a thrown error.
//
// Deliberately no per-user auth check (unlike checkout.ts): investment.html is one of the
// finance pages kept localStorage-only on purpose (CLAUDE.md/GAP_ANALYSIS.md SS4.2) and never
// loads the Supabase client at all -- requiring a login just to look up a public stock price
// would force a new dependency onto a page kept deliberately simple. Matches intel-feed's own
// precedent instead: a free/cheap public data proxy with no secret-holder identity to protect,
// bounded by a short Cache-Control instead of a login wall. Quota exhaustion on the free tier
// degrades to "quote unavailable", not a security issue.
// Env (Supabase secrets): TWELVE_DATA_API_KEY
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
const json = (b: unknown, s = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json", ...extra } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const apiKey = Deno.env.get("TWELVE_DATA_API_KEY");
    if (!apiKey) return json({ configured: false, message: "Stock/ETF price lookup not configured yet." });

    const reqUrl = new URL(req.url);
    const symbol = (req.method === "POST"
      ? (await req.json().catch(() => ({})))?.symbol
      : reqUrl.searchParams.get("symbol")) as string | undefined;
    if (!symbol || !/^[A-Za-z0-9.\-]{1,12}$/.test(symbol)) {
      return json({ error: "invalid_symbol" }, 400);
    }

    const r = await fetch(
      `https://api.twelvedata.com/price?symbol=${encodeURIComponent(symbol.toUpperCase())}&apikey=${apiKey}`,
    );
    const data = await r.json();
    if (!r.ok || data?.status === "error" || !data?.price) {
      return json({ error: "quote_unavailable", detail: data?.message || null }, 404);
    }
    return json(
      { configured: true, symbol: symbol.toUpperCase(), price: Number(data.price) },
      200,
      { "Cache-Control": "public, max-age=60" },
    );
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
