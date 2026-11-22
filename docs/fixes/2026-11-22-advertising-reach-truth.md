# Advertising reach truth-boundary correction — 2026-11-22

## Finding

The advertising page and search index described the internal 104,976-node matrix model as advertising audience reach. The live product does not have evidence to support that interpretation. The matrix count is a model dimension, not users, impressions, ad distribution or verified audience reach.

## Changes

- Replaced the 104,976 KPI with an explicit unmeasured audience-reach state.
- Added a note distinguishing the internal matrix model count from advertising reach, impressions and distribution.
- Reframed matrix reach tracking and 104,976-node distribution as unavailable / model-only, not live advertising benefits.
- Marked tier benefits as proposed or planned where paid delivery, audience targeting, reporting or placement is not active.
- Clarified that approved submissions remain queued and are not live placements while paid delivery and payment processing remain disabled.
- Corrected the search index description so it no longer repeats the false reach claim.

## Verification

`scripts/tests/test_advertising_reach_truth.py` prevents the false audience-reach claim from returning and verifies that unavailable benefits remain clearly marked.

No production data, schema, RLS, payments, ad delivery settings, or feature flags are changed by this content correction.
