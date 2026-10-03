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