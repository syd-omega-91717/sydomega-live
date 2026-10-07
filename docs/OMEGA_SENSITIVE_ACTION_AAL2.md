# Ω Sensitive Action AAL2 Policy

## Status

**LIVE / TESTED**

The platform now enforces Supabase Auth **AAL2** for selected high-impact member actions.

Supabase defines \`aal1\` as conventional authentication and \`aal2\` as authentication completed with an additional MFA factor. The current JWT exposes this as the \`aal\` claim.

## Protected actions

| Action | Protection | Reason |
|---|---|---|
| Provider job submission | AAL2 | Can initiate external provider work and eventual cost |
| KYC submission | AAL2 | Identity-sensitive operation |
| Account deletion | AAL2 | Destructive account operation |
| Legacy \`submit_exam_result\` | Disabled | Client-supplied score was not a trustworthy credential source |

## Credential integrity correction

The legacy function accepted an exam ID, score, total, and certificate name from the caller. That made the score client-authoritative.

The legacy endpoint is now disabled. The supported Academy flow is:

\`USER ANSWERS → submit_exam_attempt → SERVER-SIDE QUESTION/ANSWER CHECK → academy_exam_results → SERVER-DERIVED SCORE/PASS\`

The server-side implementation reads the published exam's actual questions and \`correct_answer\` values before calculating the score.

## Authorization boundary

The reusable private helper is \`private.require_aal2()\`.

It:
1. requires an authenticated user;
2. reads \`auth.jwt()->>'aal'\`;
3. accepts only \`aal2\`;
4. raises \`aal2_required\` otherwise;
5. is not executable by \`public\`, \`anon\`, or \`authenticated\`.

## Verification performed

A transactional live-database probe verified:
- AAL1 cannot pass the generic AAL2 gate.
- AAL1 KYC submission returns \`aal2_required\`.
- AAL1 account deletion returns \`aal2_required\`.
- AAL1 provider submission is denied before provider lookup.
- AAL2 reaches the provider authorization layer and correctly returns \`provider_not_registered\` for an unknown provider.
- The legacy exam-result path returns \`legacy_exam_result_submission_disabled\`.
- The transaction was rolled back; no synthetic production records were retained.

## Current limitation

AAL2 is not globally mandatory for every platform operation. Low-risk browsing and ordinary member actions remain available without MFA.

Next security expansion:
- financial/paid actions;
- credential issuance and revocation;
- privileged administrative actions;
- sensitive identity/data export/delete operations;
- agent actions with external side effects.

## Truth contract

**Protected:** the actions listed above.

**Not globally enforced:** all other member actions.

**Required:** users must enroll and complete MFA before protected actions can execute.
