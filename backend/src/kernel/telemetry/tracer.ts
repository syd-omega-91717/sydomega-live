// ============================================================================
// FILE: /backend/src/kernel/telemetry/tracer.ts
// NEW FILE
// ============================================================================

export interface Tracer {

    trace<T>(

        operation: string,

        callback: () => Promise<T>

    ): Promise<T>;

}
