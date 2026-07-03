// ============================================================================
// FILE: /backend/src/modules/api-gateway/domain/entities/gateway-metric.ts
// NEW FILE
// ============================================================================

export class GatewayMetric{

    constructor(

        readonly route:string,

        readonly requests:number,

        readonly errors:number,

        readonly p95Latency:number,

        readonly timestamp:Date

    ){}

}
