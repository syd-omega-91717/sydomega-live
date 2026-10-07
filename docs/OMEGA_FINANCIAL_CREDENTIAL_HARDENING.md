# Ω Financial & Credential Mutation Hardening

LIVE / TESTED

- Direct authenticated INSERT into certificates is revoked. Certificates are derived credentials and must not be client-authored.
- Perk acquisition requires AAL2 before balance or ledger mutation.
- Trial and permanent access grants require owner authorization plus AAL2.
- Private implementations are not directly executable by client roles.
- sovereign_points_ledger remains server-authoritative; clients have read access only.
- member_perks remains client-readable; acquisition occurs through the governed purchase function.
- No synthetic production records were created by this hardening pass.
