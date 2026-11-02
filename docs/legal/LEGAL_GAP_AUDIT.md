# Legal gap audit — what the platform says vs. what it does

**Prepared:** 2026-11-01, from the repository at `main` and read-only queries against the live
Supabase project (`ydqhzvvoyufiiqvzcjns`).
**For:** the owner, to hand to a licensed lawyer in each jurisdiction you serve.
**This is not legal advice and does not make anything "legal".** It is an evidence pack: every
claim the member-facing documents make is set against what the code and database actually do,
so counsel starts from facts instead of re-deriving them. Where a legal conclusion is needed it
is marked **COUNSEL**. Confidence is stated as certain / likely / guess.

Scale today (live, 2026-11-01): **9 profiles**, 4 have accepted the terms, 5 hold a date of
birth, 0 hold a phone number, 0 hold an ID-document path, 0 erasure requests, 35 mirrored
`member_state` rows across 2 users, 0 of them finance keys. The exposure below is small *now*
and grows with every member; none of it should be left until the platform opens up.

---

## 1. Findings, ranked

| # | Finding | Evidence | Confidence |
|---|---|---|---|
| 1 | **The erasure promise is not implemented.** The privacy page says personal data "will be permanently deleted within 30 days per GDPR Article 17", and `request_account_erasure()` returns the same sentence. In fact it only soft-deletes: it renames `display_name`, clears `bio`/`avatar_url`/`kyc_doc_path`, sets `erasure_requested_at`, and revokes consents. Email, phone, date of birth, country, nationality, profession and `stripe_customer_id` stay on `profiles`. **No scheduled job exists to finish the deletion**: `cron.job` holds exactly one job (`omega-in-app-notification-delivery`). | `private.request_account_erasure` source (live); `select … from cron.job` | certain |
| 2 | **Even a full deletion would leave most personal data behind.** `private.delete_account()` deletes from six tables plus `profiles` and `auth.users`, and demands an MFA (`aal2`) session. Of the 105 `public` tables with a `user_id` column (130 if `owner_id` and `member_id` tables are counted too), at most **one** has a cascading foreign key to the user; a sample of 13 personal-data tables (`family_nodes`, `member_state`, `heritage_records`, `ai_memory`, `graph_entities`, `activity_feed`, `telemetry_events`, `sovereign_events`, `consent_records`, `notifications`, `user_journeys`, `bloodline_nodes`, `certificates`) has none. A member who never enrolled in MFA cannot self-delete at all. | `private.delete_account` source; `pg_constraint` query | certain (FK count), likely (impact: rows survive as orphans) |
| 3 | **Retention periods are stated but nothing enforces them.** "Event log: 5 years. Consent records: 10 years." There is no retention job (see #1). | privacy page; `cron.job` | certain |
| 4 | **FIXED 2026-11-01 (FIXES_LOG 197): the mirror no longer uploads the 14 finance keys; a guard test fails if a finance page adds one.** Original finding: **Finance data may be uploaded despite the "browser only" design.** The seven finance pages were deliberately kept local-only because of sensitivity (`omega-local-backup.js` header; CLAUDE.md §8.2). But the member-state mirror (`omega-member-state.js`, on every page) uploads *every* `omega*` localStorage key not in a 11-key skip list, and the finance keys (`omega_wealth_assets`, `omega_treasury_*`, `omega_wallet*`, `omega_investments`, `omega_revenue`, …) are not in it. Zero finance rows exist today, so this is latent: the first member to use a finance page would be uploaded. | `omega-member-state.js:119-125`; key names in each page; live count = 0 | certain (code), certain (0 rows today) |
| 5 | **Consent toggles may not control what they describe.** The privacy page offers consent for analytics, personalisation, marketing and presence. `omega-analytics.js` / `omega-speed-insights.js` (Vercel Web Analytics and Speed Insights) contain **no consent check**; the init scripts run on every page. Google Fonts is injected by `bg.js` for every visitor. | `omega-analytics-init.js`, `omega-analytics.js`; `bg.js` fonts link | likely (static reading; confirm in a browser with consent declined) |
| 6 | **Processors are not disclosed.** The privacy page names only Supabase. Not named: Cloudflare (hosting), Vercel (analytics/speed insights, former host), Google (Fonts), Anthropic (the `concierge` assistant sends member messages to it), Stripe and Resend (dormant today), CoinGecko (browser calls it directly for crypto prices), Twelve Data (when `market-price` is keyed), Open-Meteo (browser location for the optional weather panel). Transfers outside Singapore (US providers) have no stated mechanism. | code search; privacy page text | certain (omissions), COUNSEL (what is required) |
| 7 | **"No third-party trackers / data minimisation" conflicts with #5 and #6.** | as above | likely; COUNSEL |
| 8 | **Terms are thin and missing core clauses.** ~3,500 characters of text. Absent: governing law and venue; limitation of liability and warranty disclaimer; minimum age; dispute resolution; termination procedure (it says offenders may be removed "without notice"); payment/subscription/refund/tax terms (needed before `checkout` goes live); a designated agent for the copyright-notice process it describes. | `terms.html` | certain |
| 9 | **Acceptance is a boolean, not a versioned record.** `profiles.terms_accepted` + `terms_accepted_at`. The terms promise "material changes will be surfaced for renewed acceptance", but nothing records *which* version a member accepted, so it cannot be proved. | `profiles` columns | certain |
| 10 | **Date of birth is collected with no age gate.** The form is `<input type="date" id="dob" min="1900-01-01">`; no minimum-age statement in the terms, no enforcement found. | `account.html`, `terms.html` | certain (not found), COUNSEL (requirement) |
| 11 | **Third-party personal data, possibly children's, is stored.** `family_nodes` holds names, relations and zodiac signs of relatives; members enter it, the relatives never see a notice. The privacy page does not mention it. (The "household" exemption does not cover the platform operator.) | `family.html`, `family_nodes` columns | certain (stored), COUNSEL (consequence) |
| 12 | **Health-adjacent pages with no special-category handling.** Pages for fasting, sleep, mood, body, breath, water, workout store entries under `omega*` keys, which the mirror uploads (#4). The privacy page does not mention health data. | page list; mirror prefix | likely; COUNSEL |
| 13 | **Compliance claims that may be read as certifications.** "ISO 27001:2022 · 93 Annex A controls · annual risk assessment", "OWASP ASVS Level 2 compliance target", "Supabase holds SOC 2 Type II". The repository holds no certificate or audit report for the first two. | privacy page; repo search | certain (no evidence in repo); COUNSEL (misrepresentation risk) |
| 14 | **Controller identity is an individual.** "S.Y.D · Lebanese Order of Engineers No. 30875", contact `info@sydomega.com`; no postal address, no legal entity, no EU/UK representative statement, no DPO statement, no lawful-basis table per purpose, and no mention of Lebanese law. | privacy page | certain; COUNSEL |
| 15 | **No breach-notification procedure found** in the repository (searched docs and pages). | repo search | likely (absence of evidence) |
| 16 | **Ownership and succession statements sit inside member-facing pages.** Terms: "The Architect holds absolute ownership … no dilution". `family.html`: a static Succession table (51% / 25.5% / 8.5%) — fixed copy, kept by the owner's decision. These are corporate/estate-law statements, not product facts. | `terms.html`, `family.html` | certain; COUNSEL |
| 17 | **The Ω asset is characterised as "not a currency, security, or investment".** `tokens_enabled=false`. The characterisation is a legal conclusion the owner should not publish without advice. | `terms.html` §4, live `platform_settings` | COUNSEL |
| 18 | **FIXED 2026-11-02 (FIXES_LOG 205): `awards.html` described unbuilt programmes as live.** It said members "can register real external awards" that "appear as verified credentials in the member codex", that "twelve Pioneer badges exist", that annual ceremonies and a December-31 snapshot run, and listed "LEADERBOARD ACTIVE" at 100 members (9 profiles exist). No table, function or job backs any of it (searched `supabase/migrations`, `supabase/functions`, `omega-*.js`; live schema has no award/pioneer/seal/ceremony table). Now labelled PLANNED / TARGET with a plain notice of what is active. Not covered: other pages' present-tense claims. | grep of migrations, functions, modules; `live-schema.json` | certain (no backing found), COUNSEL (whether the old wording misled anyone) |

What checks out (verified live): database region is `ap-southeast-1` (Singapore), matching the
privacy page. `consent_records`, `request_account_erasure`, `export_my_data`, `delete_account`,
`kyc_*` functions exist. ID-document links expire after 60 seconds (`approvals.js:353`).
`kyc_intake_enabled`, `payments_enabled`, `tokens_enabled`, `weekly_digest_enabled`,
`stripe_integration_enabled` are all `false`: no ID documents can be submitted, no money moves,
no digest emails go out. The Supabase security advisor lists two items: leaked-password
protection is **off** (owner toggle in the dashboard), and `omega_private.marketplace_listing_assets`
has RLS on with no policy (probably an intentional deny-all; unconfirmed).

---

## 2. What the platform does with personal data

**Controller / region.** Supabase project in Singapore holds the database, auth and storage.
Hosting is Cloudflare Pages (production since 2026-10-18); analytics scripts are Vercel's.

**Categories held (from `public.profiles` and related tables):** email, display name, date of
birth (`dob`, `birth_date`), phone, country, nationality, profession, bio, avatar, sign/element
(derived from DOB), membership and subscription state, `stripe_customer_id`, ID-document path
and review state, consent records, activity and event logs, AI memory and graph entities,
free-text content in the mirrored `member_state` (journal-style pages), and family-member records.

**Processors and where member data goes**

| Processor | What it receives | Status | In privacy page? |
|---|---|---|---|
| Supabase (Singapore) | everything server-side | live | yes |
| Cloudflare Pages | all page requests (IP, headers) | live | no |
| Vercel Analytics / Speed Insights | page views, performance, IP-derived | live, no consent check found | no |
| Google Fonts | IP of every visitor | live | no |
| Anthropic | member messages to the `concierge` assistant | live | no |
| Anthropic (graphify) | ingested graph content on member action | **held** (not deployed) | no |
| Stripe | customer id, payment data | dormant | no |
| Resend | email address and digest content | dormant | no |
| CoinGecko | browser IP + asset symbols (direct from browser) | live on investment/pulse pages | no |
| Twelve Data | ticker symbols, via `market-price` | dormant until key set | no |
| Open-Meteo | the member's browser location (rounded to ~11 km since FIXES_LOG 204; it was 4 decimals) | live, **only after the member presses SHOW WEATHER** on the dashboard TODAY tab (before: automatically on every `command.html` load) | no |

---

## 3. Remediation, in the order I would do it

**Engineering (I can build; each needs your go-ahead because it changes production data):**

1. **Stop the finance mirror (small, reversible).** Exclude the finance keys from the mirror only,
   without changing the "export everything" behaviour. Restores the original design decision.
2. **A real erasure pipeline.** A `private` function that purges every table with a `user_id`
   (driven by the catalogue, not a hand-kept list), then `profiles` and `auth.users`; run for any
   request older than 30 days by a scheduled job; an `erasure_log` that records *that* it ran
   (not the data). Ship disabled behind a `platform_settings` flag, test on a throwaway account.
   Fix `delete_account` to use the same purge and to work without forcing MFA enrolment.
3. **Retention jobs** that match whatever periods counsel approves.
4. **Gate analytics and fonts on consent** (or self-host fonts as the repo already does for code),
   and record the choice.
5. **Version the terms.** Store the version accepted and re-prompt on change.
6. **Age gate** at the DOB step, at the age counsel specifies.
7. **Complete the data export** (`export_my_data`) against the full table catalogue.

**Documents for counsel to draft or review (I can prepare working drafts to edit):**
privacy notice (controller identity, lawful basis per purpose, processor list, transfers,
retention, rights, complaint route, Lebanese law as applicable); terms of service (the missing
clauses in finding 8); cookie/tracker notice; subscription and refund terms (before payments);
processor agreements or confirmation of the standard ones for each provider in section 2; a
breach-notification procedure; a notice for third parties named in the family registry; a
position on the Ω asset and on the succession/ownership copy.

**Owner actions (outside the code):** switch on leaked-password protection in the Supabase
dashboard; decide whether finance data is ever meant to leave the browser; decide the
registered legal entity and address for the controller.

---

## 4. What I did not verify

- Whether declining consent actually stops analytics in a browser (finding 5 is a static read).
- That `export_my_data` is complete, or what it contains.
- Backup retention at Supabase (the "all backups within 30 days" sentence is the provider's to
  satisfy and is not something this repository controls).
- Anything about Lebanese or other national law, which needs a local lawyer.
- The Sovereign Charter, which the terms reference; it was not part of this pass.
- Runtime behaviour of the newly deployed `rankings` and `snapshot-leaderboard` functions
  (both need a signed-in session; the sandbox cannot reach `supabase.co`).

Reproduce the database facts with `select * from cron.job`, `select pg_get_functiondef(…)` on
`private.request_account_erasure` / `private.delete_account`, and a `pg_constraint` query for
foreign keys to `auth.users` / `public.profiles` with `confdeltype = 'c'`.
