// ============================================================================
// FILE: /backend/src/modules/identity/domain/events/authentication.events.ts
// NEW FILE
// ============================================================================

export const AuthenticationEvents = {

    LOGIN_SUCCEEDED:

        "identity.authentication.login.succeeded",

    LOGIN_FAILED:

        "identity.authentication.login.failed",

    LOGOUT:

        "identity.authentication.logout",

    SESSION_CREATED:

        "identity.authentication.session.created",

    SESSION_REVOKED:

        "identity.authentication.session.revoked",

    ACCOUNT_LOCKED:

        "identity.authentication.account.locked",

    ACCOUNT_UNLOCKED:

        "identity.authentication.account.unlocked",

    REFRESH_TOKEN_ROTATED:

        "identity.authentication.refresh.rotated"

} as const;
