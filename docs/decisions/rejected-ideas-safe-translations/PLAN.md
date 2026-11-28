# Status: AWAITING-HUMAN-REVIEW

# The ledger's rejected ideas, and the safe versions that serve what they were for

Written 2026-11-28 by Claude at the owner's request ("find a smart way to solve and fix and find an intelligent solution to make them safe"). Grounded in `docs/OMEGA_999_CONCEPT_REGISTRY.json`
(114 ledger entries REJECTED), `docs/COUNSEL_BRIEF.md`, CLAUDE.md sections 8 and 9, and what exists in the repo today (cited per row).

## Goal

Four rejected ideas stay unbuilt because they would harm real people. This document keeps the *need* behind each one and serves it with a mechanism that does not. Nothing here is
a promise: each row says what is built, what already existed, and what is only a proposal.

## Method

For each idea: (1) what the owner was actually after, (2) why the literal version is rejected, (3) the safe mechanism, (4) how the repo keeps the rejected version from creeping back, (5) status.

| # | Rejected idea | The real need | Why the literal version is out | Safe mechanism | Guard that keeps the bad version out | Status |
|---|---|---|---|---|---|---|
| 1 | **Biometric / DNA locks** | A lock only the real person can open, which survives a stolen password | A biometric cannot be rotated after a leak; DNA exposes relatives who never consented; a static site with Postgres has no hardware attestation | **Passkeys (WebAuthn).** The device keeps a private key behind the user's own fingerprint/face; the server stores a public key only. Revocable, phishing-resistant, no biometric ever leaves the device. Recovery codes for loss. Owner actions already require aal2 (`OmegaMFA`); passkeys become a stronger second factor | `scripts/no-biometric-gate.py` (blocking, in the contract suite): no biometric or genetic table/column, no face-recognition or device-fingerprinting library, no unhedged copy claiming one is real. **Built in this change (merges only when you merge it)** | Gate **built**. Dead "HSM biometric linked" tier strings **removed** from all 7 translation tables. Passkey enrolment: **plan only** (high-risk auth, below) |
| 2 | **Poisoning other AIs' training data** | Stop people training models on the owner's content without permission | Sabotaging other people's systems is an attack on third parties, can corrupt models that harm users, and invites legal exposure | **Say no in the way the law and crawlers recognise.** `robots.txt` entries for AI-training crawlers; a W3C TDM Reservation (`/.well-known/tdmrep.json` and the `tdm-reservation` header) which is the machine-readable opt-out EU copyright law (DSM Directive Art. 4(3)) looks for; licence terms in `terms.html` (counsel's words, not mine); optional C2PA Content Credentials on owner-made media | A test that every public page set the same reservation and that `robots.txt` still blocks private routes | **Proposed, next change** (low risk: static files). Whether to opt out of *every* AI crawler is the owner's policy call; I will ship it as one clearly-commented block the owner can flip |
| 3 | **Covert psychological nudging** | Members who keep their habits and come back | Influence that the person cannot see or refuse is manipulation; it also erodes the trust a membership platform lives on | **Nudges you can see, understand and switch off.** A nudge charter: opt-in; says *why* it appeared; one-tap off; no fake urgency or scarcity, no confirmshaming, no pre-ticked consent, no hidden unsubscribe. Habit features already here (`habits`, `affirmations`, `mood`) keep working under it | A **dark-pattern audit** over the repo's own pages and copy, with a positive control, so a covert pattern fails CI rather than ships | **Proposed, next change.** It may well find real problems in existing copy; I will report them as found |
| 4 | **Regulator evasion** | Not being shut down or fined; keeping the platform alive | Evading a regulator is concealment, which turns a compliance gap into a violation | **Compliance by design.** Ship anything monetisable or legally sensitive **dormant behind a flag** (already the rule, CLAUDE.md section 9; `commerce-contract.py` gates it); keep append-only evidence so the platform can *show* what it did (`docs/OMEGA_ACHIEVEMENT_EVIDENCE_CHAIN.md`); member export and deletion rights; an obligations register **owned by counsel** | The existing dormancy and commerce gates | **Already partly in place.** A regulator-readiness index needs counsel's review before it states anything as law; I will not write legal conclusions |

