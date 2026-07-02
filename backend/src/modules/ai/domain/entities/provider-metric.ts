// ============================================================================
// FILE: /backend/src/modules/ai/domain/entities/provider-metric.ts
// NEW FILE
// ============================================================================

export class ProviderMetric{

    constructor(

        readonly provider:string,

        readonly requests:number,

        readonly successRate:number,

        readonly averageLatency:number,

        readonly averageCost:number

    ){}

}
