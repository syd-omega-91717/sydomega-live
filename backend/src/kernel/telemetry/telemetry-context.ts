// ============================================================================
// FILE: /backend/src/kernel/telemetry/telemetry-context.ts
// NEW FILE
// ============================================================================

export interface TelemetryContext {

    traceId: string;

    spanId: string;

    correlationId: string;

    causationId?: string;

    tenantId: string;

    organizationId: string;

    userId: string;

    service: string;

    operation: string;

}
