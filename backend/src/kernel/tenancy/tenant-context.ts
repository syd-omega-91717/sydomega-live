// ============================================================================
// FILE: /backend/src/kernel/tenancy/tenant-context.ts
// NEW FILE
// ============================================================================

export interface TenantContext {

    readonly tenantId: string;

    readonly organizationId: string;

    readonly userId: string;

    readonly roles: readonly string[];

    readonly permissions: readonly string[];

    readonly correlationId: string;

}
