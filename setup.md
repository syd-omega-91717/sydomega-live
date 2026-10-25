# Access-request emails — setup

`notify-access` emails the owner when someone requests access, and emails the
member when permanent access is granted. The approvals queue
(`/approvals.html`) and the in-app bell work without any of this; email is an
addition.

How it is wired (migration `20261025100000_access_request_alerts.sql`):

- A trigger on `public.profiles` posts to the function through `pg_net` on two
  transitions only: a new profile (`access_requested`) and the start of
  permanent access (`access_granted`). A 9-minute trial is never emailed.
- The webhook secret is generated inside the database into Vault
  (`notify_access_webhook_secret`). The function reads it through the
  service_role-only `public.omega_notify_access_secret()`. Nobody sets or sees
  it, and no Database Webhook needs configuring in the dashboard.
- Nothing is sent until the function URL is stored in Vault as
  `notify_access_url` (done once, live), and `RESEND_API_KEY` is set.

## Owner steps

1. **Resend account.** Sign up at resend.com with s.y.dagher@gmail.com and
   create an API key.
2. **Store the key.** Supabase Dashboard → Edge Functions → Secrets → add
   `RESEND_API_KEY`. Never commit it or paste it anywhere else.
   From this point, owner alerts work. Resend's test sender
   (`onboarding@resend.dev`) delivers only to the Resend account's own
   address, which is why the owner alert works before any domain setup.
3. **Member emails (optional, recommended).** In Resend, add and verify
   `sydomega.com` (it gives you DNS records to add at your domain registrar).
   Then add the secret `MEMBER_EMAIL_FROM`, for example
   `SYD OMEGA 91717 <access@sydomega.com>`. Until it exists, member emails
   report `member_email_sender_not_configured` and send nothing.

Optional overrides: `NOTIFY_OWNER_TO` (owner address) and `NOTIFY_FROM`
(sender for owner alerts).

## Deploy (done by a session, not by hand)

    supabase functions deploy notify-access --no-verify-jwt

JWT verification is off because the caller is the database, not a member. The
function rejects any request whose `x-omega-webhook-secret` header does not
match the Vault secret.
