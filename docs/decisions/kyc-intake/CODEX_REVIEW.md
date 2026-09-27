# Codex review — KYC document intake (Mode 1, `type=auth` + `type=schema`)

## Round 1 — VERDICT: REVISE

Checked the plan against the eight classes and against the live objects it names:
`profiles` column grants, the `uploads` storage policies, the `guard_profile_privileges`
trigger, and `private.get_platform_flag`.

1. **Class 6 / auth — own-folder is a path test, not an ownership test.** The prefix check
   plus the `uploads write` policy imply the uploader, but the RPC should not lean on a
   policy it does not own. **Fix:** also require `storage.objects.owner_id =
   auth.uid()::text` for the named object.
2. **Class 8 — the path shape was underspecified.** "One segment" must exclude `/`, and
   the length bound must hold before any lookup. **Fix:** the pattern is
   `'^' || uid || '/[^/]{1,255}$'`, checked before the storage query.
3. **Class 2 — a closed flag after upload.** If the flag flips between the page's check
   and the RPC, the RPC answers `intake_closed` after a file already exists. **Fix:** the
   page removes its upload on **any** `ok:false`, not only on errors it expects.
4. **Trigger interaction (checked, no change).** `guard_profile_privileges` runs for a
   definer call too, because `auth.uid()` is set. It does not list `kyc_*`, so the update
   passes. It must stay that way. A test holds that the trigger body still omits those
   columns, so a future edit adding them surfaces here first.

## Round 2 — VERDICT: APPROVED

- Findings 1–3 are folded into the plan's Approach and into the migration (`owner_id`
  check, anchored single-segment pattern, remove-on-any-refusal).
- Finding 4 is recorded as a standing constraint.
- Residual risk is correctly left to the owner: retention and lawful basis. It is the
  reason the flag ships `false`.

## Final decision

Proceed. The server side is applied live but dormant (`kyc_intake_enabled = false`).
Evidence for the success criteria is appended to the migration header once measured.
