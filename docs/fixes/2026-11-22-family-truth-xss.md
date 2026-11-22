# Family and Heritage truth-boundary / XSS remediation — 2026-11-22

## Scope

This change preserves the family-history, family-tree and heritage-record workflows. It does not create or imply a financial benefit, trust, inheritance instrument, asset custody arrangement, biometric security boundary or legal heir designation.

## Live evidence (read-only, 2026-11-22)

The connected production database returned zero rows in:
- `public.family_nodes`
- `public.bloodline_nodes`
- `public.heritage_records`

The tables have account-scoped RLS policies. The page now also filters reads by the authenticated user's ID and explicitly includes that ID on inserts. The owner-only administrative family view remains governed by its existing access policy.

## Changes

- Removed the hard-coded family allowance chart, 91% progress value and maturity countdown.
- Replaced active treasury/provision, trust, asset-custody and inheritance assertions with explicit `NOT FUNDED`, `NOT ESTABLISHED`, and `NOT PROVIDED` disclosures.
- Removed the invented 51% / 25.5% / 8.5% succession-share table. The replacement is a single non-legal notice.
- Reframed `is_heir` as a personal successor label, not a legal heir designation.
- Replaced biometric-lock and family-safe-mode claims with account-scoped access wording.
- Labeled the authority ring and 27.8367 value as a theoretical calculated model, not a legal or financial entitlement.
- Reworked bloodline node rendering to create DOM elements and assign member-controlled values through `textContent`; no member name, relationship, birth value or note is interpolated into HTML.
- Narrowed the bloodline query to required columns and filtered by the authenticated user.
- Scoped heritage reads and writes to the authenticated user; escaped the member-controlled title, body and category before rendering.
- Kept family-node reads scoped to the authenticated user and selected only the columns the view needs.

## Verification added

`scripts/tests/test_family_truth_and_xss.py` guards:
- absence of unsupported family finance and legal claims;
- removal of fabricated allowance and maturity metrics;
- safe text rendering for bloodline records;
- authenticated-user scoping for bloodline and heritage reads/writes;
- escaping of heritage title, body and category;
- personal/non-legal successor-label language;
- removal of fabricated succession shares.

## Safety boundary

No production data was changed. No migration, RLS policy, Edge Function, payment setting, feature flag, wallet, or legal designation was modified. Existing family records, if later added, remain editable member-submitted records and are not independently verified by this interface.
