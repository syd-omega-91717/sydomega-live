// SYD OMEGA 91717 — the one place Edge Functions read Supabase API keys.
//
// Supabase's new API keys (sb_secret_… / sb_publishable_…) reach a function as two
// JSON env vars, SUPABASE_SECRET_KEYS and SUPABASE_PUBLISHABLE_KEYS, keyed by name
// ("default" first). The legacy JWT keys stay in SUPABASE_SERVICE_ROLE_KEY /
// SUPABASE_ANON_KEY until the owner deactivates them, which is the point of this
// helper: once every function reads through it and reports key_source=new, the
// legacy keys can be switched off without breaking anything
// (docs/decisions/legacy-key-migration/PLAN.md, Phase 1).
//
// Contract:
// - New key first; the legacy var is a FALLBACK, and every fallback is logged as
//   KEY_SOURCE legacy_fallback (never the value), so Phase 3 is gated on positive
//   evidence of "new", not on the absence of errors.
// - Returns undefined when neither exists, so each caller's existing
//   "not configured" path still runs.
// - Admin clients pass the secret key straight to createClient and never override
//   global.headers.Authorization: supabase-js sends Authorization equal to apikey,
//   which is exactly what the gateway accepts for an sb_ key (verified live
//   2026-10-05; a mismatched Bearer is rejected as a malformed JWT).

type Source = "new" | "legacy_fallback" | "missing";

const reported = new Set<string>();

function report(kind: string, source: Source, detail?: string) {
  const tag = `${kind}:${source}`;
  if (reported.has(tag)) return;
  reported.add(tag);
  const line = { event: "KEY_SOURCE", kind, source, ...(detail ? { detail } : {}) };
  if (source === "new") console.log(JSON.stringify(line));
  else console.warn(JSON.stringify(line));
}

function fromJson(varName: string, prefix: string): string | undefined {
  const raw = Deno.env.get(varName);
  if (!raw) return undefined;
  try {
    const parsed = (JSON.parse(raw) ?? {}) as Record<string, unknown>;
    const value = parsed.default;
    if (typeof value === "string" && value.startsWith(prefix)) return value;
    // No "default": accept a single key of the right kind under any name (the owner
    // may have named it). Two or more without a default is ambiguous -- refuse.
    // Key NAMES are not secret and are what makes this diagnosable from the logs.
    const names = Object.keys(parsed);
    const usable = names.filter((n) => typeof parsed[n] === "string" && (parsed[n] as string).startsWith(prefix));
    if (usable.length === 1) return parsed[usable[0]] as string;
    console.warn(JSON.stringify({
      event: "KEYS_PARSE_FAILED", var: varName,
      reason: usable.length ? "several keys, none named default" : "no key of this kind", names,
    }));
  } catch {
    console.warn(JSON.stringify({ event: "KEYS_PARSE_FAILED", var: varName, reason: "invalid JSON" }));
  }
  return undefined;
}

function resolve(kind: "secret" | "publishable"): { key: string | undefined; source: Source } {
  const fresh = kind === "secret"
    ? fromJson("SUPABASE_SECRET_KEYS", "sb_secret_")
    : fromJson("SUPABASE_PUBLISHABLE_KEYS", "sb_publishable_");
  if (fresh) return { key: fresh, source: "new" };
  const legacyVar = kind === "secret" ? "SUPABASE_SERVICE_ROLE_KEY" : "SUPABASE_ANON_KEY";
  const legacy = Deno.env.get(legacyVar);
  if (legacy) return { key: legacy, source: "legacy_fallback" };
  return { key: undefined, source: "missing" };
}

/** Server-only admin key (bypasses RLS). Never log, return or forward it. */
export function secretKey(): string | undefined {
  const { key, source } = resolve("secret");
  report("secret", source);
  return key;
}

/** Public key for user-scoped clients (RLS applies via the caller's JWT). */
export function publishableKey(): string | undefined {
  const { key, source } = resolve("publishable");
  report("publishable", source);
  return key;
}

/** Which source each key would come from right now — non-secret, safe to return. */
export function keySource(): { secret: Source; publishable: Source } {
  return { secret: resolve("secret").source, publishable: resolve("publishable").source };
}
