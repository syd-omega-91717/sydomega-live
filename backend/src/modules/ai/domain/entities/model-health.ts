// ============================================================================
// FILE: /backend/src/modules/ai/domain/entities/model-health.ts
// NEW FILE
// ============================================================================

export class ModelHealth{

    constructor(

        readonly provider:string,

        readonly latency:number,

        readonly availability:number,

        readonly costPerMillion:number,

        readonly healthy:boolean

    ){}

}
