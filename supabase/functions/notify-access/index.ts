// SYD OMEGA 91717 -- Access-request email notifier
// Spec: see /setup.md (already in this repo). Emails s.y.dagher@gmail.com whenever
// a new member requests access. /approvals.html keeps working regardless of whether
// this is deployed -- this only adds an email ping on top of it.
//
// Trigger: a Supabase Database Webhook on public.profiles, Insert + Update, POSTing
// the standard Supabase webhook payload: { type, table, record, old_record, schema }.
//
// Filtering (per setup.md -- "ignores ordinary profile edits and only emails on a
// real new pending request"):
//   - INSERT: always notify (a brand-new member is, by definition, a new pending
//     request awaiting approval).
//   - UPDATE: only notify if this update just moved the member INTO a pending state
//     (access_approved flipped to false/unset and they are not marked rejected) --
//     i.e. a resubmission -- not on ordinary self-edits like terms/avatar/background,
//     which never touch access_approved.
//
// Env (Supabase secrets): RESEND_API_KEY

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const NOTIFY_TO = "s.y.dagher@gmail.com";
// Per setup.md: works out of the box pre-domain-verification since Resend's
// onboarding@resend.dev sender can send to your own account email. Once
// sydomega.com is verified in Resend, change this to
// "SYD OMEGA 91717 <access@sydomega.com>" as the setup doc says.
const FROM = "SYD OMEGA 91717 <onboarding@resend.dev>";

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return json({ sent: false, error: "resend_error", detail }, 502);
    }
    return json({ sent: true });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
