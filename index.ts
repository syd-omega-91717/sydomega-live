// SYD OMEGA 91717 — access-request email notifier
// Supabase Edge Function. Emails the Architect when a new member requests access.
// Path in your repo/CLI project: supabase/functions/notify-access/index.ts

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const OWNER_EMAIL = "s.y.dagher@gmail.com";
// Use Resend's test sender until you verify your own domain, then switch to e.g. "SYD OMEGA <access@sydomega.com>"
const FROM = "SYD OMEGA 91717 <onboarding@resend.dev>";

serve(async (req) => {
  try {
    const payload = await req.json();
    const record = payload.record ?? {};
    const old = payload.old_record ?? {};

    // Only email on a genuinely NEW pending access request — ignore terms/avatar/bg updates etc.
    const isNewRequest =
      !!record.access_requested_at &&
      record.access_approved === false &&
      (!old || old.access_requested_at !== record.access_requested_at);

    if (!isNewRequest) {
      return new Response(JSON.stringify({ skipped: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const email = record.email ?? "(unknown email)";
    const sign = record.sign ?? "—";
    const when = record.access_requested_at ?? new Date().toISOString();

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: OWNER_EMAIL,
        subject: "Ω SYD OMEGA — New access request",
        html:
          `<div style="font-family:monospace;background:#07070b;color:#e9e6dc;padding:24px">` +
          `<h2 style="color:#C9A84C">Ω New access request</h2>` +
          `<p><b style="color:#C9A84C">Email:</b> ${email}</p>` +
          `<p><b style="color:#C9A84C">Sign:</b> ${sign}</p>` +
          `<p><b style="color:#C9A84C">Requested:</b> ${when}</p>` +
          `<p style="margin-top:16px">Admit or revoke at ` +
          `<a style="color:#00E5FF" href="https://www.sydomega.com/approvals.html">/approvals.html</a></p>` +
          `</div>`,
      }),
    });

    const out = await res.json();
    return new Response(JSON.stringify({ sent: true, resend: out }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
