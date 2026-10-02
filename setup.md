[SETUP.md](https://github.com/user-attachments/files/29040660/SETUP.md)
# Access-request email notifier — setup

This Supabase Edge Function emails s.y.dagher@gmail.com whenever a new member
requests access. The in-app /approvals.html queue keeps working regardless; this
just adds an email ping.

## 1. Get a (free) email API key — Resend
1. Sign up at resend.com with s.y.dagher@gmail.com.
2. Create an API key.
3. Keep the key in Supabase secrets only; never commit it.

## 2. Create the webhook secret
Generate a high-entropy random value locally, for example:

    openssl rand -hex 32

Store the resulting value only in the Supabase secret manager as
`NOTIFY_ACCESS_WEBHOOK_SECRET`. Do not put it in GitHub or browser code.

## 3. Link the Supabase project

    npm install -g supabase
    supabase login
    supabase link --project-ref ydqhzvvoyufiiqvzcjns

## 4. Add secrets and deploy

    supabase secrets set RESEND_API_KEY=YOUR_RESEND_KEY
    supabase secrets set NOTIFY_ACCESS_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET
    supabase functions deploy notify-access --no-verify-jwt

The function intentionally remains protected by its own shared secret even
though JWT verification is disabled: Supabase Database Webhooks do not use a
member JWT as the trust boundary.

## 5. Configure the Database Webhook

Supabase Dashboard → Database → Webhooks → Create a new hook:

- Table: public.profiles
- Events: Insert, Update
- Type: HTTP Request
- Method: POST
- URL:
  `https://ydqhzvvoyufiiqvzcjns.supabase.co/functions/v1/notify-access`
- HTTP Headers:
  - `Content-Type: application/json`
  - `x-omega-webhook-secret: YOUR_WEBHOOK_SECRET`

The header value must exactly match the value stored in
`NOTIFY_ACCESS_WEBHOOK_SECRET`.

The function ignores ordinary profile edits and only emails on a real new
pending request.

## Later (optional, nicer "from" address)

Verify sydomega.com in Resend, then change FROM in index.ts to
"SYD OMEGA 91717 <access@sydomega.com>" and redeploy.
