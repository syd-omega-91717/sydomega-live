// ============================================================================
// FILE: /backend/src/modules/ai/domain/entities/model-response.ts
// NEW FILE
// ============================================================================

export class ModelResponse{

    constructor(

        readonly provider:string,

        readonly model:string,

        readonly latency:number,

        readonly confidence:number,

        readonly output:string

    ){}

}
