// SYD OMEGA 91717 -- Access-request email notifier
// Called by the private._dispatch_access_email() trigger on public.profiles
// (migration 20261025100000_access_request_alerts) through pg_net.
//
// Events:
//   access_requested  email the owner: a new member is waiting in approvals.
//   access_granted    email the member: permanent access has started.
//                     Trials are never sent here; the trigger filters them.
//
// Authentication: the caller must send x-omega-webhook-secret equal to the
// Vault secret notify_access_webhook_secret, which this function reads through
// public.omega_notify_access_secret() with the service-role key. Neither the
// owner nor any client ever handles that value.
//
// Env (Supabase secrets):
//   RESEND_API_KEY      required to send anything (the owner sets it).
//   NOTIFY_OWNER_TO     owner address; defaults to the platform owner's.
//   NOTIFY_FROM         sender for owner alerts; defaults to Resend's test
//                       sender, which can only deliver to the Resend account's
//                       own address.
//   MEMBER_EMAIL_FROM   sender for member emails, on a domain verified in
//                       Resend. Unset = member emails stay dormant.

import { secretKey } from "../_shared/keys.ts";

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const SITE = "https://www.sydomega.com";
const DEFAULT_OWNER_TO = "s.y.dagher@gmail.com";
const DEFAULT_FROM = "SYD OMEGA 91717 <onboarding@resend.dev>";
const SECRET_TTL_MS = 5 * 60 * 1000;
const EMAIL_RE = /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/;

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

async function sameSecret(provided: string, expected: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(provided)),
    crypto.subtle.digest("SHA-256", enc.encode(expected)),
  ]);
  const left = new Uint8Array(a);
  const right = new Uint8Array(b);
  let diff = left.length ^ right.length;
  for (let i = 0; i < Math.min(left.length, right.length); i++) diff |= left[i] ^ right[i];
  return diff === 0;
}

let cached: { value: string; at: number } | null = null;

async function expectedSecret(): Promise<string | null> {
  if (cached && Date.now() - cached.at < SECRET_TTL_MS) return cached.value;
  const url = Deno.env.get("SUPABASE_URL");
  const key = secretKey();
  if (!url || !key) return null;
  const res = await fetch(`${url}/rest/v1/rpc/omega_notify_access_secret`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: "{}",
  });
  if (!res.ok) {
    console.warn(JSON.stringify({ event: "NOTIFY_ACCESS_SECRET_UNAVAILABLE", status: res.status }));
    return null;
  }
  const value = await res.json().catch(() => null);
  if (typeof value !== "string" || value.length < 32) return null;
  cached = { value, at: Date.now() };
  return value;
}

async function send(apiKey: string, from: string, to: string, subject: string, html: string) {
  const res = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
  if (!res.ok) {
    // Resend's error body names the cause (unverified domain, test-sender limits);
    // it carries no secret, so it is logged for the owner to diagnose.
    console.warn(JSON.stringify({ event: "RESEND_REJECTED", status: res.status, body: (await res.text()).slice(0, 300) }));
    return json({ sent: false, error: "resend_error", status: res.status }, 502);
  }
  return json({ sent: true });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    const expected = await expectedSecret();
    if (!expected) return json({ error: "webhook_not_configured" }, 503);
    const provided = req.headers.get("x-omega-webhook-secret") || "";
    if (!provided || !(await sameSecret(provided, expected))) return json({ error: "unauthorized" }, 401);

    const payload = await req.json().catch(() => null);
    const event = payload && payload.event;
    const m = payload && payload.member;
    if (!m || typeof m !== "object" || (event !== "access_requested" && event !== "access_granted")) {
      return json({ error: "bad_payload" }, 400);
    }

    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) return json({ sent: false, reason: "resend_api_key_not_configured" });

    const name = escHtml(String(m.display_name || "(no name set)"));

    if (event === "access_requested") {
      const sign = escHtml(String(m.sign || "unknown sign"));
      const when = escHtml(String(m.requested_at || new Date().toISOString()));
      const email = typeof m.email === "string" && EMAIL_RE.test(m.email) ? escHtml(m.email) : "(no email)";
      return await send(
        apiKey,
        Deno.env.get("NOTIFY_FROM") || DEFAULT_FROM,
        Deno.env.get("NOTIFY_OWNER_TO") || DEFAULT_OWNER_TO,
        `New access request -- ${name}`,
        `<p>A new member is waiting for your decision.</p>` +
          `<ul><li><b>Name:</b> ${name}</li><li><b>Email:</b> ${email}</li>` +
          `<li><b>Sign:</b> ${sign}</li><li><b>Requested:</b> ${when}</li></ul>` +
          `<p><a href="${SITE}/approvals.html">Open the approvals queue</a></p>`,
      );
    }

    // access_granted: stays dormant until a verified-domain sender is configured,
    // because Resend's test sender cannot deliver to anyone but the account owner.
    const memberFrom = Deno.env.get("MEMBER_EMAIL_FROM");
    if (!memberFrom) return json({ sent: false, reason: "member_email_sender_not_configured" });
    if (typeof m.email !== "string" || !EMAIL_RE.test(m.email)) return json({ sent: false, reason: "member_has_no_email" });

    return await send(
      apiKey,
      memberFrom,
      m.email,
      "You're in -- welcome to SYD OMEGA 91717",
      `<p>Hello ${name},</p>` +
        `<p>Your request has been approved, and your membership is now active.</p>` +
        `<p><a href="${SITE}/account.html">Sign in to begin</a></p>` +
        `<p>-- SYD OMEGA 91717</p>`,
    );
  } catch (e) {
    console.warn(JSON.stringify({ event: "NOTIFY_ACCESS_FAILED", error: e instanceof Error ? e.message : String(e) }));
    return json({ error: "notify_access_failed" }, 500);
  }
});
