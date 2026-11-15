# Mana & Wardrobe economy — design plan (HIGH-RISK: money, RLS, new RPC, flags)

> **PARTLY SUPERSEDED (2026-11-15, same day it merged). Read this before anything below.**
> This plan treated **mana as a spendable currency** (a `MANA` ledger currency, Stripe mana packs, wardrobe priced in mana, the `mana_*` flags). That was a
> misreading. The owner means mana as **the user's inner power, gained by using the platform, with a sigil**, and the repo already defines it so
> (`config/omega-relearn-sigil-mana.json`: "non-financial ... neverMeans money").
>
> **Withdrawn:** every mention of a MANA currency or ledger account, mana packs, mana prices, buying or spending mana, the `mana_earn_enabled` /
> `mana_purchase_enabled` flags, the "earn-only mana" phase, and decision 5's mana-account point.
> **Replaced by:** `docs/plans/MANA_SIGIL_PLAN.md` (open as PR #1297 when this note was written): mana is derived from the member's own recent activity,
> fades without use, is never sold, never anchored on a chain and never grants authority. Paid cosmetics, if wanted, are sold directly for real money at a
> real price with no virtual currency (`MANA_SIGIL_PLAN.md` §6).
> **Still valid:** §2 (what already exists), §3 (the closed-loop rule is the legal line, to be confirmed by counsel), §4 (sell appearance, never progress), §6
> (threat surface, for any future cosmetics purchase path), §8 (counsel questions, ignoring the mana-specific ones) and the `advance_matrix` prerequisite.
> Nothing in this file is built or approved.

Status: **PROPOSAL. Nothing built, nothing applied, no flag flipped.** Written 2026-11-15.
**Not reviewed by a lawyer or by an adversarial reviewer** (the Codex review step is unavailable: usage limit). Nothing here is legal advice.
**The controller and the governing law are not recorded anywhere in the repo** (`docs/legal/COUNSEL_BRIEF.md`, top); the database is in
Singapore and the owner may be under Lebanese law, neither assessed. Every legal statement below is a *question for counsel*, not a conclusion.

## 1. Goal

Let a member spend a small, closed-loop credit (**mana**) on the **appearance** of their characters (**wardrobe**: clothes, weapon *skins*),
without ever letting money buy progress. The 12 characters are the 12 signs; the main one comes from the member's sign, extra ones from real
progress (`docs/plans/CHARACTER_LAB_PLAN.md`, revision note). Mana and wardrobe are the *monetisable skin* over that, not a way around it.

## 2. What already exists (so nothing is rebuilt)

| Need | Existing thing | Evidence |
|---|---|---|
| Money in, balanced | Double-entry ledger: `omega_ledger_accounts/transactions/entries`, unique `idempotency_key`, `ledger_not_balanced` guard | `20261002013000_create_omega_financial_ledger.sql` |
| Real payments | Stripe `checkout` + `stripe-webhook` → ledger settlement; refund reversal | migrations `...034000`, `20261024110000`; `supabase/functions/` |
| What a member owns | `omega_entitlements` (product, status, source ledger tx); `user_assets(user_id,name,quantity,asset_type,track_name)` — **`track_name` already ties an asset to a sign**; live policy is SELECT-only | `live-schema.json`; `docs/OMEGA_ACHIEVEMENT_EVIDENCE_CHAIN.md` |
| Flags | `platform_settings` (`tokens_enabled=false` is the pattern) | `0006_omega_tokens.sql:14` |
| Progress events | `evolution_events`, `task_completions`, trophies/medals/certificates | evidence-chain doc |

**Conflict to resolve first.** `omega-canon.json` already defines a *token per sign* (ARENITE … ABYSS) and an `economy` block
(total supply 917,170,000,000, 51% master vault), behind `tokens_enabled=false`. Mana must **not** be a 13th token, an alias of one, or
convertible to one. Game-economy practice is blunt about this: every currency needs one purpose a player can explain in a sentence, and a third
or fourth currency "creates confusion" (design-guide sources in §9). Sign tokens stay dormant and out of every mana surface; if they ever go
live that is a separate plan.

## 3. The rule that decides the legal class (verify with counsel)

Secondary sources (law-firm summaries, not primary law) agree on one test: an in-game currency that stays **closed-loop** (cannot be exchanged
for fiat or other crypto-assets, not accepted by third parties) generally sits outside financial/crypto regulation, while an asset that can be
**transferred or traded, or works as an investment, is judged by substance, not by its "game item" label** (ESMA approach as summarised;
MiCA applies to fungible transferable tokens giving access to a service).

**Therefore the design is closed-loop by construction, and stays so:**
- mana: **non-transferable, non-redeemable, no member-to-member gifting, no cash-out, no market, no price shown against any token or fiat
  "value"**;
- wardrobe items: bound to the buyer's account (`user_assets`), not tradable;
- **no randomised paid rewards** (no loot boxes or gacha). That is a separate regulatory area; not assessed here, so excluded.

## 4. What may and may not be sold

| Sell (appearance, convenience) | Never sell (progress, power, identity) |
|---|---|
| Clothes / skins for any of the 12 characters | Authority, axis points (`axis_a/b/c`), `matrix_progress`, phases |
| Weapon **skins** (cosmetic only, zero stats) | Weapons or items with any gameplay/score effect |
| Mana packs; small time-savers that change no score | Unlocking an extra character (that follows real progress) |
| Seasonal / limited **cosmetic** sinks | Medals, trophies, certificates, rankings, tiers' functional unlocks |

Reason: selling progress contradicts the platform's own rule that progress is real (§8.1 class 9) and would make every leaderboard,
certificate and the future hash anchor (`CHAIN_ANCHOR_PLAN.md`) meaningless. "Pay for convenience/cosmetics" vs "pay for power" is also the line
the game-economy sources draw. **Weapons are the risky word**: anything called a weapon must be a skin with no effect, enforced in the schema
(no stat columns on wardrobe items).

## 5. Approach

**Phase 0: documents and counsel** (this PR). **Phase 1: earn-only mana, free cosmetics, no real money** (proves the loop with no payment
exposure). **Phase 2: purchase** (only after counsel answers §8 and a human reviews). **Never: transfer or cash-out.**

**Currency.** Mana is a ledger currency (`currency_code='MANA'`, fits the existing `^[A-Z]{3,12}$` check), one `USER` account per member,
balanced against a `TREASURY` account. No new balance column anywhere; the balance is the ledger sum.

**New schema (Phase 1 needs only this):**
```
public.omega_wardrobe_items(
  item_id text primary key, track_n int not null check (track_n between 1 and 12),
  slot text not null check (slot in ('clothes','weapon_skin','aura')), name text not null,
  price_mana int not null check (price_mana >= 0), active boolean not null default false)
```
RLS on; `SELECT` for `authenticated` where `active`; no write grant. No stat, power or effect column, by design.

**RPC** `public.buy_wardrobe_item(p_item_id text, p_idempotency_key text)`: `SECURITY DEFINER`, `search_path` pinned, `REVOKE ... FROM PUBLIC`
then `GRANT EXECUTE ... TO authenticated`. Uses `auth.uid()` only (never a user id argument). One transaction: check flag, check item active,
check balance from the ledger, post a balanced MANA transaction via the existing `omega_private.post_ledger_transaction` (revoked from public; reachable only from a definer function), insert the `user_assets` row (`asset_type='wardrobe'`,
`track_name` = the character), all keyed by `p_idempotency_key` so a replay returns the first result. Returns the result; the page checks `.error`
before showing success (§8.1 class 1).

**Earning (faucet)** is a server-side function reading *recorded* events only (`evolution_events`/`task_completions`), with a **daily cap per
member**. It is blocked on the `advance_matrix` question (`GAP_ANALYSIS.md` §S): minting credit from forgeable progress is the exact bug.

**Spending (sinks).** Cosmetic permanent items, a few rotating limited cosmetic sinks, and a few aspirational prestige skins. Audit every
faucet against a matching sink before shipping it (inflation control, per the economy-design sources).

**Flags (all `false`)**: `mana_earn_enabled`, `wardrobe_enabled`, `mana_purchase_enabled` (separate, so earn-only can run without any payment).

**UI.** No new page: a WARDROBE tab inside `character.html` next to the roster, reading the catalog and `user_assets`; hidden while flags are off.
Copy stays in future tense until a flag is on (CLAUDE.md §9).

## 6. Threat surface (CLAUDE.md §8.1 mapped)

1. Silent success (class 1): the buy RPC returns an explicit result; the UI shows success only after it. Tests: failure path shows no toast.
2. Spoofing/replay/double-spend (class 6b/7): no client write grants; idempotency key unique; an `ON CONFLICT` naming the exact unique index.
3. Privilege and policy meeting (class 6a/6c): table GRANT *and* policy for the catalog; `REVOKE EXECUTE FROM PUBLIC` before narrowing.
4. Wrong column (class 2): columns checked against `live-schema.json`; regenerate it in the same change.
5. Fabricated money (class 9): prices come from the catalog row, never typed in the page; `scripts/commerce-contract.py` must stay at 0 findings.
6. Refunds: a Stripe refund must reverse mana *and* revoke the asset if the mana was bought (existing refund-reversal pattern); negative balance rule decided in §7.
7. Forged progress feeding the faucet: blocked on the `advance_matrix` finding.

## 7. Decisions needed from the owner

1. **Closed-loop forever?** Recommended: yes, never transferable. Any exception reopens §3.
2. **Gifting between members** (the "link between users" idea): recommended **off**; a gift is a transfer.
3. **Phase 1 first (earn-only, no money)?** Recommended: yes.
4. **Minimum age / audience.** Unknown. Consumer-protection sources single out children; if minors may join, purchase needs a stricter design.
5. **What happens to mana on account deletion.** Note: `omega_ledger_accounts.owner_user_id` is `on delete restrict`, so giving every member a `MANA`
   `USER` account means a member can no longer be hard-deleted (the same already holds for any member with a payment account). Erase vs anonymise:
   ties to `docs/legal/ERASURE_PLAN.md` and COUNSEL_BRIEF D1; decide before Phase 1 creates those accounts.

## 8. Questions for counsel (add to `docs/legal/COUNSEL_BRIEF.md` when the owner names the jurisdiction)

- Is a closed-loop, non-transferable credit bought with real money outside e-money / virtual-asset / payment-service rules in the controller's
  jurisdiction and in each member's country?
- EU consumer rules (CPC Network key principles on in-game virtual currencies, as summarised by the Commission): show the **real-money price**
  of items; no obscuring layered currencies; no pressure to buy excessive currency to progress; clear pre-purchase information; the **14-day
  right of withdrawal, including for unused virtual currency**; fair terms; safeguards for vulnerable users and children. Which apply, and how do
  we word the withdrawal waiver (if one is allowed)?
- Refund and chargeback treatment of spent mana; tax/VAT on digital goods; invoicing.
- Whether wardrobe items need their own terms (licence to use, no ownership).
- Retention vs erasure of purchase records (COUNSEL_BRIEF D1).

## 9. Sources read (excerpts only; primary texts not fully read)

European Commission, *Key Principles on In-Game Virtual Currencies* page and the ICPEN/TLT summaries of the CPC Network action;
BEUC "Game OVER" alert; law-firm survey on blockchain-gaming regulation (closed-loop vs MiCA); Unity game-economy design guide (faucets,
sinks, hybrid currencies); an open game-economy design reference (one purpose per currency, premium currency must not buy competitive advantage,
design for the player who never pays).

## 10. Success criteria

1. Migration applies on the fresh-database replay job; `scripts/audit.py` RLS check passes; `live-schema.json` regenerated.
2. Impersonation tests (`SET LOCAL ROLE authenticated` + `request.jwt.claims`, not `set_config('role',...)`): non-owner cannot INSERT/UPDATE/DELETE the
   catalog or `user_assets`; cannot call the RPC with another user's identity; the same idempotency key twice charges once; a second member never
   sees the first member's balance.
3. With all flags false the WARDROBE tab is not rendered and the RPC refuses.
4. A test proves wardrobe rows and the RPC carry no stat/power field and that no code path writes `axis_*`, `matrix_progress` or `authority`.
5. `./scripts/ci-local.sh` all blocking checks pass.

## 11. Out of scope (stated so it is not assumed)

Sign tokens and the 917-billion-supply economy; NFTs or any asset leaving the platform; marketplace/trading; loot boxes; gifting; cash-out;
crypto payments; paid advertising revenue; the `advance_matrix` fix itself (tracked in `GAP_ANALYSIS.md` §S, a prerequisite).
