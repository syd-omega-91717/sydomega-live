// SYD OMEGA 91717 -- Access-request email notifier
// Triggered by a Supabase Database Webhook on public.profiles.
// Webhook authentication is mandatory: NOTIFY_ACCESS_WEBHOOK_SECRET must be
// configured in Supabase and sent as the x-omega-webhook-secret header.
//
// Filtering:
//   - INSERT: notify a brand-new pending member.
//   - UPDATE: notify only when access_approved enters false and the member is not rejected.
//
// Env (Supabase secrets): RESEND_API_KEY, NOTIFY_ACCESS_WEBHOOK_SECRET

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const NOTIFY_TO = "s.y.dagher@gmail.com";
const FROM = "SYD OMEGA 91717 <onboarding@resend.dev>";

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function matchesWebhookSecret(provided: string, expected: string): Promise<boolean> {
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

function shouldNotify(payload: { type: string; record: any; old_record: any }): boolean {
  if (payload.type === "INSERT") return true;
  if (payload.type === "UPDATE") {
    const was = payload.old_record || {};
    const now = payload.record || {};
    const enteredPending = was.access_approved !== false && now.access_approved === false;
    return enteredPending && now.is_rejected !== true;
  }
  return false;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    const webhookSecret = Deno.env.get("NOTIFY_ACCESS_WEBHOOK_SECRET");
    if (!webhookSecret) return json({ error: "webhook_not_configured" }, 503);

    const providedSecret = req.headers.get("x-omega-webhook-secret") || "";
    if (!providedSecret || !(await matchesWebhookSecret(providedSecret, webhookSecret))) {
      return json({ error: "unauthorized" }, 401);
    }

    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) return json({ sent: false, message: "RESEND_API_KEY not configured yet." });

    const payload = await req.json().catch(() => null);
    if (!payload || !payload.record) return json({ error: "bad_payload" }, 400);
    if (!shouldNotify(payload)) return json({ sent: false, reason: "not_a_new_request" });

    const p = payload.record;
    const name = escHtml(String(p.display_name || "(no name set)"));
    const sign = escHtml(String(p.sign || "unknown sign"));
    const submitted = escHtml(String(p.created_at || p.updated_at || new Date().toISOString()));

    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [NOTIFY_TO],
        subject: `New access request -- ${name}`,
        html:
          `<p>A new member is awaiting access approval.</p>` +
          `<ul>` +
          `<li><b>Name:</b> ${name}</li>` +
          `<li><b>Sign:</b> ${sign}</li>` +
          `<li><b>Requested:</b> ${submitted}</li>` +
          `</ul>` +
          `<p><a href="https://www.sydomega.com/approvals.html">Review in the approvals queue</a></p>`,
      }),
    });

    if (!res.ok) return json({ sent: false, error: "resend_error" }, 502);
    return json({ sent: true });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "notify_access_failed" }, 500);
  }
});
