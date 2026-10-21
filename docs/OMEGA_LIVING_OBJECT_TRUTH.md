# Ω Living Object Truth Contract

## Objective

Interactive object chrome must not turn a decorative card into a false operational promise. An object is only as trustworthy as its registered state, destination, and executable handler.

## Runtime rules

- Missing object registration defaults to **UNVERIFIED**, never **LIVE**.
- Missing ownership defaults to **UNASSIGNED**, never to an invented responsible role.
- Derived values are labeled **CALCULATED**; dormant capabilities remain **DORMANT**; unsupported claims remain **UNVERIFIED**.
- A quick action is shown only when its handler is real and its destination is registered.
- Generic placeholder actions such as “Export”, “History”, “Dependencies”, or “Permissions” must not show success-shaped toast messages when no action is implemented.
- Unregistered objects receive a clear truth-boundary explanation instead of AI-generated factual-sounding insights.
- The object panel is a region containing interactive controls, not an ARIA tooltip.

## Verification

scripts/tests/test_living_object_truth_contract.py checks these invariants and runs through scripts/contract-suite.py. Adding a new living-object action requires a concrete handler, destination or operation contract, authorization boundary where applicable, and a regression test.
