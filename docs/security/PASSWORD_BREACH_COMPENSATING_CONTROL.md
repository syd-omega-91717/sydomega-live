# Password-breach compensating control

## Status

The Supabase Security Advisor finding `auth_leaked_password_protection` is a provider-plan limitation on the current Free organization. Supabase documents leaked-password protection as a Pro-and-above Auth feature. The repository must therefore **not** claim that the Supabase finding is fixed while the project remains on Free.

## Implemented control

SYD OMEGA performs a local password-strength and compromised-password check at both password-setting entry points:

- `account.html` — new account password
- `reset.html` — password recovery / password replacement
- `omega-password-guard.js` — shared implementation

The compromised-password check uses the free Have I Been Pwned Pwned Passwords range API. The browser hashes the password locally with SHA-1, sends only the first five hexadecimal characters of the hash, and compares the returned suffixes locally. The full password is never sent to HIBP. This is the documented k-anonymity model for Pwned Passwords.

## Security boundary

This is a **compensating control, not an equivalent replacement for Supabase's server-side Auth control**.

A user who reaches Supabase Auth directly can bypass the browser guard. Therefore:

- `auth_leaked_password_protection` remains an external/unresolved Supabase Security Advisor finding on Free.
- No SQL migration, RLS policy, or application claim may mark the Supabase finding as resolved.
- Production evidence must distinguish `COMPENSATING_CONTROL=PASS` from `SUPABASE_ADVISOR=PASS`.

## Failure semantics

The HIBP check has three states: breached, clean, and unknown/unavailable. The application never displays a clean result when the external check did not run. The current UI permits account creation when HIBP is unreachable after applying local strength rules; this preserves availability but must not be described as equivalent to server-side leaked-password enforcement.

## Why this is the correct Free-tier approach

The Pwned Passwords range API is freely accessible and does not require an API key. It supports CORS for supported unauthenticated APIs and explicitly documents the five-character k-anonymity range method. This lets the application add meaningful protection without purchasing a Supabase Pro subscription.

## Closure criteria

The repository-side compensating-control work is complete only when automated tests prove:

1. weak passwords are rejected;
2. password-like input is not transmitted to HIBP as a full value;
3. a known compromised hash is rejected when the range response contains its suffix;
4. a clean range response is represented as `checked=true, breached=false`;
5. an unavailable range service is represented as `checked=false` rather than falsely reported clean;
6. both signup and password-recovery pages invoke the same guard.

The Supabase Security Advisor warning can only be closed as a provider finding after the project is upgraded and the Supabase Auth setting is enabled and rechecked live.
