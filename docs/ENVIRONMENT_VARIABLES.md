# Ω SYD OMEGA 91717 — Environment Variable Contract

This file is a **name-only contract**. It contains no credentials or provider tokens.

Required production secret/config names include:

- SUPABASE_URL
- SUPABASE_PUBLISHABLE_KEY
- SUPABASE_SECRET_KEY
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- STRIPE_PUBLISHABLE_KEY
- ANTHROPIC_API_KEY
- GEMINI_API_KEY
- PERPLEXITY_API_KEY
- RESEND_API_KEY
- VERCEL_TOKEN
- CLOUDFLARE_API_TOKEN

Store real values only in the appropriate provider secret manager or deployment environment. Never commit secret values to Git.
