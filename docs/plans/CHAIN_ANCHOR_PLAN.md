# Chain anchor — design plan (HIGH-RISK: new tables, service-role job, external network write)

Status: **PROPOSAL. Nothing built, nothing applied, nothing sent to any chain.** Written 2026-11-15.
**Not reviewed by a lawyer or an adversarial reviewer** (Codex review unavailable: usage limit). Nothing here is legal advice. The controller and
governing law are not recorded in the repo (`docs/legal/COUNSEL_BRIEF.md`).

## 1. Goal

"The blockchain belongs to the platform." Stated precisely: the platform publishes a **fingerprint of its own progress and payment records**
to a public chain, so a member (or anyone) can later prove *this record existed in this form at this time and was not edited*.
It is **proof, not an asset**: no token, no NFT, no balance, nothing a member can sell.

## 2. Uncomfortable facts that shape the design

1. **Today nothing is written to any chain.** `blockchain.html` is an explainer with no web3 code; the only chain code is a *read-only* NFT
   ownership check recorded in `omega_blockchain_ownership_verifications` (written by `service_role`). So this is new, not an extension.
2. **A chain cannot make a forgeable record true.** If a member can raise progress without a real event (`advance_matrix`, `GAP_ANALYSIS.md` §S), the
   anchor would make the forgery permanent and provable. The sources of truth must be append-only and trustworthy *first*.
3. **Per-event on-chain writes are the wrong design**: cost, a public trail of member behaviour, and no way to erase it. One fingerprint per
   period is enough, because a Merkle tree lets one root vouch for thousands of records.
4. **A chain cannot be erased.** So no personal data and no stable member identifier may ever reach it (§6).

## 3. What the sources say (excerpts only, primary specs not fully read)

- OpenTimestamps-style anchoring: calendar servers aggregate many digests into a **Merkle tree** and periodically commit **only the root** to
  Bitcoin in one transaction; any single digest can be proved part of the tree **without revealing the others**; the proof is a small file.
  No wallet, no gas, no key to custody on our side.
- Ethereum L2 anchoring: per-transaction cost on the order of cents (ethereum.org lists an average between about $0.0016 and $0.033; treat as
  indicative), needs a contract and a **signing key we must custody**.
- Running our own chain: needs validators, security and operations for no benefit here. **Rejected.**

## 4. Options

| Option | Cost | Key custody | Privacy | Verdict |
|---|---|---|---|---|
| A. OpenTimestamps (Bitcoin) | none | none | root only | **Phase 1 recommendation** (likely) |
| B. Own contract on an Ethereum L2 | cents/anchor | **yes (HIGH-RISK)** | root only | Phase 3, only if A is not enough |
| C. Own chain | high, ongoing | yes | n/a | Rejected |
| D. One tx per event | high | yes | trail of behaviour | Rejected |

## 5. Approach

**Source of truth stays Postgres.** The anchor is a read-only fingerprint of what already exists:
`evolution_events`, `task_completions`, trophies/medals/certificates, `omega_ledger_transactions` (the chain in
`docs/OMEGA_ACHIEVEMENT_EVIDENCE_CHAIN.md`: EVENT → TASK → VERIFICATION → ACHIEVEMENT → INVENTORY → WORLD).

**Leaf** = `HMAC-SHA256(anchor_secret, canonical_json({type, record_id, content_hash, occurred_at}))`. No `user_id`, no name, no free text. The
secret lives in Supabase secrets, never in client code (CLAUDE.md §9). Deleting a member's mapping from record to leaf makes their leaves
unattributable (crypto-shredding), which is the design answer to §6; counsel must confirm it.

**Tables (new, Phase 1):**
```
public.omega_anchor_batches(batch_id uuid pk, period_start timestamptz, period_end timestamptz, leaf_count int,
  merkle_root text not null, status text check (status in ('BUILT','SUBMITTED','CONFIRMED','FAILED')),
  proof_ref text, created_at timestamptz default now(), unique(period_start, period_end))
public.omega_anchor_receipts(receipt_id uuid pk, user_id uuid not null references auth.users on delete cascade,
  record_type text, record_id uuid, leaf_hash text, batch_id uuid references omega_anchor_batches, merkle_path jsonb)
```
RLS: batches readable by `authenticated` (root and status are public by nature); receipts **own rows only**; **no client write grant on either**;
writes by `service_role` from one scheduled function. `receipts.user_id` cascades on erasure, so deleting a member removes the only link from them
to a leaf; the root on the chain stays valid and reveals nothing.

