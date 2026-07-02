// ============================================================================
// FILE: /backend/src/modules/ai/domain/events/embedding-generated.event.ts
// NEW FILE
// ============================================================================

export class EmbeddingGeneratedEvent{

    constructor(

        readonly jobId:string,

        readonly vectors:number

    ){}

}
