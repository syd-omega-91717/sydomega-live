// ============================================================================
// FILE: /backend/src/modules/oidc/domain/policies/consent.policy.ts
// NEW FILE
// ============================================================================

export interface ConsentPolicy {

    requiresConsent(

        clientId: string,

        userId: string,

        scopes: string[]

    ): Promise<boolean>;

}
