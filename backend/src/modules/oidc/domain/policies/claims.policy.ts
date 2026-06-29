// ============================================================================
// FILE: /backend/src/modules/oidc/domain/policies/claims.policy.ts
// NEW FILE
// ============================================================================

export interface ClaimsPolicy {

    filter(

        scopes: string[],

        claims: Record<string, unknown>

    ): Record<string, unknown>;

}
