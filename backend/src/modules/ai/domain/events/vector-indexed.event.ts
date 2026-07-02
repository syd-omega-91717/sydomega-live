// ============================================================================
// FILE: /backend/src/modules/ai/domain/events/vector-indexed.event.ts
// NEW FILE
// ============================================================================

export class VectorIndexedEvent{

    constructor(

        readonly documentId:string,

        readonly vectors:number

    ){}

}
