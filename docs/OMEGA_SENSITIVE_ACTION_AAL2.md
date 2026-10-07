# Ω Sensitive Action AAL2 Policy

## Status

**LIVE / TESTED**

Supabase Auth exposes an authenticator assurance level in the JWT. \`aal1\` is conventional authentication; \`aal2\` means the session has completed MFA.

## Protected member actions

| Action | Protection | Reason |
|---|---|---|
| Provider job submission | AAL2 | Can initiate external provider work and eventual cost |
| KYC submission | AAL2 | Identity-sensitive operation |
| Account deletion | AAL2 | Destructive account operation |
| Legacy \`submit_exam_result\` | Disabled | Client-supplied score was not a trustworthy credential source |

## Protected owner/admin mutations

Owner mutations now require AAL2 before the state change:

- approve/revoke member access;
- permanent-access revocation;
- KYC intake enable/disable;
- KYC review;
- platform flags;
- contract status;
- reservation status;
- dispatch publication;
- consultancy status.

Stripe webhook processing remains service-to-service and is not forced through a human MFA session.

## Credential integrity correction

The legacy exam-result endpoint accepted an exam ID, score, total, and certificate name from the caller. That made the score client-authoritative.

It is now disabled. The supported Academy flow is:

\`USER ANSWERS → submit_exam_attempt → SERVER-SIDE QUESTION/ANSWER CHECK → academy_exam_results → SERVER-DERIVED SCORE/PASS\`

## Stripe subscription correction

A live defect was found while testing the service-role path: \`profiles.membership_tier\` is an integer rank (1–12), while the Stripe tier metadata is human-readable text.

The subscription writer now maps the canonical names:

\`INITIATE=1, SEEKER=2, ADEPT=3, WARDEN=4, VANGUARD=5, ARCHITECT=6, SOVEREIGN=7, LUMINARY=8, RADIANT=9, UNYIELDING=10, TRANSCENDENT=11, ASCENDANT=12\`

Numeric tier strings 1–12 are also accepted and bounded. Unknown names do not overwrite the existing integer rank.

The deprecated \`auth.role()\` checks were replaced with the JWT role claim for these hardened paths.

## Authorization boundary

\`private.require_aal2()\` is a private security-definer helper that accepts only \`aal2\` and is not executable by client roles.

Protected private implementations remain non-executable directly by \`public\`, \`anon\`, and \`authenticated\`.

## Verification performed

Live transactional probes verified:

- AAL1 is denied for protected member actions.
- AAL1 is denied for owner/admin mutations.
- AAL2 reaches the protected authorization layer.
- Service-role Stripe subscription processing bypasses the human AAL2 requirement.
- Stripe tier \`INITIATE\` correctly maps to membership rank 1.
- The legacy exam-result path remains disabled.
- All probes were rolled back; no synthetic production records were retained.

## Current limitation

AAL2 is not globally mandatory for low-risk browsing and ordinary member operations.

Remaining high-impact classification work should cover:
- other financial/paid mutations;
- credential issuance/revocation beyond the legacy exam endpoint;
- sensitive data export;
- agent actions with external side effects.

## Truth contract

**Protected:** the actions listed above.

**Not globally enforced:** all other member actions.

**Required:** users must enroll and complete MFA before protected actions can execute.
