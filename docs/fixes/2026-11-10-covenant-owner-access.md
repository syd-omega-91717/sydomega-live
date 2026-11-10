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
- The Approvals route is now owner-only in navigation; its denial screen no longer displays founder identity to non-owners.
- The global `omega-user.js` member runtime now carries only the public abbreviation `S.Y.D`; the full name and professional order number were removed from that shared client module. The Profile field is labelled **Public Identity**.
- The full name remains on owner-only Covenant and Approvals surfaces. Member-facing legal/controller identity continues to use the public abbreviation where disclosure is required.

## Verification boundary

The regression contract checks the static owner gate, fail-closed error path, owner-only navigation marker, and absence of founder/article copy in the member Vault. A real signed-in owner and non-owner browser test is still required after deployment. This does not claim server-side confidentiality for content that remains in a public static repository; the change controls what the application renders to member sessions.
