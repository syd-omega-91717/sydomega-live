# Ω Financial & Credential Mutation Hardening

LIVE / TESTED

## Closed client-write surfaces

Direct authenticated mutation privileges are removed from:
- certificates
- evolution_events
- medals
- task_completions
- trophies
- sovereign_points_ledger
- member_perks

These are derived/accounting/progression state and must be produced through governed server workflows.

## AAL2 protections

- Perk acquisition requires AAL2 before balance or ledger mutation.
- Trial and permanent access grants require owner authorization plus AAL2.
- Private implementations are not directly executable by client roles.

## Truth boundary

Certificates, achievements, progression records and ledger entries are not client-authoritative.

## Verification

- authenticated direct INSERT/UPDATE/DELETE privilege query returned no rows for the audited derived-state tables;
- no synthetic production records were created by this hardening pass.
