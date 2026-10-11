# Ω Credential Lifecycle

## Purpose
Turn credentials from a passive table into a governed production lifecycle:

`ISSUE → EVENT → EVIDENCE → VERIFY → REVOKE → EVENT → EVIDENCE`

## Production controls
- Direct authenticated INSERT/UPDATE/DELETE on `omega_certificates` remains denied.
- Issuance is owner-only and requires AAL2.
- Revocation is owner-only and requires AAL2.
- Issuance validates the subject and achievement definition.
- Certificate numbers are unique; the database can generate one when absent.
- Revocation requires a reason and is terminal for an issued credential.
- Issuance and revocation write canonical `omega_platform_events`.
- Both actions write E2 `omega_platform_evidence`.
- Public verification exposes only a bounded verification response; it does not expose email, profile data, or the issuer's identity.
- Unknown certificate numbers return `found=false` and `truth_state=UNAVAILABLE`.
- Issued credentials are `LIVE`; revoked credentials are `CALCULATED` for presentation and remain explicitly revoked.

## Important boundary
This is a SYD OMEGA platform credential lifecycle. It must not be presented as government citizenship, professional licensure, legal accreditation, or any other external authority unless an appropriately authorized external issuer is actually integrated and verified.

## Current production reality
- The lifecycle functions are installed in the live Supabase database.
- No synthetic certificate was created during implementation.
- Existing certificate data remains untouched.
- AAL2 enforcement is delegated to the existing `private.require_aal2()` control.
- The public verification function is callable without authentication because verification is intentionally read-only and bounded.
- Provider-backed or externally signed credentials are not implied by this feature.

## Next hardening
1. Add issuer policy registry if multiple authorized issuers are introduced.
2. Add expiration and credential schema/version when the product requires them.
3. Add a signed credential artifact only when a real signing-key lifecycle exists.
4. Add user-facing verification/credential pages after the production Vercel deployment path is restored.
