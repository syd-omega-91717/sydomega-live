// ============================================================================
// FILE: /backend/src/modules/ai/domain/events/retrieval-completed.event.ts
// NEW FILE
// ============================================================================

export class RetrievalCompletedEvent{

    constructor(

        readonly sessionId:string,

        readonly retrievedChunks:number

    ){}

}
