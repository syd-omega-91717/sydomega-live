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
// precedent instead: a free/cheap public data proxy with no secret-holder identity to protect.
//
// QUOTA PROTECTION (docs/legal/FUNCTION_GO_LIVE.md: "before setting TWELVE_DATA_API_KEY"). The
// endpoint is public and every upstream call spends the key's quota, so three bounded layers sit
// in front of Twelve Data:
//   1. a per-symbol cache (QUOTE_TTL_MS), so N viewers of one symbol cost one upstream call;
//   2. a short negative cache (MISS_TTL_MS), so a bad or unknown symbol cannot be replayed;
//   3. a per-IP limit (IP_LIMIT per minute) and an upstream budget (UPSTREAM_PER_MIN per minute).
// All three live in this isolate's memory. They are best-effort: Supabase may run several
// isolates, each with its own counters, so the real ceiling is roughly isolates x the numbers
// below, and an idle isolate forgets everything. They bound accidental and casual abuse, not a
// determined caller. A hard ceiling needs a shared store, which this function does not have.
//
// Every successful answer carries `as_of`, the time this server fetched the quote, so a page can
// say how old a price is instead of implying it is current.
// Env (Supabase secrets): TWELVE_DATA_API_KEY
const QUOTE_TTL_MS = 5 * 60_000; // a cached quote is served as fresh for 5 minutes
const STALE_MAX_MS = 60 * 60_000; // if upstream fails, a quote up to 1 hour old is served, flagged stale
const MISS_TTL_MS = 60_000; // an unknown symbol is remembered for 1 minute
const IP_LIMIT = 30; // requests per IP per minute
const UPSTREAM_PER_MIN = 6; // Twelve Data's free tier allows 8/min; stay under it
const MAX_ENTRIES = 500; // hard bound on every in-memory map

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};
const json = (b: unknown, s = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json", ...extra } });

type Quote = { price: number; at: number };
const quotes = new Map<string, Quote>();
const misses = new Map<string, number>();
const ipHits = new Map<string, { n: number; reset: number }>();
let upstream = { n: 0, reset: 0 };

function bound<K, V>(m: Map<K, V>) {
  // Maps iterate in insertion order, so dropping the first key drops the oldest.
  while (m.size > MAX_ENTRIES) m.delete(m.keys().next().value as K);
}

function clientIp(req: Request): string {
  const h = req.headers;
  return (h.get("cf-connecting-ip") || (h.get("x-forwarded-for") || "").split(",")[0] || "unknown").trim();
}

// Returns seconds to wait if this IP is over its limit, else 0.
function ipRetryAfter(ip: string, now: number): number {
  const e = ipHits.get(ip);
  if (!e || now >= e.reset) {
    ipHits.set(ip, { n: 1, reset: now + 60_000 });
    bound(ipHits);
    return 0;
  }
  e.n += 1;
  return e.n > IP_LIMIT ? Math.max(1, Math.ceil((e.reset - now) / 1000)) : 0;
}

function takeUpstreamSlot(now: number): boolean {
  if (now >= upstream.reset) upstream = { n: 0, reset: now + 60_000 };
  if (upstream.n >= UPSTREAM_PER_MIN) return false;
  upstream.n += 1;
  return true;
}

const fresh = (q: Quote, symbol: string, stale = false) => ({
  configured: true,
  symbol,
  price: q.price,
  as_of: new Date(q.at).toISOString(),
  ...(stale ? { stale: true } : {}),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  // Public and read-only: GET only (config/omega-edge-function-auth.json, PUBLIC_READONLY).
  if (req.method !== "GET") return json({ error: "method_not_allowed" }, 405);
  try {
    const apiKey = Deno.env.get("TWELVE_DATA_API_KEY");
    if (!apiKey) return json({ configured: false, message: "Stock/ETF price lookup not configured yet." });

    const reqUrl = new URL(req.url);
    const raw = reqUrl.searchParams.get("symbol");
    if (!raw || !/^[A-Za-z0-9.\-]{1,12}$/.test(raw)) {
      return json({ error: "invalid_symbol" }, 400);
    }
    const symbol = raw.toUpperCase();
    const now = Date.now();

    const wait = ipRetryAfter(clientIp(req), now);
    if (wait) return json({ error: "rate_limited" }, 429, { "Retry-After": String(wait) });

    const cached = quotes.get(symbol);
    if (cached && now - cached.at < QUOTE_TTL_MS) {
      return json(fresh(cached, symbol), 200, { "Cache-Control": "public, max-age=60, s-maxage=300" });
    }

    const missAt = misses.get(symbol);
    if (missAt && now - missAt < MISS_TTL_MS) {
      return json({ error: "quote_unavailable" }, 404, { "Cache-Control": "public, max-age=30" });
    }

    // Out of upstream budget: serve what we have, labelled, rather than spend quota we lack.
    if (!takeUpstreamSlot(now)) {
      if (cached && now - cached.at < STALE_MAX_MS) return json(fresh(cached, symbol, true));
      return json({ error: "quote_unavailable", detail: "busy" }, 503, { "Retry-After": "30" });
    }

    const r = await fetch(
      `https://api.twelvedata.com/price?symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`,
    );
    const data = await r.json().catch(() => null);
    const price = Number(data?.price);
    if (!r.ok || data?.status === "error" || !Number.isFinite(price) || price <= 0) {
      // A quota or upstream failure is not proof the symbol is bad, so only a clean
      // "symbol not found" style error (HTTP 400/404 from Twelve Data) is remembered as a miss.
      const code = Number(data?.code);
      if (code === 400 || code === 404) {
        misses.set(symbol, now);
        bound(misses);
      }
      if (cached && now - cached.at < STALE_MAX_MS) return json(fresh(cached, symbol, true));
      const detail = typeof data?.message === "string" ? data.message.split(apiKey).join("").slice(0, 120) : null;
      return json({ error: "quote_unavailable", detail }, 404);
    }

    const q = { price, at: now };
    quotes.set(symbol, q);
    bound(quotes);
    return json(fresh(q, symbol), 200, { "Cache-Control": "public, max-age=60, s-maxage=300" });
  } catch (e) {
    console.error("[market-price]", e);
    return json({ error: "internal_error" }, 500);
  }
});
