# Status: AWAITING-HUMAN-REVIEW (no Codex review ran: the repo's Codex bot is at its usage limit; the self-review is in CODEX_REVIEW.md and is not an independent check)

## Goal

Blueprint points 20, 238, 256 (stage certificates and badges). Make **governed certificates issuable and visible for real**, without
pretending the platform can verify progress it cannot.

## Facts (all from the repo; live database NOT checked)

- The canonical project `ydqhzvvoyufiiqvzcjns` is not reachable from this session (the connector lists only `nvgedlxlkdzvcelimbvq`,
  which CLAUDE.md 8.2 says never to touch). **Nothing below is confirmed against the live database.**
- Three stage achievements are seeded (`omega.stage.initiate|architect|prime`, bands 1-3 / 4-6 / 7-9) with
  `requires_verified_progress:true`, `requires_evidence:true` and node `reward_policy.no_auto_award:true`
  (`20261002031000_progression_achievement_productization.sql`). The design already says: never auto-award.
- Governed lifecycle exists in `omega_private` (assign -> verify with evidence -> issue certificate, idempotent):
  `20261002075824_...`. Not callable by members.
- `public.omega_issue_certificate(p_user_id, p_achievement_id, p_certificate_number, p_metadata)` -> `private.omega_issue_certificate`:
  requires auth, **aal2**, `profiles.is_owner=true`, an existing user and an existing achievement definition; unique certificate
  number; writes an `omega_platform_events` row. `authenticated` has EXECUTE (`20261012091641`); **no page calls it**.
- Members read their own rows: `omega_certificates_owner_read` (`auth.uid() = user_id`); `achieve.html` /
  `omega-achieve-native.js:18` already lists them. `omega_verify_certificate(number)` returns status and an 8-char subject ref.
- **Progress is self-attested.** The legacy progression RPC (`0001_omega_master_deploy.sql:~275-345`) takes a member-supplied
  `p_task` string, inserts a `task_completions` row, raises `axis_a/b/c` by a weight and inserts into the legacy `public.certificates`,
  `trophies`, `medals` tables. A dedup is per task string, so any member can reach axis 9 by sending distinct strings (if still the
  live shape; later migrations 0094 and others changed it and were not re-read). `credentials.html` shows those legacy rows.

## Threat surface (the 8 classes)

1. Stored XSS: certificate title / metadata are rendered. Mitigation: textContent / OmegaEsc only.
2. Silent-failure writes: the issue call must check `.error` and the returned row before any success state.
3. RLS: no change. Members keep own-row SELECT only; there is no member INSERT/UPDATE path, and none is added.
4. Column names: verified against `supabase/live-schema.json` by `schema-dictionary.py`.
5. Module boundary: no inline handlers; delegated listener (CSP inline ratchet).
6. Unguarded RPC: none added. The existing one is owner + aal2 guarded server-side; the UI check is cosmetic only.
7. Races: duplicate issue is rejected by the unique certificate number; the UI disables the button while in flight.
8. Edge cases: not owner, not aal2 (RPC raises `aal2_required`-style error), unknown user, unknown achievement, revoked.

## Decision

1. **Do not derive certificates from axis/task progress.** It is member-attested (above), so a certificate derived from it would be a
   fabricated credential (CLAUDE.md 8.1 class 9). Stage-band automation stays closed until a server-graded evidence source exists.
2. **Phase 1 (this change, no migration, no new table/RPC):** an owner-only issuance panel that calls the existing
   `public.omega_issue_certificate` with an explicit achievement, subject and evidence note in `metadata`, behind the existing aal2
   step-up, plus a revoke action calling `public.omega_revoke_certificate`. Members already see their own certificates.
3. Flag: `platform_settings.stage_certificates_enabled` is **not** needed for Phase 1 (owner-only, no member exposure). It would be
   required before any member-facing automation (Phase 2).
4. **Phase 2 (NOT built; needs an owner decision, recorded as NEEDS_DECISION):** what counts as verified evidence (graded exam result,
   owner review of a submission, counterparty confirmation) and whether certificates may lapse.
5. The legacy `certificates` rows on `credentials.html` are progress markers, not credentials; Phase 1 labels the difference.

## Out of scope

Physical stickers, blockchain/NFT deeds, "Sovereign Deed" legal claims, tier-based compute, anything monetized, and auto-promotion.

## Success criteria

- Owner (aal2) can issue and revoke a certificate for an existing member and achievement; the result is read back from the RPC row, not assumed.
- A non-owner and a non-aal2 owner cannot (server rejects; UI shows the real error).
- No member can create, edit or self-issue a certificate by any path touched here.
- All gates pass: schema-dictionary, csp-inline, xss-sink, grant-contract, upsert, i18n, registry.
