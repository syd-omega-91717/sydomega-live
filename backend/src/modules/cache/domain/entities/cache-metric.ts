// ============================================================================
// FILE: /backend/src/modules/cache/domain/entities/cache-metric.ts
// NEW FILE
// ============================================================================

export class CacheMetric{

    constructor(

        readonly hits:number,

        readonly misses:number,

        readonly evictions:number,

        readonly memoryUsage:number

    ){}

}