**Job** (Edge Function on `pg_cron`, `verify_jwt` and in `config.toml` so it deploys): 1) select records created in the period that are not yet
leaves; 2) build leaves, the Merkle tree, per-leaf paths; 3) insert batch + receipts in one transaction; 4) submit the root (Phase 2, option A);
5) later poll the proof and mark `CONFIRMED`. Idempotent on `(period_start, period_end)`; a failed submit leaves the batch `BUILT` and is retried.

**Member verification.** A VERIFY panel inside an existing page (no new page): "This achievement is in batch N; root R; proof status." A member can
recompute the leaf from their own record and the path and compare to the public root. Plain words; "anchored" only when status is `CONFIRMED`.

**Flag** `chain_anchor_enabled=false` (and the submit step behind its own `chain_anchor_submit_enabled=false`), so Phase 1 can build and test
roots with zero external effect.

## 6. Privacy and erasure (the real legal question)

- Leaves hold no member identifier and no content, only an HMAC. Whether an HMAC'd, secret-keyed hash is still personal data, and whether
  deleting the receipt mapping satisfies erasure, is **exactly the open question already in `docs/legal/COUNSEL_BRIEF.md` D2** (hashed identifier).
  Do not go past Phase 1 until counsel answers it.
- `docs/legal/ERASURE_PLAN.md` must list the two new tables.
- Financial records: `omega_ledger_accounts.owner_user_id` is `references auth.users(id) on delete restrict` (and so is `omega_entitlements.user_id`),
  i.e. a member with a ledger account cannot be hard-deleted today. Ledger leaves therefore never change; retention vs anonymisation is counsel's
  call (COUNSEL_BRIEF D1).

## 7. Threat surface (§8.1)

1. Forged source (class 9): prerequisite is an append-only, trustworthy event source; `advance_matrix` first.
2. Anyone writing a fake batch (class 6b): no client write grants; service-role only; `unique(period_start, period_end)`.
3. Silent failure (class 1): a failed submission must set `FAILED`/leave `BUILT` visibly; the UI never says "anchored" before `CONFIRMED`.
4. Secret leakage: HMAC secret only in Supabase secrets; `scripts/check-secrets.sh` before deploy.
5. Overclaim (class 9): copy says "fingerprint recorded on Bitcoin at time T"; never "your data is on the blockchain", "immutable record of you",
   or any claim about value or ownership. `commerce-contract.py` and the overclaim sweeps in `GAP_ANALYSIS.md` §4.17-4.21 are the precedent.
6. Cost/availability: option A has no spend; if the calendar service is down the job retries; nothing user-facing breaks.

## 8. Decisions needed from the owner

1. **Option A first, B only if needed?** Recommended yes: no key custody, no gas.
2. **Which records are in scope** for Phase 1: recommended achievements and ledger transactions only (not every event).
3. **Anchor period**: recommended daily.
4. **Who may verify**: recommended anyone can check a root; only the member sees their receipts.

## 9. Success criteria

1. Phase 1 (no external effect): Merkle root and paths computed in a test from fixtures; recomputing any leaf from a receipt reproduces the
   stored root; a tampered record fails.
2. Impersonation tests: a member cannot read or write another member's receipts nor write any batch; `anon` sees nothing.
3. Erasing a member deletes their receipts and no root changes; the verification path for others still works.
4. With flags false: no job runs, no network call, no UI.
5. `./scripts/ci-local.sh` all blocking checks pass; `supabase/live-schema.json` regenerated.

## 10. Build order

1. Owner decisions (§8) and counsel on §6. 2. `advance_matrix` resolved. 3. Phase 1: tables + job that **builds** batches, no submit. 4. Phase 2:
submit to OpenTimestamps behind its flag. 5. Phase 3: VERIFY panel. 6. Only if needed: option B, with its own plan for key custody.

## 11. Out of scope

Tokens, NFTs, any tradable or ownable on-chain asset; writing member data to a chain; our own chain; one transaction per event; showing
member names or ids publicly; the mana/wardrobe economy (`MANA_WARDROBE_ECONOMY_PLAN.md`).
