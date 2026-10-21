# Ω Live Data Truth Contract

## Purpose

The shared live-data engine must distinguish a successful value from loading, a calculated value, missing data, an unavailable session, and a failed query. Static placeholder text must not masquerade as current production data.

## Runtime states

- **loading** — the query or binding is in progress; first-load placeholders are replaced by an ellipsis.
- **live** — the value came from a successful live query or the current authenticated profile.
- **calculated** — the value is derived from persisted inputs; it is not an independent provider measurement.
- **unavailable** — the required session, source, or value is missing.
- **error** — the provider query failed; the UI shows an em dash rather than retaining a stale value.

The engine records the state in data-live-state for audit, styling, and future diagnostics. Missing authentication does not mark a binding complete, so the next profile-population event can retry. A sign-out clears member-scoped live values and refresh timers. Owner status does not inject hard-coded axes or an authority score; the score is calculated from persisted axes.

Public member counts and activity tickers use the same visible loading/unavailable/error states, while keeping their data access separate from member-scoped profile bindings.

## Verification

scripts/tests/test_live_binding_truth.py is part of the blocking contract suite. Any new live binding type must define its source, authorization requirements, success state, null-data behavior, and failure behavior.
