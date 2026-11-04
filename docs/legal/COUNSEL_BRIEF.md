# Brief for counsel: Ω SYD OMEGA 91717

**What this is.** A single list of the questions that only a lawyer can close, each with the position the
engineering side recommends and a pointer to the evidence. Prepared 2026-11-04 by an AI assistant from the
repository; **it is not legal advice** and nothing in it has been reviewed by a lawyer. Section numbers
below point at `LEGAL_GAP_AUDIT.md` (the audit) and the files named.

**Who the controller is, and which law applies, are not recorded anywhere in the repo.** The owner has to supply
them first; every answer below depends on them. The audit notes the database is in Singapore
(`ap-southeast-1`) and the owner may be subject to Lebanese law; neither has been assessed.

## Questions, in the order they block engineering

### 1. How long must financial records be kept, and may they be kept anonymised? (decision D1)
- **Tables:** `payments`, `billing_invoices`, `subscriptions`, `omega_service_orders`, `commission_contracts`,
  `sovereign_points_ledger` (`config/erasure-policy.json`). Payments are dormant today, so the real exposure
  is small now and grows the day payments go live.
- **Recommended position:** on erasure, keep the row but detach the member (anonymise), never delete it.
- **Ask:** the statutory retention period for invoices and payment records in the controller's jurisdiction;
  whether an anonymised row still counts as the required record; whether the row may keep a hashed member id.
- **Blocks:** the anonymisation migration for those tables (it also needs the live column list).

### 2. What consent and event evidence may or must be kept after erasure? (decision D2)
- **Privacy page promises** consent records are kept 10 years as proof and the event log 5 years (audit #3, #19).
  Today `consent_records` cascades from `profiles`, so deleting a profile destroys the row the page says is kept.
- **Recommended position:** keep a minimal evidence record (consent type, time, a hash of the member id), never
  the member id or free text; delete the rest. Apply the same to `sovereign_events`, `platform_events`, `threat_events`.
- **Ask:** whether a hashed identifier is still personal data here; whether 10 and 5 years are required or only
  promised (if only promised, shorten the promise); whether security logs have a different basis.

### 3. Is a 14-day cooling-off and cancellable erasure acceptable? (decisions D3, D4)
- The privacy page says erasure happens "within 30 days". The engine waits 14 days (`erasure_delay_days`) and
  would run daily, so the longest case is about 15 days. `delete_account()` today deletes immediately but only
  behind an MFA session; the plan makes it a cancellable request instead (`ERASURE_PLAN.md`).
- **Ask:** whether a cooling-off period is compatible with the controller's erasure duty; whether notifying the
  member by email is required; backups (the provider's, up to 30 days per the page).

### 4. Which third parties must the privacy notice name, and on what transfer basis?
The audit (#6 and §2) lists them. Added since: **GitHub Pages** (a static mirror of the site, deployed on
every push to `main`; GitHub sees visitor IPs on that origin if DNS or links ever point at it).

| Processor | Receives | Status |
|---|---|---|
| Supabase (Singapore) | everything server-side | live, named |
| Cloudflare Pages | page requests (IP, headers) | live, not named |
| Vercel Analytics / Speed Insights | page views, performance | live, not named |
| Google Fonts | visitor IP | live, not named |
| Anthropic | member messages to the `concierge` assistant | live, not named |
| CoinGecko, Open-Meteo | browser IP and request (direct from the browser) | live, not named |
| GitHub Pages | visitor IP on the mirror | live as a mirror, not named |
| Stripe, Resend, Twelve Data | payment data, email, ticker symbols | dormant or held |

- **Ask:** the required content of the notice; whether the US providers need a stated transfer mechanism;
  whether Google Fonts and the analytics scripts need prior consent (the audit found no consent check, #5).
  Engineering can self-host the fonts and gate analytics on consent once told what is required.
- **Blocks:** turning on `graphify` (Anthropic), `weekly-digest` (Resend) and payments (`FUNCTION_GO_LIVE.md`).

### 5. Market data licence (Twelve Data)
- The terms (read 2026-11-04) license display to the customer's *own* people only; showing quotes to members is
  "Redistribution" and needs a Redistribution Rights Add-On or separate agreement, with attribution; the endpoint
  is also public. Details in `FUNCTION_GO_LIVE.md`.
- **Ask:** confirm that reading; whether a public endpoint is acceptable under such an add-on; the disclaimer
  wording to show beside prices. **Engineering will not set the key until this is answered.**

### 6. The terms of service and the Ω asset
- The audit (#8, #17) lists missing clauses (payment, refund, tax, liability, governing law) and a statement that
  the Ω asset is "not a currency, security, or investment". The platform keeps `tokens_enabled=false`.
- **Ask:** drafting or review of the terms; a position on the Ω asset before it is ever enabled.

### 7. Age and family records
- Audit #10: date of birth is collected with no age gate. The audit's section 3 also lists a notice for third parties named in the family registry, who have not consented.
- **Ask:** the age threshold; how to treat named relatives (notice, objection, deletion).

## What engineering will do once each is answered
1. D1 and D2: write the anonymisation migrations and the minimal evidence record, then run the production gate.
2. Processors: update the privacy page, self-host fonts, gate analytics on consent, add the missing notices.
3. Terms: wire the versioned acceptance (item 5 of the audit's engineering list in its section 3).

## What this brief does not cover
National law of any country; backup retention at the database provider; the Sovereign Charter referenced by the
terms; anything the audit lists under "What I did not verify".
