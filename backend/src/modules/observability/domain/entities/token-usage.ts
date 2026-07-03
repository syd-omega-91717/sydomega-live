// ============================================================================
// FILE: /backend/src/modules/observability/domain/entities/token-usage.ts
// NEW FILE
// ============================================================================

export class TokenUsage{

    constructor(

        readonly requestId:string,

        readonly model:string,

        readonly promptTokens:number,

        readonly completionTokens:number,

        readonly totalTokens:number,

        readonly estimatedCost:number

    ){}

}