### The fiction the owner listed with no mechanism, and its real translation

| Fiction | Real mechanism | Exists today? |
|---|---|---|
| Orbital nodes | Multi-region failover and a static fallback | `omega-static-failover.yml` runs on every merge to `main` (seen green); multi-region is **not** built |
| Mars ledger | Append-only, hash-chained evidence with an external anchor | An evidence-chain design exists (`OMEGA_ACHIEVEMENT_EVIDENCE_CHAIN.md`); an external anchor is **proposed** |
| Atomic locks | Two-person or time-delayed approval for destructive actions | Owner-only plus aal2 exists; a delay/second approver is **proposed** |
| Immortality | Backups, a tested restore, and a succession/estate plan | Counsel's matter for the estate part; **no restore drill has been run** (unverified) |
| DNA identity | Passkeys (row 1) | Gate built; enrolment is **plan only** |

## Threat surface (the repo's eight classes, for the one piece that touches auth: passkey enrolment)

1. Stored XSS: enrolment UI sets text with `textContent`; no member-writable text is rendered.
2. Silent-failure writes: every `.rpc()`/Auth call checks `.error` before it shows success (CLAUDE.md section 9).
3. RLS gaps: a `passkey_credentials` table, if one is needed, gets RLS and an explicit `GRANT` in the same migration (both halves, section 8.1 class 6).
4. Column names: checked against `live-schema.json` by `schema-dictionary.py`.
5. Module boundaries: no inline `onclick`; handlers bound with `addEventListener` (the CSP ratchet enforces it).
6. Unguarded RPCs: any RPC is `SECURITY DEFINER` with `REVOKE ... FROM PUBLIC` first, then a narrow grant.
7. Races: one enrolment per credential id (unique index); registration challenge single-use and expiring.
8. Edge cases: lost device (recovery codes, owner break-glass), a second device, an unsupported browser (fall back to the existing TOTP factor, never lock anyone out).

Open question I could not verify from here: whether the Supabase Auth version in use supports WebAuthn as a factor natively (guess: partly, and the API has moved). If it does not, the fallback is a small Edge Function that verifies the WebAuthn assertion against a stored public key. **Check the current Supabase documentation before any migration.**

## Key decisions

- Biometrics are never stored; only public keys are. This is now enforced by a gate, not a promise.
- Every rejected idea is replaced by its safe mechanism, not simply deleted.
- Anything legal (licence wording, obligations, estate) is counsel's. I draft structure, never conclusions.
- Order: gate and copy fix now (done); static opt-out signals and the dark-pattern audit next (low risk); passkey enrolment last and only after this plan is reviewed.

## Risks / open questions

- Passkey enrolment is a real auth change: it needs a human reviewer before code, and a rollback path (the existing TOTP factor stays).
- An AI-crawler opt-out is a policy choice with a cost (less reach in AI answers); it is the owner's to make.
- The dark-pattern audit may surface existing offenders; fixing them is a separate, visible change.
- The i18n removal deletes two keys from seven files; the contract tests pass, but a translator tool outside this repo might still list them.

## Out of scope (stays unbuilt, permanently)

Regulator evasion, poisoning other systems' data, covert behavioural influence, storage of biometric or genetic data.

## Success criteria

- `no-biometric-gate.py` passes on the repo and fails on each planted violation (it does: 10 tests, 6 mutants killed).
- No member-visible string claims a biometric, DNA or HSM identity exists.
- For the next changes: the robots/TDM signals are served and tested; the dark-pattern audit has a positive control and its findings are reported honestly.
- For passkeys: a human has approved this plan; enrolment works on two real devices; a lost device is recoverable; no biometric reaches the server.
