// ============================================================================
// FILE: /backend/src/platform/observability/metrics.ts
// NEW FILE
// ============================================================================

export interface Metric {

    name: string;

    value: number;

    labels?: Record<string, string>;

    timestamp: Date;

}

class MetricsManager {

    private readonly metrics: Metric[] = [];

    public record(

        name: string,

        value: number,

        labels?: Record<string, string>

    ): void {

        this.metrics.push({

            name,

            value,

            labels,

            timestamp: new Date()

        });

    }

    public all(): Metric[] {

        return [...this.metrics];

    }

    public clear(): void {

        this.metrics.length = 0;

    }

}

export default new MetricsManager();
