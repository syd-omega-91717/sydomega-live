[SETUP.md](https://github.com/user-attachments/files/29040660/SETUP.md)
# Access-request email notifier — setup

This Supabase Edge Function emails s.y.dagher@gmail.com whenever a new member
requests access. The in-app /approvals.html queue keeps working regardless;
this just adds an email ping.

## 1. Get a (free) email API key — Resend
1. Sign up at resend.com with s.y.dagher@gmail.com.
2. Create an API key. Copy it.
   (Until you verify your own domain, Resend lets onboarding@resend.dev send to
   YOUR OWN account email — which is exactly s.y.dagher@gmail.com, so it works.)

## 2. Install the Supabase CLI and link the project
    npm install -g supabase
    supabase login
    supabase link --project-ref ydqhzvvoyufiiqvzcjns

## 3. Add the function
Create this file in your project:
    supabase/functions/notify-access/index.ts
…and paste in the index.ts from this folder.

## 4. Add the secret + deploy
    supabase secrets set RESEND_API_KEY=YOUR_RESEND_KEY
    supabase functions deploy notify-access --no-verify-jwt

Your function URL will be:
    https://ydqhzvvoyufiiqvzcjns.supabase.co/functions/v1/notify-access

## 5. Fire it on new requests — Database Webhook
Supabase Dashboard → Database → Webhooks → Create a new hook:
- Table: public.profiles
- Events: Insert, Update
- Type: HTTP Request
- Method: POST
- URL: the function URL above
- HTTP Headers: Content-Type: application/json

That's it. The function ignores ordinary profile edits (terms, avatar, background)
and only emails you on a real new pending request.

## Later (optional, nicer "from" address)
Verify sydomega.com in Resend, then change FROM in index.ts to
"SYD OMEGA 91717 <access@sydomega.com>" and redeploy.
