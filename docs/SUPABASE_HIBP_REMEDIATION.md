# Supabase HIBP Remediation

Supabase currently reports the Auth security advisor warning auth_leaked_password_protection.

The platform setting is password_hibp_enabled. Supabase documents this setting as the control that rejects passwords found in the HaveIBeenPwned Pwned Passwords corpus.

## Deterministic remediation

The repository now contains scripts/enable-supabase-hibp.py.

It:
1. Reads SUPABASE_ACCESS_TOKEN only from the environment.
2. Reads the current Auth configuration.
3. PATCHes only password_hibp_enabled=true when needed.
4. Re-reads the returned configuration value.
5. Fails closed if Supabase does not confirm the setting.

The token must have Supabase Management API permissions for Auth configuration write/project administration.

Example from a trusted local shell:

    export SUPABASE_ACCESS_TOKEN='YOUR_TOKEN_FROM_SUPABASE_DASHBOARD'
    python3 scripts/enable-supabase-hibp.py

Do not commit the token, put it in repository files, or paste it into source code.

## Current session status

The setting was verified through the Supabase security advisor as still disabled before this remediation tool was added. The connected Supabase integration exposes database/function operations but not the Management API Auth-config mutation, so the final toggle cannot be executed from this connector without a Management API authorization token.

Supabase's current Management API exposes PATCH /v1/projects/{ref}/config/auth with password_hibp_enabled as a writable field.

## Protected GitHub Actions execution path — 2026-11-17

The repository now includes the manual workflow:

`.github/workflows/supabase-auth-security-config.yml`

Open [Supabase Auth Security Configuration](https://github.com/syd-omega-91717/sydomega-live/actions/workflows/supabase-auth-security-config.yml) and:

1. Select **Run workflow**.
2. Select branch `main`.
3. Start the workflow and complete any approval required by the `supabase-production` environment.
4. Confirm the job reports `OK: Supabase Auth leaked-password protection is enabled.`
5. Re-read Supabase Security Advisor. The `auth_leaked_password_protection` warning must disappear before this issue is closed.

The workflow is manual-only, restricted to `main`, and passes the existing `SUPABASE_ACCESS_TOKEN` secret only to the helper process. The protected environment must contain a valid Management API token with the Auth configuration write permissions required by the helper. If the secret is missing or under-scoped, the workflow fails; do not bypass the environment or place a token in source control.

The current live Auth setting remains **UNVERIFIED / disabled** until a successful run and a fresh Security Advisor read are recorded. The workflow's existence is not proof that the setting has changed.
