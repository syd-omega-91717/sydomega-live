// ============================================================================
// FILE: /backend/src/kernel/bootstrap/health-check.ts
// NEW FILE
// ============================================================================

export interface HealthCheck {

    readonly name: string;

    check(): Promise<boolean>;

}
