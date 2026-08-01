// SYD OMEGA 91717 -- Intelligence Feed (legitimate public industry news)
// Pulls real, current headlines from Hacker News' public, free, unauthenticated
// Firebase API -- explicitly designed by HN for exactly this kind of external
// consumption (no scraping, no scanning private systems, no authentication
// bypass). Filters for AI/platform/crypto-industry relevance.
//
// Improvements over v1:
//   - Samples topstories AND beststories lists so high-quality older items
//     aren't missed (each can surface different relevant content)
//   - Deduplicates by story ID before fetching
//   - Graceful partial results: if one list fails, returns what the other gives
//   - Response includes per-item age in hours for display
//   - Cache-Control: public, max-age=300 so CDN/browser reduces cold-fetch cost
//
// Contract: GET -> 200 { items: [{title, url, points, comments, source, age_h}] }

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};
const json = (b: unknown, s = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(b), {
    status: s,
    headers: { ...cors, "Content-Type": "application/json", ...extra },
  });

const KEYWORDS = [
  "ai", "artificial intelligence", "llm", "gpt", "claude", "anthropic", "openai",
  "gemini", "mistral", "agent", "blockchain", "crypto", "web3", "token", "defi",
  "platform", "saas", "startup", "subscription", "membership", "creator economy",
  "gamification", "sovereign", "automation", "open source"
];

function isRelevant(title: string): boolean {
  const t = title.toLowerCase();
  return KEYWORDS.some((k) => t.includes(k));
}

async function fetchIdList(url: string): Promise<number[]> {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!r.ok) return [];
    return (await r.json() as number[]).slice(0, 80);
  } catch {
    return [];
  }
}

async function fetchStory(id: number): Promise<Record<string, unknown> | null> {
  try {
    const r = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, {
      signal: AbortSignal.timeout(3000),
    });
    return r.ok ? r.json() : null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "GET") return json({ error: "method_not_allowed" }, 405);

  try {
    // Fetch both lists concurrently; merge and deduplicate
    const [topIds, bestIds] = await Promise.all([
      fetchIdList("https://hacker-news.firebaseio.com/v0/topstories.json"),
      fetchIdList("https://hacker-news.firebaseio.com/v0/beststories.json"),
    ]);

    const seen = new Set<number>();
    const merged: number[] = [];
    // Interleave top and best so neither dominates
    for (let i = 0; i < Math.max(topIds.length, bestIds.length); i++) {
      if (topIds[i] && !seen.has(topIds[i])) { seen.add(topIds[i]); merged.push(topIds[i]); }
      if (bestIds[i] && !seen.has(bestIds[i])) { seen.add(bestIds[i]); merged.push(bestIds[i]); }
      if (merged.length >= 80) break;
    }

    if (merged.length === 0) return json({ error: "upstream_unavailable" }, 502);

    const stories = await Promise.all(merged.map(fetchStory));

    const nowSec = Date.now() / 1000;
    const relevant = (stories.filter(Boolean) as Record<string, unknown>[])
      .filter((s) => s.title && s.url)
      .filter((s) => isRelevant(s.title as string))
      .slice(0, 15)
      .map((s) => ({
        title: s.title,
        url: s.url,
        points: s.score || 0,
        comments: s.descendants || 0,
        source: "Hacker News",
        age_h: Math.round((nowSec - (s.time as number || nowSec)) / 3600),
      }));

    return json(
      { items: relevant, fetched_at: new Date().toISOString() },
      200,
      { "Cache-Control": "public, max-age=300" }
    );
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
