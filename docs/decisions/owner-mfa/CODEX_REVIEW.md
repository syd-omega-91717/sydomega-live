# Review trail — Owner MFA (grill-me-codex Mode 1, type=auth)

The adversarial review was run in the same session against
`.claude/skills/grill-me-codex/THREAT_MODEL.md`. No separate reviewer model was
available, so the verdict is not presented as independent. That is why `PLAN.md`
carries `AWAITING-HUMAN-REVIEW` and not `APPROVED-BY-CODEX`.

## Round 1 — REVISE

| # | finding | class |
|---|---|---|
| 1 | The first draft put the AAL2 check in the pages (`approvals.html` redirects when `aal1`). A client check is bypassable with a direct REST call, and RLS is the real boundary. | 3, auth |
| 2 | The draft claimed `is_platform_owner()` is "the" owner gate. Measured live: **24** functions test `profiles.is_owner` or `platform_owners` directly and would ignore an AAL check there. | 3, 6 |
| 3 | The draft had no answer to "an owner loses their phone with enforcement on". | 8 |
| 4 | Enrol was one call. Repeated clicks leave unverified factors, and Supabase caps factors per user. | 7 |
| 5 | The QR was to be injected with `innerHTML` from the enroll response. | 1 |
| 6 | "Show enabled after verify" did not require checking `verify`'s `.error`. | 2 |

## Changes (Round 1 → 2)

1. Enforcement moved to `private.is_platform_owner()` (PLAN D1). Pages only add a step-up prompt (phase 2, item 5).
2. Phase 2 lists all 24 by name and makes them a precondition for turning enforcement on.
3. D5: break-glass through the Supabase dashboard. D4: the switch-on order requires two devices per owner. Success criterion 3 is a query that must return 0 rows.
4. `mount()` removes the caller's own unverified TOTP factors before enrolling.
5. QR goes into `<img src>`; the secret and name use `textContent` (D7).
6. Every Auth call's `.error` is checked before any state change. After verify, the factor list is re-read from the server instead of assumed.

## Round 2 — APPROVED (pending human review)

The proposed enforcement function was exercised live inside a single transaction
that was then aborted (`RAISE EXCEPTION`), so nothing persisted. Afterwards
`is_platform_owner()` contains no `aal` test and 0 MFA flag rows exist.

```
before_owner=t
flag_off_owner_aal1=t   flag_off_member=f             <- unchanged while the flag is off
flag_on_owner_aal1=f    flag_on_owner_aal2=t   flag_on_member_aal2=f
```

Residual risk, accepted and recorded in the plan: until phase 2 lands, turning
enforcement on protects 161 policies and 33 functions, not the 24 direct checks.
Enforcement must not be turned on before then.
