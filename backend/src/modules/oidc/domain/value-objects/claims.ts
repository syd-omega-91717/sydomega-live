// ============================================================================
// FILE: /backend/src/modules/oidc/domain/value-objects/claims.ts
// NEW FILE
// ============================================================================

export interface Claims {

    sub: string;

    name?: string;

    given_name?: string;

    family_name?: string;

    email?: string;

    email_verified?: boolean;

    picture?: string;

    locale?: string;

    zoneinfo?: string;

}
