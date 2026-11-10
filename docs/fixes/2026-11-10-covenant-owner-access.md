# Covenant owner-access correction — 2026-11-10

## Finding

The Sovereign Covenant contained founder and reserved-governance material but the route admitted every approved member. Its error handler also revealed the application shell when the session/profile lookup failed. The member Vault duplicated the covenant articles and included founder-specific claims.

## Changes

- The Covenant now verifies an authenticated session and a readable profile with `is_owner=true` before revealing its hidden application shell.
- Missing session redirects to the account route; missing/error owner profile fails closed; non-owners are redirected to the pending route.
- The exception path no longer reveals the Covenant shell.
- The Covenant navigation entry is marked owner-only, allowing the existing navigation renderer to hide it from member menus and command search.
- The Vault no longer renders the duplicate 11-article founder/covenant copy or its client-side article renderer.
- The Vault now states that reserved governance material is owner-only and reveals the Covenant link only after the current profile is verified as owner.
- The Vault reserve heading uses a distinct description instead of repeating the Academy's canonical lattice heading.

## Verification boundary

The regression contract checks the static owner gate, fail-closed error path, owner-only navigation marker, and absence of founder/article copy in the member Vault. A real signed-in owner and non-owner browser test is still required after deployment. This does not claim server-side confidentiality for content that remains in a public static repository; the change controls what the application renders to member sessions.
