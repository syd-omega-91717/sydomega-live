// ============================================================================
// FILE: /backend/src/kernel/security/authorization-request.ts
// NEW FILE
// ============================================================================

export interface AuthorizationRequest {

    subjectId: string;

    tenantId: string;

    resource: string;

    action: string;

    roles: readonly string[];

    permissions: readonly string[];

    attributes: Record<string, unknown>;

}
