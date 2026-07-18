// SYD OMEGA 91717 -- Intelligence Feed (legitimate public industry news)
// Pulls real, current headlines from Hacker News' public, free, unauthenticated
// Firebase API -- explicitly designed by HN for exactly this kind of external
// consumption (no scraping, no scanning private systems, no authentication
// bypass). Filters for AI/platform/crypto-industry relevance. This replaces
// the "crawl foreign servers to neutralize competitors" request with what's
// actually legal: reading public information everyone is allowed to read.
//
// Contract: GET -> 200 { items: [{title, url, points, comments, source}] }

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

const KEYWORDS = [
  "ai", "artificial intelligence", "llm", "gpt", "claude", "anthropic", "openai",
  "blockchain", "crypto", "web3", "token", "defi", "platform", "saas", "startup",
  "subscription", "membership", "creator economy", "gamification"
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "GET") return json({ error: "method_not_allowed" }, 405);

  try {
    // top stories -- HN's own public index, refreshed constantly by HN itself
    const topRes = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json");
    if (!topRes.ok) return json({ error: "upstream_unavailable" }, 502);
    const topIds: number[] = (await topRes.json()).slice(0, 60);

    const stories = await Promise.all(
      topIds.map((id) =>
        fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then((r) => (r.ok ? r.json() : null))
      )
    );

    const relevant = stories
      .filter((s) => s && s.title && s.url)
      .filter((s) => {
        const t = s.title.toLowerCase();
        return KEYWORDS.some((k) => t.includes(k));
      })
      .slice(0, 12)
      .map((s) => ({
        title: s.title,
        url: s.url,
        points: s.score || 0,
        comments: s.descendants || 0,
        source: "Hacker News (public)",
      }));

    return json({ items: relevant, fetched_at: new Date().toISOString() });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
