# Ω Data Reality Fabric

## Purpose

The Data Reality Fabric gives every real-data product surface one canonical source registry instead of scattered provider assumptions.

### Canonical source record

`omega_data_sources` records:

- source identity and domain
- source URI where safe
- access mode
- explicit truth state
- freshness expectation
- last verification time
- verification method
- status reason
- non-secret metadata
- active/inactive state

## Truth discipline

A configured provider is not automatically healthy. A source is not `LIVE` until verification evidence exists. `UNVERIFIED` is a valid production state and must remain visible.

This layer does not grant permissions and does not replace the event, evidence, lineage, mission, or product-reality systems.

## Current production sources

- Supabase production: `LIVE` because the connected production project and schema were directly verified.
- Hacker News public API: `UNVERIFIED` until a live upstream probe is successfully observed; the existing `intel-feed` adapter is implemented but implementation alone is not runtime evidence.

## Product integration

Intelligence surfaces can render source state through `omega-data-reality.js`. This makes freshness and verification status visible without exposing credentials.

## Verification

Run:

`node scripts/tests/test_omega_data_reality_fabric.js`

Expected:

`OMEGA_DATA_REALITY_FABRIC=PASS`
