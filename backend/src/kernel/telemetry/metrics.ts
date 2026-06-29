// ============================================================================
// FILE: /backend/src/kernel/telemetry/metrics.ts
// NEW FILE
// ============================================================================

export interface Metrics {

    increment(

        metric: string,

        value?: number

    ): void;

    histogram(

        metric: string,

        value: number

    ): void;

    gauge(

        metric: string,

        value: number

    ): void;

}
