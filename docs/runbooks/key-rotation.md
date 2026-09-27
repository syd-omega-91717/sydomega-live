# Key rotation

Every key that appeared in a document outside this repo is treated as compromised. The keys live
only in **Supabase → Project Settings → Edge Functions → Secrets**. They are never in the repo,
never in a page, and never shown by the platform.

For each key: create the new key → set it in Supabase → press VERIFY → revoke the old key → DONE.

| secret | create a new one | revoke the old one |
|---|---|---|
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys | same page |
| `STRIPE_SECRET_KEY` | dashboard.stripe.com → Developers → API keys → Roll key | Stripe expires the old key on the schedule you pick |
| `STRIPE_WEBHOOK_SECRET` | Developers → Webhooks → endpoint → Roll secret | automatic |
| `RESEND_API_KEY` | resend.com → API Keys | same page |
| `TWELVE_DATA_API_KEY` | twelvedata.com → Account → API Keys | same page |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → API Keys → new **secret** key | disable the legacy key once nothing uses it |

Set a secret with `supabase secrets set NAME=value --project-ref ydqhzvvoyufiiqvzcjns`, or in the
dashboard. Never paste a key into a chat, an issue or a document.

**Proof:** the Owner Deck → SECURITY → ROTATE KEYS → **VERIFY** calls `secrets-health`. It shows
each key as rotated (new fingerprint), same key, failing or not set. **DONE** records the new
fingerprints server-side, and it refuses while any key is failing. The platform shows only an
8-character hash of each key, never the key.

Enrol two-factor on both owner accounts first. VERIFY and DONE are owner powers, and once
enforcement is on they require a confirmed code.
