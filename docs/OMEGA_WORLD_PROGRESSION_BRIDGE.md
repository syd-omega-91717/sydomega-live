# Ω World Progression Bridge

## Purpose
Connect the existing persisted Evolution progression source to the World presentation layer.

## Source of truth
The bridge reads the authenticated member's existing `profiles.axis_a`, `profiles.axis_b`, `profiles.axis_c`, `is_owner`, and `access_approved` fields. It does not create a parallel progression store.

## Calculation
For approved members, the World calculates the same authority formula already documented by Evolution:

`AUTH = sqrt(A^3 + B^3 + C^3) * phi / e`

The resulting authority is used only to select a visual phase from the existing repository phase artwork.

## Truth boundary
The panel is labelled **CALCULATED**. A selected phase is **presentation state**, not a new entitlement. The bridge does not grant:
- achievements
- credentials
- membership tiers
- ownership
- financial value
- NFT ownership
- authorization

Signed-out and unauthorized users receive **UNAVAILABLE** rather than inferred values.

## User value
The World now answers three questions in one place:
1. Where am I? — World route/module map.
2. What is my current progression state? — authenticated calculated state.
3. What visual phase represents that state? — source artwork selected deterministically.

The Evolution page remains the authoritative progression interface and audit surface.
