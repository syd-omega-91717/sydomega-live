// ============================================================================
// FILE: /backend/src/modules/identity/domain/events/identity.events.ts
// NEW FILE
// ============================================================================

export const IdentityEvents = {

    REGISTERED:

        "identity.registered",

    LOGIN:

        "identity.login",

    LOGOUT:

        "identity.logout",

    PASSWORD_CHANGED:

        "identity.password.changed",

    MFA_ENABLED:

        "identity.mfa.enabled",

    ACCOUNT_LOCKED:

        "identity.account.locked"

} as const;
