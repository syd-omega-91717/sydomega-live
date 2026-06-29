// ============================================================================
// FILE: /backend/src/kernel/features/feature-context.ts
// NEW FILE
// ============================================================================

export interface FeatureContext {

    tenantId: string;

    organizationId: string;

    userId: string;

    environment: string;

    subscription: string;

    region?: string;

    attributes: Record<string, unknown>;

}
