# Counsel brief: questions to answer before any money or family feature ships

**For:** the owner's lawyer(s). **Jurisdictions requested:** Lebanon, UAE / GCC, United
States, EU / UK (owner decision 2026-10-12: "all of the above").
**Status of this document:** a list of questions with the facts a lawyer needs to answer them.
It is **not legal advice**, and nothing below says what any law requires. The laws and regulators
named are pointers for counsel to confirm, including whether they apply and which version is in
force. The platform must not change any flag below until counsel answers in writing.

## 1. What the platform is today (facts, verified 2026-10-12)

- An invite-and-approval membership site ("SYD OMEGA 91717"): habits, learning, finance
  tracking, media, community. One owner. 9 accounts, 4 approved.
- **No money moves.** `payments`, `subscriptions`, `billing_invoices` and
  `stripe_webhook_events` each have 0 rows. Flags `payments_enabled`,
  `stripe_integration_enabled`, `tokens_enabled`, `creator_earnings_enabled`,
  `ad_network_enabled` and `kyc_intake_enabled` are all `false`.
- Stripe Checkout code exists (`supabase/functions/checkout`, `stripe-webhook`) but is switched
  off.
- "Ω" is shown as points and badges. Nothing can be bought, transferred, cashed out or
  redeemed for money (owner decision 2026-10-12).
- Personal data held: email, display name, optional date of birth, star sign, country,
  profession, bio, learning and habit records, and a private family tree (`family_nodes`,
  0 rows).

## 2. Decisions taken, and the question each one leaves for counsel

### 2.1 Membership tiers (owner chose the 12-tier canon ladder, $9.17 → $917.17)

The billing period (monthly, annual or one-off) is **not yet decided**. Prices are displayed
with "billing not yet enabled".

Questions for every jurisdiction:

1. What must the price display include (tax-inclusive price, currency, period, renewal terms)?
2. If billing is recurring, what are the rules on auto-renewal consent, renewal reminders,
   and cancellation that is as easy as sign-up?
3. Do members have a withdrawal or cooling-off right for digital services, and what is the
   refund policy obligation?
4. Which sales tax, VAT or digital-services tax applies, by whose location?

Pointers to confirm:
- **US:** FTC Act §5, ROSCA, state automatic-renewal laws (e.g. California's).
- **EU:** Consumer Rights Directive (withdrawal right), Digital Content Directive, VAT OSS.
- **UK:** Consumer Contracts Regulations; the subscription-contract rules in the Digital
  Markets, Competition and Consumers Act 2024 (check the commencement date).
- **UAE:** Federal consumer-protection law and VAT.
- **Lebanon:** Consumer Protection Law and e-transactions law (Law 81/2018).

### 2.2 Family accounts (owner chose: adults only, access granted by the owner)

How it works: the owner grants free access to an adult relative and links the account as
"family". Family members are excluded from member-visible lists. Under-18 dates of birth are
refused. When no date of birth exists, the owner attests that the person is an adult.

Questions:

1. Is "free access to relatives" a benefit in kind with any tax or disclosure consequence?
2. What must the privacy notice say about linking accounts, and about the owner seeing a
   relative's activity? The owner sees all member data today.
3. Is owner attestation enough age assurance for an adults-only service in each jurisdiction?
4. If minors are ever added, what consent and verification is required?

Pointers to confirm:
- **US:** COPPA (under 13) and state privacy laws (e.g. CCPA/CPRA).
- **EU / UK:** GDPR Art. 8 and the UK GDPR / Age Appropriate Design Code.
- **UAE:** Federal PDPL (Decree-Law 45/2021); DIFC / ADGM data-protection law if registered
  there.
- **Lebanon:** Law 81/2018, personal-data provisions.

### 2.3 Ω points (owner chose: dormant, non-cash, non-transferable)

Questions:

1. As long as points cannot be bought, sold, transferred or cashed out, are they outside
   e-money, stored-value and virtual-asset rules?
2. Would *selling* points, or letting members exchange them, change that?

Pointers to confirm:
- **EU:** E-Money Directive; MiCA.
- **UK:** E-Money Regulations; FCA cryptoasset regime.
- **UAE:** CBUAE stored-value-facilities regulation; VARA (Dubai); ADGM FSRA.
- **US:** FinCEN money-services-business rules; state money-transmitter laws; the SEC's
  Howey test if points carry any expectation of profit.
- **Lebanon:** Banque du Liban circulars on electronic payments and digital currencies.

### 2.4 Items kept dormant and NOT built (from the owner's 999-point blueprint)

Counsel should confirm these stay off. Each has been read as needing a licence or as likely
unlawful in at least one of the four jurisdictions:

| Blueprint points | What it would do | Why it needs counsel |
|---|---|---|
| 3, 4, 34, 101, 328 | a currency with a 51% founder stake, a public float, a peg and buy-backs | a token issued to the public, with value managed by the issuer, may be a security, e-money or a virtual asset |
| 38, 39, 303, 312, 318, 320 | members receive a share of platform revenue or dividends by tier | a return on payment is the classic sign of an investment contract |
| 41, 61, 299, 304, 805 | commissions and an affiliate "Smart-Link" split | consumer and advertising disclosure; payment-services rules if the platform holds the money |
| 35, 51, 90, 202 | an automatic 20% sweep into gold, silver and rhodium | holding or investing customer funds; commodity dealing |
| 113, 114 | member-to-member lending and "insurance" payouts | lending and insurance are licensed activities |
| 201, 204, 223, 228 | tokenised real estate and resources as member rewards | securities and real-estate law |

Points the owner's review marked **REJECTED** (tax, sanctions or regulator evasion, market
manipulation, offensive cyber operations, covert profiling) are not listed here, because they
will not be built under any legal reading.

## 3. Requested output from counsel

For each jurisdiction:

1. the conditions under which tier billing (2.1) may be switched on;
2. the privacy-notice wording and age-assurance standard for family accounts (2.2);
3. confirmation that non-cash points (2.3) need no licence, and where the line sits;
4. confirmation, or an exception, for each dormant item in 2.4.

The answers go into `GAP_ANALYSIS.md` §S and `scripts/blueprint-truth-map.py`, and only then
does any flag change.
