// ============================================================================
// FILE: /backend/src/modules/ai/domain/entities/model-capability.ts
// NEW FILE
// ============================================================================

export class ModelCapability{

    constructor(

        readonly provider:string,

        readonly model:string,

        readonly contextWindow:number,

        readonly multimodal:boolean,

        readonly streaming:boolean,

        readonly toolCalling:boolean

    ){}

}
