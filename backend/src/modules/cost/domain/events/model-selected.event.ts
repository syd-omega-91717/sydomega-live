// ============================================================================
// FILE: /backend/src/modules/cost/domain/events/model-selected.event.ts
// NEW FILE
// ============================================================================

export class ModelSelectedEvent{

    constructor(

        readonly model:string,

        readonly estimatedCost:number

    ){}

}
