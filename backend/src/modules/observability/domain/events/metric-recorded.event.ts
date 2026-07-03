// ============================================================================
// FILE: /backend/src/modules/observability/domain/events/metric-recorded.event.ts
// NEW FILE
// ============================================================================

export class MetricRecordedEvent{

    constructor(

        readonly metricId:string,

        readonly metricName:string

    ){}

}
