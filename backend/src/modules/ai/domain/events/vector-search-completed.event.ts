// ============================================================================
// FILE: /backend/src/modules/ai/domain/events/vector-search-completed.event.ts
// NEW FILE
// ============================================================================

export class VectorSearchCompletedEvent{

    constructor(

        readonly queryId:string,

        readonly matches:number

    ){}

}
