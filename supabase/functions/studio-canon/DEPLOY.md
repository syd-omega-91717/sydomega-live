# Verifying deployed studio-canon

**Provider observation — 2026-11-10:** \`studio-canon\` is ACTIVE at version 4 with \`verify_jwt=true\`. The deployed \`index.ts\` matches main byte-for-byte; the returned \`worlds-data.ts\`, shared key module and studio-access module also match their repository files. The live snapshot records the provider SHA-256 and repository blob SHA.

An unauthenticated request previously returned 401 \`UNAUTHORIZED_NO_AUTH_HEADER\` (2026-11-07). This confirms the gateway enforces JWT, but does not prove the owner path or approved non-owner denial path.

## Required verification after any deployment

1. Read the provider inventory and confirm the function is ACTIVE with \`verify_jwt=true\`.
2. Read the deployed function files and compare the entrypoint and every returned dependency/payload file with the current main branch.
3. Invoke as an owner and verify the expected canon response.
4. Invoke as an approved non-owner and verify 403 \`owner_only\`; also test signed-out, rejected, expired-trial, missing-profile and profile-read-error cases.
5. Refresh \`docs/runtime/supabase-edge-functions-live.json\` with provider version, SHA-256, repository blob SHA and capture time.
6. Run \`python3 scripts/supabase-edge-runtime-reconciliation.py\`, the Studio tests and the relevant browser checks.

**Current limitation:** the 2026-11-10 provider log query returned a FetchException. The previous owner-page 503 \`profile_unavailable\` cause therefore remains undiagnosed. Source parity does not prove a successful owner request. Keep the page's UNAVAILABLE/RESTRICTED states honest until the owner and non-owner invocation paths pass.
