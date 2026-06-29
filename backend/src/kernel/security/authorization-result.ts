// ============================================================================
// FILE: /backend/src/kernel/security/authorization-result.ts
// NEW FILE
// ============================================================================

export interface AuthorizationResult {

    allowed: boolean;

    reason?: string;

    policy?: string;

}
